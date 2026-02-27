"""
monitoring_views.py — Phase 8: ML Observability API

Single admin endpoint that returns full system health:
  - Last pipeline run metadata
  - Active model versions (from registry)
  - Data drift status
  - Model performance status
  - Recent alerts
  - S3 connection health
  - Dataset statistics

Endpoint: GET /api/admin/ml-observability/

No authentication enforced at model level; protect via Django middleware
or nginx if needed in production.
"""
import os
import json
import logging
from datetime import datetime

from django.http import JsonResponse
from django.views import View

logger = logging.getLogger(__name__)

BASE_DIR         = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANALYTICS_DIR    = os.path.join(BASE_DIR, "analytics")
MONITORING_DIR   = os.path.join(BASE_DIR, "monitoring")
METADATA_PATH    = os.path.join(ANALYTICS_DIR, "pipeline_metadata.json")


class MLObservabilityAPIView(View):
    """
    GET /api/admin/ml-observability/

    Returns comprehensive ML system health report.
    Response shape:
    {
        "generated_at": "ISO timestamp",
        "pipeline": { last_run, status, rows_processed, duration_seconds, s3_configured },
        "models": { active_versions, training_metrics, loaded },
        "drift": { drift_score, drift_detected, last_checked, has_baseline },
        "performance": { degradation_detected, latest_metrics, comparisons },
        "alerts": { summary, recent: [...] },
        "s3": { ok, bucket, region },
        "dataset": { products, customers, date_range }
    }
    """

    def get(self, request, *args, **kwargs):
        report = {
            "generated_at": datetime.now().isoformat(),
            "pipeline": self._pipeline_status(),
            "models": self._model_status(),
            "drift": self._drift_status(),
            "performance": self._performance_status(),
            "alerts": self._alert_status(),
            "s3": self._s3_status(),
            "dataset": self._dataset_status(),
        }
        return JsonResponse(report)

    # ── Pipeline ──────────────────────────────────────────────────────────────

    def _pipeline_status(self) -> dict:
        if not os.path.exists(METADATA_PATH):
            return {"status": "never_run", "last_run": None}
        try:
            with open(METADATA_PATH) as f:
                meta = json.load(f)
            # Import s3 to get live configured status instead of waiting for next pipeline run
            from data_pipeline.s3_storage import s3
            
            return {
                "last_run": meta.get("pipeline_run_at"),
                "status": "success",
                "rows_processed": meta.get("clean_rows"),
                "raw_rows": meta.get("raw_rows"),
                "duration_seconds": meta.get("elapsed_seconds"),
                "s3_configured": s3.is_configured,
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    # ── Models ────────────────────────────────────────────────────────────────

    def _model_status(self) -> dict:
        try:
            from ml_monitoring.model_registry import registry
            from predictions.ml_service import ml

            ml_health = ml.health_check()
            return {
                "active_versions": registry.get_active_versions(),
                "registry_updated": registry.summary().get("last_updated"),
                "training_metrics": ml_health.get("metrics", {}),
                "loaded": {
                    "demand_model":     ml_health.get("demand_model", False),
                    "elasticity_model": ml_health.get("elasticity_model", False),
                    "recommender":      ml_health.get("recommender", False),
                },
            }
        except Exception as e:
            return {"error": str(e)}

    # ── Drift ─────────────────────────────────────────────────────────────────

    def _drift_status(self) -> dict:
        try:
            from ml_monitoring.data_drift import get_latest_drift_report
            report = get_latest_drift_report()
            if report is None:
                return {"status": "no_report", "drift_detected": False}
            return {
                "drift_score":    report.get("drift_score", 0.0),
                "drift_detected": report.get("drift_detected", False),
                "last_checked":   report.get("checked_at"),
                "has_baseline":   report.get("has_baseline", False),
                "feature_scores": report.get("feature_scores", {}),
                "status":         report.get("status", "ok"),
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    # ── Performance ───────────────────────────────────────────────────────────

    def _performance_status(self) -> dict:
        try:
            from ml_monitoring.model_performance import get_latest_performance
            latest = get_latest_performance()
            if latest is None:
                return {"status": "no_history"}
            # Summarize metrics for the demand model (primary)
            demand_metrics = latest.get("metrics", {}).get("demand_model", {})
            return {
                "degradation_detected": False,  # computed on check, not stored here
                "last_recorded": latest.get("recorded_at"),
                "demand_model_rmse": demand_metrics.get("rmse"),
                "demand_model_mae":  demand_metrics.get("mae"),
                "demand_model_r2":   demand_metrics.get("r2"),
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    # ── Alerts ────────────────────────────────────────────────────────────────

    def _alert_status(self) -> dict:
        try:
            from ml_monitoring.alert_manager import alert_manager
            summary = alert_manager.summary()
            recent = alert_manager.get_recent(n=10)
            return {
                "summary": summary,
                "recent":  recent,
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    # ── S3 ────────────────────────────────────────────────────────────────────

    def _s3_status(self) -> dict:
        try:
            from data_pipeline.s3_storage import s3
            if not s3.is_configured:
                return {"ok": False, "reason": "not configured"}
            health = s3.health_check()
            return health
        except Exception as e:
            return {"ok": False, "error": str(e)}

    # ── Dataset ───────────────────────────────────────────────────────────────

    def _dataset_status(self) -> dict:
        if not os.path.exists(METADATA_PATH):
            return {}
        try:
            with open(METADATA_PATH) as f:
                meta = json.load(f)
            return {
                "products":   meta.get("products"),
                "customers":  meta.get("customers"),
                "date_range": meta.get("date_range", {}),
                "outputs":    meta.get("outputs", {}),
            }
        except Exception:
            return {}
