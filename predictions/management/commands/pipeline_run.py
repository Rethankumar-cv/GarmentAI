"""
pipeline_run.py — Django management command: python manage.py pipeline_run

Runs the GarmentsInsights AI data pipeline from within Django.

Options:
    --retrain       Trigger ML model retraining + S3 upload after ETL
    --upload-only   Skip ETL, only upload existing CSVs to S3
    --no-s3         Force local-only mode even if S3 is configured

Usage:
    python manage.py pipeline_run
    python manage.py pipeline_run --retrain
    python manage.py pipeline_run --upload-only
"""
import os
import sys
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Run the GarmentsInsights AI data pipeline (ETL + optional model retrain)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--retrain",
            action="store_true",
            default=False,
            help="Trigger ML model retraining and upload to S3 after ETL",
        )
        parser.add_argument(
            "--upload-only",
            action="store_true",
            default=False,
            help="Skip ETL — only upload existing local CSVs to S3",
        )
        parser.add_argument(
            "--no-s3",
            action="store_true",
            default=False,
            help="Skip S3 uploads (local run only)",
        )

    def handle(self, *args, **options):
        # Load .env before importing pipeline modules
        try:
            from dotenv import load_dotenv
            project_root = os.path.dirname(os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            ))
            load_dotenv(os.path.join(project_root, ".env"))
        except ImportError:
            pass

        # Optionally disable S3
        if options["no_s3"]:
            os.environ.pop("AWS_ACCESS_KEY_ID", None)
            os.environ.pop("AWS_SECRET_ACCESS_KEY", None)
            self.stdout.write(self.style.WARNING("[pipeline_run] S3 disabled (--no-s3 flag)"))

        # Check S3 status
        try:
            from data_pipeline.s3_storage import s3
            health = s3.health_check()
            if health["ok"]:
                self.stdout.write(self.style.SUCCESS(
                    f"[pipeline_run] S3 ready: s3://{health['bucket']} ({health['region']})"
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f"[pipeline_run] S3 not available: {health.get('reason', 'unknown')} — running locally"
                ))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"[pipeline_run] S3 check skipped: {e}"))

        # Run the pipeline
        try:
            from data_pipeline.pipeline import run_pipeline
            metadata = run_pipeline(
                retrain=options["retrain"],
                upload_only=options["upload_only"],
            )

            if metadata:
                self.stdout.write(self.style.SUCCESS(
                    f"\n[pipeline_run] Done! "
                    f"{metadata.get('clean_rows', 0):,} rows processed in "
                    f"{metadata.get('elapsed_seconds', '?')}s"
                ))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"[pipeline_run] Pipeline failed: {e}"))
            sys.exit(1)
