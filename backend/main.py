from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys

# Explicitly import jose/bcrypt to help PyInstaller discovery
try:
    import bcrypt
    import jose
except ImportError:
    pass

from database import engine, Base
import database
import models
from routers import clients, motorcycles, repairs, settings, stock, auth

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Motorcycle Workshop API")

@app.on_event("startup")
async def startup_event():
    # Inicializar Base de Datos (Crear admin por defecto)
    from database import SessionLocal
    import crud, schemas
    db = SessionLocal()
    try:
        admin_user = crud.get_user_by_username(db, "admin")
        if not admin_user:
            print("[SISTEMA] Creando usuario administrador inicial (admin/1234)...")
            initial_user = schemas.UserCreate(
                username="admin",
                password="1234",
                full_name="Administrador del Taller",
                role="admin"
            )
            crud.create_user(db, initial_user)
    except Exception as e:
        print(f"[SISTEMA] Error inicializando admin: {e}")
    finally:
        db.close()

    # Check if auto-backup is enabled
    from database import SessionLocal
    import models
    import backup_utils
    from datetime import datetime, timedelta
    
    db = SessionLocal()
    try:
        setting = db.query(models.Setting).filter(models.Setting.key == "enable_auto_backup").first()
        if setting and setting.value == "true":
            # Obtener frecuencia y última fecha de respaldo
            freq_setting = db.query(models.Setting).filter(models.Setting.key == "backup_frequency").first()
            last_date_setting = db.query(models.Setting).filter(models.Setting.key == "last_auto_backup_date").first()
            
            frequency = freq_setting.value if freq_setting else "siempre"
            last_date_str = last_date_setting.value if last_date_setting else None
            
            should_backup = False
            now = datetime.now()
            
            if frequency == "siempre" or not last_date_str:
                should_backup = True
            else:
                try:
                    # Intentar parsear la fecha de la última copia
                    last_date = datetime.fromisoformat(last_date_str)
                    if frequency == "semanal":
                        if now >= last_date + timedelta(days=7):
                            should_backup = True
                    elif frequency == "quincenal":
                        if now >= last_date + timedelta(days=15):
                            should_backup = True
                    elif frequency == "mensual":
                        if now >= last_date + timedelta(days=30):
                            should_backup = True
                except Exception as e:
                    print(f"[SISTEMA] Error parseando fecha de respaldo ({last_date_str}): {e}")
                    should_backup = True # Ante la duda, si el formato falló, hacemos copia
            
            if should_backup:
                print(f"[SISTEMA] Iniciando copia de seguridad automática (Frecuencia: {frequency})...")
                success, msg = backup_utils.perform_backup()
                if success:
                    print("[SISTEMA] Copia de seguridad completada con éxito.")
                    # Actualizar fecha del último respaldo exitoso
                    if last_date_setting:
                        last_date_setting.value = now.isoformat()
                    else:
                        new_last_date = models.Setting(key="last_auto_backup_date", value=now.isoformat())
                        db.add(new_last_date)
                    db.commit()
                else:
                    print(f"[SISTEMA] Error en copia automática: {msg}")
            else:
                print(f"[SISTEMA] Omitiendo copia de seguridad automática (Frecuencia: {frequency}, última: {last_date_str})")
                
    except Exception as e:
        print(f"[SISTEMA] Error comprobando configuración de backup: {e}")
    finally:
        db.close()

# MIDDLEWARE PARA FORZAR HTTPS (Elimina el Mixed Content al 100%)
@app.middleware("http")
async def force_https_middleware(request: Request, call_next):
    # Forzar el esquema de la URL de la petición a https
    if request.url.scheme == "http":
        request.scope["scheme"] = "https"
    
    response = await call_next(request)
    # Reforzar cabeceras de seguridad para móviles
    response.headers["X-Frame-Options"] = "DENY"
    return response

# CORS con SOPORTE EXPLÍCITO PARA PRODUCCIÓN (HTTPS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://taller.codigodiogenes.es", 
        "http://localhost", 
        "http://localhost:5173",
        "http://127.0.0.1"
    ],
    allow_origin_regex="https?://.*", # Pase VIP para cualquier dirección (soluciona móvil)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    # Log detallado para diagnosticar móviles
    user_agent = request.headers.get("user-agent", "Desconocido")
    origin = request.headers.get("origin", "Sin Origen")
    
    # Manejar redirección interna para evitar Double Slash / 307 indeseados
    if request.url.path.endswith("/") and len(request.url.path) > 1:
        # Si la ruta termina en / pero la API espera sin /, FastAPI suele redirigir,
        # aquí simplemente logueamos para estar atentos.
        pass

    print(f"DEBUG REQUETS: {request.method} {request.url.path} (Scheme: {request.url.scheme}) | UA: {user_agent}")
    
    response = await call_next(request)
    
    # Cabeceras extra de seguridad para móviles
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

app.include_router(clients.router)
app.include_router(motorcycles.router)
app.include_router(repairs.router)
app.include_router(settings.router)
app.include_router(stock.router)
app.include_router(auth.router)

# Serve user-friendly directories
images_dir = database.get_images_path()
docs_dir = database.get_documents_path()
logos_dir = database.get_logos_path()
db_dir = os.path.dirname(database.DATABASE_PATH)

for d in [images_dir, docs_dir, logos_dir, db_dir]:
    if not os.path.exists(d):
        os.makedirs(d)

# Forzar rutas de medios para que apunten al volumen persistente de Docker
app.mount("/imagenes", StaticFiles(directory="/app/data/imagenes"), name="imagenes")
app.mount("/documentos", StaticFiles(directory="/app/data/documentos"), name="documentos")
app.mount("/logos", StaticFiles(directory="/app/data/logos"), name="logos")
app.mount("/brands", StaticFiles(directory="/app/data/logos"), name="brands")

@app.get("/")
def read_root():
    return {"message": "Workshop API is running", "diagnosis": "If you see this, your connection is successful."}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# El servidor arranca vía Docker mediante el Dockerfile (Puerto 8000)
