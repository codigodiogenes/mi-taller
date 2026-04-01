import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Ruta fija y segura para Docker
DATABASE_PATH = os.environ.get("DATABASE_PATH", "/app/data/database/workshop.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

print(f"\n[SISTEMA] --- INICIO DE CONEXION DOCKER ---")
print(f"[SISTEMA] Conectando a: {SQLALCHEMY_DATABASE_URL}")

# Intentar limpiar archivos WAL/SHM residuales ANTES de abrir la conexión.
# En Docker Desktop (Windows), estos archivos causan errores de disco I/O.
for ext in ("-wal", "-shm"):
    residual = DATABASE_PATH + ext
    if os.path.exists(residual):
        try:
            os.remove(residual)
            print(f"[SISTEMA] Limpiado archivo residual: {residual}")
        except OSError as e:
            print(f"[SISTEMA] No se pudo limpiar {residual}: {e} (no es crítico)")

print(f"[SISTEMA] Base de datos lista.\n")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={
        "check_same_thread": False,
        "timeout": 60  # Aumentamos el tiempo de espera a 60 segundos
    },
    pool_pre_ping=True
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    # Forzamos modo DELETE (no WAL) para evitar archivos -shm/-wal en Docker.
    # Si falla (disco bloqueado), continuamos sin crashear.
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=DELETE")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()
    except Exception as e:
        print(f"[SISTEMA] PRAGMA no aplicado (no es crítico): {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_portable_base():
    return os.environ.get("DATA_BASE_PATH", "/app/data")

def get_images_path():
    return os.path.join(get_portable_base(), "imagenes")

def get_documents_path():
    return os.path.join(get_portable_base(), "documentos")

def get_logos_path():
    return os.path.join(get_portable_base(), "logos")
