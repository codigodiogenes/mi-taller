"""
Script de migración para agregar campos status, photos y documents a la tabla motorcycles
"""
import sqlite3
import os

# Usamos la base de datos de la version portable
db_path = r"C:\Users\srodr\Desktop\proyectos\TALLER\Taller_Portable\workshop.db"

def migrate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar si las columnas ya existen
        cursor.execute("PRAGMA table_info(motorcycles)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Agregar columna status si no existe
        if 'status' not in columns:
            print("Agregando columna 'status' a motorcycles...")
            cursor.execute("ALTER TABLE motorcycles ADD COLUMN status VARCHAR DEFAULT 'activa'")
            # Actualizar todas las motos existentes a 'activa'
            cursor.execute("UPDATE motorcycles SET status = 'activa' WHERE status IS NULL")
            print("✓ Columna 'status' agregada")
        else:
            print("✓ Columna 'status' ya existe")
        
        # Agregar columna photos si no existe
        if 'photos' not in columns:
            print("Agregando columna 'photos' a motorcycles...")
            cursor.execute("ALTER TABLE motorcycles ADD COLUMN photos TEXT")
            print("✓ Columna 'photos' agregada")
        else:
            print("✓ Columna 'photos' ya existe")
        
        # Agregar columna documents si no existe
        if 'documents' not in columns:
            print("Agregando columna 'documents' a motorcycles...")
            cursor.execute("ALTER TABLE motorcycles ADD COLUMN documents TEXT")
            print("✓ Columna 'documents' agregada")
        else:
            print("✓ Columna 'documents' ya existe")

        # Agregar columna vin si no existe
        if 'vin' not in columns:
            print("Agregando columna 'vin' a motorcycles...")
            cursor.execute("ALTER TABLE motorcycles ADD COLUMN vin VARCHAR")
            print("✓ Columna 'vin' agregada")

        # Agregar columna current_km si no existe
        if 'current_km' not in columns:
            print("Agregando columna 'current_km' a motorcycles...")
            cursor.execute("ALTER TABLE motorcycles ADD COLUMN current_km INTEGER DEFAULT 0")
            print("✓ Columna 'current_km' agregada")

        # Agregar columna specifications si no existe
        if 'specifications' not in columns:
            print("Agregando columna 'specifications' a motorcycles...")
            cursor.execute("ALTER TABLE motorcycles ADD COLUMN specifications TEXT")
            print("✓ Columna 'specifications' agregada")

        # Migrar tabla repairs para agregar entry_km
        cursor.execute("PRAGMA table_info(repairs)")
        repair_columns = [column[1] for column in cursor.fetchall()]
        if 'entry_km' not in repair_columns:
            print("Agregando columna 'entry_km' a repairs...")
            cursor.execute("ALTER TABLE repairs ADD COLUMN entry_km INTEGER")
            print("✓ Columna 'entry_km' agregada")

        conn.commit()
        print("\n✅ Migración completada con éxito!")
        
    except Exception as e:
        print(f"\n❌ Error durante la migración: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("=== Iniciando migración de base de datos ===\n")
    migrate()
