"""
s3_storage.py — Phase 7: AWS S3 Storage Helper

Central module for all S3 operations in GarmentsInsights AI.
Provides upload, download, versioned artifact management, and health checks.

Design:
  - Graceful degradation: if S3 is not configured or unreachable,
    all methods log a warning and return None / False.
  - Local caching: downloaded files are cached in tmp/ to avoid
    repeated S3 calls on every Django restart.
  - Versioning: upload keys include YYYYMM suffix for analytics CSVs
    and v{N} suffix for model files.

Usage:
    from data_pipeline.s3_storage import s3

    # Upload a file
    s3.upload_file("analytics/product_demand.csv", "analytics/product_demand_2026_02.csv")

    # Download with local cache
    local_path = s3.download_file("models/demand_model_v1.joblib", "tmp/models/demand_model.joblib")

    # Upload a DataFrame directly
    s3.upload_dataframe(df, "analytics/product_demand_2026_02.csv")

    # Health check
    print(s3.health_check())
"""
import os
import io
import json
import logging
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

# Try to load .env if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

try:
    import boto3
    from botocore.exceptions import NoCredentialsError, ClientError, BotoCoreError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

import pandas as pd

# ── Configuration ─────────────────────────────────────────────────────────────
BUCKET_NAME   = os.environ.get("S3_BUCKET_NAME", "garmentsinsights-data")
AWS_REGION    = os.environ.get("AWS_DEFAULT_REGION", "ap-south-1")
PREFIX_RAW    = os.environ.get("S3_PREFIX_RAW",       "raw")
PREFIX_PROC   = os.environ.get("S3_PREFIX_PROCESSED",  "processed")
PREFIX_ANA    = os.environ.get("S3_PREFIX_ANALYTICS",  "analytics")
PREFIX_MODELS = os.environ.get("S3_PREFIX_MODELS",     "models")
PREFIX_LOGS   = os.environ.get("S3_PREFIX_LOGS",       "pipeline_logs")

# Local cache directory (under project root)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR    = os.path.join(PROJECT_ROOT, "tmp")


class S3Storage:
    """
    Thin wrapper around boto3 S3 client with graceful fallback.
    """

    def __init__(self):
        self._client = None
        self._configured = False
        self._init_client()

    def _init_client(self):
        if not BOTO3_AVAILABLE:
            logger.warning("[S3] boto3 not installed — S3 features disabled. Run: pip install boto3")
            return

        key_id = os.environ.get("AWS_ACCESS_KEY_ID", "")
        secret  = os.environ.get("AWS_SECRET_ACCESS_KEY", "")

        if not key_id or not secret:
            logger.warning("[S3] AWS credentials not found in environment — S3 features disabled.")
            return

        try:
            self._client = boto3.client(
                "s3",
                aws_access_key_id=key_id,
                aws_secret_access_key=secret,
                region_name=AWS_REGION,
            )
            self._configured = True
            logger.info(f"[S3] Client initialized — bucket: {BUCKET_NAME}, region: {AWS_REGION}")
        except Exception as e:
            logger.error(f"[S3] Failed to initialize client: {e}")

    # ── Upload ─────────────────────────────────────────────────────────────────

    def upload_file(self, local_path: str, s3_key: str) -> bool:
        """
        Upload a local file to S3.

        Args:
            local_path: absolute or relative path to the file
            s3_key: key inside the S3 bucket (e.g. "analytics/product_demand_2026_02.csv")

        Returns:
            True on success, False on failure or if S3 not configured.
        """
        if not self._configured:
            logger.debug("[S3] Not configured — skipping upload.")
            return False

        if not os.path.exists(local_path):
            logger.warning(f"[S3] File not found for upload: {local_path}")
            return False

        try:
            self._client.upload_file(local_path, BUCKET_NAME, s3_key)
            size_kb = os.path.getsize(local_path) / 1024
            logger.info(f"[S3] ✅ Uploaded {local_path} → s3://{BUCKET_NAME}/{s3_key} ({size_kb:.1f} KB)")
            return True
        except (ClientError, BotoCoreError) as e:
            logger.error(f"[S3] Upload failed for {s3_key}: {e}")
            return False

    def upload_dataframe(self, df: pd.DataFrame, s3_key: str, fmt: str = "csv") -> bool:
        """
        Upload a pandas DataFrame directly to S3 (no temp file needed).

        Args:
            df: DataFrame to upload
            s3_key: key inside the S3 bucket
            fmt: "csv" or "parquet"
        """
        if not self._configured:
            return False

        try:
            buf = io.BytesIO()
            if fmt == "parquet":
                df.to_parquet(buf, index=False)
                content_type = "application/octet-stream"
            else:
                buf = io.StringIO()
                df.to_csv(buf, index=False)
                buf = io.BytesIO(buf.getvalue().encode("utf-8"))
                content_type = "text/csv"

            buf.seek(0)
            self._client.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=buf,
                ContentType=content_type,
            )
            logger.info(f"[S3] ✅ DataFrame uploaded → s3://{BUCKET_NAME}/{s3_key} ({len(df):,} rows)")
            return True
        except Exception as e:
            logger.error(f"[S3] DataFrame upload failed for {s3_key}: {e}")
            return False

    def upload_json(self, data: dict, s3_key: str) -> bool:
        """Upload a dict as JSON to S3."""
        if not self._configured:
            return False
        try:
            body = json.dumps(data, indent=2).encode("utf-8")
            self._client.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=body,
                ContentType="application/json",
            )
            logger.info(f"[S3] ✅ JSON uploaded → s3://{BUCKET_NAME}/{s3_key}")
            return True
        except Exception as e:
            logger.error(f"[S3] JSON upload failed: {e}")
            return False

    # ── Download ───────────────────────────────────────────────────────────────

    def download_file(self, s3_key: str, local_path: str, force: bool = False) -> str | None:
        """
        Download a file from S3 to local_path.
        Skips download if local_path already exists and force=False.

        Returns:
            local_path on success, None on failure.
        """
        if not self._configured:
            return None

        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        if os.path.exists(local_path) and not force:
            logger.debug(f"[S3] Using cached: {local_path}")
            return local_path

        try:
            self._client.download_file(BUCKET_NAME, s3_key, local_path)
            size_kb = os.path.getsize(local_path) / 1024
            logger.info(f"[S3] ✅ Downloaded s3://{BUCKET_NAME}/{s3_key} → {local_path} ({size_kb:.1f} KB)")
            return local_path
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                logger.warning(f"[S3] Key not found: {s3_key}")
            else:
                logger.error(f"[S3] Download failed for {s3_key}: {e}")
            return None

    def download_dataframe(self, s3_key: str) -> pd.DataFrame | None:
        """Download a CSV from S3 directly into a DataFrame (no temp file)."""
        if not self._configured:
            return None
        try:
            obj = self._client.get_object(Bucket=BUCKET_NAME, Key=s3_key)
            df = pd.read_csv(io.BytesIO(obj["Body"].read()))
            logger.info(f"[S3] ✅ DataFrame downloaded from s3://{BUCKET_NAME}/{s3_key} ({len(df):,} rows)")
            return df
        except ClientError as e:
            if e.response["Error"]["Code"] in ("404", "NoSuchKey"):
                logger.warning(f"[S3] CSV not found: {s3_key}")
            else:
                logger.error(f"[S3] DataFrame download failed: {e}")
            return None

    # ── Versioning helpers ─────────────────────────────────────────────────────

    @staticmethod
    def analytics_key(filename: str) -> str:
        """Return versioned S3 key for analytics CSVs: analytics/product_demand_2026_02.csv"""
        stem = Path(filename).stem
        suffix = Path(filename).suffix
        month_tag = datetime.now().strftime("%Y_%m")
        return f"{PREFIX_ANA}/{stem}_{month_tag}{suffix}"

    @staticmethod
    def model_key(filename: str, version: int = 1) -> str:
        """Return versioned S3 key for model files: models/demand_model_v1.joblib"""
        stem = Path(filename).stem
        suffix = Path(filename).suffix
        return f"{PREFIX_MODELS}/{stem}_v{version}{suffix}"

    @staticmethod
    def log_key(run_dt: datetime | None = None) -> str:
        """Return S3 key for pipeline log: pipeline_logs/run_20260223_154500.json"""
        dt = run_dt or datetime.now()
        return f"{PREFIX_LOGS}/run_{dt.strftime('%Y%m%d_%H%M%S')}.json"

    def get_latest_model_version(self, model_stem: str) -> int:
        """
        Scan S3 models/ prefix to find the highest version number for a model.
        Returns 0 if no versioned models found.
        """
        if not self._configured:
            return 0
        try:
            resp = self._client.list_objects_v2(
                Bucket=BUCKET_NAME,
                Prefix=f"{PREFIX_MODELS}/{model_stem}_v",
            )
            objs = resp.get("Contents", [])
            versions = []
            for obj in objs:
                key = obj["Key"]
                # Extract v{N} from key
                try:
                    vpart = key.split("_v")[-1].split(".")[0]
                    versions.append(int(vpart))
                except ValueError:
                    pass
            return max(versions) if versions else 0
        except Exception as e:
            logger.error(f"[S3] Failed to list model versions: {e}")
            return 0

    # ── Health check ───────────────────────────────────────────────────────────

    def health_check(self) -> dict:
        """Test S3 connection and return status dict."""
        if not self._configured:
            return {
                "ok": False,
                "reason": "Not configured (missing boto3 or credentials)",
                "bucket": BUCKET_NAME,
            }

        try:
            # Try a lightweight HEAD bucket call
            self._client.head_bucket(Bucket=BUCKET_NAME)
            return {
                "ok": True,
                "bucket": BUCKET_NAME,
                "region": AWS_REGION,
            }
        except ClientError as e:
            code = e.response["Error"]["Code"]
            return {
                "ok": False,
                "bucket": BUCKET_NAME,
                "reason": f"ClientError {code}: {e}",
            }
        except Exception as e:
            return {"ok": False, "bucket": BUCKET_NAME, "reason": str(e)}

    @property
    def is_configured(self) -> bool:
        return self._configured

    @property
    def bucket(self) -> str:
        return BUCKET_NAME

    @property
    def prefixes(self) -> dict:
        return {
            "raw": PREFIX_RAW,
            "processed": PREFIX_PROC,
            "analytics": PREFIX_ANA,
            "models": PREFIX_MODELS,
            "logs": PREFIX_LOGS,
        }


# ── Global singleton ──────────────────────────────────────────────────────────
s3 = S3Storage()
