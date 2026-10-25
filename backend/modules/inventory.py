import pandas as pd, numpy as np

def analyse(df):
    if df.empty: return {"items":[],"restock_needed":[],"summary":{}}
    df["quantity"]=pd.to_numeric(df["quantity"],errors="coerce").fillna(0)
    df["revenue"]=pd.to_numeric(df["revenue"],errors="coerce").fillna(0)
    df["date"]=pd.to_datetime(df["date"],errors="coerce")
    df=df.dropna(subset=["date"])

    grp=df.groupby("product_name").agg(
        total_qty=("quantity","sum"),
        total_rev=("revenue","sum"),
        order_count=("order_id","count"),
        last_sale=("date","max"),
        category=("category","first")
    ).reset_index()

    date_range=(df["date"].max()-df["date"].min()).days or 1
    grp["daily_velocity"]=round(grp["total_qty"]/date_range,2)
    grp["days_stock_left"]=round(30/grp["daily_velocity"].replace(0,np.nan)).fillna(999)
    grp["total_rev"]=grp["total_rev"].round(2)
    grp["last_sale"]=grp["last_sale"].dt.strftime("%Y-%m-%d")

    items=grp.sort_values("total_rev",ascending=False).to_dict(orient="records")
    restock=grp[grp["days_stock_left"]<14].sort_values("days_stock_left").to_dict(orient="records")

    return {"items":items[:50],"restock_needed":restock,
            "summary":{"total_skus":len(grp),"restock_alert_count":len(restock),
                       "top_velocity":grp["daily_velocity"].max(),"date_range_days":date_range}}
