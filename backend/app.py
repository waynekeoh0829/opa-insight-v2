from flask import Flask, request, jsonify, send_file, g
from flask_cors import CORS
import os, json, io, secrets, sqlite3, pandas as pd, csv
from datetime import datetime
from werkzeug.utils import secure_filename

from database import init_db, get_db, push_notification, DB_PATH
from modules.validator import validate_file
from modules.cleaner import clean
from modules.categoriser import categorise_df, save_correction, add_keyword, remove_keyword, get_all_keywords
from modules.analytics import compute, compare_periods
from modules.anomaly import detect
from modules.insights import generate as gen_insights
from modules.recommendations import generate as gen_recs
from modules.inventory import analyse as inv_analyse
from modules.pdf_generator import generate as gen_pdf

app = Flask(__name__)
CORS(app, supports_credentials=True)
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

SESSIONS = {}   # token -> user_id

def auth():
    tok = request.headers.get("Authorization","").replace("Bearer ","").strip()
    uid = SESSIONS.get(tok)
    if not uid: return None
    return uid

def require_auth(f):
    from functools import wraps
    @wraps(f)
    def wrapper(*args,**kwargs):
        uid = auth()
        if not uid: return jsonify({"error":"Unauthorized"}),401
        g.user_id = uid
        return f(*args,**kwargs)
    return wrapper

def load_processed(file_ids=None, date_from=None, date_to=None):
    conn = get_db()
    q = "SELECT * FROM processed_orders"
    params = []
    conds = []
    if file_ids:
        ph = ",".join("?"*len(file_ids))
        conds.append(f"file_id IN ({ph})")
        params.extend(file_ids)
    q += (" WHERE "+" AND ".join(conds)) if conds else ""
    rows = conn.execute(q,params).fetchall()
    conn.close()
    df = pd.DataFrame([dict(r) for r in rows]) if rows else pd.DataFrame()
    if not df.empty and date_from and date_to:
        df["date"] = pd.to_datetime(df["date"],errors="coerce")
        df = df[(df["date"]>=date_from)&(df["date"]<=date_to)]
        df["date"] = df["date"].dt.strftime("%Y-%m-%d")
    return df

def get_file_ids_for_user(user_id):
    conn = get_db()
    rows = conn.execute("SELECT file_id FROM uploaded_files WHERE user_id=? AND status='processed'",(user_id,)).fetchall()
    conn.close()
    return [r[0] for r in rows]

# ── Auth ─────────────────────────────────────────────────────────────────────
@app.route("/api/auth/login", methods=["POST"])
def login():
    d = request.json or {}
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email=? AND password=?",(d.get("email"),d.get("password"))).fetchone()
    conn.close()
    if not user: return jsonify({"error":"Invalid credentials"}),401
    token = secrets.token_hex(32)
    SESSIONS[token] = user["user_id"]
    return jsonify({"token":token,"user":{"user_id":user["user_id"],"name":user["name"],"email":user["email"],"role":user["role"],"avatar_color":user["avatar_color"]}})

@app.route("/api/auth/register", methods=["POST"])
def register():
    d = request.json or {}
    if not all([d.get("name"),d.get("email"),d.get("password")]): return jsonify({"error":"All fields required"}),400
    conn = get_db()
    try:
        conn.execute("INSERT INTO users(name,email,password) VALUES(?,?,?)",(d["name"],d["email"],d["password"]))
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE email=?",(d["email"],)).fetchone()
        conn.close()
        token = secrets.token_hex(32)
        SESSIONS[token] = user["user_id"]
        return jsonify({"token":token,"user":{"user_id":user["user_id"],"name":user["name"],"email":user["email"],"role":user["role"],"avatar_color":user["avatar_color"]}})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error":"Email already registered"}),409

@app.route("/api/auth/logout", methods=["POST"])
@require_auth
def logout():
    tok = request.headers.get("Authorization","").replace("Bearer ","").strip()
    SESSIONS.pop(tok,None)
    return jsonify({"ok":True})

@app.route("/api/auth/profile", methods=["GET","PUT"])
@require_auth
def profile():
    conn = get_db()
    if request.method=="GET":
        u = conn.execute("SELECT * FROM users WHERE user_id=?",(g.user_id,)).fetchone()
        conn.close()
        if not u: return jsonify({"error":"Not found"}),404
        return jsonify({"user_id":u["user_id"],"name":u["name"],"email":u["email"],"role":u["role"],"avatar_color":u["avatar_color"],"created_at":u["created_at"]})
    d = request.json or {}
    if "name" in d: conn.execute("UPDATE users SET name=? WHERE user_id=?",(d["name"],g.user_id))
    if "avatar_color" in d: conn.execute("UPDATE users SET avatar_color=? WHERE user_id=?",(d["avatar_color"],g.user_id))
    if "password" in d and "new_password" in d:
        user = conn.execute("SELECT password FROM users WHERE user_id=?",(g.user_id,)).fetchone()
        if not user or user["password"] != d["password"]: conn.close(); return jsonify({"error":"Wrong current password"}),400
        conn.execute("UPDATE users SET password=? WHERE user_id=?",(d["new_password"],g.user_id))
    conn.commit(); conn.close()
    return jsonify({"ok":True})

# ── Upload ───────────────────────────────────────────────────────────────────
@app.route("/api/upload", methods=["POST"])
@require_auth
def upload():
    if "file" not in request.files: return jsonify({"error":"No file"}),400
    f = request.files["file"]
    ext = f.filename.rsplit(".",1)[-1].lower() if "." in f.filename else ""
    if ext not in ("csv","xlsx","xls","docx","doc"): return jsonify({"error":"Unsupported file type"}),400
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    fname = f"{ts}_{secure_filename(f.filename)}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    f.save(fpath)
    result = validate_file(fpath, ext)
    if not result["ok"]: os.remove(fpath); return jsonify({"error":result["error"],"found":result.get("found",[])}),400
    conn = get_db()
    conn.execute("INSERT INTO uploaded_files(user_id,filename,original_name,file_type,record_count) VALUES(?,?,?,?,?)",
                 (g.user_id,fname,f.filename,ext,result["row_count"]))
    conn.commit()
    file_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()
    return jsonify({"ok":True,"file_id":file_id,"row_count":result["row_count"],"preview":result["preview"],"columns":result["columns"]})

@app.route("/api/process/<int:file_id>", methods=["POST"])
@require_auth
def process(file_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM uploaded_files WHERE file_id=? AND user_id=?",(file_id,g.user_id)).fetchone()
    if not row: conn.close(); return jsonify({"error":"File not found"}),404
    conn.close()
    fpath = os.path.join(UPLOAD_DIR, row["filename"])
    ext   = row["file_type"]
    result= validate_file(fpath, ext)
    if not result["ok"]: return jsonify({"error":result["error"]}),400
    df, clean_stats = clean(result["df"])
    df = categorise_df(df)
    conn = get_db()
    conn.execute("DELETE FROM processed_orders WHERE file_id=?",(file_id,))
    for _,r in df.iterrows():
        conn.execute("INSERT INTO processed_orders(order_id,product_name,quantity,revenue,gst,date,category,file_id) VALUES(?,?,?,?,?,?,?,?)",
                     (str(r["order_id"]),str(r["product_name"]),float(r["quantity"]),float(r["revenue"]),float(r["gst"]),str(r["date"]),str(r["category"]),file_id))
    conn.execute("UPDATE uploaded_files SET status='processed', record_count=? WHERE file_id=?",(len(df),file_id))
    conn.commit(); conn.close()
    analytics = compute(df)
    anomalies = detect(df)
    insights  = gen_insights(df, analytics, anomalies)
    recs      = gen_recs(df, analytics, anomalies)
    conn = get_db()
    conn.execute("INSERT INTO generated_reports(user_id,file_id,summary,recommendation) VALUES(?,?,?,?)",
                 (g.user_id,file_id,json.dumps(insights),json.dumps(recs)))
    conn.commit(); conn.close()
    if anomalies:
        high = [a for a in anomalies if a["severity"]=="High"]
        if high:
            push_notification(g.user_id,"⚠️ Data Quality Alert",f"{len(high)} high-severity issue(s) detected in latest upload.","warning")
    push_notification(g.user_id,"✅ Processing Complete",f"'{row['original_name']}' processed — {len(df)} records, {len(anomalies)} anomalies.","success")
    return jsonify({"ok":True,"records":len(df),"anomalies":len(anomalies),"clean_stats":clean_stats})

# ── Manual entry ─────────────────────────────────────────────────────────────
@app.route("/api/orders/manual", methods=["POST"])
@require_auth
def manual_entry():
    orders = request.json.get("orders",[])
    if not orders: return jsonify({"error":"No orders provided"}),400
    conn = get_db()
    conn.execute("INSERT INTO uploaded_files(user_id,filename,original_name,file_type,status,record_count) VALUES(?,?,?,?,?,?)",
                 (g.user_id,"manual_entry","Manual Entry","manual","processed",len(orders)))
    conn.commit()
    file_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    for o in orders:
        from modules.categoriser import categorise
        cat = categorise(o.get("product_name",""))
        conn.execute("INSERT INTO processed_orders(order_id,product_name,quantity,revenue,gst,date,category,file_id) VALUES(?,?,?,?,?,?,?,?)",
                     (o.get("order_id","M"+str(file_id)),o.get("product_name",""),float(o.get("quantity",0)),
                      float(o.get("revenue",0)),float(o.get("gst",0)),o.get("date",""),cat,file_id))
    conn.commit(); conn.close()
    return jsonify({"ok":True,"file_id":file_id,"records":len(orders)})

# ── Files ────────────────────────────────────────────────────────────────────
@app.route("/api/files", methods=["GET"])
@require_auth
def list_files():
    conn = get_db()
    rows = conn.execute("SELECT * FROM uploaded_files WHERE user_id=? ORDER BY upload_date DESC",(g.user_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/files/<int:file_id>", methods=["DELETE"])
@require_auth
def delete_file(file_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM uploaded_files WHERE file_id=? AND user_id=?",(file_id,g.user_id)).fetchone()
    if not row: conn.close(); return jsonify({"error":"Not found"}),404
    try:
        fpath = os.path.join(UPLOAD_DIR, row["filename"])
        if os.path.exists(fpath): os.remove(fpath)
    except: pass
    conn.execute("DELETE FROM processed_orders WHERE file_id=?",(file_id,))
    conn.execute("DELETE FROM generated_reports WHERE file_id=?",(file_id,))
    conn.execute("DELETE FROM uploaded_files WHERE file_id=?",(file_id,))
    conn.commit(); conn.close()
    return jsonify({"ok":True})

@app.route("/api/data/clear", methods=["POST"])
@require_auth
def clear_all():
    conn = get_db()
    file_ids = [r[0] for r in conn.execute("SELECT file_id FROM uploaded_files WHERE user_id=?",(g.user_id,)).fetchall()]
    for fid in file_ids:
        row = conn.execute("SELECT filename FROM uploaded_files WHERE file_id=?",(fid,)).fetchone()
        if row:
            try:
                fpath = os.path.join(UPLOAD_DIR, row[0])
                if os.path.exists(fpath): os.remove(fpath)
            except: pass
    conn.execute("DELETE FROM processed_orders WHERE file_id IN ({})".format(",".join("?"*len(file_ids))),file_ids) if file_ids else None
    conn.execute("DELETE FROM generated_reports WHERE user_id=?",(g.user_id,))
    conn.execute("DELETE FROM uploaded_files WHERE user_id=?",(g.user_id,))
    conn.commit(); conn.close()
    return jsonify({"ok":True})

# ── Analytics ────────────────────────────────────────────────────────────────
@app.route("/api/analytics")
@require_auth
def analytics():
    date_from = request.args.get("from") or None
    date_to   = request.args.get("to") or None
    fids = get_file_ids_for_user(g.user_id)
    df = load_processed(fids, date_from, date_to)
    return jsonify(compute(df))

@app.route("/api/anomalies")
@require_auth
def anomalies():
    date_from = request.args.get("from") or None
    date_to   = request.args.get("to") or None
    fids = get_file_ids_for_user(g.user_id)
    df = load_processed(fids, date_from, date_to)
    return jsonify(detect(df))

@app.route("/api/insights")
@require_auth
def insights():
    date_from = request.args.get("from") or None
    date_to   = request.args.get("to") or None
    fids = get_file_ids_for_user(g.user_id)
    df = load_processed(fids, date_from, date_to)
    an = compute(df); anom = detect(df)
    return jsonify(gen_insights(df, an, anom))

@app.route("/api/recommendations")
@require_auth
def recommendations():
    date_from = request.args.get("from") or None
    date_to   = request.args.get("to") or None
    fids = get_file_ids_for_user(g.user_id)
    df = load_processed(fids, date_from, date_to)
    an = compute(df); anom = detect(df)
    return jsonify(gen_recs(df, an, anom))

@app.route("/api/compare")
@require_auth
def compare():
    fids = get_file_ids_for_user(g.user_id)
    df = load_processed(fids)
    if df.empty: return jsonify({"error":"No data"}),400
    return jsonify(compare_periods(df,
        request.args.get("from1",""), request.args.get("to1",""),
        request.args.get("from2",""), request.args.get("to2","")))

@app.route("/api/inventory")
@require_auth
def inventory():
    date_from = request.args.get("from") or None
    date_to   = request.args.get("to") or None
    fids = get_file_ids_for_user(g.user_id)
    df = load_processed(fids, date_from, date_to)
    return jsonify(inv_analyse(df))

# ── Categories ───────────────────────────────────────────────────────────────
@app.route("/api/categories", methods=["GET"])
@require_auth
def get_categories():
    return jsonify(get_all_keywords())

@app.route("/api/categories/<category>/keywords", methods=["POST"])
@require_auth
def add_kw(category):
    kw = (request.json or {}).get("keyword","").strip()
    if not kw: return jsonify({"error":"keyword required"}),400
    add_keyword(category, kw)
    return jsonify({"ok":True})

@app.route("/api/categories/<category>/keywords/<keyword>", methods=["DELETE"])
@require_auth
def del_kw(category, keyword):
    remove_keyword(category, keyword)
    return jsonify({"ok":True})

@app.route("/api/corrections", methods=["GET","POST"])
@require_auth
def corrections():
    if request.method=="GET":
        conn=get_db()
        rows=conn.execute("SELECT * FROM correction_memory ORDER BY updated_at DESC").fetchall()
        conn.close()
        return jsonify([dict(r) for r in rows])
    d = request.json or {}
    pname = d.get("product_name","").strip()
    cat   = d.get("category","").strip()
    if not pname or not cat: return jsonify({"error":"product_name and category required"}),400
    save_correction(pname, cat)
    conn=get_db(); conn.execute("UPDATE processed_orders SET category=? WHERE LOWER(product_name)=?",(cat,pname.lower())); conn.commit(); conn.close()
    return jsonify({"ok":True})

# ── Notifications ─────────────────────────────────────────────────────────────
@app.route("/api/notifications", methods=["GET"])
@require_auth
def get_notifs():
    conn=get_db()
    rows=conn.execute("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 30",(g.user_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/notifications/read-all", methods=["POST"])
@require_auth
def read_all_notifs():
    conn=get_db(); conn.execute("UPDATE notifications SET is_read=1 WHERE user_id=?",(g.user_id,)); conn.commit(); conn.close()
    return jsonify({"ok":True})

@app.route("/api/notifications/<int:nid>/read", methods=["POST"])
@require_auth
def read_notif(nid):
    conn=get_db(); conn.execute("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?",(nid,g.user_id)); conn.commit(); conn.close()
    return jsonify({"ok":True})

# ── Exports ───────────────────────────────────────────────────────────────────
@app.route("/api/export/pdf")
@require_auth
def export_pdf():
    date_from = request.args.get("from") or None
    date_to   = request.args.get("to") or None
    fids = get_file_ids_for_user(g.user_id)
    df = load_processed(fids, date_from, date_to)
    an = compute(df); anom = detect(df)
    ins = gen_insights(df,an,anom); recs = gen_recs(df,an,anom)
    conn=get_db()
    user=conn.execute("SELECT name FROM users WHERE user_id=?",(g.user_id,)).fetchone()
    conn.close()
    buf = gen_pdf(an,ins,recs,anom,an.get("kpi",{}),date_from or "",date_to or "",user["name"] if user else "")
    fname = f"OPA_Report_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    return send_file(buf, mimetype="application/pdf", as_attachment=True, download_name=fname)

@app.route("/api/export/csv")
@require_auth
def export_csv():
    date_from = request.args.get("from") or None
    date_to   = request.args.get("to") or None
    fids = get_file_ids_for_user(g.user_id)
    df = load_processed(fids, date_from, date_to)
    if df.empty: return jsonify({"error":"No data"}),400
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    out = io.BytesIO(buf.getvalue().encode())
    fname = f"OPA_Data_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    return send_file(out, mimetype="text/csv", as_attachment=True, download_name=fname)

@app.route("/api/uncategorised")
@require_auth
def uncategorised():
    fids = get_file_ids_for_user(g.user_id)
    df = load_processed(fids)
    if df.empty: return jsonify([])
    oth = df[df["category"]=="Others"][["product_name"]].drop_duplicates().head(50)
    return jsonify(oth["product_name"].tolist())

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
