"""
extract.py — Phase 1: Data Extraction

Loads the raw Online Retail CSV from the data/ directory.
Provides raw DataFrame with minimal dtype coercion.
"""
import os
import pandas as pd

# Default path relative to project root
RAW_CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "online_retail.csv")


def load_raw(path: str = RAW_CSV_PATH) -> pd.DataFrame:
    """
    Load raw Online Retail CSV into a DataFrame.

    Raw columns expected:
        Invoice, StockCode, Description, Quantity,
        InvoiceDate, Price, Customer ID, Country, _source_sheet

    Returns:
        pd.DataFrame with raw data
    """
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Dataset not found at '{path}'.\n"
            f"Run: python convert_dataset.py  to generate it from the Excel source."
        )

    print(f"[extract] Loading raw CSV from: {path}")
    df = pd.read_csv(
        path,
        dtype={
            "Invoice": str,
            "StockCode": str,
            "Description": str,
            "Customer ID": str,
            "Country": str,
        },
        low_memory=False,
    )

    print(f"[extract] Loaded {len(df):,} rows × {len(df.columns)} columns")
    print(f"[extract] Columns: {list(df.columns)}")
    return df


if __name__ == "__main__":
    df = load_raw()
    print(df.head(3))
