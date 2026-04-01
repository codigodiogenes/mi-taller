import sqlite3
import os

db_path = 'workshop.db'
if not os.path.exists(db_path):
    print(f"ERROR: {db_path} not found in {os.getcwd()}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = ['clients', 'motorcycles', 'repairs', 'repair_items', 'stock', 'settings']
for t in tables:
    print(f"\n--- Table: {t} ---")
    try:
        cursor.execute(f"PRAGMA table_info({t})")
        columns = cursor.fetchall()
        for c in columns:
            print(f"  Column: {c[1]} ({c[2]})")
        
        cursor.execute(f"SELECT count(*) FROM {t}")
        count = cursor.fetchone()[0]
        print(f"  Count: {count}")
    except Exception as e:
        print(f"  Error accessing table {t}: {e}")

conn.close()
