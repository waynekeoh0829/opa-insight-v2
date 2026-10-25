import pandas as pd, numpy as np

def compute(df):
    if df.empty:
        return {"kpi":{},"trend":[],"categories":[],"top_products":[],"monthly":[],"weekly":[]}
    df["revenue"]=pd.to_numeric(df["revenue"],errors="coerce").fillna(0)
    df["gst"]=pd.to_numeric(df["gst"],errors="coerce").fillna(0)
    df["quantity"]=pd.to_numeric(df["quantity"],errors="coerce").fillna(0)
    df["date"]=pd.to_datetime(df["date"],errors="coerce")
    df=df.dropna(subset=["date"])

    total_rev = round(df["revenue"].sum(),2)
    total_orders = len(df)
    total_gst = round(df["gst"].sum(),2)
    avg_order = round(total_rev/total_orders,2) if total_orders else 0
    unique_products = df["product_name"].nunique()
    unique_categories = (df["category"]!="Others").sum()

    # Month trend
    df["month"]=df["date"].dt.to_period("M")
    monthly=df.groupby("month").agg(revenue=("revenue","sum"),orders=("order_id","count")).reset_index()
    monthly["month"]=monthly["month"].astype(str)
    monthly_list=monthly.rename(columns={"revenue":"Revenue","orders":"Orders"}).to_dict(orient="records")

    # Weekly trend
    df["week"]=df["date"].dt.to_period("W")
    weekly=df.groupby("week").agg(revenue=("revenue","sum"),orders=("order_id","count")).reset_index()
    weekly["week"]=weekly["week"].astype(str)
    weekly_list=weekly.rename(columns={"revenue":"Revenue","orders":"Orders"}).to_dict(orient="records")

    # Category breakdown
    cats=df.groupby("category").agg(revenue=("revenue","sum"),orders=("order_id","count")).reset_index()
    cats=cats.sort_values("revenue",ascending=False)
    cats["pct"]=round(cats["revenue"]/total_rev*100,1) if total_rev else 0
    cat_list=cats.to_dict(orient="records")

    # Top 10 products
    top=df.groupby("product_name").agg(revenue=("revenue","sum"),quantity=("quantity","sum"),orders=("order_id","count")).reset_index()
    top=top.sort_values("revenue",ascending=False).head(10)
    top["revenue"]=top["revenue"].round(2)
    top_list=top.to_dict(orient="records")

    return {
        "kpi":{"total_revenue":total_rev,"total_orders":total_orders,"total_gst":total_gst,
               "avg_order_value":avg_order,"unique_products":unique_products,"categorised":int(unique_categories)},
        "trend":monthly_list,"weekly":weekly_list,"categories":cat_list,"top_products":top_list
    }

def compare_periods(df, from1, to1, from2, to2):
    def period_kpi(dff):
        rev=round(dff["revenue"].sum(),2)
        orders=len(dff)
        gst=round(dff["gst"].sum(),2)
        avg=round(rev/orders,2) if orders else 0
        return {"revenue":rev,"orders":orders,"gst":gst,"avg_order":avg}
    df["date"]=pd.to_datetime(df["date"],errors="coerce")
    p1=df[(df["date"]>=from1)&(df["date"]<=to1)]
    p2=df[(df["date"]>=from2)&(df["date"]<=to2)]
    k1=period_kpi(p1); k2=period_kpi(p2)
    def diff(a,b): return round(((a-b)/b*100) if b else 0,1)
    return {"period1":{"from":from1,"to":to1,"kpi":k1},
            "period2":{"from":from2,"to":to2,"kpi":k2},
            "change":{"revenue":diff(k1["revenue"],k2["revenue"]),
                      "orders":diff(k1["orders"],k2["orders"]),
                      "avg_order":diff(k1["avg_order"],k2["avg_order"])}}
