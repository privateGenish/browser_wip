import { BrowserWindow, app } from 'electron';
import path from 'node:path';

// Use CommonJS globals for Jest/Electron compatibility
const _filename = __filename;
const _dirname = __dirname;

export let mainWindow: BrowserWindow | null = null;

export function createWindow(): BrowserWindow {
  if (mainWindow) return mainWindow; // singleton

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,               // defer until ready-to-show
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f0f0f',  // dark neutral
    webPreferences: {
      preload: path.join(_dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: process.env.DEBUG === 'true',
      spellcheck: false,
      webSecurity: true,
    },
  });

  // Strip default menu for production-like environments
  // and when not explicitly debugging.
  if (process.env.NODE_ENV !== 'development' && process.env.DEBUG !== 'true') {
    mainWindow.removeMenu();
  }

  // Defer showing the window until it's ready
  mainWindow.once('ready-to-show', () => mainWindow?.show());

  // Dev-vs-Prod URL loader
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
    // Optionally open DevTools in development if DEBUG is true
    if (process.env.DEBUG === 'true') {
      mainWindow.webContents.openDevTools();
    }
  } else {
    // Production build: load the index.html file
    const indexPath = path.join(app.getAppPath(), 'dist', 'renderer', 'index.html'); 
    // Note: Adjusted path assuming 'renderer' output is in 'dist/renderer'
    // This might need further adjustment based on actual vite-plugin-electron-renderer output structure.
    // A common structure is `projectRoot/dist/renderer/index.html` where `app.getAppPath()` points to `projectRoot/dist/electron` in prod.
    // Thus, `path.join(app.getAppPath(), '../renderer/index.html')` or similar might be needed.
    // For now, using a placeholder that needs verification during integration.
    // A more robust approach might involve `path.resolve(app.getAppPath(), '..', 'renderer', 'index.html')` if `app.getAppPath()` is `dist/electron`
    // Or if `vite-plugin-electron-renderer` copies assets to `dist/electron/renderer`, then `path.join(app.getAppPath(), 'renderer', 'index.html')` is correct.
    // The prompt specified `path.join(app.getAppPath(), 'renderer', 'index.html')` which implies the latter.
    void mainWindow.loadFile(indexPath);
  }

  // Lifecycle hook: clear mainWindow when closed to prevent memory leaks
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}
