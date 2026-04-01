import subprocess
import os
import sys

def launch():
    # Base location of THIS executable (Taller_Portable/backend/workshop_backend.exe)
    if getattr(sys, 'frozen', False):
        # We are running as a bundled exe
        current_dir = os.path.dirname(sys.executable)
    else:
        # We are running as a script
        current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Target paths relative to Taller_Portable/backend/
    # We want C:\Users\srodr\Desktop\proyectos\TALLER\moto_workshop\backend\venv\Scripts\python.exe
    # Go up 2 levels: Taller_Portable/backend -> Taller_Portable -> TALLER root
    root_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
    
    # Define actual source paths
    venv_python = os.path.join(root_dir, "moto_workshop", "backend", "venv", "Scripts", "python.exe")
    main_script = os.path.join(root_dir, "moto_workshop", "backend", "main.py")
    cwd_dir = os.path.join(root_dir, "moto_workshop", "backend")

    # Creation flag 0x08000000 (CREATE_NO_WINDOW) to hide terminal
    creation_flags = 0
    if sys.platform == "win32":
        creation_flags = 0x08000000

    # Execute backend from source silently
    if os.path.exists(venv_python):
        subprocess.Popen([venv_python, main_script], 
                        cwd=cwd_dir,
                        creationflags=creation_flags,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        stdin=subprocess.DEVNULL)

if __name__ == "__main__":
    launch()
