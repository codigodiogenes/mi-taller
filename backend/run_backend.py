import uvicorn
import main
import os
import sys

# Crucial for PyInstaller to find the app
from main import app

if __name__ == "__main__":
    # Get port from env or default to 8000
    port = int(os.getenv("PORT", 8000))
    # Run uvicorn
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
