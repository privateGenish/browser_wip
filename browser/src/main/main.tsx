import { app, ipcMain, BrowserWindow } from 'electron';
import { CHANNELS } from '../shared/ipcChannels';
import { createWindow } from './windowFactory';

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;

// Handle second instance
app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
});

// Placeholder for tab management logic
interface Tab {
  id: number;
  url: string;
  // Add other relevant properties
}

let tabs: Tab[] = [];
let currentTabId: number | null = null;

app.whenReady().then(() => {
  // Create the main window using the factory
  mainWindow = createWindow();

  // Handle 'tabs-create' event
  ipcMain.on(CHANNELS.TABS_CREATE, () => {
    const newTab: Tab = {
      id: Date.now(),
      url: 'https://example.com',
    };
    tabs.push(newTab);
    currentTabId = newTab.id;
    sendTabsUpdated();
  });

  // Handle 'tabs-close' event
  ipcMain.on(CHANNELS.TABS_CLOSE, (_event, id: number) => {
    tabs = tabs.filter(tab => tab.id !== id);
    if (currentTabId === id) {
      currentTabId = tabs.length ? tabs[0].id : null;
    }
    sendTabsUpdated();
  });

  // Handle 'tabs-switch' event
  ipcMain.on(CHANNELS.TABS_SWITCH, (_event, id: number) => {
    if (tabs.some(tab => tab.id === id)) {
      currentTabId = id;
      sendTabsUpdated();
    }
  });

  // Handle 'tabs-navigate' event
  ipcMain.on(CHANNELS.TABS_NAVIGATE, (_event, id: number, url: string) => {
    const tab = tabs.find(tab => tab.id === id);
    if (tab) {
      tab.url = url;
      sendTabsUpdated();
    }
  });

  // Handle 'tabs-back' event
  ipcMain.on(CHANNELS.TABS_GO_BACK, () => {
    // Implement navigation logic as needed
  });

  // Handle 'tabs-forward' event
  ipcMain.on(CHANNELS.TABS_GO_FORWARD, () => {
    // Implement navigation logic as needed
  });

  // Handle 'tabs-reload' event
  ipcMain.on(CHANNELS.TABS_RELOAD, () => {
    // Implement reload logic as needed
  });
});

// Function to send updated tabs information to renderer
function sendTabsUpdated() {
  if (mainWindow) {
    mainWindow.webContents.send(CHANNELS.TABS_UPDATED, {
      list: tabs,
      currentId: currentTabId,
    });
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
