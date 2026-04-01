import sqlite3
import os

db_path = "workshop.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def check_columns(table):
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Columns in {table}: {columns}")

check_columns("motorcycles")
check_columns("repairs")
conn.close()
