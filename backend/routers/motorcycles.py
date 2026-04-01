from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
import crud, schemas, database
import os
import shutil
import json
import uuid

router = APIRouter(
    prefix="/motorcycles",
    tags=["motorcycles"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Motorcycle)
def create_motorcycle(motorcycle: schemas.MotorcycleCreate, db: Session = Depends(database.get_db)):
    return crud.create_motorcycle(db=db, motorcycle=motorcycle)

@router.get("/", response_model=List[schemas.Motorcycle])
def read_motorcycles(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_motorcycles(db, skip=skip, limit=limit)

@router.get("/by-client/{client_id}", response_model=List[schemas.Motorcycle])
def read_motorcycles_by_client(client_id: int, db: Session = Depends(database.get_db)):
    return crud.get_motorcycles_by_client(db, client_id=client_id)

@router.get("/{motorcycle_id}", response_model=schemas.Motorcycle)
def read_motorcycle(motorcycle_id: int, db: Session = Depends(database.get_db)):
    print(f"DEBUG: Buscando moto con ID {motorcycle_id}")
    print(f"DEBUG: Usando DB: {database.SQLALCHEMY_DATABASE_URL}")
    motorcycle = crud.get_motorcycle(db, motorcycle_id)
    if motorcycle is None:
        print(f"DEBUG: ! MOTO NO ENCONTRADA EN DB !")
        # List all IDs to see what's there
        all_ids = [m.id for m in crud.get_motorcycles(db)]
        print(f"DEBUG: IDs disponibles en esta DB: {all_ids}")
        raise HTTPException(status_code=404, detail="Motorcycle not found")
    print(f"DEBUG: Moto encontrada: {motorcycle.brand} {motorcycle.model}")
    return motorcycle

@router.put("/{motorcycle_id}", response_model=schemas.Motorcycle)
def update_motorcycle(motorcycle_id: int, motorcycle: schemas.MotorcycleUpdate, db: Session = Depends(database.get_db)):
    # Get current state before update
    old_moto = crud.get_motorcycle(db, motorcycle_id)
    if old_moto is None:
        raise HTTPException(status_code=404, detail="Motorcycle not found")
    
    old_status = old_moto.status
    old_client_id = old_moto.client_id
    old_photos = json.loads(old_moto.photos or '[]')
    old_docs = json.loads(old_moto.documents or '[]')
    
    db_motorcycle = crud.update_motorcycle(db, motorcycle_id, motorcycle)
    
    # Handle Physical File Deletion for Photos
    if motorcycle.photos:
        new_photos = json.loads(motorcycle.photos)
        # Find removed photos (in old but not in new)
        # Normalize structure just in case (e.g. string vs object url)
        # But we know our system uses strings mainly now, or objects. 
        # Let's extract URLs to compare.
        
        def get_url(p): return p if isinstance(p, str) else p.get('url')
        
        new_urls = set(get_url(p) for p in new_photos)
        
        for p in old_photos:
            url = get_url(p)
            if url and url not in new_urls:
                # This photo was removed. Delete file.
                # url format: /uploads/photos/filename.png
                filename = url.split('/')[-1]
                full_path = os.path.join(database.get_images_path(), filename)
                print(f"DEBUG: Deleting removed photo: {full_path}")
                if os.path.exists(full_path):
                    try:
                        os.remove(full_path)
                    except Exception as e:
                        print(f"Error deleting file {full_path}: {e}")

    # Handle Physical File Deletion for Documents
    if motorcycle.documents:
        new_docs = json.loads(motorcycle.documents)
        
        def get_doc_url(d): return d if isinstance(d, str) else d.get('url')
        
        new_doc_urls = set(get_doc_url(d) for d in new_docs)
        
        for d in old_docs:
            url = get_doc_url(d)
            if url and url not in new_doc_urls:
                filename = url.split('/')[-1]
                full_path = os.path.join(database.get_documents_path(), filename)
                print(f"DEBUG: Deleting removed document: {full_path}")
                if os.path.exists(full_path):
                    try:
                        os.remove(full_path)
                    except Exception as e:
                        print(f"Error deleting file {full_path}: {e}")

    # Log changes
    if motorcycle.status and motorcycle.status != old_status:
        crud.create_audit_log(
            db, "motorcycle", motorcycle_id, "status_change",
            f"Cambio de estado: {old_status} -> {motorcycle.status}",
            json.dumps({"old": old_status, "new": motorcycle.status})
        )
    
    if motorcycle.client_id and motorcycle.client_id != old_client_id:
        crud.create_audit_log(
            db, "motorcycle", motorcycle_id, "owner_change",
            f"Cambio de propietario: {old_client_id} -> {motorcycle.client_id}",
            json.dumps({"old": old_client_id, "new": motorcycle.client_id})
        )
    
    return db_motorcycle

@router.post("/{motorcycle_id}/upload-photo", response_model=schemas.Motorcycle)
async def upload_motorcycle_photo(
    motorcycle_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    db_motorcycle = crud.get_motorcycle(db, motorcycle_id)
    if not db_motorcycle:
        raise HTTPException(status_code=404, detail="Motorcycle not found")
    
    # Create unique filename
    extension = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{extension}"
    
    # Save file
    full_path = os.path.join(database.get_images_path(), filename)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update motorcycle photos record
    current_photos = json.loads(db_motorcycle.photos) if db_motorcycle.photos else []
    current_photos.append(f"/imagenes/{filename}")
    
    update_data = schemas.MotorcycleUpdate(photos=json.dumps(current_photos))
    
    # Log action
    crud.create_audit_log(
        db, "motorcycle", motorcycle_id, "upload_photo",
        f"Nueva foto subida: {file.filename}",
        json.dumps({"filename": file.filename, "url": f"/uploads/photos/{filename}"})
    )
    
    return crud.update_motorcycle(db, motorcycle_id, update_data)

@router.post("/{motorcycle_id}/upload-document", response_model=schemas.Motorcycle)
async def upload_motorcycle_document(
    motorcycle_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    db_motorcycle = crud.get_motorcycle(db, motorcycle_id)
    if not db_motorcycle:
        raise HTTPException(status_code=404, detail="Motorcycle not found")
    
    # Create unique filename
    filename = f"{uuid.uuid4()}_{file.filename}"
    
    # Save file
    full_path = os.path.join(database.get_documents_path(), filename)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update motorcycle documents record
    current_docs = json.loads(db_motorcycle.documents) if db_motorcycle.documents else []
    new_doc = {
        "name": file.filename,
        "url": f"/documentos/{filename}"
    }
    current_docs.append(new_doc)
    
    update_data = schemas.MotorcycleUpdate(documents=json.dumps(current_docs))
    
    # Log action
    crud.create_audit_log(
        db, "motorcycle", motorcycle_id, "upload_document",
        f"Nuevo documento vinculado: {file.filename}",
        json.dumps(new_doc)
    )
    
    return crud.update_motorcycle(db, motorcycle_id, update_data)

@router.get("/{motorcycle_id}/history", response_model=List[schemas.AuditLog])
def read_motorcycle_history(motorcycle_id: int, db: Session = Depends(database.get_db)):
    return crud.get_audit_logs(db, entity_type="motorcycle", entity_id=motorcycle_id)
