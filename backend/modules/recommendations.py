import pandas as pd

def generate(df, analytics, anomalies):
    if df.empty: return []
    kpi = analytics.get("kpi",{})
    cats = analytics.get("categories",[])
    top  = analytics.get("top_products",[])
    trend= analytics.get("trend",[])
    recs = []

    # Revenue trend
    if trend and len(trend)>=2:
        latest=trend[-1]; prev=trend[-2]
        chg=((latest.get("Revenue",0)-prev.get("Revenue",0))/prev.get("Revenue",1))*100 if prev.get("Revenue",0) else 0
        if chg<-10:
            recs.append(f"Revenue declined {abs(chg):.1f}% last period — consider running a promotional campaign or bundle deals to recover sales.")
        elif chg>20:
            recs.append(f"Revenue grew {chg:.1f}% — capitalise on momentum by increasing stock levels for top-performing products.")

    # High Others
    others_rate=(df["category"]=="Others").mean() if "category" in df.columns else 0
    if others_rate>0.15:
        recs.append("Use the Category Correction tool to classify uncategorised products — this improves insight accuracy and report quality.")

    # Top product
    if top:
        t=top[0]
        recs.append(f"'{t['product_name']}' is your best seller — ensure adequate stock and consider creating bundle promotions around it.")

    # Low category
    if len(cats)>=2:
        low=cats[-1]
        recs.append(f"'{low['category']}' underperforms — review pricing strategy, consider targeted discounts or remove low-margin SKUs.")

    # High anomalies
    high_anom=[a for a in anomalies if a.get("severity")=="High"]
    if high_anom:
        recs.append(f"Resolve {len(high_anom)} high-severity data issue(s) (duplicates/zero revenue) before submitting financial reports to avoid discrepancies.")

    # Avg order value
    avg=kpi.get("avg_order_value",0)
    if avg>0:
        if avg<50:
            recs.append(f"Average order value is RM {avg:.2f} — introduce minimum-spend promotions or free shipping thresholds to increase basket size.")
        else:
            recs.append(f"Average order value of RM {avg:.2f} is healthy — maintain current pricing strategy and introduce loyalty rewards for repeat customers.")

    # Category diversification
    if cats:
        top_pct=cats[0].get("pct",0) if cats else 0
        if top_pct>60:
            recs.append(f"Revenue is heavily concentrated in one category ({top_pct:.0f}%) — diversify product range to reduce dependency risk.")

    return recs[:7]
