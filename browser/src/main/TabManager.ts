import { BrowserView, BrowserWindow, session, shell } from 'electron';
import { EventEmitter } from 'node:events';
import path from 'node:path';

export interface TabInfo {
  id: number;
  view: BrowserView;
  title: string;
  incognito: boolean;
}

export class TabManager extends EventEmitter {
  /* private fields */
  #tabs: TabInfo[] = [];
  #currentId: number | null = null;
  #nextId = 1;

  constructor(private win: BrowserWindow) {
    super();
    this.win.on('resize', () => {
      const currentTab = this.#tabs.find(tab => tab.id === this.#currentId);
      if (currentTab) {
        this.#setBounds(currentTab.view);
      }
    });
  }

  // ---------- public API to be implemented in later tasks ----------
  createTab(url: string = 'about:blank', incognito = false): void {
    const id = this.#nextId++;
    
    // Configure web preferences
    const webPreferences: Electron.WebPreferences = {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    };

    // Handle incognito session
    if (incognito) {
      const partition = `tab-${id}`;
      webPreferences.session = session.fromPartition(partition, { cache: false });
    }

    // Create and configure the view
    const view = new BrowserView({ webPreferences });
    this.win.addBrowserView(view);
    this.#setBounds(view);
    this.#configureSecurity(view);

    // Initial navigation
    view.webContents.loadURL(url).catch(console.error);

    // Update state
    const tabInfo: TabInfo = { id, view, title: url, incognito };
    this.#tabs.push(tabInfo);
    this.#currentId = id;
    
    // Notify listeners
    this._emit();
  }
  // These methods are placeholders for future implementation
  // The underscore prefix indicates these parameters are intentionally unused
  /* eslint-disable @typescript-eslint/no-unused-vars */
  closeTab(_tabId: number): void { /* TODO 2.2.4 */ }
  switchTab(_tabId: number): void { /* TODO 2.2.4 */ }
  navigate(_tabId: number, _url: string): void { /* TODO 2.2.3 */ }
  goBack(_tabId: number): void { /* TODO 2.2.3 */ }
  goForward(_tabId: number): void { /* TODO 2.2.3 */ }
  reload(_tabId: number): void { /* TODO 2.2.3 */ }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  // ---------- private helpers ----------
  #setBounds(view: BrowserView): void {
    const [width, height] = this.win.getContentSize();
    view.setBounds({ x: 0, y: 40, width, height: height - 40 });
  }

  #configureSecurity(view: BrowserView): void {
    const { webContents } = view;
    
    // Block unsafe window.open calls
    webContents.setWindowOpenHandler(({ url }) => {
      if (this.#isSafe(url)) {
        shell.openExternal(url).catch(console.error);
      }
      return { action: 'deny' };
    });

    // Block unsafe navigation
    webContents.on('will-navigate', (event, navigationUrl) => {
      if (!this.#isSafe(navigationUrl)) {
        event.preventDefault();
      }
    });

    // Update tab title when page title changes
    webContents.on('page-title-updated', (_event, title) => {
      const tab = this.#tabs.find(t => t.view === view);
      if (tab) {
        tab.title = title;
        this._emit();
      }
    });
  }

  #isSafe(url: string): boolean {
    try {
      const u = new URL(url);
      return ['http:', 'https:', 'about:'].includes(u.protocol);
    } catch {
      return false;
    }
  }

  protected _emit(): void { /* TODO 2.2.5 */ }
}
