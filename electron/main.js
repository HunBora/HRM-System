const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

let mainWindow = null;

// Determine if we should connect to the hosted production URL or local development server
const PRODUCTION_URL = 'https://hrm-system-mrbora.vercel.app';
const DEV_URL = 'http://localhost:3000';
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: 'HRM Enterprise System',
    icon: path.join(__dirname, '../public/app-icon.ico'),
    backgroundColor: '#0f172a',
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Custom Application Menu
  const menuTemplate = [
    {
      label: 'កម្មវិធី (App)',
      submenu: [
        { label: 'Reload (ផ្ទុកឡើងវិញ)', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { label: 'ចាកចេញ (Exit)', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'ទិដ្ឋភាព (View)',
      submenu: [
        { label: 'ពង្រីក (Zoom In)', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'បង្រួម (Zoom Out)', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'កម្រិតដើម (Reset Zoom)', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'ពេញអេក្រង់ (Full Screen)', accelerator: 'F11', role: 'togglefullscreen' },
        { label: 'Developer Tools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
      ],
    },
    {
      label: 'ជំនួយ (Help)',
      submenu: [
        {
          label: 'អំពីប្រព័ន្ធ HRM Enterprise',
          click: async () => {
            await shell.openExternal('https://hrm-system-mrbora.vercel.app/dashboard/about');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Load URL
  const targetUrl = isDev ? DEV_URL : (process.env.APP_URL || PRODUCTION_URL);
  mainWindow.loadURL(targetUrl);

  // Open external links in default browser instead of the electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (!url.includes('hrm-system-mrbora.vercel.app') && !url.includes('localhost:3000')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
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
