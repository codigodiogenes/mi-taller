import sqlite3
import os

def migrate():
    db_path = 'workshop.db'
    if not os.path.exists(db_path):
        db_path = os.path.join('backend', 'workshop.db')
        if not os.path.exists(db_path):
            print("Base de datos no encontrada.")
            return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Verificando tabla audit_logs...")
    
    # Crear tabla audit_logs si no existe
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        description TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        data TEXT
    )
    ''')

    conn.commit()
    conn.close()
    print("Migración de auditoría completada con éxito.")

if __name__ == "__main__":
    migrate()
