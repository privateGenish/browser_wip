import { ipcMain } from 'electron';
import { TabManager } from './TabManager';

const tabManager = new TabManager();
tabManager.attachWindow(mainWindow);

tabManager.on('tabs-updated', (_, data) => {
  mainWindow.webContents.send('tabs-updated', data);
});

ipcMain.on('tabs-create', () => {
  tabManager.createTab('https://example.com');
});
ipcMain.on('tabs-close', (_e, id) => tabManager.closeTab(id));
ipcMain.on('tabs-switch', (_e, id) => tabManager.switchTab(id));
ipcMain.on('tabs-navigate', (_e, id, url) => tabManager.navigate(id, url));
ipcMain.on('tabs-back', (_e, id) => tabManager.goBack(id));
ipcMain.on('tabs-forward', (_e, id) => tabManager.goForward(id));
ipcMain.on('tabs-reload', (_e, id) => tabManager.reload(id));
