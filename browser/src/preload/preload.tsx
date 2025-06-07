import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from '../shared/ipcChannels';

contextBridge.exposeInMainWorld('electronAPI', {
  // Fire-and-forget
  newTab: () => ipcRenderer.send(CHANNELS.TABS_CREATE),
  closeTab: (id: number) => ipcRenderer.send(CHANNELS.TABS_CLOSE, id),
  switchTab: (id: number) => ipcRenderer.send(CHANNELS.TABS_SWITCH, id),
  navigate: (id: number, url: string) => ipcRenderer.send(CHANNELS.TABS_NAVIGATE, id, url),
  goBack: (id: number) => ipcRenderer.send(CHANNELS.TABS_GO_BACK, id),
  goForward: (id: number) => ipcRenderer.send(CHANNELS.TABS_GO_FORWARD, id),
  reload: (id: number) => ipcRenderer.send(CHANNELS.TABS_RELOAD, id),

  // From main to renderer
  onTabsUpdated: (callback: (tabs: { list: any[], currentId: number }) => void) =>
    ipcRenderer.on(CHANNELS.TABS_UPDATED, (_, data) => callback(data)),
});
