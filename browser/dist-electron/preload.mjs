"use strict";
const electron = require("electron");
const CHANNELS = {
  // Tab management channels
  TABS_CREATE: "tabs:create",
  TABS_CLOSE: "tabs:close",
  TABS_SWITCH: "tabs:switch",
  TABS_NAVIGATE: "tabs:navigate",
  TABS_GO_BACK: "tabs:go-back",
  TABS_GO_FORWARD: "tabs:go-forward",
  TABS_RELOAD: "tabs:reload",
  TABS_UPDATED: "tabs:updated"
};
const validateTabId = (id) => {
  if (typeof id !== "number" || !Number.isInteger(id) || id < 0) {
    throw new Error(`Invalid tab ID: ${id}. Must be a non-negative integer.`);
  }
  return id;
};
const validateUrl = (url) => {
  if (typeof url !== "string" || !url) {
    throw new Error(`Invalid URL: ${url}. Must be a non-empty string.`);
  }
  return url;
};
const api = {
  addTab: () => {
    electron.ipcRenderer.send(CHANNELS.TABS_CREATE);
  },
  closeTab: (tabId) => {
    const validId = validateTabId(tabId);
    electron.ipcRenderer.send(CHANNELS.TABS_CLOSE, validId);
  },
  switchTab: (tabId) => {
    const validId = validateTabId(tabId);
    electron.ipcRenderer.send(CHANNELS.TABS_SWITCH, validId);
  },
  navigateTab: (tabId, url) => {
    const validId = validateTabId(tabId);
    const validUrl = validateUrl(url);
    electron.ipcRenderer.send(CHANNELS.TABS_NAVIGATE, validId, validUrl);
  },
  goBack: (tabId) => {
    const validId = validateTabId(tabId);
    electron.ipcRenderer.send(CHANNELS.TABS_GO_BACK, validId);
  },
  goForward: (tabId) => {
    const validId = validateTabId(tabId);
    electron.ipcRenderer.send(CHANNELS.TABS_GO_FORWARD, validId);
  },
  reloadTab: (tabId) => {
    const validId = validateTabId(tabId);
    electron.ipcRenderer.send(CHANNELS.TABS_RELOAD, validId);
  },
  onTabsUpdated: (callback) => {
    const handler = (_, data) => {
      if (typeof callback === "function") {
        try {
          if (!data || typeof data !== "object") {
            console.error("Invalid tabs data received:", data);
            return;
          }
          callback(data);
        } catch (error) {
          console.error("Error in tabs update handler:", error);
        }
      }
    };
    electron.ipcRenderer.on(CHANNELS.TABS_UPDATED, handler);
    return () => {
      electron.ipcRenderer.off(CHANNELS.TABS_UPDATED, handler);
    };
  }
};
electron.contextBridge.exposeInMainWorld("electronAPI", api);
