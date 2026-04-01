from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Dict
import models, schemas, database
import os
import shutil
import uuid

router = APIRouter(
    prefix="/settings",
    tags=["settings"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.Setting])
def read_settings(db: Session = Depends(database.get_db)):
    return db.query(models.Setting).all()

@router.post("/", response_model=schemas.Setting)
def create_or_update_setting(setting: schemas.SettingCreate, db: Session = Depends(database.get_db)):
    db_setting = db.query(models.Setting).filter(models.Setting.key == setting.key).first()
    if db_setting:
        db_setting.value = setting.value
    else:
        db_setting = models.Setting(key=setting.key, value=setting.value)
        db.add(db_setting)
    
    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.post("/upload-logo")
async def upload_settings_logo(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    # Create unique filename
    extension = os.path.splitext(file.filename)[1]
    filename = f"logo_{uuid.uuid4()}{extension}"
    
    # Save file to the correct portable logos directory
    logos_dir = database.get_logos_path()
    
    # Ensure directory exists
    os.makedirs(logos_dir, exist_ok=True)
    
    full_path = os.path.join(logos_dir, filename)
    
    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # The URL will be served from /logos mount point
    url = f"/logos/{filename}"
    
    # Update logo_url in settings
    db_setting = db.query(models.Setting).filter(models.Setting.key == "logo_url").first()
    if db_setting:
        db_setting.value = url
    else:
        db_setting = models.Setting(key="logo_url", value=url)
        db.add(db_setting)
    
    db.commit()
    return {"url": url}
@router.post("/backup")
def create_backup():
    import backup_utils
    success, message = backup_utils.perform_backup()
    if not success:
        raise HTTPException(status_code=500, detail=message)
    return {"status": "success", "message": message}

@router.post("/restore-backup")
async def restore_backup(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    # Check extension
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="El archivo debe ser un .zip")
        
    import backup_utils
    import tempfile
    
    # Save uploaded file to temp
    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        tmp_path = tmp_file.name
        
    try:
        success, message = backup_utils.restore_backup(tmp_path)
        if not success:
            raise HTTPException(status_code=500, detail=message)
        return {"status": "success", "message": message}
    finally:
        # Cleanup temp zip
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except:
                pass
