import { BrowserWindow, app, Menu, shell } from 'electron';
import path from 'node:path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM-native path resolution
const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

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
      spellcheck: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Remove default menu in production
  if (process.env.NODE_ENV !== 'development' && process.env.DEBUG !== 'true') {
    Menu.setApplicationMenu(null);
  }

  // Defer showing the window until it's ready
  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) return;
    
    mainWindow.show();
    mainWindow.focus();
    
    // Only open DevTools in development
    if (!app.isPackaged) {
      // mainWindow.webContents.openDevTools();
    }
  });

  // Dev-vs-Prod URL loader
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  const loadApp = async () => {
    if (!mainWindow) return;
    
    try {
      if (devServerUrl) {
        await mainWindow.loadURL(devServerUrl);
      } else {
        // Production build: load the index.html file
        const indexPath = path.join(app.getAppPath(), 'dist', 'renderer', 'index.html');
        await mainWindow.loadFile(indexPath);
      }
    } catch (error) {
      console.error('Failed to load app:', error);
    }
  };

  void loadApp();

  // Secure popup handling: block all popups except external http(s) URLs
  const handleWindowOpen = (details: { url: string }) => {
    if (details.url.startsWith('http')) {
      shell.openExternal(details.url).catch(console.error);
    }
    return { action: 'deny' as const };
  };
  
  // Set up window open handler if available
  if (mainWindow?.webContents?.setWindowOpenHandler) {
    mainWindow.webContents.setWindowOpenHandler(handleWindowOpen);
  }

  // Lifecycle hook: clear mainWindow when closed to prevent memory leaks
  const cleanup = () => {
    if (!mainWindow) return;
    
    mainWindow.off('closed', cleanup);
    // webContents and the window itself are likely already destroyed or in the process.
    // Explicitly calling destroy() or accessing webContents here can lead to errors.
    // If specific webContents listeners need removal, it's safer to do it in the 'close' event.
    
    mainWindow = null;
  };
  
  mainWindow.on('closed', cleanup);

  return mainWindow;
}
