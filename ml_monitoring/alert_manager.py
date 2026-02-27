"""
alert_manager.py — Phase 8: Centralized Alert System

Records and manages operational alerts for the ML pipeline.
Designed for extensibility: start with file-based alerts,
later add email/Slack/SNS integrations.

Alert types:
  DATA_DRIFT      — data distribution shifted significantly
  PERFORMANCE_DROP — model RMSE/MAE degradation detected
  ETL_FAILURE     — pipeline run failed
  S3_FAILURE      — S3 upload/download failed
  VALIDATION_FAIL — analytics CSV failed schema check

Severity levels:
  INFO     — informational, no action required
  WARNING  — notable, monitor closely
  CRITICAL — immediate attention required

Usage:
    from ml_monitoring.alert_manager import alert_manager

    alert_manager.emit(
        alert_type="DATA_DRIFT",
        severity="WARNING",
        message="Avg price drifted 30% from baseline.",
        metadata={"drift_score": 0.32}
    )

    recent = alert_manager.get_recent(n=10)
"""
import os
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

BASE_DIR       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MONITORING_DIR = os.path.join(BASE_DIR, "monitoring")
ALERTS_PATH    = os.path.join(MONITORING_DIR, "alerts.json")
S3_ALERTS_KEY  = "monitoring/alerts.json"

VALID_TYPES     = {"DATA_DRIFT", "PERFORMANCE_DROP", "ETL_FAILURE", "S3_FAILURE", "VALIDATION_FAIL", "INFO"}
VALID_SEVERITIES = {"INFO", "WARNING", "CRITICAL"}

MAX_ALERTS = 500   # rolling cap


class AlertManager:
    """
    Central alert hub for the GarmentsInsights AI pipeline.
    Thread-safe for single-process Django deployments.
    """

    def __init__(self):
        self._alerts: list[dict] = []
        self._load()

    def _load(self):
        """Load existing alerts from disk."""
        if os.path.exists(ALERTS_PATH):
            try:
                with open(ALERTS_PATH) as f:
                    self._alerts = json.load(f)
                logger.debug(f"[Alerts] Loaded {len(self._alerts)} alerts.")
            except Exception as e:
                logger.error(f"[Alerts] Failed to load: {e}")
                self._alerts = []

    def _save(self):
        """Persist alerts to disk."""
        os.makedirs(MONITORING_DIR, exist_ok=True)
        # Keep rolling cap
        self._alerts = self._alerts[-MAX_ALERTS:]
        with open(ALERTS_PATH, "w") as f:
            json.dump(self._alerts, f, indent=2)

    # ── Emit ──────────────────────────────────────────────────────────────────

    def emit(
        self,
        alert_type: str,
        severity: str,
        message: str,
        metadata: dict | None = None,
        upload_to_s3: bool = True,
    ) -> dict:
        """
        Create and store an alert.

        Args:
            alert_type: One of VALID_TYPES
            severity: One of VALID_SEVERITIES
            message: Human-readable description
            metadata: Any additional context dict

        Returns:
            The alert dict that was stored.
        """
        if alert_type not in VALID_TYPES:
            alert_type = "INFO"
        if severity not in VALID_SEVERITIES:
            severity = "INFO"

        alert = {
            "id": len(self._alerts) + 1,
            "type": alert_type,
            "severity": severity,
            "message": message,
            "metadata": metadata or {},
            "timestamp": datetime.now().isoformat(),
            "acknowledged": False,
        }

        self._alerts.append(alert)
        self._save()

        log_level = {
            "INFO": logger.info,
            "WARNING": logger.warning,
            "CRITICAL": logger.error,
        }.get(severity, logger.info)
        log_level(f"[Alert][{severity}][{alert_type}] {message}")

        if upload_to_s3:
            self._upload_to_s3()

        return alert

    # ── Convenience methods ───────────────────────────────────────────────────

    def data_drift(self, drift_score: float, top_features: list | None = None):
        return self.emit(
            "DATA_DRIFT",
            "WARNING" if drift_score < 0.5 else "CRITICAL",
            f"Data drift detected: score={drift_score:.3f}",
            {"drift_score": drift_score, "top_features": top_features or []},
        )

    def performance_drop(self, model: str, old_rmse: float, new_rmse: float):
        pct = round((new_rmse - old_rmse) / max(abs(old_rmse), 1e-6) * 100, 1)
        return self.emit(
            "PERFORMANCE_DROP",
            "WARNING" if pct < 25 else "CRITICAL",
            f"{model} RMSE increased {pct}% ({old_rmse:.2f} -> {new_rmse:.2f})",
            {"model": model, "old_rmse": old_rmse, "new_rmse": new_rmse, "pct_increase": pct},
        )

    def etl_failure(self, error: str, step: str = "unknown"):
        return self.emit(
            "ETL_FAILURE", "CRITICAL",
            f"ETL failure at step '{step}': {error[:200]}",
            {"step": step, "error": error[:500]},
        )

    def s3_failure(self, operation: str, key: str, error: str):
        return self.emit(
            "S3_FAILURE", "WARNING",
            f"S3 {operation} failed for {key}: {error[:200]}",
            {"operation": operation, "key": key},
        )

    def validation_fail(self, filename: str, issues: list):
        return self.emit(
            "VALIDATION_FAIL", "WARNING",
            f"Schema validation failed for {filename}: {len(issues)} issue(s)",
            {"filename": filename, "issues": issues[:10]},
        )

    # ── Query ─────────────────────────────────────────────────────────────────

    def get_recent(self, n: int = 20) -> list:
        """Return the N most recent alerts."""
        return self._alerts[-n:]

    def get_unacknowledged(self) -> list:
        """Return all unacknowledged alerts."""
        return [a for a in self._alerts if not a.get("acknowledged")]

    def get_critical(self) -> list:
        """Return all CRITICAL severity alerts."""
        return [a for a in self._alerts if a.get("severity") == "CRITICAL"]

    def get_by_type(self, alert_type: str) -> list:
        return [a for a in self._alerts if a.get("type") == alert_type]

    def acknowledge(self, alert_id: int) -> bool:
        """Mark an alert as acknowledged."""
        for alert in self._alerts:
            if alert.get("id") == alert_id:
                alert["acknowledged"] = True
                alert["acknowledged_at"] = datetime.now().isoformat()
                self._save()
                return True
        return False

    def summary(self) -> dict:
        """Return aggregate summary of current alerts."""
        total = len(self._alerts)
        unacked = len(self.get_unacknowledged())
        critical = len(self.get_critical())
        return {
            "total_alerts": total,
            "unacknowledged": unacked,
            "critical": critical,
            "last_alert": self._alerts[-1]["timestamp"] if self._alerts else None,
        }

    def _upload_to_s3(self):
        try:
            from data_pipeline.s3_storage import s3
            if s3.is_configured:
                s3.upload_file(ALERTS_PATH, S3_ALERTS_KEY)
        except Exception as e:
            logger.debug(f"[Alerts] S3 upload skipped: {e}")


# Global singleton
alert_manager = AlertManager()
