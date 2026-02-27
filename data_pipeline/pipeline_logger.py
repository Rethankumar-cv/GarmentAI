"""
pipeline_logger.py — Phase 7: Structured Pipeline Run Logger

Records every pipeline execution with:
  - timestamps, duration
  - rows processed, products, customers
  - analytics outputs generated
  - errors (if any)
  - model training metrics (if --retrain)

Saves locally to analytics/pipeline_logs/ and uploads to S3.

Usage:
    logger = PipelineLogger()
    logger.start()
    # ... do work ...
    logger.record_step("transform", rows=802924)
    logger.finish(metadata_dict)
    logger.upload_to_s3()
"""
import os
import json
import logging
import traceback
from datetime import datetime

log = logging.getLogger(__name__)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_DIR = os.path.join(PROJECT_ROOT, "analytics", "pipeline_logs")


class PipelineLogger:
    """Structured run logger for the ETL pipeline."""

    def __init__(self):
        self.run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_data = {
            "run_id": self.run_id,
            "started_at": None,
            "finished_at": None,
            "duration_seconds": None,
            "status": "running",
            "steps": [],
            "outputs": {},
            "errors": [],
            "models_trained": [],
        }
        self._start_ts = None

    def start(self):
        """Mark pipeline start time."""
        self._start_ts = datetime.now()
        self.log_data["started_at"] = self._start_ts.isoformat()
        log.info(f"[PipelineLogger] Run {self.run_id} started.")

    def record_step(self, step_name: str, **kwargs):
        """
        Record completion of a pipeline step.

        Args:
            step_name: e.g. "extract", "transform", "feature_engineering"
            **kwargs: any metrics to record (rows, products, etc.)
        """
        entry = {
            "step": step_name,
            "at": datetime.now().isoformat(),
            **kwargs,
        }
        self.log_data["steps"].append(entry)
        log.info(f"[PipelineLogger] Step '{step_name}' recorded: {kwargs}")

    def record_output(self, filename: str, rows: int, size_kb: float, s3_key: str | None = None):
        """Record a saved analytics CSV."""
        self.log_data["outputs"][filename] = {
            "rows": rows,
            "size_kb": round(size_kb, 1),
            "s3_key": s3_key,
        }

    def record_model(self, model_name: str, metrics: dict, s3_key: str | None = None):
        """Record a trained model's metrics."""
        self.log_data["models_trained"].append({
            "model": model_name,
            "metrics": metrics,
            "s3_key": s3_key,
        })

    def record_error(self, error: Exception | str, step: str = "unknown"):
        """Log an error that occurred during the run."""
        err_str = traceback.format_exc() if isinstance(error, Exception) else str(error)
        self.log_data["errors"].append({
            "step": step,
            "at": datetime.now().isoformat(),
            "error": err_str[:2000],  # cap to avoid huge logs
        })
        log.error(f"[PipelineLogger] Error at step '{step}': {error}")

    def finish(self, status: str = "success"):
        """Mark pipeline end, compute duration, save log locally."""
        finished = datetime.now()
        self.log_data["finished_at"] = finished.isoformat()
        self.log_data["status"] = status

        if self._start_ts:
            self.log_data["duration_seconds"] = round(
                (finished - self._start_ts).total_seconds(), 1
            )

        # Save locally
        os.makedirs(LOG_DIR, exist_ok=True)
        local_path = os.path.join(LOG_DIR, f"run_{self.run_id}.json")
        with open(local_path, "w") as f:
            json.dump(self.log_data, f, indent=2)

        log.info(f"[PipelineLogger] Run {self.run_id} finished in "
                 f"{self.log_data['duration_seconds']}s — status: {status}")
        log.info(f"[PipelineLogger] Log saved to: {local_path}")
        return local_path

    def upload_to_s3(self) -> bool:
        """Upload the run log JSON to S3 pipeline_logs/ prefix."""
        try:
            from data_pipeline.s3_storage import s3
            if not s3.is_configured:
                return False

            local_path = os.path.join(LOG_DIR, f"run_{self.run_id}.json")
            if not os.path.exists(local_path):
                return False

            s3_key = s3.log_key()
            return s3.upload_file(local_path, s3_key)
        except Exception as e:
            log.error(f"[PipelineLogger] S3 upload failed: {e}")
            return False

    @property
    def has_errors(self) -> bool:
        return len(self.log_data["errors"]) > 0

    def summary(self) -> dict:
        return {
            "run_id": self.run_id,
            "status": self.log_data["status"],
            "duration_seconds": self.log_data.get("duration_seconds"),
            "outputs": list(self.log_data["outputs"].keys()),
            "errors": len(self.log_data["errors"]),
        }
