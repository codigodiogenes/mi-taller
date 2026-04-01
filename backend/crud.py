"""
Lógica de Base de Datos (CRUD - Create, Read, Update, Delete).
Contiene todas las funciones que interactúan directamente con SQLAlchemy
para insertar, consultar y modificar los registros (clientes, motos, reparaciones, etc.).
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
import models, schemas
import bcrypt

def get_password_hash(password):
    # Generar salt y hashear el password
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password, hashed_password):
    # Verificar el password plano contra el hash
    pwd_bytes = plain_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hash_bytes)

# --- Clients ---
def get_client(db: Session, client_id: int):
    return db.query(models.Client).filter(models.Client.id == client_id).first()

def get_clients(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Client).offset(skip).limit(limit).all()

def create_client(db: Session, client: schemas.ClientCreate):
    db_client = models.Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

def update_client(db: Session, client_id: int, client_update: schemas.ClientUpdate):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if db_client:
        update_data = client_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_client, key, value)
        db.commit()
        db.refresh(db_client)
    return db_client

def delete_client(db: Session, client_id: int):
    client = get_client(db, client_id)
    if client:
        db.delete(client)
        db.commit()
    return client

def get_repairs_by_client(db: Session, client_id: int):
    # Get repairs directly linked to client OR repairs linked to motorcycles of that client
    from sqlalchemy import or_
    return db.query(models.Repair).outerjoin(models.Motorcycle).filter(
        or_(
            models.Repair.client_id == client_id,
            models.Motorcycle.client_id == client_id
        )
    ).order_by(desc(models.Repair.entry_date)).all()

def get_repairs_by_motorcycle(db: Session, motorcycle_id: int):
    return db.query(models.Repair).filter(models.Repair.motorcycle_id == motorcycle_id).order_by(desc(models.Repair.entry_date)).all()

# --- Motorcycles ---
def get_motorcycles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Motorcycle).offset(skip).limit(limit).all()

def create_motorcycle(db: Session, motorcycle: schemas.MotorcycleCreate):
    db_moto = models.Motorcycle(**motorcycle.model_dump())
    db.add(db_moto)
    db.commit()
    db.refresh(db_moto)
    return db_moto

def get_motorcycles_by_client(db: Session, client_id: int):
    return db.query(models.Motorcycle).filter(models.Motorcycle.client_id == client_id).all()

def get_motorcycle(db: Session, motorcycle_id: int):
    return db.query(models.Motorcycle).filter(models.Motorcycle.id == motorcycle_id).first()

def update_motorcycle(db: Session, motorcycle_id: int, motorcycle_update: schemas.MotorcycleUpdate):
    db_motorcycle = get_motorcycle(db, motorcycle_id)
    if not db_motorcycle:
        return None
    
    update_data = motorcycle_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_motorcycle, key, value)
    
    db.add(db_motorcycle)
    db.commit()
    db.refresh(db_motorcycle)
    return db_motorcycle


# --- Repairs ---
def create_repair(db: Session, repair: schemas.RepairCreate):
    # Extract items to create them separately
    items_data = repair.items
    db_repair = models.Repair(
        motorcycle_id=repair.motorcycle_id,
        client_id=repair.client_id,
        description=repair.description,
        status=repair.status,
        paid=repair.paid,
        entry_km=repair.entry_km
    )
    
    # Add repair to get ID
    db.add(db_repair)
    db.commit()
    db.refresh(db_repair)

    # Add items
    total_cost = 0.0
    for item in items_data:
        db_item = models.RepairItem(**item.model_dump(), repair_id=db_repair.id)
        db.add(db_item)
        total_cost += item.cost
    
    db_repair.total_cost = total_cost
    db.commit()
    db.refresh(db_repair)
    return db_repair

def get_repairs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Repair).order_by(desc(models.Repair.entry_date)).offset(skip).limit(limit).all()

def get_repair(db: Session, repair_id: int):
    from sqlalchemy.orm import joinedload
    return db.query(models.Repair).options(
        joinedload(models.Repair.motorcycle).joinedload(models.Motorcycle.owner),
        joinedload(models.Repair.client),
        joinedload(models.Repair.items)
    ).filter(models.Repair.id == repair_id).first()

def update_repair(db: Session, repair_id: int, repair_update: schemas.RepairUpdate):
    db_repair = get_repair(db, repair_id)
    if not db_repair:
        return None
    
    update_data = repair_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_repair, key, value)
    
    db.add(db_repair)
    db.commit()
    db.refresh(db_repair)
    return db_repair

def delete_repair(db: Session, repair_id: int):
    db_repair = get_repair(db, repair_id)
    if db_repair:
        db.delete(db_repair)
        db.commit()
    return db_repair

def create_repair_item(db: Session, repair_id: int, item: schemas.RepairItemCreate):
    print(f"DEBUG CREATE: Start for repair {repair_id}, item qty: {item.quantity}, stock_id: {item.stock_item_id}")
    # Create the item
    db_item = models.RepairItem(
        description=item.description,
        cost=item.cost,
        quantity=item.quantity,
        repair_id=repair_id,
        stock_item_id=item.stock_item_id if item.decrement_stock else None
    )
    db.add(db_item)

    # Update repair total cost
    db_repair = get_repair(db, repair_id)
    if db_repair:
        old_total_repair = db_repair.total_cost
        db_repair.total_cost += (item.cost * item.quantity)
        db.add(db_repair)
        print(f"DEBUG CREATE: Repair cost updated {old_total_repair} -> {db_repair.total_cost}")
    
    # Decrement stock if requested
    if item.stock_item_id and item.decrement_stock:
        db_stock_item = db.query(models.StockItem).filter(models.StockItem.id == item.stock_item_id).first()
        if db_stock_item:
            print(f"DEBUG CREATE: Decrementing stock for {db_stock_item.name}. Old: {db_stock_item.quantity}, Minus: {item.quantity}")
            db_stock_item.quantity -= item.quantity
            db.add(db_stock_item)
    
    db.commit()
    db.refresh(db_item)
    print(f"DEBUG CREATE: Commit successful. New stock: {db_stock_item.quantity if (item.stock_item_id and item.decrement_stock and 'db_stock_item' in locals()) else 'N/A'}")
    return db_item

def get_repair_item(db: Session, item_id: int):
    return db.query(models.RepairItem).filter(models.RepairItem.id == item_id).first()

def delete_repair_item(db: Session, repair_id: int, item_id: int):
    db_item = get_repair_item(db, item_id)
    if not db_item or db_item.repair_id != repair_id:
        return None
    
    total_to_remove = db_item.cost * db_item.quantity
    
    # Refund stock if it was linked
    if db_item.stock_item_id:
        db_stock_item = db.query(models.StockItem).filter(models.StockItem.id == db_item.stock_item_id).first()
        if db_stock_item:
            print(f"DEBUG DELETE: Refunding {db_item.quantity} to {db_stock_item.name}. Old: {db_stock_item.quantity}")
            db_stock_item.quantity += db_item.quantity
            db.add(db_stock_item)

    db.delete(db_item)

    # Update total cost
    db_repair = get_repair(db, repair_id)
    if db_repair:
        db_repair.total_cost -= total_to_remove
        db.add(db_repair)
    
    db.commit()
    print(f"DEBUG DELETE: Commit successful.")
    return db_item

def update_repair_item(db: Session, repair_id: int, item_id: int, item_update: schemas.RepairItemUpdate):
    db_item = get_repair_item(db, item_id)
    if not db_item or db_item.repair_id != repair_id:
        return None
    
    old_total = db_item.cost * db_item.quantity
    old_qty = db_item.quantity
    
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.add(db_item)
    
    # Adjust stock if quantity changed and it was linked
    if db_item.stock_item_id and 'quantity' in update_data:
        new_qty = db_item.quantity
        qty_diff = new_qty - old_qty
        db_stock_item = db.query(models.StockItem).filter(models.StockItem.id == db_item.stock_item_id).first()
        if db_stock_item:
            print(f"DEBUG UPDATE: Adjusting {db_stock_item.name}. Old: {db_stock_item.quantity}, Diff: {qty_diff}")
            db_stock_item.quantity -= qty_diff
            db.add(db_stock_item)

    # Update total repair cost
    new_total = db_item.cost * db_item.quantity
    diff = new_total - old_total
    db_repair = get_repair(db, repair_id)
    if db_repair:
        db_repair.total_cost += diff
        db.add(db_repair)

    db.commit()
    db.refresh(db_item)
    print("DEBUG UPDATE: Commit successful.")
    return db_item

# --- Stock ---
def get_stock_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.StockItem).offset(skip).limit(limit).all()

def create_stock_item(db: Session, item: schemas.StockItemCreate):
    db_item = models.StockItem(name=item.name, quantity=item.quantity)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_stock_item(db: Session, item_id: int, item: schemas.StockItemUpdate):
    db_item = db.query(models.StockItem).filter(models.StockItem.id == item_id).first()
    if not db_item:
        return None
    
    if item.name is not None:
        db_item.name = item.name
    if item.quantity is not None:
        db_item.quantity = item.quantity
    
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_stock_item(db: Session, item_id: int):
    db_item = db.query(models.StockItem).filter(models.StockItem.id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
    return db_item

# --- Audit Logs ---
def create_audit_log(db: Session, entity_type: str, entity_id: int, action: str, description: str, data: str = None):
    db_log = models.AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        description=description,
        data=data
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_audit_logs(db: Session, entity_type: str = None, entity_id: int = None, limit: int = 50):
    query = db.query(models.AuditLog)
    if entity_type:
        query = query.filter(models.AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(models.AuditLog.entity_id == entity_id)
    return query.order_by(desc(models.AuditLog.timestamp)).limit(limit).all()

# --- Users ---
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

from sqlalchemy import func

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(func.lower(models.User.username) == username.lower()).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data:
        password = update_data.pop("password")
        db_user.hashed_password = get_password_hash(password)
        
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user
