import sqlite3, os, json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "opa_insight.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    user_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    email     TEXT UNIQUE NOT NULL,
    password  TEXT NOT NULL,
    role      TEXT DEFAULT 'analyst',
    avatar_color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS uploaded_files (
    file_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER,
    filename     TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type    TEXT DEFAULT 'csv',
    upload_date  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    record_count INTEGER DEFAULT 0,
    status       TEXT DEFAULT 'uploaded',
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE IF NOT EXISTS processed_orders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id     TEXT,
    product_name TEXT,
    quantity     REAL DEFAULT 0,
    revenue      REAL DEFAULT 0,
    gst          REAL DEFAULT 0,
    date         TEXT,
    category     TEXT DEFAULT 'Others',
    file_id      INTEGER,
    FOREIGN KEY (file_id) REFERENCES uploaded_files(file_id)
);
CREATE TABLE IF NOT EXISTS generated_reports (
    report_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER,
    file_id        INTEGER,
    date_from      TEXT,
    date_to        TEXT,
    summary        TEXT,
    recommendation TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES uploaded_files(file_id)
);
CREATE TABLE IF NOT EXISTS correction_memory (
    memory_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name     TEXT UNIQUE NOT NULL,
    correct_category TEXT NOT NULL,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS category_keywords (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    category  TEXT NOT NULL,
    keyword   TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, keyword)
);
CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER,
    title      TEXT,
    message    TEXT,
    type       TEXT DEFAULT 'info',
    is_read    INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

DEFAULT_KEYWORDS = {
    "Electronics":      ["phone","laptop","charger","cable","headphone","earphone","speaker","tablet","keyboard","mouse","monitor","camera","battery","powerbank","usb","hdmi","router","smartwatch","webcam","printer","scanner","projector","memory","ram","ssd","hdd","cpu","gpu","motherboard","gaming","console","controller"],
    "Fashion":          ["shirt","dress","pants","jeans","shoes","bag","handbag","wallet","watch","sunglasses","hat","cap","jacket","coat","skirt","blouse","hoodie","sneakers","sandals","heels","boots","belt","scarf","gloves","socks","underwear","bra","swimsuit","uniform","tie","suit"],
    "Health & Beauty":  ["shampoo","conditioner","moisturiser","sunscreen","lipstick","foundation","serum","toner","mask","cleanser","lotion","cream","powder","perfume","deodorant","toothbrush","toothpaste","vitamin","supplement","medicine","bandage","sanitiser","cotton","razor","trimmer","comb","brush"],
    "Home & Living":    ["pillow","blanket","bedsheet","curtain","towel","mop","broom","dustpan","detergent","soap","tissue","candle","lamp","fan","airfryer","kettle","blender","rice cooker","fridge","washing machine","iron","vacuum","storage","organiser","shelf","mirror","picture","vase","clock","rug","mat"],
    "Sports & Outdoors":["yoga","gym","dumbbell","barbell","resistance band","jump rope","bicycle","helmet","racket","ball","gloves","shoes","track","running","swimming","cycling","hiking","tent","backpack","sleeping bag","fishing","camping","football","basketball","badminton","tennis","golf","skateboard","roller"],
    "Books & Stationery":["book","novel","textbook","notebook","pen","pencil","marker","highlighter","ruler","eraser","stapler","paper","folder","binder","envelope","sticky note","diary","calendar","sticker","stamp","tape","glue","scissors","calculator","art supply","paint","brush","canvas","drawing","coloring"],
    "Food & Beverages":  ["coffee","tea","juice","milk","water","snack","chocolate","biscuit","cookie","candy","sugar","flour","rice","noodle","pasta","sauce","oil","vinegar","spice","herb","honey","jam","butter","cheese","yogurt","protein","energy drink","supplement","vitamin","cereal","oat"],
    "Baby & Kids":       ["diaper","baby","infant","toddler","toy","lego","puzzle","doll","action figure","game","cartoon","stroller","crib","feeding","bottle","pacifier","crayon","paint","playmat","learning","kids","child","nursery","school supply","backpack","lunch box","water bottle"],
    "Pet Supplies":      ["dog","cat","fish","bird","hamster","rabbit","pet","paw","leash","collar","cage","aquarium","food bowl","litter","shampoo","toy","treat","grooming","vet","kennel","scratching post","bird cage","fish tank","terrarium","seed","hay"],
    "Others":            []
}

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript(SCHEMA)
    # Seed keywords if empty
    count = conn.execute("SELECT COUNT(*) FROM category_keywords").fetchone()[0]
    if count == 0:
        for cat, kws in DEFAULT_KEYWORDS.items():
            for kw in kws:
                try:
                    conn.execute("INSERT OR IGNORE INTO category_keywords(category,keyword) VALUES(?,?)",(cat,kw))
                except: pass
        conn.commit()
    # Default admin
    admin = conn.execute("SELECT user_id FROM users WHERE email=?",("admin@opa.com",)).fetchone()
    if not admin:
        conn.execute("INSERT INTO users(name,email,password,role,avatar_color) VALUES(?,?,?,?,?)",
                     ("Admin","admin@opa.com","admin123","admin","#6366f1"))
        conn.commit()
    conn.close()

def push_notification(user_id, title, message, ntype="info"):
    conn = get_db()
    conn.execute("INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)",(user_id,title,message,ntype))
    conn.commit()
    conn.close()
