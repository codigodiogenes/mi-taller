import os
import shutil
import tempfile
import database

def perform_backup():
    try:
        portable_root = database.get_portable_base()
        backup_folder = os.path.join(portable_root, "copias_de_seguridad")
        
        # Ensure backup directory exists
        if not os.path.exists(backup_folder):
            os.makedirs(backup_folder)
            
        # Define zip path
        zip_name = "COPIA_SEGURIDAD_TALLER" # shutil adds .zip
        zip_path_no_ext = os.path.join(backup_folder, zip_name)
        final_zip_path = zip_path_no_ext + ".zip"
        
        # Delete old backup if exists to keep only one
        if os.path.exists(final_zip_path):
            os.remove(final_zip_path)
        
        # Zip necessary folders to avoid recursion
        with tempfile.TemporaryDirectory() as temp_dir:
            items_to_backup = [
                "backend", "frontend", "imagenes", "documentos", 
                "logos", "workshop.db", "Lanzador.bat", "INSTRUCCIONES.txt"
            ]
            
            for item in items_to_backup:
                src = os.path.join(portable_root, item)
                if os.path.exists(src):
                    dst = os.path.join(temp_dir, item)
                    if os.path.isdir(src):
                        # Use a custom copy function to handle busy files like .db
                        try:
                            shutil.copytree(src, dst)
                        except Exception as e:
                            print(f"Warning skipping busy folder/file: {src} - {e}")
                    else:
                        try:
                            shutil.copy2(src, dst)
                        except Exception as e:
                            print(f"Warning skipping busy file: {src} - {e}")
            
            # Now zip the temp directory
            shutil.make_archive(zip_path_no_ext, 'zip', temp_dir)

        return True, "Copia de seguridad creada correctamente"
    except Exception as e:
        return False, str(e)

def restore_backup(zip_file_path):
    try:
        portable_root = database.get_portable_base()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Unzip the uploaded file
            shutil.unpack_archive(zip_file_path, temp_dir, 'zip')
            
            # The zip structure might be flat or contain the folders directly
            # Based on how we zip (shutil.make_archive on temp_dir containing items), it should be flat at root of zip
            
            # 1. Restore Database
            db_source = os.path.join(temp_dir, "workshop.db")
            if os.path.exists(db_source):
                db_dest = os.path.join(portable_root, "workshop.db")
                
                # INTENTAR LIBERAR EL ARCHIVO DB
                # Cerrar conexiones de SQLAlchemy
                database.engine.dispose()
                import gc
                gc.collect() # Forzar recolección de basura para cerrar handles sueltos
                
                # Backup current db just in case
                if os.path.exists(db_dest):
                    try:
                        shutil.copy2(db_dest, db_dest + ".pre_restore_backup")
                    except:
                        pass # If we can't backup, proceed anyway?
                
                # Try to replace
                try:
                    shutil.copy2(db_source, db_dest)
                except OSError as e: # Catch broader OSError for WinError 1224
                    # If locked, try to rename current and place new
                    try:
                        print(f"Warning: Direct overwrite failed ({e}). Trying rename strategy...")
                        timestamp =  str(int(os.path.getmtime(db_dest)))
                        os.rename(db_dest, db_dest + f".old.{timestamp}")
                        shutil.copy2(db_source, db_dest)
                    except Exception as rename_error:
                        return False, f"La base de datos está bloqueada por el sistema. Cierre el programa y restaure manualmente. Error: {e} | Rename: {rename_error}"
            
            # 2. Restore Folders (imagenes, documentos, logos)
            folders_to_restore = ["imagenes", "documentos", "logos"]
            for folder in folders_to_restore:
                src_folder = os.path.join(temp_dir, folder)
                if os.path.exists(src_folder):
                    dest_folder = os.path.join(portable_root, folder)
                    
                    # Create dest if not exists
                    if not os.path.exists(dest_folder):
                        os.makedirs(dest_folder)
                    
                    # Copy contents
                    # We utilize copytree with dirs_exist_ok=True (Python 3.8+) to merge/overwrite
                    shutil.copytree(src_folder, dest_folder, dirs_exist_ok=True)
                    
        return True, "Copia de seguridad restaurada correctamente"
    except Exception as e:
        return False, f"Error al restaurar: {str(e)}"
