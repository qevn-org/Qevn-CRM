const { app, BrowserWindow, session } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: 'QEVN CRM Softphone Station',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  // Automatically grant Microphone permission for WebRTC softphone calling
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media' || permission === 'audioCapture') {
      return callback(true);
    }
    callback(true);
  });

  // Load production deployment or custom URL
  const targetUrl = process.env.ELECTRON_START_URL || 'https://crm.qevn.in/employee/dialer';
  console.log('[ELECTRON MAIN] Loading Softphone URL:', targetUrl);
  mainWindow.loadURL(targetUrl);

  // Hide default menu bar for clean app appearance
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
