import pandas as pd, re, numpy as np

def clean(df):
    df = df.copy()
    before = len(df)
    df.drop_duplicates(subset=["order_id"], keep="first", inplace=True)
    dupes = before - len(df)
    for col in ["revenue","quantity","gst"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    df["revenue"] = df["revenue"].abs()
    df["quantity"] = df["quantity"].abs()
    df["gst"]     = df["gst"].abs()
    df["product_name"] = (df["product_name"].astype(str)
        .str.strip()
        .str.replace(r"[^\w\s\-&'/]","",regex=True)
        .str.title())
    df["order_id"] = df["order_id"].astype(str).str.strip()
    df["date"]     = pd.to_datetime(df["date"], errors="coerce", dayfirst=True)
    df.dropna(subset=["date"], inplace=True)
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")
    df = df[df["product_name"].str.len() > 0].reset_index(drop=True)
    return df, {"duplicates_removed": dupes, "final_count": len(df)}
