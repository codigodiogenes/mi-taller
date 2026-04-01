import sqlite3
import os

db_path = os.path.join('c:\\Users\\srodr\\Desktop\\proyectos\\TALLER\\moto_workshop\\backend', 'workshop.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute('SELECT key, value FROM settings')
rows = cur.fetchall()
print("Settings in DB:")
for r in rows:
    print(f"{r[0]}: {r[1]}")
conn.close()
