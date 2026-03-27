const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');

let overlayProc = null;
let win = null;

function isOverlayRunning() {
    return new Promise((resolve) => {
        exec('tasklist /FI "IMAGENAME eq lspd_overlay.exe" /NH', (err, stdout) => {
            resolve(stdout.toLowerCase().includes('lspd_overlay.exe'));
        });
    });
}

async function startOverlay(manual = false) {
    const isDev = !app.isPackaged;
    
    // W trybie produkcyjnym szukamy ZAWSZE w tym samym folderze co EXE (używając PORTABLE_EXECUTABLE_DIR)
    const baseDir = isDev 
        ? app.getAppPath() 
        : (process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath));
    
    const overlayPath = path.join(baseDir, 'lspd_overlay.exe');

    if (!require('fs').existsSync(overlayPath)) {
        console.warn(`Nie znaleziono Overlay'a w: ${overlayPath}`);
        if (manual) dialog.showErrorBox('Błąd', `Nie znaleziono pliku lspd_overlay.exe obok Kartoteki.`);
        return;
    }

    const running = await isOverlayRunning();
    if (running && !manual) {
        console.log("Overlay już działa, pomijam start...");
        return;
    }

    overlayProc = spawn(overlayPath, [], { 
        detached: true, 
        stdio: 'ignore',
        cwd: baseDir
    });
    overlayProc.unref(); 
    console.log("Uruchomiono Overlay LSPD...");
}

function stopOverlay() {
    exec('taskkill /F /IM lspd_overlay.exe', (err) => {
        console.log("Zatrzymano procesy Overlay LSPD");
    });
}

async function checkStatusAndSend() {
    if (!win || win.isDestroyed()) return;
    const running = await isOverlayRunning();
    win.webContents.send('overlay-status', running ? 'ONLINE' : 'OFFLINE');
}

function createWindow() {
    win = new BrowserWindow({
        width: 1400, height: 900,
        icon: path.join(app.getAppPath(), process.env.VITE_DEV_SERVER_URL ? 'public/icon.png' : 'dist/icon.png'),
        backgroundColor: '#0c0e14', autoHideMenuBar: true, resizable: true,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    win.maximize();
    
    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        win.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
    }
    
    win.webContents.on('did-finish-load', () => {
        startOverlay();
        setInterval(checkStatusAndSend, 5000);
        checkStatusAndSend();
    });
}

ipcMain.on('start-overlay', () => startOverlay(true));
ipcMain.on('stop-overlay', () => stopOverlay());

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});
