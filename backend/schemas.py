"""
Esquemas de Pydantic.
Define cómo debe lucir la información (JSON) que entra y sale de la API.
Valida tipos de datos, campos requeridos y crea los modelos de respuesta.
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- Forward declarations for nested models (no recursion) ---
class ClientShort(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    class Config:
        from_attributes = True

class MotorcycleShort(BaseModel):
    id: int
    brand: str
    model: str
    plate: str
    client_id: int
    owner: Optional[ClientShort] = None
    class Config:
        from_attributes = True

class RepairShort(BaseModel):
    id: int
    description: str
    status: str
    total_cost: float
    paid: bool
    entry_date: datetime
    class Config:
        from_attributes = True

# --- Clients ---
class ClientBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = "activa"

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None

class Client(ClientBase):
    id: int
    motorcycles: List[MotorcycleShort] = [] # Use Short to avoid recursion

    class Config:
        from_attributes = True

# --- Motorcycles ---
class MotorcycleBase(BaseModel):
    brand: str
    model: str
    plate: str
    year: Optional[int] = None
    color: Optional[str] = None
    vin: Optional[str] = None
    current_km: Optional[int] = 0
    specifications: Optional[str] = None
    status: Optional[str] = "activa"
    photos: Optional[str] = None
    documents: Optional[str] = None
    client_id: int

class MotorcycleCreate(MotorcycleBase):
    pass

class MotorcycleUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    plate: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    vin: Optional[str] = None
    current_km: Optional[int] = None
    specifications: Optional[str] = None
    status: Optional[str] = None
    photos: Optional[str] = None
    documents: Optional[str] = None
    client_id: Optional[int] = None

class Motorcycle(MotorcycleBase):
    id: int
    repairs: List[RepairShort] = [] # Use Short to avoid recursion
    owner: Optional[ClientShort] = None
    
    class Config:
        from_attributes = True

# --- Repairs ---
class RepairItemBase(BaseModel):
    description: str
    cost: float
    quantity: int = 1

class RepairItemCreate(RepairItemBase):
    stock_item_id: Optional[int] = None
    decrement_stock: bool = False

class RepairItemUpdate(BaseModel):
    description: Optional[str] = None
    cost: Optional[float] = None
    quantity: Optional[int] = None

class RepairItem(RepairItemBase):
    id: int
    repair_id: int
    stock_item_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class RepairBase(BaseModel):
    motorcycle_id: Optional[int] = None
    client_id: Optional[int] = None
    description: str
    status: str = "pendiente"
    paid: bool = False
    entry_km: Optional[int] = None

class RepairCreate(RepairBase):
    items: List[RepairItemCreate] = []

class RepairUpdate(BaseModel):
    motorcycle_id: Optional[int] = None
    client_id: Optional[int] = None
    description: Optional[str] = None
    status: Optional[str] = None
    paid: Optional[bool] = None
    total_cost: Optional[float] = None
    entry_km: Optional[int] = None

class Repair(RepairBase):
    id: int
    entry_date: datetime
    total_cost: float
    items: List[RepairItem] = []
    motorcycle: Optional[MotorcycleShort] = None
    client: Optional[ClientShort] = None

    class Config:
        from_attributes = True

# --- Settings ---
class SettingBase(BaseModel):
    key: str
    value: str

class SettingCreate(SettingBase):
    pass

class Setting(SettingBase):
    class Config:
        from_attributes = True

# --- Stock ---
class StockItemBase(BaseModel):
    name: str
    quantity: int

class StockItemCreate(StockItemBase):
    pass

class StockItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None

class StockItem(StockItemBase):
    id: int

    class Config:
        from_attributes = True

# --- Audit Logs ---
class AuditLogBase(BaseModel):
    entity_type: str
    entity_id: int
    action: str
    description: str
    data: Optional[str] = None

class AuditLog(AuditLogBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class EmailRequest(BaseModel):
    emails: List[str]

# --- Users ---
class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    role: str = "viewer"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None
