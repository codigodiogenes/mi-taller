from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import crud, schemas

router = APIRouter(
    prefix="/stock",
    tags=["stock"],
)

@router.get("/", response_model=List[schemas.StockItem])
def read_stock_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = crud.get_stock_items(db, skip=skip, limit=limit)
    return items

@router.post("/", response_model=schemas.StockItem)
def create_stock_item(item: schemas.StockItemCreate, db: Session = Depends(get_db)):
    return crud.create_stock_item(db=db, item=item)

@router.put("/{item_id}", response_model=schemas.StockItem)
def update_stock_item(item_id: int, item: schemas.StockItemUpdate, db: Session = Depends(get_db)):
    db_item = crud.update_stock_item(db, item_id=item_id, item=item)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@router.delete("/{item_id}", response_model=schemas.StockItem)
def delete_stock_item(item_id: int, db: Session = Depends(get_db)):
    db_item = crud.delete_stock_item(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item
