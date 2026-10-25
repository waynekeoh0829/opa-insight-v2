"""
Generate realistic SME sample data for OPA Insight v2
Small Malaysian online/physical shop — monthly revenue ~RM 3,000-15,000
"""
import csv, random, datetime, os

random.seed(99)

# ── Small business product catalogue (realistic Malaysian SME pricing) ─────────
PRODUCTS = {
    "Electronics": [
        ("Wireless Earbuds Type-C", 89),("USB-C Charging Cable 1m", 18),
        ("Power Bank 10000mAh", 79),("Phone Ring Holder",  12),
        ("Screen Protector Tempered", 15),("Bluetooth Speaker Mini", 69),
        ("Phone Case iPhone 14", 25),("Laptop Stand Foldable", 55),
        ("USB Hub 4-Port", 35),("Cable Organiser Velcro", 9),
    ],
    "Fashion": [
        ("Cotton T-Shirt Plain", 35),("Flowy Maxi Dress", 79),
        ("Slim Fit Chinos", 89),("Canvas Tote Bag", 45),
        ("Sports Socks 5-Pair", 25),("Baseball Cap Unisex", 39),
        ("Basic Hoodie", 79),("Linen Shorts", 65),
        ("Crossbody Sling Bag", 69),("Slip-On Canvas Shoes", 99),
    ],
    "Health & Beauty": [
        ("Aloe Vera Gel 200ml", 29),("Sunscreen SPF50 50ml", 45),
        ("Vitamin C Serum 30ml", 59),("Charcoal Face Wash", 35),
        ("Lip Balm SPF Set 3pcs", 22),("Biotin Hair Gummies 60s", 55),
        ("Sheet Mask 5pcs", 25),("Micellar Water 200ml", 38),
        ("Rose Water Toner 150ml", 39),("Hand Cream Lavender 75ml", 28),
    ],
    "Home & Living": [
        ("Aroma Diffuser 200ml", 65),("Beeswax Candle 200g", 38),
        ("Bamboo Toothbrush 4pcs", 28),("Reusable Straw Set 6pcs", 22),
        ("Dish Drying Rack Mini", 45),("Wall Hook Self-Adhesive 5pcs", 19),
        ("Kitchen Sponge 6pcs", 12),("Storage Box Foldable S", 35),
        ("LED Night Light USB", 25),("Microfibre Cloth 3pcs", 18),
    ],
    "Food & Beverages": [
        ("Premium Coffee Blend 250g", 45),("Milo 3-in-1 30pcs", 38),
        ("Oat Milk 1L", 18),("Himalayan Pink Salt 500g", 22),
        ("Manuka Honey 250g", 89),("Collagen Drink 10pcs", 55),
        ("Protein Bar 12pcs", 65),("Green Tea Bag 50pcs", 28),
        ("Granola Cereal 400g", 35),("Coconut Oil 500ml", 32),
    ],
    "Sports & Outdoors": [
        ("Yoga Mat 6mm", 65),("Resistance Band Set 5pcs", 45),
        ("Jump Rope Steel Cable", 35),("Gym Gloves Pair", 39),
        ("Water Bottle 750ml", 32),("Ankle Resistance Band", 38),
        ("Foam Roller 30cm", 55),("Fitness Towel Quick-Dry", 28),
        ("Dumbbell 2kg Pair", 69),("Skipping Counter Digital", 22),
    ],
    "Books & Stationery": [
        ("Bullet Journal A5 Dotted", 39),("Pastel Highlighter 6pcs", 18),
        ("Gel Pen Black 10pcs", 22),("Washi Tape Set 10 Rolls", 29),
        ("Index Sticker Tabs 240pcs", 15),("Sticky Note Cube 400pcs", 19),
        ("Watercolour Pencil 24pcs", 45),("Planner 2026 Weekly", 35),
        ("Clear File A4 20pcs", 12),("Correction Tape 2pcs", 10),
    ],
    "Baby & Kids": [
        ("Wet Wipes Unscented 80pcs", 15),("Muslin Swaddle Blanket", 45),
        ("Baby Rattle Set 3pcs", 35),("Teether Silicone BPA-Free", 29),
        ("Baby Bib Waterproof 3pcs", 38),("Toddler Sippy Cup 300ml", 29),
        ("Baby Nail File Set", 22),("Children Colouring Book", 18),
        ("Play-Doh Set 6 Colours", 39),("Baby Shampoo 200ml", 35),
    ],
    "Pet Supplies": [
        ("Cat Treat Hairball 60g", 22),("Dog Toy Rope Knot", 18),
        ("Pet Nail Clipper", 25),("Cat Litter Lavender 5L", 35),
        ("Dog Poop Bag 120pcs", 12),("Pet Food Bowl Stainless", 29),
        ("Catnip Toy Fish", 15),("Dog Collar Adjustable M", 32),
        ("Pet Shampoo 300ml", 38),("Slow Feeder Bowl Dog", 35),
    ],
}

def gen_csv(filename="sample_orders_2026.csv", months=6, orders_per_month=55):
    rows = []
    start = datetime.date(2026, 1, 1)
    oid   = 5001

    for month in range(months):
        n = random.randint(orders_per_month - 8, orders_per_month + 10)
        for _ in range(n):
            d   = start + datetime.timedelta(days=month*30 + random.randint(0, 27))
            cat = random.choice(list(PRODUCTS.keys()))
            name, base = random.choice(PRODUCTS[cat])
            qty   = random.randint(1, 4)
            price = round(base * random.uniform(0.95, 1.05), 2)
            rev   = round(price * qty, 2)
            gst   = round(rev * 0.06, 2)   # Malaysia SST 6%
            rows.append({
                "Order ID":    f"ORD-{oid:05d}",
                "Product Name": name,
                "Quantity":    qty,
                "Revenue":     rev,
                "GST":         gst,
                "Date":        d.strftime("%Y-%m-%d"),
            })
            oid += 1

    # 3 intentional anomalies (realistic scale)
    rows.append({                              # duplicate order ID
        "Order ID":"ORD-05001","Product Name":"Wireless Earbuds Type-C",
        "Quantity":1,"Revenue":89,"GST":5.34,"Date":"2026-02-10"
    })
    rows.append({                              # zero revenue
        "Order ID":f"ORD-{oid:05d}","Product Name":"Broken Item",
        "Quantity":1,"Revenue":0,"GST":0,"Date":"2026-03-15"
    })
    rows.append({                              # mild quantity outlier (15 units)
        "Order ID":f"ORD-{oid+1:05d}","Product Name":"USB-C Charging Cable 1m",
        "Quantity":15,"Revenue":270,"GST":16.20,"Date":"2026-04-22"
    })

    random.shuffle(rows)
    with open(filename, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["Order ID","Product Name","Quantity","Revenue","GST","Date"])
        w.writeheader(); w.writerows(rows)

    total_rev = sum(r["Revenue"] for r in rows)
    print(f"✅  {filename}  —  {len(rows)} rows  |  Est. revenue: RM {total_rev:,.2f}")
    return rows

def gen_docx(rows, filename="sample_orders_word.docx"):
    """Create a Word (.docx) file with orders in a table — same data, Word format."""
    try:
        from docx import Document
        from docx.shared import Pt, RGBColor, Cm
        from docx.enum.text import WD_ALIGN_PARAGRAPH
    except ImportError:
        print("⚠️  python-docx not installed — skipping Word sample")
        return

    doc   = Document()
    style = doc.styles["Normal"]
    style.font.name = "Arial"
    style.font.size = Pt(10)

    # Title
    title = doc.add_heading("Sample Order Data — SmallBiz Store", level=1)
    title.runs[0].font.color.rgb = RGBColor(0x63, 0x66, 0xf1)

    doc.add_paragraph(f"Generated: {datetime.date.today()}  |  "
                      f"Total records: {len(rows)}  |  SST 6%")

    # Table
    headers = ["Order ID","Product Name","Quantity","Revenue","GST","Date"]
    table   = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"

    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(h)
        run.bold = True
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        hdr_cells[i]._tc.get_or_add_tcPr()

    # Sample data rows (first 30 to keep file small)
    for row in rows[:30]:
        cells = table.add_row().cells
        vals  = [row["Order ID"], row["Product Name"], str(row["Quantity"]),
                 f'{row["Revenue"]:.2f}', f'{row["GST"]:.2f}', row["Date"]]
        for i, v in enumerate(vals):
            p = cells[i].paragraphs[0]
            p.add_run(v).font.size = Pt(8.5)

    # Column widths
    for i, w_cm in enumerate([3.0, 6.0, 2.0, 2.5, 2.0, 3.0]):
        for cell in table.columns[i].cells:
            cell.width = Cm(w_cm)

    doc.save(filename)
    print(f"✅  {filename}  —  30 rows (Word table format)")

if __name__ == "__main__":
    rows = gen_csv()
    gen_docx(rows)
