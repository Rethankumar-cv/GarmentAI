"""
data_drift.py — Phase 8: Data Distribution Drift Detection

Compares current analytics CSVs against a saved previous snapshot
to detect if the underlying data distribution has shifted significantly.

Metrics tracked:
  - avg_price_shift: change in mean unit price
  - demand_variance_shift: change in demand volatility
  - customer_frequency_shift: change in avg transactions per customer
  - product_count_change: new/removed products
  - overall drift_score (0.0 to 1.0)

Drift is flagged if drift_score > DRIFT_THRESHOLD (default 0.25).

Usage:
    from ml_monitoring.data_drift import run_drift_check
    result = run_drift_check()
    print(result["drift_detected"], result["drift_score"])
"""
import os
import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime

logger = logging.getLogger(__name__)

BASE_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANALYTICS_DIR = os.path.join(BASE_DIR, "analytics")
MONITORING_DIR = os.path.join(BASE_DIR, "monitoring")
SNAPSHOT_DIR  = os.path.join(MONITORING_DIR, "snapshots")

DRIFT_THRESHOLD = 0.25   # flag if any key metric drifts > 25%

S3_MONITORING_PREFIX = "monitoring"


def _load_snapshot(name: str) -> dict | None:
    """Load the previous data snapshot from disk."""
    path = os.path.join(SNAPSHOT_DIR, f"{name}_snapshot.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None


def _save_snapshot(name: str, data: dict):
    """Save current data as the new snapshot."""
    os.makedirs(SNAPSHOT_DIR, exist_ok=True)
    path = os.path.join(SNAPSHOT_DIR, f"{name}_snapshot.json")
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def _compute_current_stats() -> dict | None:
    """Extract key statistics from current analytics CSVs."""
    stats = {}

    # Pricing signals: avg_price, price_std
    pricing_path = os.path.join(ANALYTICS_DIR, "pricing_signals.csv")
    if os.path.exists(pricing_path):
        pf = pd.read_csv(pricing_path)
        stats["avg_price"]      = float(pf["avg_price"].mean()) if "avg_price" in pf.columns else 0.0
        stats["price_std"]      = float(pf["avg_price"].std())  if "avg_price" in pf.columns else 0.0
        stats["product_count"]  = int(len(pf))
        stats["avg_revenue"]    = float(pf["total_revenue"].mean()) if "total_revenue" in pf.columns else 0.0
    else:
        logger.warning("[DataDrift] pricing_signals.csv not found")
        return None

    # Demand CSV: units_sold distribution
    demand_path = os.path.join(ANALYTICS_DIR, "product_demand.csv")
    if os.path.exists(demand_path):
        df = pd.read_csv(demand_path)
        col = "units_sold" if "units_sold" in df.columns else df.columns[-1]
        stats["avg_demand"]      = float(df[col].mean())
        stats["demand_variance"] = float(df[col].var())
    else:
        stats["avg_demand"]      = 0.0
        stats["demand_variance"] = 0.0

    # Customer segments: customer count, avg frequency
    seg_path = os.path.join(ANALYTICS_DIR, "customer_segments.csv")
    if os.path.exists(seg_path):
        sf = pd.read_csv(seg_path)
        stats["customer_count"] = int(len(sf))
        freq_col = "frequency" if "frequency" in sf.columns else None
        stats["avg_frequency"]  = float(sf[freq_col].mean()) if freq_col else 0.0
    else:
        stats["customer_count"] = 0
        stats["avg_frequency"]  = 0.0

    stats["captured_at"] = datetime.now().isoformat()
    return stats


def _compute_drift_scores(current: dict, previous: dict) -> dict:
    """
    Compare current vs previous stats and produce per-metric drift scores.
    Drift score = abs(current - prev) / max(abs(prev), 1e-6)
    Capped at 1.0.
    """
    numeric_keys = [
        "avg_price", "price_std", "product_count",
        "avg_revenue", "avg_demand", "demand_variance",
        "customer_count", "avg_frequency",
    ]

    feature_scores = {}
    for key in numeric_keys:
        cur_val  = float(current.get(key, 0))
        prev_val = float(previous.get(key, 0))
        if abs(prev_val) < 1e-6:
            score = 0.0
        else:
            score = min(abs(cur_val - prev_val) / abs(prev_val), 1.0)
        feature_scores[key] = round(score, 4)

    overall = float(np.mean(list(feature_scores.values())))
    return {"features": feature_scores, "overall": round(overall, 4)}


def run_drift_check() -> dict:
    """
    Run the full data drift check:
      1. Compute current dataset stats
      2. Load previous snapshot
      3. Compute drift scores
      4. Save new snapshot
      5. Upload result to S3

    Returns:
        dict with drift_score, drift_detected, feature_scores, timestamp
    """
    logger.info("[DataDrift] Starting drift check...")
    result = {
        "checked_at": datetime.now().isoformat(),
        "drift_detected": False,
        "drift_score": 0.0,
        "feature_scores": {},
        "has_baseline": False,
        "status": "ok",
    }

    try:
        current = _compute_current_stats()
        if current is None:
            result["status"] = "no_data"
            return result

        previous = _load_snapshot("analytics")

        if previous is None:
            # First run — save snapshot and skip comparison
            _save_snapshot("analytics", current)
            result["status"] = "baseline_created"
            result["has_baseline"] = False
            logger.info("[DataDrift] No previous snapshot — baseline created.")
            return result

        result["has_baseline"] = True
        drift = _compute_drift_scores(current, previous)
        overall_score = drift["overall"]

        result["drift_score"]    = overall_score
        result["feature_scores"] = drift["features"]
        result["drift_detected"] = overall_score > DRIFT_THRESHOLD

        if result["drift_detected"]:
            top_drifters = sorted(
                drift["features"].items(), key=lambda x: x[1], reverse=True
            )[:3]
            result["top_drifting_features"] = [
                {"feature": k, "score": v} for k, v in top_drifters
            ]
            logger.warning(
                f"[DataDrift] DRIFT DETECTED: score={overall_score:.3f} "
                f"(threshold={DRIFT_THRESHOLD}) — top: {top_drifters[:2]}"
            )
        else:
            logger.info(f"[DataDrift] No significant drift. score={overall_score:.3f}")

        # Save new snapshot and upload result to S3
        _save_snapshot("analytics", current)
        _upload_drift_report(result)

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)
        logger.error(f"[DataDrift] Check failed: {e}")

    return result


def _upload_drift_report(report: dict):
    """Upload drift report JSON to S3 monitoring/."""
    try:
        from data_pipeline.s3_storage import s3
        if not s3.is_configured:
            return
        os.makedirs(MONITORING_DIR, exist_ok=True)
        date_tag = datetime.now().strftime("%Y%m%d")
        local_path = os.path.join(MONITORING_DIR, f"data_drift_{date_tag}.json")
        with open(local_path, "w") as f:
            json.dump(report, f, indent=2)
        s3.upload_file(local_path, f"{S3_MONITORING_PREFIX}/data_drift_{date_tag}.json")
    except Exception as e:
        logger.error(f"[DataDrift] Upload failed: {e}")


def get_latest_drift_report() -> dict | None:
    """Load the most recent drift report from local monitoring/ folder."""
    try:
        reports = [f for f in os.listdir(MONITORING_DIR) if f.startswith("data_drift_")]
        if not reports:
            return None
        latest = sorted(reports)[-1]
        with open(os.path.join(MONITORING_DIR, latest)) as f:
            return json.load(f)
    except Exception:
        return None
