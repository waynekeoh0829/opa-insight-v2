import sqlite3, os
from rapidfuzz import fuzz

DB_PATH = os.path.join(os.path.dirname(__file__),"..","opa_insight.db")
THRESHOLD = 65

def _load_keywords():
    try:
        conn=sqlite3.connect(DB_PATH)
        rows=conn.execute("SELECT category,keyword FROM category_keywords").fetchall()
        conn.close()
        kw={}
        for cat,kw_val in rows:
            kw.setdefault(cat,[]).append(kw_val.lower())
        return kw
    except: return {}

def _load_corrections():
    try:
        conn=sqlite3.connect(DB_PATH)
        rows=conn.execute("SELECT product_name,correct_category FROM correction_memory").fetchall()
        conn.close()
        return {r[0].lower():r[1] for r in rows}
    except: return {}

def categorise(product_name):
    name_l = product_name.lower()
    corrections = _load_corrections()
    if name_l in corrections:
        return corrections[name_l]
    keywords = _load_keywords()
    for cat, kws in keywords.items():
        if cat == "Others": continue
        for kw in kws:
            if kw in name_l: return cat
    best_cat, best_score = "Others", 0
    for cat, kws in keywords.items():
        if cat == "Others": continue
        for kw in kws:
            score = fuzz.partial_ratio(kw, name_l)
            if score > best_score: best_score, best_cat = score, cat
    return best_cat if best_score >= THRESHOLD else "Others"

def categorise_df(df):
    df = df.copy()
    df["category"] = df["product_name"].apply(categorise)
    return df

def save_correction(product_name, category):
    conn=sqlite3.connect(DB_PATH)
    conn.execute("INSERT OR REPLACE INTO correction_memory(product_name,correct_category,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)",
                 (product_name.lower(), category))
    conn.commit(); conn.close()

def add_keyword(category, keyword):
    conn=sqlite3.connect(DB_PATH)
    conn.execute("INSERT OR IGNORE INTO category_keywords(category,keyword) VALUES(?,?)",(category,keyword.lower()))
    conn.commit(); conn.close()

def remove_keyword(category, keyword):
    conn=sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM category_keywords WHERE category=? AND keyword=?",(category,keyword.lower()))
    conn.commit(); conn.close()

def get_all_keywords():
    conn=sqlite3.connect(DB_PATH)
    rows=conn.execute("SELECT category,keyword FROM category_keywords ORDER BY category,keyword").fetchall()
    conn.close()
    result={}
    for cat,kw in rows:
        result.setdefault(cat,[]).append(kw)
    return result
