import sqlite3
import os

def migrate():
    # USAR RUTA REAL DIRECTAMENTE
    db_path = r"C:\Users\srodr\Desktop\proyectos\TALLER\Taller_Portable\workshop.db"
    
    print(f"Migrando base de datos en: {db_path}")

    if not os.path.exists(db_path):
        print("¡ERROR! Base de datos no encontrada en la ruta portable.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Verificando tabla clients...")
    
    # Verificar si la columna status existe
    cursor.execute("PRAGMA table_info(clients)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'status' not in columns:
        print("Agregando columna 'status' a la tabla 'clients'...")
        cursor.execute("ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'activa'")
        print("Columna 'status' agregada.")
    else:
        print("La columna 'status' ya existe.")

    conn.commit()
    conn.close()
    print("Migración de clientes completada con éxito.")

if __name__ == "__main__":
    migrate()
