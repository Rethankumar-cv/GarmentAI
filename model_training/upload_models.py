"""
upload_models.py — Phase 7: Upload Trained Models to S3

Uploads all trained model files from the local models/ directory to
the S3 models/ prefix with version numbering.

Version strategy:
  - Scans existing S3 keys to find current max version
  - Increments version by 1 for this run
  - Uploads: demand_model_v{N}.joblib, elasticity_model_v{N}.joblib,
             recommender_model_v{N}.joblib, model_metrics_v{N}.json

Usage:
    # After training
    python -m model_training.upload_models

    # Or called programmatically
    from model_training.upload_models import upload_all_models
    upload_all_models()
"""
import os
import sys
import json
import logging

logger = logging.getLogger(__name__)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")

MODEL_FILES = [
    "demand_model.joblib",
    "elasticity_model.joblib",
    "recommender_model.joblib",
    "model_metrics.json",
]


def upload_all_models() -> dict:
    """
    Upload all model artifacts to S3 with version numbering.

    Returns:
        dict with upload results per file.
    """
    sys.path.insert(0, PROJECT_ROOT)

    try:
        from data_pipeline.s3_storage import s3
    except ImportError:
        logger.error("[upload_models] Cannot import s3_storage — make sure data_pipeline is on path.")
        return {"ok": False, "reason": "import error"}

    if not s3.is_configured:
        logger.warning("[upload_models] S3 not configured — skipping upload.")
        return {"ok": False, "reason": "S3 not configured"}

    print("\n" + "=" * 60)
    print("  Uploading Models to S3")
    print("=" * 60)

    results = {}

    # Determine next version number (based on demand_model since it's always present)
    current_version = s3.get_latest_model_version("demand_model")
    next_version = current_version + 1
    print(f"\n  Current version: v{current_version}  →  New version: v{next_version}\n")

    for filename in MODEL_FILES:
        local_path = os.path.join(MODELS_DIR, filename)

        if not os.path.exists(local_path):
            logger.warning(f"[upload_models] Not found locally: {local_path}")
            results[filename] = {"uploaded": False, "reason": "file not found"}
            print(f"  ⚠️  {filename} — not found locally, skipping")
            continue

        # Build versioned S3 key
        if filename.endswith(".joblib"):
            stem = filename.replace(".joblib", "")
            s3_key = f"models/{stem}_v{next_version}.joblib"
        else:
            # model_metrics.json
            stem = filename.replace(".json", "")
            s3_key = f"models/{stem}_v{next_version}.json"

        # Also upload as "latest" (unversioned key for easy access)
        s3_latest_key = f"models/{filename}"

        size_kb = os.path.getsize(local_path) / 1024
        print(f"  Uploading {filename} ({size_kb:.1f} KB) → s3://{s3.bucket}/{s3_key}")

        ok_versioned = s3.upload_file(local_path, s3_key)
        ok_latest    = s3.upload_file(local_path, s3_latest_key)  # latest alias

        results[filename] = {
            "uploaded": ok_versioned,
            "s3_key_versioned": s3_key,
            "s3_key_latest": s3_latest_key,
            "version": next_version,
            "size_kb": round(size_kb, 1),
        }

        status = "✅" if ok_versioned else "❌"
        print(f"  {status} {filename} → {s3_key}")

    # Summary
    success_count = sum(1 for r in results.values() if r.get("uploaded"))
    print(f"\n  {success_count}/{len(MODEL_FILES)} files uploaded to S3 (version v{next_version})")
    print("=" * 60 + "\n")

    return {
        "ok": success_count == len(MODEL_FILES),
        "version": next_version,
        "results": results,
    }


if __name__ == "__main__":
    # Allow running from the model_training/ directory
    sys.path.insert(0, PROJECT_ROOT)

    # Load .env if available
    try:
        from dotenv import load_dotenv
        load_dotenv(os.path.join(PROJECT_ROOT, ".env"))
    except ImportError:
        pass

    logging.basicConfig(level=logging.INFO)
    result = upload_all_models()
    print(json.dumps(result, indent=2))
