const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const isDev = !app.isPackaged;

// Configurar ruta de datos de usuario para persistencia
app.setPath('userData', path.join(app.getPath('appData'), 'DarkWhisper'));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      partition: 'persist:darkwhisper', // Partición persistente
    },
    frame: true,
    titleBarStyle: 'default',
    autoHideMenuBar: true,
  });

  // Cargar la app
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // En producción, cargar desde el archivo local
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist', 'index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  // Mostrar cuando esté lista para evitar parpadeo
  win.once('ready-to-show', () => {
    win.show();
  });

  // Debug: mostrar errores de carga
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
