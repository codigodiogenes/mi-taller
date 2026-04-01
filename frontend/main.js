import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess = null;

function createWindow() {
    // Determine icon path
    const isDev = process.env.NODE_ENV === 'development';
    const appPath = isDev ? __dirname : app.getAppPath();
    const iconPath = isDev
        ? path.join(__dirname, 'public/icon.png')
        : path.join(appPath, 'dist/icon.png');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true, // Hide menu bar
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
        icon: iconPath
    });

    mainWindow.setMenuBarVisibility(false); // Force hide

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // Use app.getAppPath() for reliable path resolution in production
        // const appPath = app.getAppPath(); // Already defined above
        mainWindow.loadFile(path.join(appPath, 'dist/index.html'));

        // LAUNCH BACKEND IN PRODUCTION
        // Taller_Portable/frontend/TallerMotos.exe -> Taller_Portable/backend/workshop_backend.exe
        const exePath = app.getPath('exe');
        const backendPath = path.join(path.dirname(exePath), '..', 'backend', 'workshop_backend.exe');

        console.log("Looking for backend at:", backendPath);

        if (fs.existsSync(backendPath)) {
            console.log("Starting Backend...");
            backendProcess = execFile(backendPath, (error, stdout, stderr) => {
                if (error) {
                    console.error('Backend Error:', error);
                }
            });
        } else {
            console.error("Backend not found at:", backendPath);
        }
    }

    // Intercept external links and open in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    // Kill backend
    if (backendProcess) {
        backendProcess.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
