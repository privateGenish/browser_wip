import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Fire-and-forget
  newTab: () => ipcRenderer.send('tabs-create'),
  closeTab: (id: number) => ipcRenderer.send('tabs-close', id),
  switchTab: (id: number) => ipcRenderer.send('tabs-switch', id),
  navigate: (id: number, url: string) => ipcRenderer.send('tabs-navigate', id, url),
  goBack: (id: number) => ipcRenderer.send('tabs-back', id),
  goForward: (id: number) => ipcRenderer.send('tabs-forward', id),
  reload: (id: number) => ipcRenderer.send('tabs-reload', id),

  // From main to renderer
  onTabsUpdated: (callback: (tabs: { list: any[], currentId: number }) => void) =>
    ipcRenderer.on('tabs-updated', (_, data) => callback(data)),
});
