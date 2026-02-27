"""
model_registry.py — Phase 8: Model Registry

Central controller for model version management.
Reads/writes models/active_model.json to determine which version
of each model is currently active in production.

Features:
  - get_active_version(model_name) -> "v1"
  - promote(model_name, version) -> promote new version as active
  - rollback(model_name) -> revert to previous version
  - list_versions(model_name) -> scan S3 for available versions
  - sync_to_s3() -> upload registry to S3 for multi-instance consistency

Usage:
    from ml_monitoring.model_registry import registry

    version = registry.get_active_version("demand_model")  # -> "v1"
    registry.promote("demand_model", "v2")
    registry.rollback("demand_model")
"""
import os
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY_PATH = os.path.join(BASE_DIR, "models", "active_model.json")
S3_REGISTRY_KEY = "models/active_model.json"

KNOWN_MODELS = ["demand_model", "elasticity_model", "recommender_model"]


class ModelRegistry:
    """
    Manages active model versions and version history.
    Syncs with S3 for multi-instance deployments.
    """

    def __init__(self):
        self._data = {}
        self._load()

    def _load(self):
        """Load registry from local file."""
        if os.path.exists(REGISTRY_PATH):
            try:
                with open(REGISTRY_PATH) as f:
                    self._data = json.load(f)
                logger.info(f"[Registry] Loaded from {REGISTRY_PATH}")
            except Exception as e:
                logger.error(f"[Registry] Failed to load: {e}")
                self._data = self._default_registry()
        else:
            logger.warning("[Registry] active_model.json not found — using defaults")
            self._data = self._default_registry()
            self._save()

    def _default_registry(self) -> dict:
        return {
            "demand_model": "v1",
            "elasticity_model": "v1",
            "recommender_model": "v1",
            "last_updated": datetime.now().isoformat(),
            "updated_by": "default",
            "history": {m: ["v1"] for m in KNOWN_MODELS},
        }

    def _save(self):
        """Persist registry to local file."""
        os.makedirs(os.path.dirname(REGISTRY_PATH), exist_ok=True)
        self._data["last_updated"] = datetime.now().isoformat()
        with open(REGISTRY_PATH, "w") as f:
            json.dump(self._data, f, indent=2)
        logger.info("[Registry] Saved locally.")

    # ── Read ──────────────────────────────────────────────────────────────────

    def get_active_version(self, model_name: str) -> str:
        """Return the active version string for a model (e.g. 'v1')."""
        return self._data.get(model_name, "v1")

    def get_active_versions(self) -> dict:
        """Return all active versions as a dict."""
        return {m: self._data.get(m, "v1") for m in KNOWN_MODELS}

    def get_history(self, model_name: str) -> list:
        """Return list of all versions seen for a model."""
        return self._data.get("history", {}).get(model_name, [])

    def get_previous_version(self, model_name: str) -> str | None:
        """Return the version before the current active one."""
        history = self.get_history(model_name)
        current = self.get_active_version(model_name)
        try:
            idx = history.index(current)
            return history[idx - 1] if idx > 0 else None
        except ValueError:
            return None

    def summary(self) -> dict:
        return {
            "active_versions": self.get_active_versions(),
            "last_updated": self._data.get("last_updated"),
            "updated_by": self._data.get("updated_by"),
        }

    # ── Write ─────────────────────────────────────────────────────────────────

    def promote(self, model_name: str, version: str, updated_by: str = "system") -> bool:
        """
        Set a new active version for a model.

        Args:
            model_name: e.g. "demand_model"
            version: e.g. "v2"
            updated_by: audit trail label
        """
        if model_name not in KNOWN_MODELS:
            logger.error(f"[Registry] Unknown model: {model_name}")
            return False

        old_version = self.get_active_version(model_name)
        self._data[model_name] = version
        self._data["updated_by"] = updated_by

        # Update history
        hist = self._data.setdefault("history", {}).setdefault(model_name, [])
        if version not in hist:
            hist.append(version)

        self._save()
        logger.info(f"[Registry] Promoted {model_name}: {old_version} -> {version}")
        return True

    def rollback(self, model_name: str) -> str | None:
        """
        Revert a model to its previous version.

        Returns:
            The version rolled back to, or None if no history.
        """
        prev = self.get_previous_version(model_name)
        if prev is None:
            logger.warning(f"[Registry] No previous version for {model_name}")
            return None

        self._data[model_name] = prev
        self._data["updated_by"] = "rollback"
        self._save()
        logger.info(f"[Registry] Rolled back {model_name} to {prev}")
        return prev

    def register_new_version(self, model_name: str, version: str) -> bool:
        """
        Add a version to history without making it active.
        Called by upload_models after a successful upload.
        """
        if model_name not in KNOWN_MODELS:
            return False

        hist = self._data.setdefault("history", {}).setdefault(model_name, [])
        if version not in hist:
            hist.append(version)
            self._save()
            logger.info(f"[Registry] Registered new version: {model_name} {version}")
        return True

    # ── S3 Sync ───────────────────────────────────────────────────────────────

    def sync_to_s3(self) -> bool:
        """Upload the registry JSON to S3 for multi-instance consistency."""
        try:
            from data_pipeline.s3_storage import s3
            if not s3.is_configured:
                return False
            ok = s3.upload_file(REGISTRY_PATH, S3_REGISTRY_KEY)
            if ok:
                logger.info("[Registry] Synced to S3.")
            return ok
        except Exception as e:
            logger.error(f"[Registry] S3 sync failed: {e}")
            return False

    def sync_from_s3(self) -> bool:
        """Download registry from S3 (e.g. on server startup for multi-instance)."""
        try:
            from data_pipeline.s3_storage import s3
            if not s3.is_configured:
                return False
            result = s3.download_file(S3_REGISTRY_KEY, REGISTRY_PATH, force=True)
            if result:
                self._load()
                logger.info("[Registry] Synced from S3.")
                return True
            return False
        except Exception as e:
            logger.error(f"[Registry] S3 download failed: {e}")
            return False

    # ── S3 Version Discovery ──────────────────────────────────────────────────

    def list_s3_versions(self, model_name: str) -> list[int]:
        """
        Scan S3 models/ prefix for all uploaded versions of a model.
        Returns list of version integers, e.g. [1, 2, 3].
        """
        try:
            from data_pipeline.s3_storage import s3
            if not s3.is_configured:
                return []
            return [s3.get_latest_model_version(model_name)]
        except Exception as e:
            logger.error(f"[Registry] S3 version scan failed: {e}")
            return []


# Global singleton
registry = ModelRegistry()
