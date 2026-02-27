"""
pipeline.py — Phase 2 + Phase 7: Pipeline Orchestrator

Runs the full ETL + Feature Engineering pipeline end-to-end:
  1. Extract raw CSV
  2. Transform / clean
  3. Feature engineering -> 4 analytics CSVs
  4. Save locally and upload to S3 (if configured)
  5. (Optional) Trigger model retraining + upload models

Usage:
    # From project root
    python -m data_pipeline.pipeline

    # With retraining enabled
    python -m data_pipeline.pipeline --retrain

    # Force re-upload to S3 even if no retrain
    python -m data_pipeline.pipeline --upload
"""
import os
import sys
import time
import argparse
import json
import pandas as pd
from datetime import datetime

# Add project root to path when run directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from .env
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

from data_pipeline.extract import load_raw
from data_pipeline.transform import clean_transactions
from data_pipeline.feature_engineering import (
    build_demand_features,
    build_pricing_signals,
    build_customer_rfm,
    build_inventory_metrics,
)
from data_pipeline.s3_storage import s3
from data_pipeline.pipeline_logger import PipelineLogger
from data_pipeline.pipeline_validation import validate_outputs

# Output directory for precomputed analytics CSVs
ANALYTICS_DIR = os.path.join(os.path.dirname(__file__), "..", "analytics")
METADATA_FILE = os.path.join(ANALYTICS_DIR, "pipeline_metadata.json")


def ensure_dirs():
    """Create output directories if they don't exist."""
    os.makedirs(ANALYTICS_DIR, exist_ok=True)


def save_csv(df, filename, run_logger=None):
    """
    Save a DataFrame to the analytics/ directory and upload to S3.
    Returns the local path of saved file.
    """
    path = os.path.join(ANALYTICS_DIR, filename)
    df.to_csv(path, index=False)
    size_kb = os.path.getsize(path) / 1024
    print(f"[pipeline] Saved {filename} -- {len(df):,} rows, {size_kb:.1f} KB")

    # Upload to S3 (versioned key, e.g. analytics/product_demand_2026_02.csv)
    s3_key = None
    if s3.is_configured:
        s3_key = s3.analytics_key(filename)
        ok = s3.upload_file(path, s3_key)
        if ok:
            print(f"[pipeline] S3 Uploaded -> s3://{s3.bucket}/{s3_key}")

    # Log the output
    if run_logger:
        run_logger.record_output(filename, rows=len(df), size_kb=size_kb, s3_key=s3_key)

    return path


def run_pipeline(retrain=False, upload_only=False):
    """
    Full pipeline: Extract -> Clean -> Feature Engineer -> Save CSVs -> Upload to S3.

    Args:
        retrain: If True, triggers model_training scripts after pipeline.
        upload_only: If True, skip ETL and only upload existing CSVs to S3.
    """
    run_logger = PipelineLogger()
    run_logger.start()

    metadata = {}

    try:
        start = time.time()
        print("\n" + "=" * 60)
        print("  GarmentsInsights AI -- Data Pipeline")
        print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  S3 configured: {'YES' if s3.is_configured else 'NO (local only)'}")
        print("=" * 60)

        ensure_dirs()

        if upload_only:
            print("\n[UPLOAD-ONLY] Uploading existing CSVs to S3...")
            _upload_existing_csvs(run_logger)
            elapsed = round(time.time() - start, 1)
            run_logger.record_step("upload_only", elapsed_seconds=elapsed)
            run_logger.finish("success")
            run_logger.upload_to_s3()
            return {}

        # -- STEP 1: Extract --------------------------------------------------
        print("\n[1/4] Extracting raw data...")
        raw_df = load_raw()
        run_logger.record_step("extract", raw_rows=len(raw_df))

        # -- STEP 2: Transform ------------------------------------------------
        print("\n[2/4] Cleaning transactions...")
        clean_df = clean_transactions(raw_df)
        run_logger.record_step(
            "transform",
            clean_rows=len(clean_df),
            retention_pct=round(len(clean_df) / max(len(raw_df), 1) * 100, 1),
        )

        # -- STEP 3: Feature Engineering --------------------------------------
        print("\n[3/4] Engineering features...")
        demand_df    = build_demand_features(clean_df)
        pricing_df   = build_pricing_signals(clean_df)
        rfm_df       = build_customer_rfm(clean_df)
        inventory_df = build_inventory_metrics(clean_df)
        run_logger.record_step(
            "feature_engineering",
            demand_rows=len(demand_df),
            pricing_rows=len(pricing_df),
            rfm_rows=len(rfm_df),
            inventory_rows=len(inventory_df),
        )

        # -- STEP 4: Validate + Save + Upload ----------------------------------
        print("\n[4/4] Validating and saving analytics datasets...")

        # Schema validation before any writes
        validation = validate_outputs({
            "product_demand.csv":     demand_df,
            "pricing_signals.csv":    pricing_df,
            "customer_segments.csv":  rfm_df,
            "inventory_metrics.csv":  inventory_df,
            "clean_transactions.csv": clean_df,
        })
        vsummary = validation.summary()
        run_logger.record_step(
            "validation",
            checks_passed=vsummary["passed"],
            checks_failed=vsummary["failed"],
            all_passed=vsummary["all_passed"],
        )
        if not validation.all_passed:
            print(f"[pipeline] WARNING: {vsummary['failed']} validation check(s) failed — see logs")

        save_csv(demand_df,    "product_demand.csv",     run_logger)
        save_csv(pricing_df,   "pricing_signals.csv",    run_logger)
        save_csv(rfm_df,       "customer_segments.csv",  run_logger)
        save_csv(inventory_df, "inventory_metrics.csv",  run_logger)
        save_csv(clean_df,     "clean_transactions.csv", run_logger)

        # -- Pipeline metadata ------------------------------------------------
        elapsed = round(time.time() - start, 1)
        metadata = {
            "pipeline_run_at": datetime.now().isoformat(),
            "elapsed_seconds": elapsed,
            "raw_rows": int(len(raw_df)),
            "clean_rows": int(len(clean_df)),
            "products": int(clean_df["StockCode"].nunique()),
            "customers": int(clean_df["CustomerID"].nunique()),
            "date_range": {
                "from": str(clean_df["InvoiceDate"].min().date()),
                "to":   str(clean_df["InvoiceDate"].max().date()),
            },
            "outputs": {
                "product_demand":    int(len(demand_df)),
                "pricing_signals":   int(len(pricing_df)),
                "customer_segments": int(len(rfm_df)),
                "inventory_metrics": int(len(inventory_df)),
            },
            "s3_configured": s3.is_configured,
        }

        with open(METADATA_FILE, "w") as f:
            json.dump(metadata, f, indent=2)

        print("\n" + "=" * 60)
        print(f"  Pipeline complete in {elapsed}s")
        print(f"  Output directory: {os.path.abspath(ANALYTICS_DIR)}")
        if s3.is_configured:
            print(f"  Analytics uploaded to s3://{s3.bucket}/analytics/")
        print("=" * 60 + "\n")

        run_logger.finish("success")

        # -- Phase 8: Run monitoring checks after successful pipeline ---------
        _run_monitoring_checks()

    except Exception as e:
        run_logger.record_error(e, step="pipeline")
        run_logger.finish("failed")
        # Emit ETL failure alert
        try:
            from ml_monitoring.alert_manager import alert_manager
            alert_manager.etl_failure(str(e), step="pipeline")
        except Exception:
            pass
        raise
    finally:
        run_logger.upload_to_s3()

    # -- Optional: Trigger model training + upload ----------------------------
    if retrain:
        print("[pipeline] Retraining flag enabled -- launching model_training...")
        _trigger_retraining(run_logger)

        if s3.is_configured:
            print("[pipeline] Uploading trained models to S3...")
            from model_training.upload_models import upload_all_models
            upload_result = upload_all_models()
            print(f"[pipeline] Model upload: {'OK' if upload_result['ok'] else 'FAILED'} "
                  f"version v{upload_result.get('version', '?')}")

    return metadata


def _run_monitoring_checks():
    """Run data drift + model performance checks after a successful pipeline run."""
    try:
        print("[pipeline] Running monitoring checks...")
        from ml_monitoring.data_drift import run_drift_check
        from ml_monitoring.model_performance import run_performance_check
        from ml_monitoring.alert_manager import alert_manager

        drift = run_drift_check()
        if drift.get("drift_detected"):
            alert_manager.data_drift(
                drift["drift_score"],
                drift.get("top_drifting_features")
            )
            print(f"[pipeline] DRIFT ALERT: score={drift['drift_score']:.3f}")
        else:
            print(f"[pipeline] Data drift check: OK (score={drift.get('drift_score', 0):.3f})")

        perf = run_performance_check()
        if perf.get("degradation_detected"):
            print("[pipeline] PERFORMANCE DEGRADATION detected — check alerts")
        else:
            print("[pipeline] Model performance check: OK")

    except Exception as e:
        print(f"[pipeline] Monitoring checks failed (non-fatal): {e}")


def _upload_existing_csvs(run_logger):
    """Upload already-generated local CSVs to S3 without re-running ETL."""
    filenames = [
        "product_demand.csv",
        "pricing_signals.csv",
        "customer_segments.csv",
        "inventory_metrics.csv",
    ]
    for filename in filenames:
        local_path = os.path.join(ANALYTICS_DIR, filename)
        if os.path.exists(local_path):
            size_kb = os.path.getsize(local_path) / 1024
            s3_key = s3.analytics_key(filename)
            ok = s3.upload_file(local_path, s3_key)
            if run_logger:
                try:
                    nrows = len(pd.read_csv(local_path))
                except Exception:
                    nrows = 0
                run_logger.record_output(
                    filename, rows=nrows, size_kb=size_kb,
                    s3_key=s3_key if ok else None
                )
        else:
            print(f"[pipeline] {filename} not found locally -- skipping")


def _trigger_retraining(run_logger=None):
    """Trigger all model training scripts."""
    import subprocess
    training_scripts = [
        "model_training.train_demand",
        "model_training.train_elasticity",
        "model_training.train_recommender",
    ]
    for module in training_scripts:
        print(f"[pipeline] Running: python -m {module}")
        result = subprocess.run([sys.executable, "-m", module], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"[pipeline] {module} completed")
            if run_logger:
                run_logger.record_model(module, metrics={"status": "success"})
        else:
            print(f"[pipeline] {module} FAILED:\n{result.stderr}")
            if run_logger:
                run_logger.record_error(result.stderr, step=module)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GarmentsInsights AI Data Pipeline")
    parser.add_argument("--retrain", action="store_true",
                        help="Trigger ML model retraining + S3 upload after pipeline run")
    parser.add_argument("--upload", action="store_true",
                        help="Skip ETL, only upload existing CSVs to S3")
    args = parser.parse_args()
    run_pipeline(retrain=args.retrain, upload_only=args.upload)
