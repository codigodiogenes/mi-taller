import sqlite3
import json
import os

# Ruta real de la base de datos
db_path = r"C:\Users\srodr\Desktop\proyectos\TALLER\Taller_Portable\workshop.db"

if not os.path.exists(db_path):
    print(f"Error: No se encuentra la DB en {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Obtener todas las motos
cursor.execute("SELECT id, photos, documents FROM motorcycles")
motos = cursor.fetchall()

for moto_id, photos_json, docs_json in motos:
    updated = False
    
    # Actualizar fotos
    if photos_json:
        photos = json.loads(photos_json)
        new_photos = []
        for p in photos:
            if isinstance(p, str) and "/uploads/photos/" in p:
                new_photos.append(p.replace("/uploads/photos/", "/imagenes/"))
                updated = True
            else:
                new_photos.append(p)
        photos_json = json.dumps(new_photos)
        
    # Actualizar documentos
    if docs_json:
        docs = json.loads(docs_json)
        new_docs = []
        for d in docs:
            if isinstance(d, dict) and "url" in d and "/uploads/documents/" in d["url"]:
                d["url"] = d["url"].replace("/uploads/documents/", "/documentos/")
                updated = True
                new_docs.append(d)
            elif isinstance(d, str) and "/uploads/documents/" in d:
                new_docs.append(d.replace("/uploads/documents/", "/documentos/"))
                updated = True
            else:
                new_docs.append(d)
        docs_json = json.dumps(new_docs)
        
    if updated:
        print(f"Actualizando moto ID {moto_id}...")
        cursor.execute(
            "UPDATE motorcycles SET photos = ?, documents = ? WHERE id = ?",
            (photos_json, docs_json, moto_id)
        )

conn.commit()
conn.close()
print("Migración completada con éxito.")
