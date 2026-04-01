import models, schemas, crud
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup test DB
engine = create_engine("sqlite:///:memory:")
SessionLocal = sessionmaker(bind=engine)
models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

def test_stock_flow():
    print("--- Testing Stock Flow ---")
    # 1. Create stock item with 3 units
    stock_item = models.StockItem(name="Aceite", quantity=3)
    db.add(stock_item)
    db.commit()
    db.refresh(stock_item)
    print(f"Initial Stock: {stock_item.quantity}")

    # 2. Create repair
    repair = models.Repair(description="Reparacion Test")
    db.add(repair)
    db.commit()
    db.refresh(repair)

    # 3. Add 5 units to repair (Expect -2)
    print("\nAdding 5 units to repair...")
    item_in = schemas.RepairItemCreate(
        description="Aceite",
        cost=10.0,
        quantity=5,
        stock_item_id=stock_item.id,
        decrement_stock=True
    )
    db_item = crud.create_repair_item(db, repair.id, item_in)
    db.refresh(stock_item)
    print(f"Stock after adding 5: {stock_item.quantity} (Expected -2)")

    # 4. Delete item (Expect back to 3)
    print("\nDeleting repair item...")
    crud.delete_repair_item(db, repair.id, db_item.id)
    db.refresh(stock_item)
    print(f"Stock after deletion: {stock_item.quantity} (Expected 3)")

    # 5. Add 5 units again
    print("\nAdding 5 units again...")
    db_item = crud.create_repair_item(db, repair.id, item_in)
    db.refresh(stock_item)
    print(f"Stock: {stock_item.quantity}")

    # 6. Edit to 2 units (Expect stock -2 + (5-2) = 1)
    # Wait, -2 + 3 = 1.
    print("\nEditing from 5 units to 2 units...")
    update = schemas.RepairItemUpdate(quantity=2)
    crud.update_repair_item(db, repair.id, db_item.id, update)
    db.refresh(stock_item)
    print(f"Stock after editing to 2: {stock_item.quantity} (Expected 1)")
    
    # 7. Edit to 10 units (Expect stock 1 - (10-2) = -7)
    print("\nEditing from 2 units to 10 units...")
    update = schemas.RepairItemUpdate(quantity=10)
    crud.update_repair_item(db, repair.id, db_item.id, update)
    db.refresh(stock_item)
    print(f"Stock after editing to 10: {stock_item.quantity} (Expected -7)")

if __name__ == "__main__":
    test_stock_flow()
