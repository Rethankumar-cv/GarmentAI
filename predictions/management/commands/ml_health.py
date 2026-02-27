"""
ml_health.py — Django management command: python manage.py ml_health

Prints a full health report for the GarmentsInsights ML system:
  - S3 connection status
  - Loaded models (demand, elasticity, recommender)
  - Analytics CSVs in memory
  - S3 artifact inventory

Usage:
    python manage.py ml_health
    python manage.py ml_health --s3-inventory
"""
import os
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Print ML system health — models, analytics CSVs, and S3 status"

    def add_arguments(self, parser):
        parser.add_argument(
            "--s3-inventory",
            action="store_true",
            default=False,
            help="Also list all artifacts in the S3 bucket",
        )

    def handle(self, *args, **options):
        # Load .env
        try:
            from dotenv import load_dotenv
            project_root = os.path.dirname(os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            ))
            load_dotenv(os.path.join(project_root, ".env"))
        except ImportError:
            pass

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("  GarmentsInsights AI -- ML Health Check")
        self.stdout.write("=" * 60)

        # ── S3 status ──────────────────────────────────────────────────────
        self.stdout.write("\n[1] S3 Connection")
        try:
            from data_pipeline.s3_storage import s3
            health = s3.health_check()
            if health["ok"]:
                self.stdout.write(self.style.SUCCESS(
                    f"  OK  bucket: {health['bucket']}  region: {health['region']}"
                ))
            else:
                self.stdout.write(self.style.ERROR(
                    f"  FAIL  {health.get('reason', 'unknown')}"
                ))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ERROR: {e}"))
            s3 = None

        # ── ml_service status ───────────────────────────────────────────────
        self.stdout.write("\n[2] ML Service")
        try:
            from predictions.ml_service import ml
            health_ml = ml.health_check()
            color = self.style.SUCCESS if health_ml.get("ok") else self.style.WARNING

            self.stdout.write(color(f"  Models loaded: {health_ml.get('models_loaded', [])}"))
            self.stdout.write(color(f"  Analytics CSVs: {health_ml.get('analytics_loaded', [])}"))
            self.stdout.write(color(f"  Source: {health_ml.get('source', 'local')}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ERROR loading ml_service: {e}"))

        # ── S3 artifact inventory ───────────────────────────────────────────
        if options["s3_inventory"] and s3 and s3.is_configured:
            self.stdout.write("\n[3] S3 Artifact Inventory")
            try:
                from botocore.exceptions import ClientError
                prefixes = s3.prefixes
                for label, prefix in prefixes.items():
                    resp = s3._client.list_objects_v2(
                        Bucket=s3.bucket, Prefix=prefix + "/", Delimiter="/"
                    )
                    objs = resp.get("Contents", [])
                    if objs:
                        self.stdout.write(f"\n  s3://{s3.bucket}/{prefix}/")
                        for obj in objs:
                            size_kb = obj["Size"] / 1024
                            modified = obj["LastModified"].strftime("%Y-%m-%d %H:%M")
                            key = obj["Key"].replace(prefix + "/", "")
                            self.stdout.write(f"    {key:<50} {size_kb:>8.1f} KB  {modified}")
                    else:
                        self.stdout.write(f"  s3://{s3.bucket}/{prefix}/  (empty)")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  Inventory failed: {e}"))

        self.stdout.write("\n" + "=" * 60 + "\n")
