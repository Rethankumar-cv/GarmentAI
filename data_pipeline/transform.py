"""
transform.py — Phase 2: Data Cleaning & Transformation

Cleans raw Online Retail transaction data:
  - Removes returns (Quantity < 0)
  - Removes cancelled invoices (Invoice starts with 'C')
  - Removes null CustomerID
  - Removes zero/negative prices
  - Parses InvoiceDate to datetime
  - Normalises text fields
  - Adds derived time columns: Year, Month, WeekOfYear, Quarter
  - Adds TotalRevenue = Quantity × Price
"""
import pandas as pd
import numpy as np


def clean_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply all cleaning rules to raw Online Retail DataFrame.

    Args:
        df: Raw DataFrame from extract.load_raw()

    Returns:
        Cleaned DataFrame with standardised column names.
    """
    print(f"[transform] Input rows: {len(df):,}")

    # ── 1. Standardise column names ────────────────────────────────────────
    # Online Retail II uses 'Price' (not 'UnitPrice') and 'Customer ID' (space)
    col_map = {}
    for c in df.columns:
        stripped = c.strip()
        if stripped == "Customer ID":
            col_map[c] = "CustomerID"
        elif stripped == "Price":
            col_map[c] = "UnitPrice"
        else:
            col_map[c] = stripped.replace(" ", "_")
    df = df.rename(columns=col_map)

    print(f"[transform] Normalised columns: {list(df.columns)}")

    # ── 2. Parse InvoiceDate ───────────────────────────────────────────────
    df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"], errors="coerce")
    before = len(df)
    df = df.dropna(subset=["InvoiceDate"])
    print(f"[transform] Dropped {before - len(df):,} rows with invalid InvoiceDate")

    # ── 3. Remove cancelled invoices (Invoice starts with 'C') ────────────
    before = len(df)
    df = df[~df["Invoice"].astype(str).str.startswith("C")]
    print(f"[transform] Removed {before - len(df):,} cancellation rows (Invoice ~ C*)")

    # ── 4. Remove returns / negative quantities ───────────────────────────
    df["Quantity"] = pd.to_numeric(df["Quantity"], errors="coerce")
    before = len(df)
    df = df[df["Quantity"] > 0]
    print(f"[transform] Removed {before - len(df):,} rows with Quantity ≤ 0")

    # ── 5. Remove zero or negative prices ────────────────────────────────
    df["UnitPrice"] = pd.to_numeric(df["UnitPrice"], errors="coerce")
    before = len(df)
    df = df[df["UnitPrice"] > 0]
    print(f"[transform] Removed {before - len(df):,} rows with UnitPrice ≤ 0")

    # ── 6. Remove null CustomerID ─────────────────────────────────────────
    before = len(df)
    df = df.dropna(subset=["CustomerID"])
    df = df[df["CustomerID"].astype(str).str.strip() != ""]
    print(f"[transform] Removed {before - len(df):,} rows with null CustomerID")

    # ── 7. Clean text fields ──────────────────────────────────────────────
    df["Description"] = (
        df["Description"]
        .fillna("UNKNOWN")
        .astype(str)
        .str.upper()
        .str.strip()
    )
    df["StockCode"] = df["StockCode"].astype(str).str.upper().str.strip()
    df["CustomerID"] = df["CustomerID"].astype(str).str.strip()
    df["Country"] = df["Country"].fillna("Unknown").astype(str).str.strip()

    # ── 8. Add derived time columns ───────────────────────────────────────
    df["Year"] = df["InvoiceDate"].dt.year
    df["Month"] = df["InvoiceDate"].dt.month
    df["Quarter"] = df["InvoiceDate"].dt.quarter
    df["WeekOfYear"] = df["InvoiceDate"].dt.isocalendar().week.astype(int)
    df["YearMonth"] = df["InvoiceDate"].dt.to_period("M").astype(str)  # e.g. "2010-12"

    # ── 9. Add TotalRevenue ───────────────────────────────────────────────
    df["TotalRevenue"] = (df["Quantity"] * df["UnitPrice"]).round(2)

    # ── 10. Filter out non-product StockCodes (test / postage codes) ──────
    # StockCodes that are purely alphabetic (e.g. "POST", "DOT", "BANK CHARGES")
    before = len(df)
    df = df[df["StockCode"].str.match(r"^[0-9]", na=False)]
    print(f"[transform] Removed {before - len(df):,} non-product rows (postage/test codes)")

    print(f"[transform] ✅ Clean rows: {len(df):,}")
    print(f"[transform]    Date range: {df['InvoiceDate'].min().date()} → {df['InvoiceDate'].max().date()}")
    print(f"[transform]    Unique customers: {df['CustomerID'].nunique():,}")
    print(f"[transform]    Unique products:  {df['StockCode'].nunique():,}")
    print(f"[transform]    Countries:         {df['Country'].nunique()}")

    return df.reset_index(drop=True)


if __name__ == "__main__":
    from extract import load_raw
    raw = load_raw()
    clean = clean_transactions(raw)
    print(clean.dtypes)
    print(clean.head(3))
