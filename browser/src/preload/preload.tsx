import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { CHANNELS } from '../shared/ipcChannels';

/**
 * Type definitions for the exposed Electron API in the renderer process
 */
// Only expose the minimal, secure surface to the renderer
interface PreloadAPI {
  addTab: () => void;
  closeTab: (tabId: number) => void;
  switchTab: (tabId: number) => void;
  navigateTab: (tabId: number, url: string) => void;
  goBack: (tabId: number) => void;
  goForward: (tabId: number) => void;
  reloadTab: (tabId: number) => void;
  onTabsUpdated: (callback: (tabs: { list: Array<{ id: number; url: string }>, currentId: number | null }) => void) => () => void;
}


// Validate tab ID parameter
const validateTabId = (id: unknown): number => {
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 0) {
    throw new Error(`Invalid tab ID: ${id}. Must be a non-negative integer.`);
  }
  return id;
};

// Validate URL parameter
const validateUrl = (url: unknown): string => {
  if (typeof url !== 'string' || !url) {
    throw new Error(`Invalid URL: ${url}. Must be a non-empty string.`);
  }
  return url;
};

const api: PreloadAPI = {
  addTab: () => {
    ipcRenderer.send(CHANNELS.TABS_CREATE);
  },
  closeTab: (tabId: number) => {
    const validId = validateTabId(tabId);
    ipcRenderer.send(CHANNELS.TABS_CLOSE, validId);
  },
  switchTab: (tabId: number) => {
    const validId = validateTabId(tabId);
    ipcRenderer.send(CHANNELS.TABS_SWITCH, validId);
  },
  navigateTab: (tabId: number, url: string) => {
    const validId = validateTabId(tabId);
    const validUrl = validateUrl(url);
    ipcRenderer.send(CHANNELS.TABS_NAVIGATE, validId, validUrl);
  },
  goBack: (tabId: number) => {
    const validId = validateTabId(tabId);
    ipcRenderer.send(CHANNELS.TABS_GO_BACK, validId);
  },
  goForward: (tabId: number) => {
    const validId = validateTabId(tabId);
    ipcRenderer.send(CHANNELS.TABS_GO_FORWARD, validId);
  },
  reloadTab: (tabId: number) => {
    const validId = validateTabId(tabId);
    ipcRenderer.send(CHANNELS.TABS_RELOAD, validId);
  },
  onTabsUpdated: (callback) => {
    // Wrap the handler to never leak the Electron event object
    const handler = (_: IpcRendererEvent, data: any) => {
      if (typeof callback === 'function') {
        try {
          if (!data || typeof data !== 'object') {
            console.error('Invalid tabs data received:', data);
            return;
          }
          callback(data); // Only pass the data, never the event
        } catch (error) {
          console.error('Error in tabs update handler:', error);
        }
      }
    };
    ipcRenderer.on(CHANNELS.TABS_UPDATED, handler);
    return () => {
      ipcRenderer.off(CHANNELS.TABS_UPDATED, handler);
    };
  }
};
// Do NOT expose ipcRenderer, require, process, or Buffer.
// Only the above safe API is exposed.

// Expose the API to the renderer process
// Expose only the secure API to the renderer
contextBridge.exposeInMainWorld('electronAPI', api);

// Extend the Window interface to include our electronAPI
declare global {
  interface Window {
    electronAPI: PreloadAPI;
  }
}
