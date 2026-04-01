"""
Modelos de la Base de Datos (SQLAlchemy).
Define la estructura de las tablas en la base de datos relacional (SQLite/PostgreSQL):
columnas, tipos de datos y relaciones entre ellas (ej. un cliente tiene múltiples motos).
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    status = Column(String, default="activa") # activa, inactiva

    motorcycles = relationship("Motorcycle", back_populates="owner")
    repairs = relationship("Repair", back_populates="client")

class Motorcycle(Base):
    __tablename__ = "motorcycles"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    brand = Column(String)
    model = Column(String)
    plate = Column(String, unique=True, index=True)
    year = Column(Integer, nullable=True)
    color = Column(String, nullable=True)
    vin = Column(String, nullable=True)
    current_km = Column(Integer, default=0)
    specifications = Column(Text, nullable=True)
    status = Column(String, default="activa")  # activa, vendida, inactiva
    photos = Column(Text, nullable=True)  # JSON string con URLs de fotos
    documents = Column(Text, nullable=True)  # JSON string con URLs de documentos

    owner = relationship("Client", back_populates="motorcycles")
    repairs = relationship("Repair", back_populates="motorcycle")

class Repair(Base):
    __tablename__ = "repairs"

    id = Column(Integer, primary_key=True, index=True)
    motorcycle_id = Column(Integer, ForeignKey("motorcycles.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    entry_date = Column(DateTime, default=datetime.utcnow)
    description = Column(Text)
    status = Column(String, default="pendiente") # pendiente, terminado, entregado
    total_cost = Column(Float, default=0.0)
    paid = Column(Boolean, default=False)
    entry_km = Column(Integer, nullable=True)

    motorcycle = relationship("Motorcycle", back_populates="repairs")
    client = relationship("Client", back_populates="repairs")
    items = relationship("RepairItem", back_populates="repair", cascade="all, delete-orphan")

class RepairItem(Base):
    __tablename__ = "repair_items"

    id = Column(Integer, primary_key=True, index=True)
    repair_id = Column(Integer, ForeignKey("repairs.id"))
    description = Column(String)
    cost = Column(Float, default=0.0)
    quantity = Column(Integer, default=1)
    stock_item_id = Column(Integer, ForeignKey("stock.id"), nullable=True)

    repair = relationship("Repair", back_populates="items")

class Setting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)

class StockItem(Base):
    __tablename__ = "stock"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    quantity = Column(Integer, default=0)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String) # motorcycle, client, repair, etc.
    entity_id = Column(Integer)
    action = Column(String) # update, create, delete, status_change
    description = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    data = Column(Text, nullable=True) # JSON string with before/after state

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    role = Column(String, default="viewer") # admin, mechanic, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
