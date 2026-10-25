import pandas as pd, numpy as np

def detect(df):
    anomalies = []
    if df.empty: return anomalies
    df["revenue"]=pd.to_numeric(df["revenue"],errors="coerce").fillna(0)
    df["quantity"]=pd.to_numeric(df["quantity"],errors="coerce").fillna(0)

    # 1 Duplicates
    dupes=df[df.duplicated(subset=["order_id"],keep=False)]
    for _,r in dupes.iterrows():
        anomalies.append({"type":"Duplicate Order ID","severity":"High",
            "order_id":r["order_id"],"detail":f"Order ID '{r['order_id']}' appears multiple times"})

    # 2 Zero revenue
    zero=df[df["revenue"]==0]
    for _,r in zero.iterrows():
        anomalies.append({"type":"Zero Revenue","severity":"High",
            "order_id":r["order_id"],"detail":f"Order '{r['order_id']}' has zero revenue"})

    # 3 Negative revenue
    neg=df[df["revenue"]<0]
    for _,r in neg.iterrows():
        anomalies.append({"type":"Negative Revenue","severity":"High",
            "order_id":r["order_id"],"detail":f"Order '{r['order_id']}' has negative revenue: RM {r['revenue']:.2f}"})

    # 4 Quantity outliers (>2 std)
    if len(df)>5:
        mean_q=df["quantity"].mean(); std_q=df["quantity"].std()
        if std_q>0:
            hi=df[df["quantity"]>(mean_q+2*std_q)]
            for _,r in hi.iterrows():
                anomalies.append({"type":"Abnormal Quantity","severity":"Medium",
                    "order_id":r["order_id"],"detail":f"Quantity {r['quantity']:.0f} is >2σ above mean ({mean_q:.1f})"})

    # 5 Revenue outliers (>3 std)
    if len(df)>5:
        mean_r=df["revenue"].mean(); std_r=df["revenue"].std()
        if std_r>0:
            hi=df[df["revenue"]>(mean_r+3*std_r)]
            for _,r in hi.iterrows():
                anomalies.append({"type":"Revenue Outlier","severity":"Medium",
                    "order_id":r["order_id"],"detail":f"Revenue RM {r['revenue']:.2f} is >3σ above mean (RM {mean_r:.2f})"})

    # 6 High Others rate
    others_rate = (df["category"]=="Others").mean() if "category" in df.columns else 0
    if others_rate > 0.20:
        anomalies.append({"type":"High Uncategorised Rate","severity":"Low",
            "order_id":"N/A","detail":f"{others_rate*100:.1f}% of products are uncategorised — use correction tool"})

    return anomalies[:50]  # cap at 50
