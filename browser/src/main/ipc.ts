import { ipcMain, webContents, IpcMainEvent } from 'electron';
import { CHANNELS } from '../shared/ipc-channels';
import { TabManager } from './TabManager';
import type { BrowserWindow } from 'electron';

let tabManagerInstance: TabManager;

/**
 * Broadcasts the current tab state to all renderer processes
 */
/**
 * Broadcasts the current tab state to all renderer processes
 * @returns {boolean} True if the broadcast was successful, false otherwise
 */
export function broadcastTabs(): boolean {
  if (!tabManagerInstance) {
      console.error('TabManager not initialized in broadcastTabs. Call initIPC first.');
    return false;
  }
  const snapshot = tabManagerInstance.getSnapshot();
  const allWebContents = webContents.getAllWebContents();
  
  if (allWebContents.length === 0) {
    return false;
  }

  let success = true;
  allWebContents.forEach(contents => {
    try {
      if (!contents.isDestroyed()) {
        contents.send(CHANNELS.TABS_UPDATED, snapshot);
      }
    } catch (error) {
      console.error('Error sending tab update to renderer:', error);
      success = false;
    }
  });
  
  return success;
}

/**
 * Validates if a string is a non-empty string
 */
function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Initializes all IPC event listeners for tab management
 */
export function initIPC(mainWindow: BrowserWindow): void {
  tabManagerInstance = new TabManager(mainWindow);
  // TABS_CREATE: Create a new tab
  ipcMain.on(CHANNELS.TABS_CREATE, (event: IpcMainEvent, options: { url?: string; active?: boolean } = {}) => {
    try {
      const { url, active = true } = options || {};
      if (url && !isValidString(url)) {
        console.warn('Invalid URL provided for tab creation');
        return;
      }
      
      tabManagerInstance.createTab(url, active); // Assuming createTab is the method name in TabManager
      broadcastTabs();
    } catch (error) {
      console.error('Error creating tab:', error);
    }
  });

  // TABS_CLOSE: Close a tab by ID
  ipcMain.on(CHANNELS.TABS_CLOSE, (event: IpcMainEvent, { tabId }: { tabId: string }) => {
    try {
      if (!isValidString(tabId)) {
        console.warn('Invalid tab ID provided for closing tab');
        return;
      }
      
      tabManagerInstance.closeTab(parseInt(tabId, 10));
      broadcastTabs();
    } catch (error) {
      console.error('Error closing tab:', error);
    }
  });

  // TABS_SWITCH: Switch to a different tab
  ipcMain.on(CHANNELS.TABS_SWITCH, (event: IpcMainEvent, { tabId }: { tabId: string }) => {
    try {
      if (!isValidString(tabId)) {
        console.warn('Invalid tab ID provided for switching tabs');
        return;
      }
      
      tabManagerInstance.switchTab(parseInt(tabId, 10));
      broadcastTabs();
    } catch (error) {
      console.error('Error switching tabs:', error);
    }
  });

  // TABS_NAVIGATE: Navigate a tab to a new URL
  ipcMain.on(
    CHANNELS.TABS_NAVIGATE,
    (event: IpcMainEvent, { tabId, url }: { tabId: string; url: string }) => {
      try {
        if (!isValidString(tabId) || !isValidString(url)) {
          console.warn('Invalid tab ID or URL provided for navigation');
          return;
        }
        
        tabManagerInstance.navigate(parseInt(tabId, 10), url);
        broadcastTabs();
      } catch (error) {
        console.error('Error navigating tab:', error);
      }
    }
  );

  // TABS_BACK: Navigate back in tab history
  ipcMain.on(CHANNELS.TABS_BACK, (event: IpcMainEvent, { tabId }: { tabId: string }) => {
    try {
      if (!isValidString(tabId)) {
        console.warn('Invalid tab ID provided for back navigation');
        return;
      }
      
      tabManagerInstance.goBack(parseInt(tabId, 10));
      broadcastTabs();
    } catch (error) {
      console.error('Error navigating back:', error);
    }
  });

  // TABS_FORWARD: Navigate forward in tab history
  ipcMain.on(CHANNELS.TABS_FORWARD, (event: IpcMainEvent, { tabId }: { tabId: string }) => {
    try {
      if (!isValidString(tabId)) {
        console.warn('Invalid tab ID provided for forward navigation');
        return;
      }
      
      tabManagerInstance.goForward(parseInt(tabId, 10));
      broadcastTabs();
    } catch (error) {
      console.error('Error navigating forward:', error);
    }
  });

  // TABS_RELOAD: Reload the current tab
  ipcMain.on(
    CHANNELS.TABS_RELOAD,
    (event: IpcMainEvent, { tabId }: { tabId: string; bypassCache?: boolean }) => {
      try {
        if (!isValidString(tabId)) {
          console.warn('Invalid tab ID provided for reload');
          return;
        }
        
        tabManagerInstance.reload(parseInt(tabId, 10));
        broadcastTabs(); // Ensure UI is updated with any potential state changes
      } catch (error) {
        console.error('Error reloading tab:', error);
      }
    }
  );

  console.log('IPC listeners initialized');
}
