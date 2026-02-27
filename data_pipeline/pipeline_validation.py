"""
pipeline_validation.py — Phase 8: Analytics CSV Schema Validation

Validates every analytics DataFrame before it is saved/uploaded.
Catches: missing columns, zero-row outputs, out-of-range prices, bad dates.

Returns a ValidationResult with passed/failed checks and details.

Usage:
    from data_pipeline.pipeline_validation import validate_outputs

    results = validate_outputs({
        "product_demand.csv": demand_df,
        "pricing_signals.csv": pricing_df,
        ...
    })
    if not results.all_passed:
        print(results.failures)
"""
import logging
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ── Expected schemas ──────────────────────────────────────────────────────────
REQUIRED_COLUMNS = {
    "product_demand.csv": ["StockCode", "units_sold"],
    "pricing_signals.csv": ["StockCode", "avg_price", "total_revenue", "total_units"],
    "inventory_metrics.csv": ["StockCode", "safety_stock", "reorder_point", "eoq"],
    "customer_segments.csv": ["CustomerID", "segment"],
    "clean_transactions.csv": ["InvoiceDate", "StockCode", "Quantity", "UnitPrice"],
}

MIN_ROWS = {
    "product_demand.csv":    100,
    "pricing_signals.csv":   50,
    "inventory_metrics.csv": 10,
    "customer_segments.csv": 10,
    "clean_transactions.csv": 1000,
}


class ValidationResult:
    """Holds the results of all validation checks for a pipeline run."""

    def __init__(self):
        self.checks: list[dict] = []

    def add(self, filename: str, check: str, passed: bool, detail: str = ""):
        self.checks.append({
            "filename": filename,
            "check": check,
            "passed": passed,
            "detail": detail,
        })
        if not passed:
            logger.warning(f"[Validation] FAIL {filename} / {check}: {detail}")
        else:
            logger.debug(f"[Validation] PASS {filename} / {check}")

    @property
    def all_passed(self) -> bool:
        return all(c["passed"] for c in self.checks)

    @property
    def failures(self) -> list[dict]:
        return [c for c in self.checks if not c["passed"]]

    @property
    def passed_count(self) -> int:
        return sum(1 for c in self.checks if c["passed"])

    @property
    def failed_count(self) -> int:
        return len(self.failures)

    def summary(self) -> dict:
        return {
            "total_checks": len(self.checks),
            "passed": self.passed_count,
            "failed": self.failed_count,
            "all_passed": self.all_passed,
            "failures": self.failures,
        }


def validate_dataframe(filename: str, df: pd.DataFrame, result: ValidationResult):
    """Run all validation checks for a single DataFrame."""

    # 1. Minimum row count
    min_rows = MIN_ROWS.get(filename, 1)
    result.add(filename, "min_rows",
               len(df) >= min_rows,
               f"rows={len(df)}, required>={min_rows}")

    # 2. Required columns
    required = REQUIRED_COLUMNS.get(filename, [])
    missing = [c for c in required if c not in df.columns]
    result.add(filename, "required_columns",
               len(missing) == 0,
               f"missing={missing}" if missing else "all present")

    # 3. No all-null columns
    null_cols = [c for c in df.columns if df[c].isna().all()]
    result.add(filename, "no_all_null_columns",
               len(null_cols) == 0,
               f"all-null={null_cols}" if null_cols else "ok")

    # 4. Price sanity (if applicable)
    if "UnitPrice" in df.columns:
        neg_prices = int((df["UnitPrice"] < 0).sum())
        result.add(filename, "non_negative_price",
                   neg_prices == 0,
                   f"{neg_prices} negative prices" if neg_prices else "ok")

    if "avg_price" in df.columns:
        neg_avg = int((df["avg_price"] < 0).sum())
        result.add(filename, "non_negative_avg_price",
                   neg_avg == 0,
                   f"{neg_avg} rows" if neg_avg else "ok")

    # 5. Quantity sanity
    if "Quantity" in df.columns:
        extreme = int((df["Quantity"].abs() > 100_000).sum())
        result.add(filename, "quantity_range",
                   extreme == 0,
                   f"{extreme} extreme quantity rows" if extreme else "ok")

    # 6. StockCode is not blank
    if "StockCode" in df.columns:
        blank_sc = int(df["StockCode"].astype(str).str.strip().eq("").sum())
        result.add(filename, "stockcode_not_blank",
                   blank_sc == 0,
                   f"{blank_sc} blank StockCodes" if blank_sc else "ok")

    # 7. No duplicate StockCodes
    # As noted, demand and pricing have multiple rows per StockCode.
    # We will enforce uniqueness ONLY on files designated as strict single-row directories.
    STRICTLY_UNIQUE_STOCKCODE = {"product_recommendations.csv", "customer_segments.csv"}
    if filename in STRICTLY_UNIQUE_STOCKCODE and "StockCode" in df.columns:
        dups = int(df["StockCode"].duplicated().sum())
        result.add(filename, "no_duplicate_stockcodes",
                   dups == 0,
                   f"{dups} duplicates" if dups else "ok")


def validate_outputs(dfs: dict[str, pd.DataFrame]) -> ValidationResult:
    """
    Validate a batch of DataFrames.

    Args:
        dfs: Dict mapping filename -> DataFrame
             e.g. {"product_demand.csv": demand_df, ...}

    Returns:
        ValidationResult with all check outcomes.
    """
    result = ValidationResult()
    for filename, df in dfs.items():
        validate_dataframe(filename, df, result)

    summary = result.summary()
    if result.all_passed:
        logger.info(f"[Validation] All {summary['total_checks']} checks passed.")
    else:
        logger.warning(
            f"[Validation] {summary['failed']} / {summary['total_checks']} checks FAILED."
        )
        # Emit alerts for failures
        try:
            from ml_monitoring.alert_manager import alert_manager
            for failure in result.failures:
                alert_manager.validation_fail(
                    failure["filename"],
                    [f"{failure['check']}: {failure['detail']}"]
                )
        except Exception:
            pass

    return result
