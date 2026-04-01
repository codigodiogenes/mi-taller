from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud, schemas, database

router = APIRouter(
    prefix="/clients",
    tags=["clients"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Client)
def create_client(client: schemas.ClientCreate, db: Session = Depends(database.get_db)):
    return crud.create_client(db=db, client=client)

@router.get("/", response_model=List[schemas.Client])
def read_clients(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    clients = crud.get_clients(db, skip=skip, limit=limit)
    return clients

@router.get("/{client_id}", response_model=schemas.Client)
def read_client(client_id: int, db: Session = Depends(database.get_db)):
    db_client = crud.get_client(db, client_id=client_id)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client

@router.put("/{client_id}", response_model=schemas.Client)
def update_client(client_id: int, client: schemas.ClientUpdate, db: Session = Depends(database.get_db)):
    old_client = crud.get_client(db, client_id)
    if not old_client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    db_client = crud.update_client(db, client_id, client)
    
    # Log changes
    if client.status and client.status != old_client.status:
        crud.create_audit_log(
            db, "client", client_id, "status_change",
            f"Estado del cliente: {old_client.status} -> {client.status}"
        )
    
    return db_client

@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(database.get_db)):
    db_client = crud.get_client(db, client_id)
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Soft delete instead of hard delete
    update_data = schemas.ClientUpdate(status="inactiva")
    crud.update_client(db, client_id, update_data)
    
    crud.create_audit_log(
        db, "client", client_id, "deactivation",
        f"Cliente dado de baja (marcado como inactivo)"
    )
    
    return {"ok": True, "message": "Client deactivated"}
