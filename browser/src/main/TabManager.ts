import { WebContentsView, BrowserWindow, session, shell } from 'electron';
import { EventEmitter } from 'node:events';
import path from 'node:path';

export interface SerializableTabInfo {
  id: number;
  url: string;
  title: string;
  incognito: boolean;
  // isActive can be derived by comparing id with currentTabId from TabsSnapshot
}

export interface TabsSnapshot {
  tabs: SerializableTabInfo[];
  currentTabId: number | null;
}

export interface TabInfo {
  id: number;
  view: WebContentsView;
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
    const view = new WebContentsView({ webPreferences });
    this.win.contentView.addChildView(view);
    this.#setBounds(view);
    this.#configureSecurity(view);

    // Initial navigation
    view.webContents.loadURL(url) // Initial load can be less strict, e.g. about:blank
      .catch(err => {
        console.error(new Error(`Failed to load initial URL "${url}": ${err.message}`));
        // Do not re-throw here, allow tab creation even if initial load fails for some reason.
        // The navigate() method handles strict validation for subsequent navigations.
      });

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
  closeTab(tabId: number): void {
    const tabIndex = this.#tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;

    const [tab] = this.#tabs.splice(tabIndex, 1);
    this.win.contentView.removeChildView(tab.view);
    
    // Clean up web contents
    (tab.view.webContents as any).destroy();
    
    // Update current tab if needed
    if (this.#currentId === tabId) {
      this.#currentId = this.#tabs[Math.max(0, tabIndex - 1)]?.id || null;
    }
    
    this._emit();
  }
  switchTab(tabId: number): void {
    const tab = this.#tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    // Show only the selected tab
    this.#tabs.forEach(t => {
      const isVisible = t.id === tabId;
      t.view.setVisible(isVisible);
    });
    
    this.#currentId = tabId;
    this._emit();
  }
  navigate(tabId: number, url: string): void {
    const tab = this.#tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    try {
      // Parse the URL first to validate it
      const parsed = new URL(url);
      
      // Only allow http: and https: protocols for navigation
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`Navigation blocked for unsafe protocol: ${parsed.protocol}`);
      }
      
      // If we got here, the protocol is valid, so load the URL
      tab.view.webContents.loadURL(url);
      
      // Update the tab title after navigation
      tab.view.webContents.once('did-finish-load', () => {
        const title = tab.view.webContents.getTitle();
        if (title) {
          tab.title = title;
          this._emit();
        }
      });
    } catch (err) {
      // Log the blocked attempt with both the URL and error details
      console.warn(`Navigation to "${url}" blocked: `, err);
    }
  }
  goBack(tabId: number): void {
    const tab = this.#tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    if (tab.view.webContents.canGoBack()) {
      tab.view.webContents.goBack();
    }
  }
  goForward(tabId: number): void {
    const tab = this.#tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    if (tab.view.webContents.canGoForward()) {
      tab.view.webContents.goForward();
    }
  }
  reload(tabId: number): void {
    const tab = this.#tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    tab.view.webContents.reload();
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  // ---------- public API ----------
  public getSnapshot(): TabsSnapshot {
    const serializableTabs = this.#tabs.map(tab => ({
      id: tab.id,
      url: tab.view.webContents.getURL(),
      title: tab.view.webContents.getTitle() || tab.title, // Use live title, fallback to stored
      incognito: tab.incognito,
    }));
    return {
      tabs: serializableTabs,
      currentTabId: this.#currentId,
    };
  }

  // ---------- private helpers ----------
  #setBounds(view: WebContentsView): void {
    const [width, height] = this.win.getContentSize();
    view.setBounds({ x: 0, y: 40, width, height: height - 40 });
  }

  #configureSecurity(view: WebContentsView): void {
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
      // Only allow http: and https: for popups and navigation
      return ['http:', 'https:'].includes(u.protocol);
    } catch {
      return false;
    }
  }

  protected _emit(): void { /* TODO 2.2.5 */ }
}
