"""
feature_engineering.py — Phase 2: Feature Engineering for ML

Builds three analytics datasets from cleaned transaction data:

1. build_demand_features()  → product_demand.csv
   - Monthly units sold per product (StockCode)
   - Lag features: lag_1, lag_2, lag_3 month sales
   - Rolling 3-month average demand
   - Month encoding (for seasonality)

2. build_pricing_signals()  → pricing_signals.csv
   - Average price per product
   - Price volatility (std dev)
   - Revenue per product
   - Optimal price signal based on revenue maximisation

3. build_customer_rfm()     → customer_segments.csv
   - Recency: days since last purchase
   - Frequency: number of orders
   - Monetary: total spend
   - RFM tier segmentation (VIP, Loyal, At-Risk, Lost)

4. build_inventory_metrics()  → inventory_metrics.csv
   - Daily average demand per product
   - Safety stock (95% service level)
   - Reorder point (14-day lead time)
   - EOQ (Economic Order Quantity)
"""
import pandas as pd
import numpy as np
from datetime import datetime


# ── 1. Demand Features ─────────────────────────────────────────────────────

def build_demand_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate monthly units sold per product and add time-series lag features.
    Used to train the demand forecasting ML model.

    Returns DataFrame with columns:
        StockCode, Description, YearMonth, Year, Month,
        units_sold, revenue,
        lag_1, lag_2, lag_3,
        rolling_avg_3m,
        price_avg
    """
    print("[feature_eng] Building product demand features...")

    # Monthly aggregation per product
    monthly = (
        df.groupby(["StockCode", "Description", "YearMonth", "Year", "Month"])
        .agg(
            units_sold=("Quantity", "sum"),
            revenue=("TotalRevenue", "sum"),
            price_avg=("UnitPrice", "mean"),
            num_transactions=("Invoice", "nunique"),
        )
        .reset_index()
    )

    # Sort for lag computation
    monthly = monthly.sort_values(["StockCode", "Year", "Month"]).reset_index(drop=True)

    # Lag features per product
    monthly["lag_1"] = monthly.groupby("StockCode")["units_sold"].shift(1)
    monthly["lag_2"] = monthly.groupby("StockCode")["units_sold"].shift(2)
    monthly["lag_3"] = monthly.groupby("StockCode")["units_sold"].shift(3)

    # Rolling 3-month average
    monthly["rolling_avg_3m"] = (
        monthly.groupby("StockCode")["units_sold"]
        .transform(lambda x: x.shift(1).rolling(3, min_periods=1).mean())
    )

    # Target: next month's units (what we want to predict)
    monthly["next_month_units"] = monthly.groupby("StockCode")["units_sold"].shift(-1)

    # Drop rows with insufficient lag history (first 3 months per product)
    feature_df = monthly.dropna(subset=["lag_1", "lag_2", "lag_3"]).reset_index(drop=True)

    # Round floats
    for col in ["lag_1", "lag_2", "lag_3", "rolling_avg_3m", "price_avg"]:
        feature_df[col] = feature_df[col].round(2)

    print(f"[feature_eng] Demand features: {len(feature_df):,} rows, "
          f"{feature_df['StockCode'].nunique():,} products, "
          f"{feature_df['YearMonth'].nunique()} periods")

    return feature_df


# ── 2. Pricing Signals ─────────────────────────────────────────────────────

def build_pricing_signals(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute pricing intelligence per product.
    Used to train price elasticity model and power the pricing dashboard.

    Returns DataFrame with columns:
        StockCode, Description,
        avg_price, min_price, max_price, price_std,
        total_units, total_revenue,
        avg_revenue_per_unit,
        price_volatility_pct,
        suggested_discount_pct
    """
    print("[feature_eng] Building pricing signals...")

    # Overall product-level stats
    pricing = (
        df.groupby(["StockCode", "Description"])
        .agg(
            avg_price=("UnitPrice", "mean"),
            min_price=("UnitPrice", "min"),
            max_price=("UnitPrice", "max"),
            price_std=("UnitPrice", "std"),
            total_units=("Quantity", "sum"),
            total_revenue=("TotalRevenue", "sum"),
            num_customers=("CustomerID", "nunique"),
        )
        .reset_index()
    )

    pricing["price_std"] = pricing["price_std"].fillna(0)
    pricing["avg_revenue_per_unit"] = (
        pricing["total_revenue"] / pricing["total_units"].replace(0, np.nan)
    ).round(2)

    # Price volatility = std / avg (coefficient of variation, %)
    pricing["price_volatility_pct"] = (
        (pricing["price_std"] / pricing["avg_price"].replace(0, np.nan)) * 100
    ).round(1).fillna(0)

    # Simple discount signal: if price_volatility > 20%, product has pricing inconsistency
    # Suggested discount = bring to median pricing
    pricing["suggested_discount_pct"] = (
        pricing["price_volatility_pct"].clip(0, 30)
    ).round(1)

    # Optimal price signal = price that historically maximised revenue per product-month
    monthly_price = (
        df.groupby(["StockCode", "YearMonth"])
        .agg(
            month_revenue=("TotalRevenue", "sum"),
            month_price=("UnitPrice", "mean"),
        )
        .reset_index()
    )
    best_price = (
        monthly_price.loc[monthly_price.groupby("StockCode")["month_revenue"].idxmax()]
        [["StockCode", "month_price"]]
        .rename(columns={"month_price": "optimal_price"})
    )
    pricing = pricing.merge(best_price, on="StockCode", how="left")
    pricing["optimal_price"] = pricing["optimal_price"].round(2)

    # Keep only products with meaningful sales volume (>= 10 units total)
    pricing = pricing[pricing["total_units"] >= 10].reset_index(drop=True)

    print(f"[feature_eng] Pricing signals: {len(pricing):,} products")
    return pricing


# ── 3. Customer RFM ────────────────────────────────────────────────────────

def build_customer_rfm(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute RFM (Recency, Frequency, Monetary) scores per customer.
    Used to build customer_segments.csv for the recommendation system.

    Returns DataFrame with columns:
        CustomerID, Country,
        recency_days, frequency, monetary,
        R_score, F_score, M_score, rfm_score,
        segment (VIP / Loyal / Potential / At-Risk / Lost)
    """
    print("[feature_eng] Building customer RFM segments...")

    reference_date = df["InvoiceDate"].max() + pd.Timedelta(days=1)

    rfm = (
        df.groupby("CustomerID")
        .agg(
            recency_days=("InvoiceDate", lambda x: (reference_date - x.max()).days),
            frequency=("Invoice", "nunique"),
            monetary=("TotalRevenue", "sum"),
            country=("Country", "first"),
        )
        .reset_index()
    )

    # Score each dimension 1–5 (5 = best)
    rfm["R_score"] = pd.qcut(rfm["recency_days"], q=5, labels=[5, 4, 3, 2, 1], duplicates="drop").astype(int)
    rfm["F_score"] = pd.qcut(rfm["frequency"].rank(method="first"), q=5, labels=[1, 2, 3, 4, 5]).astype(int)
    rfm["M_score"] = pd.qcut(rfm["monetary"].rank(method="first"), q=5, labels=[1, 2, 3, 4, 5]).astype(int)
    rfm["rfm_score"] = rfm["R_score"] + rfm["F_score"] + rfm["M_score"]

    # Human-readable segments
    def segment(row):
        if row["rfm_score"] >= 13:
            return "VIP"
        elif row["rfm_score"] >= 10:
            return "Loyal"
        elif row["rfm_score"] >= 7:
            return "Potential"
        elif row["rfm_score"] >= 4:
            return "At-Risk"
        else:
            return "Lost"

    rfm["segment"] = rfm.apply(segment, axis=1)
    rfm["monetary"] = rfm["monetary"].round(2)

    seg_counts = rfm["segment"].value_counts().to_dict()
    print(f"[feature_eng] Customer segments: {len(rfm):,} customers — {seg_counts}")
    return rfm


# ── 4. Inventory Metrics ───────────────────────────────────────────────────

def build_inventory_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute inventory KPIs per product using the correct statistical formulas.
    Replaces the BigMart-era hardcoded calculations.

    Returns DataFrame with columns:
        StockCode, Description,
        daily_avg_demand, demand_std_daily,
        safety_stock, reorder_point,
        eoq,
        stockout_risk (Low / Medium / High)
    """
    print("[feature_eng] Building inventory metrics...")

    LEAD_TIME_DAYS = 14        # standard lead time assumption
    SERVICE_LEVEL_Z = 1.65    # 95% service level (Z-score)
    HOLDING_COST_RATE = 0.12  # 12% of item price per year
    ORDER_COST = 500           # ₹500 per order (fixed)

    # Daily sales per product
    date_range_days = (df["InvoiceDate"].max() - df["InvoiceDate"].min()).days + 1

    product_totals = (
        df.groupby(["StockCode", "Description"])
        .agg(
            total_units=("Quantity", "sum"),
            total_revenue=("TotalRevenue", "sum"),
            avg_price=("UnitPrice", "mean"),
        )
        .reset_index()
    )

    # Monthly std for safety stock calculation
    monthly_units = (
        df.groupby(["StockCode", "YearMonth"])["Quantity"]
        .sum()
        .reset_index()
        .rename(columns={"Quantity": "monthly_units"})
    )
    monthly_std = (
        monthly_units.groupby("StockCode")["monthly_units"]
        .std()
        .fillna(0)
        .reset_index()
        .rename(columns={"monthly_units": "monthly_std"})
    )

    inv = product_totals.merge(monthly_std, on="StockCode", how="left")
    inv["monthly_std"] = inv["monthly_std"].fillna(0)

    # Daily average demand
    inv["daily_avg_demand"] = (inv["total_units"] / date_range_days).round(4)
    inv["demand_std_daily"] = (inv["monthly_std"] / 30).round(4)

    # Safety stock = Z × σ_daily × √(lead_time)
    inv["safety_stock"] = (
        SERVICE_LEVEL_Z * inv["demand_std_daily"] * np.sqrt(LEAD_TIME_DAYS)
    ).round(1)

    # Reorder point = (daily avg demand × lead time) + safety stock
    inv["reorder_point"] = (
        inv["daily_avg_demand"] * LEAD_TIME_DAYS + inv["safety_stock"]
    ).round(1)

    # EOQ = √(2 × annual_demand × order_cost / holding_cost_per_unit)
    annual_demand = inv["daily_avg_demand"] * 365
    holding_cost_per_unit = inv["avg_price"] * HOLDING_COST_RATE
    inv["eoq"] = np.sqrt(
        (2 * annual_demand * ORDER_COST) / holding_cost_per_unit.replace(0, np.nan)
    ).fillna(0).round(0)

    # Stockout risk: if safety_stock < 5% of daily demand × lead time
    demand_during_lt = inv["daily_avg_demand"] * LEAD_TIME_DAYS
    inv["stockout_risk"] = pd.cut(
        inv["safety_stock"] / demand_during_lt.replace(0, np.nan),
        bins=[0, 0.1, 0.3, float("inf")],
        labels=["High", "Medium", "Low"],
    ).cat.add_categories("Unknown").fillna("Unknown")

    # Keep meaningful products
    inv = inv[inv["daily_avg_demand"] > 0].reset_index(drop=True)

    print(f"[feature_eng] Inventory metrics: {len(inv):,} products")
    return inv[
        [
            "StockCode", "Description",
            "daily_avg_demand", "demand_std_daily",
            "safety_stock", "reorder_point",
            "eoq", "avg_price",
            "total_units", "total_revenue",
            "stockout_risk",
        ]
    ]


if __name__ == "__main__":
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from data_pipeline.extract import load_raw
    from data_pipeline.transform import clean_transactions

    raw = load_raw()
    clean = clean_transactions(raw)

    demand = build_demand_features(clean)
    print(demand.head(3))

    pricing = build_pricing_signals(clean)
    print(pricing.head(3))

    rfm = build_customer_rfm(clean)
    print(rfm.head(3))

    inv = build_inventory_metrics(clean)
    print(inv.head(3))
