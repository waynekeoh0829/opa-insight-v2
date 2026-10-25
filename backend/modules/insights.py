import pandas as pd

def generate(df, analytics, anomalies):
    if df.empty or not analytics.get("kpi"): return []
    kpi = analytics["kpi"]
    cats = analytics.get("categories",[])
    top  = analytics.get("top_products",[])
    trend= analytics.get("trend",[])
    insights = []

    rev = kpi.get("total_revenue",0)
    orders = kpi.get("total_orders",0)
    avg = kpi.get("avg_order_value",0)

    insights.append(f"Total revenue of RM {rev:,.2f} was generated across {orders:,} orders, with an average order value of RM {avg:.2f}.")

    if trend and len(trend)>=2:
        latest=trend[-1]; prev=trend[-2]
        chg=((latest.get("Revenue",0)-prev.get("Revenue",0))/prev.get("Revenue",1))*100 if prev.get("Revenue",0) else 0
        direction="increased" if chg>0 else "decreased"
        insights.append(f"Monthly revenue {direction} by {abs(chg):.1f}% from {prev.get('month','')} (RM {prev.get('Revenue',0):,.0f}) to {latest.get('month','')} (RM {latest.get('Revenue',0):,.0f}).")

    if cats:
        top_cat=cats[0]
        insights.append(f"'{top_cat['category']}' is the top-performing category, contributing RM {top_cat.get('revenue',0):,.2f} ({top_cat.get('pct',0):.1f}% of total revenue).")

    if top:
        t=top[0]
        insights.append(f"Best-selling product is '{t['product_name']}' with RM {t.get('revenue',0):,.2f} in revenue and {t.get('quantity',0):.0f} units sold.")

    if len(cats)>=2:
        low=cats[-1]
        insights.append(f"'{low['category']}' is the lowest-performing category at RM {low.get('revenue',0):,.2f} — consider promotion or restocking strategies.")

    high_anom=[a for a in anomalies if a.get("severity")=="High"]
    if high_anom:
        insights.append(f"{len(high_anom)} high-severity data quality issue(s) detected (duplicate orders or zero-revenue records) — review before generating financial reports.")
    else:
        insights.append("No high-severity anomalies detected. Data quality is good — the dataset is suitable for financial reporting.")

    others_rate=(df["category"]=="Others").mean() if "category" in df.columns else 0
    if others_rate>0.1:
        insights.append(f"{others_rate*100:.1f}% of products are uncategorised (Others). Use the Category Correction tool to improve classification accuracy.")
    else:
        insights.append(f"Product categorisation accuracy is high — only {others_rate*100:.1f}% of orders remain uncategorised.")

    return insights[:7]
