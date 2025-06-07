import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { TabManager } from './TabManager';

let mainWindow: BrowserWindow | null = null;
const tabManager = new TabManager();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  tabManager.attachWindow(mainWindow);

  tabManager.on('tabs-updated', (_, data) => {
    mainWindow?.webContents.send('tabs-updated', data);
  });

  ipcMain.on('tabs-create', () => tabManager.createTab('https://example.com'));
  ipcMain.on('tabs-close', (_e, id) => tabManager.closeTab(id));
  ipcMain.on('tabs-switch', (_e, id) => tabManager.switchTab(id));
  ipcMain.on('tabs-navigate', (_e, id, url) => tabManager.navigate(id, url));
  ipcMain.on('tabs-back', (_e, id) => tabManager.goBack(id));
  ipcMain.on('tabs-forward', (_e, id) => tabManager.goForward(id));
  ipcMain.on('tabs-reload', (_e, id) => tabManager.reload(id));

  mainWindow.on('closed', () => (mainWindow = null));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
