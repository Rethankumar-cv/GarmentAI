"""
model_performance.py — Phase 8: Model Performance Trend Monitoring

Tracks ML model metrics (RMSE, MAE, R2) over time.
Detects when model performance degrades compared to the previous run.

On each call:
  1. Reads current model_metrics.json
  2. Loads performance history
  3. Compares current vs previous metrics
  4. Appends to history
  5. Flags degradation if RMSE increases > DEGRADATION_THRESHOLD

Saves to:
  monitoring/model_performance_history.json
  s3://.../monitoring/model_performance_history.json

Usage:
    from ml_monitoring.model_performance import run_performance_check
    result = run_performance_check()
"""
import os
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

BASE_DIR       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR     = os.path.join(BASE_DIR, "models")
MONITORING_DIR = os.path.join(BASE_DIR, "monitoring")
HISTORY_PATH   = os.path.join(MONITORING_DIR, "model_performance_history.json")

DEGRADATION_THRESHOLD = 0.10   # 10% RMSE increase = degradation warning
S3_KEY = "monitoring/model_performance_history.json"


def _load_history() -> list:
    if os.path.exists(HISTORY_PATH):
        try:
            with open(HISTORY_PATH) as f:
                return json.load(f)
        except Exception:
            pass
    return []


def _save_history(history: list):
    os.makedirs(MONITORING_DIR, exist_ok=True)
    with open(HISTORY_PATH, "w") as f:
        json.dump(history, f, indent=2)


def _load_current_metrics() -> dict | None:
    path = os.path.join(MODELS_DIR, "model_metrics.json")
    if not os.path.exists(path):
        logger.warning("[ModelPerf] model_metrics.json not found")
        return None
    with open(path) as f:
        return json.load(f)


def _compare_metrics(current: dict, previous_entry: dict) -> dict:
    """
    Compare current demand model RMSE vs previous.
    Returns dict of per-model degradation flags.
    """
    issues = {}

    def _check(model_key: str, metric: str = "rmse"):
        cur_val  = current.get(model_key, {}).get(metric)
        prev_val = previous_entry.get("metrics", {}).get(model_key, {}).get(metric)
        if cur_val is None or prev_val is None or prev_val == 0:
            return None
        pct_change = (cur_val - prev_val) / abs(prev_val)
        return {"current": cur_val, "previous": prev_val, "pct_change": round(pct_change, 4)}

    for model in ["demand_model", "elasticity_model"]:
        comp = _check(model)
        if comp:
            degraded = comp["pct_change"] > DEGRADATION_THRESHOLD
            issues[model] = {**comp, "degraded": degraded}

    return issues


def run_performance_check() -> dict:
    """
    Run model performance trend check.

    Returns:
        dict with degradation flags, metric comparisons, and history entry.
    """
    logger.info("[ModelPerf] Running performance check...")
    result = {
        "checked_at": datetime.now().isoformat(),
        "status": "ok",
        "degradation_detected": False,
        "comparisons": {},
        "current_metrics": {},
    }

    try:
        current_metrics = _load_current_metrics()
        if current_metrics is None:
            result["status"] = "no_metrics"
            return result

        result["current_metrics"] = current_metrics
        history = _load_history()

        if history:
            comparisons = _compare_metrics(current_metrics, history[-1])
            result["comparisons"] = comparisons
            result["degradation_detected"] = any(
                v.get("degraded", False) for v in comparisons.values()
            )
            if result["degradation_detected"]:
                degraded_models = [k for k, v in comparisons.items() if v.get("degraded")]
                logger.warning(
                    f"[ModelPerf] DEGRADATION: {degraded_models} "
                    f"RMSE increased > {DEGRADATION_THRESHOLD*100:.0f}%"
                )
            else:
                logger.info("[ModelPerf] No degradation detected.")
        else:
            logger.info("[ModelPerf] No history — first entry recorded.")

        # Append to history
        history.append({
            "recorded_at": datetime.now().isoformat(),
            "metrics": current_metrics,
        })
        # Keep last 50 entries
        history = history[-50:]
        _save_history(history)

        # Upload to S3
        _upload_history()

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)
        logger.error(f"[ModelPerf] Check failed: {e}")

    return result


def _upload_history():
    try:
        from data_pipeline.s3_storage import s3
        if s3.is_configured:
            s3.upload_file(HISTORY_PATH, S3_KEY)
    except Exception as e:
        logger.error(f"[ModelPerf] S3 upload failed: {e}")


def get_performance_history() -> list:
    """Return the full performance history list."""
    return _load_history()


def get_latest_performance() -> dict | None:
    """Return the most recent performance entry."""
    history = _load_history()
    return history[-1] if history else None
