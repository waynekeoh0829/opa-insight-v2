import io, os, textwrap
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable, KeepTogether)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# ── Palette ───────────────────────────────────────────────────────────────────
INDIGO  = colors.HexColor("#6366f1")
VIOLET  = colors.HexColor("#7c3aed")
DARK    = colors.HexColor("#0f172a")
SLATE   = colors.HexColor("#1e293b")
LIGHT   = colors.HexColor("#f8fafc")
LIGHT2  = colors.HexColor("#eef2ff")
MUTED   = colors.HexColor("#64748b")
GREEN   = colors.HexColor("#10b981")
AMBER   = colors.HexColor("#f59e0b")
RED     = colors.HexColor("#ef4444")
WHITE   = colors.white
BORDER  = colors.HexColor("#e2e8f0")
ROW_ALT = colors.HexColor("#f1f5f9")

W, H  = A4
LM    = 1.5 * cm   # left margin
RM    = 1.5 * cm   # right margin
TW    = W - LM - RM   # 510.24 pts — FULL text width, all tables must use this

# ── Styles ────────────────────────────────────────────────────────────────────
def _styles():
    return {
        "title":    ParagraphStyle("T",  fontName="Helvetica-Bold", fontSize=20, textColor=DARK,   spaceAfter=3, alignment=TA_CENTER),
        "sub":      ParagraphStyle("S",  fontName="Helvetica",      fontSize=9,  textColor=MUTED,  spaceAfter=2, alignment=TA_CENTER),
        "h1":       ParagraphStyle("H1", fontName="Helvetica-Bold", fontSize=12, textColor=INDIGO, spaceBefore=14, spaceAfter=6),
        "h2":       ParagraphStyle("H2", fontName="Helvetica-Bold", fontSize=10, textColor=DARK,   spaceBefore=8, spaceAfter=4),
        "body":     ParagraphStyle("B",  fontName="Helvetica",      fontSize=9,  textColor=DARK,   leading=13, spaceAfter=4),
        "bullet":   ParagraphStyle("BL", fontName="Helvetica",      fontSize=8.5,textColor=DARK,   leading=13, spaceAfter=4, leftIndent=10),
        "num":      ParagraphStyle("N",  fontName="Helvetica-Bold", fontSize=16, textColor=INDIGO, alignment=TA_CENTER),
        "numlabel": ParagraphStyle("NL", fontName="Helvetica",      fontSize=7.5,textColor=MUTED,  alignment=TA_CENTER),
        "tbl_hdr":  ParagraphStyle("TH", fontName="Helvetica-Bold", fontSize=8,  textColor=WHITE),
        "tbl_cell": ParagraphStyle("TC", fontName="Helvetica",      fontSize=8,  textColor=DARK,   leading=11),
        "footer":   ParagraphStyle("F",  fontName="Helvetica",      fontSize=7.5,textColor=MUTED,  alignment=TA_CENTER),
    }

# ── Table style helpers ───────────────────────────────────────────────────────
def _tbl(header_col=None, row_count=0):
    hc = header_col or INDIGO
    ts = [
        # Header row
        ("BACKGROUND",  (0,0), (-1,0),  hc),
        ("TEXTCOLOR",   (0,0), (-1,0),  WHITE),
        ("FONTNAME",    (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",    (0,0), (-1,0),  8),
        ("ALIGN",       (0,0), (-1,0),  "LEFT"),
        # Data rows
        ("FONTNAME",    (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",    (0,1), (-1,-1), 8),
        ("TEXTCOLOR",   (0,1), (-1,-1), DARK),
        ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",  (0,0), (-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("RIGHTPADDING",(0,0), (-1,-1), 6),
        # Grid
        ("LINEBELOW",   (0,0), (-1,0),  0.5, colors.HexColor("#4f46e5")),
        ("LINEBELOW",   (0,1), (-1,-1), 0.4, BORDER),
        ("BOX",         (0,0), (-1,-1), 0.5, BORDER),
    ]
    # Alternating row colours
    for i in range(1, row_count+1):
        if i % 2 == 0:
            ts.append(("BACKGROUND", (0,i), (-1,i), ROW_ALT))
    return TableStyle(ts)

def _right_align_cols(ts_list, col_indices, start_row=1):
    """Add RIGHT alignment to specified column indices."""
    for c in col_indices:
        ts_list.append(("ALIGN", (c, start_row), (c, -1), "RIGHT"))
    return ts_list

# ── Page template ─────────────────────────────────────────────────────────────
def _on_page(canvas, doc):
    canvas.saveState()
    # Header bar
    canvas.setFillColor(INDIGO)
    canvas.rect(0, H - 1.35*cm, W, 1.35*cm, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 9.5)
    canvas.setFillColor(WHITE)
    canvas.drawString(LM, H - 0.88*cm, "OPA Insight")
    canvas.setFont("Helvetica", 8.5)
    canvas.drawRightString(W - RM, H - 0.88*cm, "Business Intelligence Report")
    # Footer line
    canvas.setStrokeColor(BORDER)
    canvas.line(LM, 1.35*cm, W - RM, 1.35*cm)
    # Footer text
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(LM, 0.75*cm,
        f"Confidential  ·  Generated {datetime.now().strftime('%d %b %Y, %H:%M')}")
    canvas.drawRightString(W - RM, 0.75*cm, f"Page {doc.page}")
    canvas.restoreState()

# ── Main generator ────────────────────────────────────────────────────────────
def generate(analytics, insights, recommendations, anomalies,
             kpi, date_from="", date_to="", company=""):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=LM, rightMargin=RM,
                            topMargin=2.0*cm, bottomMargin=1.8*cm)
    st  = _styles()
    els = []
    period = f"{date_from} — {date_to}" if date_from and date_to else \
             datetime.now().strftime("%B %Y")

    # ── Cover ─────────────────────────────────────────────────────────────────
    els += [
        Spacer(1, 0.4*cm),
        Paragraph("Business Intelligence Report", st["title"]),
        Paragraph(f"OPA Insight  ·  {period}" +
                  (f"  ·  {company}" if company else ""), st["sub"]),
        Spacer(1, 0.3*cm),
        HRFlowable(width="100%", thickness=2, color=INDIGO, spaceAfter=10),
    ]

    # ── KPI summary (4-cell grid, full TW) ────────────────────────────────────
    cw4 = TW / 4  # each cell = 127.56 pts
    els.append(Paragraph("Key Performance Indicators", st["h1"]))
    kpi_labels = [
        Paragraph("Total Revenue",     st["numlabel"]),
        Paragraph("Total Orders",      st["numlabel"]),
        Paragraph("Total GST",         st["numlabel"]),
        Paragraph("Avg Order Value",   st["numlabel"]),
    ]
    kpi_values = [
        Paragraph(f"RM {kpi.get('total_revenue',0):,.2f}", st["num"]),
        Paragraph(f"{kpi.get('total_orders',0):,}",         st["num"]),
        Paragraph(f"RM {kpi.get('total_gst',0):,.2f}",     st["num"]),
        Paragraph(f"RM {kpi.get('avg_order_value',0):,.2f}",st["num"]),
    ]
    kpi_tbl = Table([kpi_labels, kpi_values],
                    colWidths=[cw4]*4, rowHeights=[1.1*cm, 1.4*cm])
    kpi_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,-1), LIGHT2),
        ("LINEABOVE",    (0,0), (-1, 0), 3, INDIGO),
        ("BOX",          (0,0), (-1,-1), 0.5, colors.HexColor("#c7d2fe")),
        ("LINEAFTER",    (0,0), (-4,-1), 0.4, colors.HexColor("#c7d2fe")),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",   (0,0), (-1,-1), 4),
        ("BOTTOMPADDING",(0,0), (-1,-1), 4),
    ]))
    els += [kpi_tbl, Spacer(1, 0.4*cm)]

    # ── Category breakdown (4 cols, TW total) ─────────────────────────────────
    cats = analytics.get("categories", [])
    if cats:
        els.append(Paragraph("Revenue by Category", st["h1"]))
        # Widths: Category 7cm | Revenue 4.5cm | Orders 3cm | Share 3.5cm = 18cm
        cw = [7*cm, 4.5*cm, 3*cm, 3.5*cm]
        data = [[Paragraph(h, st["tbl_hdr"]) for h in
                 ["Category", "Revenue (RM)", "Orders", "% Share"]]]
        for c in cats[:12]:
            rev  = f"RM {c.get('revenue',0):>10,.2f}"
            ords = f"{c.get('orders',0):>6,}"
            pct  = f"{c.get('pct',0):>5.1f}%"
            data.append([
                Paragraph(c.get("category",""), st["tbl_cell"]),
                Paragraph(rev,  st["tbl_cell"]),
                Paragraph(ords, st["tbl_cell"]),
                Paragraph(pct,  st["tbl_cell"]),
            ])
        ts = _tbl(INDIGO, len(data)-1)
        extra = [("ALIGN",(1,1),(-1,-1),"RIGHT")]
        t = Table(data, colWidths=cw)
        t.setStyle(TableStyle(ts._cmds + [
            ("ALIGN",(1,0),(-1,0),"CENTER"),
            ("ALIGN",(1,1),(-1,-1),"RIGHT"),
        ]))
        els += [t, Spacer(1, 0.4*cm)]

    # ── Top 10 products (5 cols, TW total) ────────────────────────────────────
    top = analytics.get("top_products", [])
    if top:
        els.append(Paragraph("Top Products by Revenue", st["h1"]))
        # Widths: # 1cm | Product 8cm | Revenue 4cm | Qty 2.5cm | Orders 2.5cm = 18cm
        cw = [1*cm, 8*cm, 4*cm, 2.5*cm, 2.5*cm]
        data = [[Paragraph(h, st["tbl_hdr"]) for h in
                 ["#","Product Name","Revenue (RM)","Qty","Orders"]]]
        for i, p in enumerate(top[:10], 1):
            name = textwrap.shorten(str(p.get("product_name","")), width=45, placeholder="…")
            data.append([
                Paragraph(str(i), st["tbl_cell"]),
                Paragraph(name,   st["tbl_cell"]),
                Paragraph(f"RM {p.get('revenue',0):,.2f}", st["tbl_cell"]),
                Paragraph(f"{p.get('quantity',0):.0f}",    st["tbl_cell"]),
                Paragraph(f"{p.get('orders',0):,}",        st["tbl_cell"]),
            ])
        t = Table(data, colWidths=cw)
        t.setStyle(TableStyle(_tbl(INDIGO, len(data)-1)._cmds + [
            ("ALIGN",(0,0),(0,-1),"CENTER"),
            ("ALIGN",(2,1),(-1,-1),"RIGHT"),
        ]))
        els += [t, Spacer(1, 0.4*cm)]

    # ── AI Insights ───────────────────────────────────────────────────────────
    if insights:
        els.append(Paragraph("AI-Generated Insights", st["h1"]))
        insight_rows = []
        for i, ins in enumerate(insights, 1):
            insight_rows.append([
                Paragraph(str(i), ParagraphStyle("IN", fontName="Helvetica-Bold",
                    fontSize=8.5, textColor=INDIGO, alignment=TA_CENTER)),
                Paragraph(ins, st["bullet"]),
            ])
        t = Table(insight_rows, colWidths=[0.8*cm, TW-0.8*cm])
        t.setStyle(TableStyle([
            ("VALIGN",       (0,0), (-1,-1), "TOP"),
            ("TOPPADDING",   (0,0), (-1,-1), 4),
            ("BOTTOMPADDING",(0,0), (-1,-1), 4),
            ("LINEBELOW",    (0,0), (-1,-2), 0.3, BORDER),
            ("BACKGROUND",   (0,0), (0,-1), LIGHT2),
        ]))
        els += [t, Spacer(1, 0.4*cm)]

    # ── Recommendations ───────────────────────────────────────────────────────
    if recommendations:
        els.append(Paragraph("Recommended Actions", st["h1"]))
        rec_rows = []
        for i, rec in enumerate(recommendations, 1):
            rec_rows.append([
                Paragraph(str(i), ParagraphStyle("RN", fontName="Helvetica-Bold",
                    fontSize=8.5, textColor=colors.HexColor("#10b981"), alignment=TA_CENTER)),
                Paragraph(rec, st["bullet"]),
            ])
        t = Table(rec_rows, colWidths=[0.8*cm, TW-0.8*cm])
        t.setStyle(TableStyle([
            ("VALIGN",       (0,0), (-1,-1), "TOP"),
            ("TOPPADDING",   (0,0), (-1,-1), 4),
            ("BOTTOMPADDING",(0,0), (-1,-1), 4),
            ("LINEBELOW",    (0,0), (-1,-2), 0.3, BORDER),
            ("BACKGROUND",   (0,0), (0,-1), colors.HexColor("#f0fdf4")),
        ]))
        els += [t, Spacer(1, 0.4*cm)]

    # ── Anomaly / Data Quality ────────────────────────────────────────────────
    els.append(Paragraph("Data Quality Report", st["h1"]))
    if not anomalies:
        els.append(Paragraph("✓  No anomalies detected — data quality is excellent.", st["body"]))
    else:
        # Widths: Type 5cm | Order ID 3.5cm | Severity 2.5cm | Detail 7cm = 18cm
        cw = [5*cm, 3.5*cm, 2.5*cm, 7*cm]
        data = [[Paragraph(h, st["tbl_hdr"]) for h in
                 ["Issue Type","Order ID","Severity","Detail"]]]
        sev_colors = {"High": RED, "Medium": AMBER, "Low": MUTED}
        for a in anomalies[:20]:
            sev  = a.get("severity","Low")
            detail = textwrap.shorten(a.get("detail",""), width=60, placeholder="…")
            sev_style = ParagraphStyle("SV", fontName="Helvetica-Bold",
                fontSize=8, textColor=sev_colors.get(sev, MUTED))
            data.append([
                Paragraph(a.get("type",""),       st["tbl_cell"]),
                Paragraph(str(a.get("order_id","")), st["tbl_cell"]),
                Paragraph(sev, sev_style),
                Paragraph(detail,                 st["tbl_cell"]),
            ])
        t = Table(data, colWidths=cw)
        t.setStyle(TableStyle(_tbl(colors.HexColor("#dc2626"), len(data)-1)._cmds))
        els.append(t)

    doc.build(els, onFirstPage=_on_page, onLaterPages=_on_page)
    buf.seek(0)
    return buf
