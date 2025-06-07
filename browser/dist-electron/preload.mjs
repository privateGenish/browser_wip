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
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Fire-and-forget
  newTab: () => electron.ipcRenderer.send(CHANNELS.TABS_CREATE),
  closeTab: (id) => electron.ipcRenderer.send(CHANNELS.TABS_CLOSE, id),
  switchTab: (id) => electron.ipcRenderer.send(CHANNELS.TABS_SWITCH, id),
  navigate: (id, url) => electron.ipcRenderer.send(CHANNELS.TABS_NAVIGATE, id, url),
  goBack: (id) => electron.ipcRenderer.send(CHANNELS.TABS_GO_BACK, id),
  goForward: (id) => electron.ipcRenderer.send(CHANNELS.TABS_GO_FORWARD, id),
  reload: (id) => electron.ipcRenderer.send(CHANNELS.TABS_RELOAD, id),
  // From main to renderer
  onTabsUpdated: (callback) => electron.ipcRenderer.on(CHANNELS.TABS_UPDATED, (_, data) => callback(data))
});
