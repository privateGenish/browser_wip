import { ipcMain, webContents } from 'electron';
import { CHANNELS } from '../../src/shared/ipc-channels';
import { initIPC } from '../../src/main/ipc';
import { vi, describe, it, expect, beforeEach, afterEach, MockedFunction } from 'vitest';

// Mock Electron modules
const mockIpcHandlers: Record<string, (...args: any[]) => void> = {};

vi.mock('electron', () => ({
  ipcMain: {
    on: vi.fn((channel: string, handler: (...args: any[]) => void) => {
      mockIpcHandlers[channel] = handler;
    }),
    emit: vi.fn(),
  },
  webContents: {
    getAllWebContents: vi.fn(),
  },
}));

// Mock TabManager
const mockTabManager = {
  createTab: vi.fn(),
  closeTab: vi.fn(),
  switchTab: vi.fn(),
  navigate: vi.fn(),
  goBack: vi.fn(),
  goForward: vi.fn(),
  reload: vi.fn(),
  getSnapshot: vi.fn().mockReturnValue({
    tabs: [],
    currentTabId: null,
  }),
};

vi.mock('../../src/main/TabManager', () => ({
  TabManager: vi.fn().mockImplementation(() => mockTabManager),
}));

// Mock the actual TabManager instance
declare module '../../src/main/TabManager' {
  export let instance: typeof mockTabManager;
}

describe('IPC Handlers', () => {
  let mockWindow: any;
  let mockWebContents: any[]; // mockTabManager is now at module level

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock BrowserWindow
    mockWindow = {
      contentView: {
        addChildView: vi.fn(),
        removeChildView: vi.fn(),
        children: [],
      },
    };

    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup mock webContents
    mockWebContents = [
      { 
        isDestroyed: () => false, 
        send: vi.fn() 
      },
      { 
        isDestroyed: () => false, 
        send: vi.fn() 
      },
    ];

    (webContents.getAllWebContents as MockedFunction<typeof webContents.getAllWebContents>)
      .mockReturnValue(mockWebContents);

    // Initialize IPC handlers
    initIPC(mockWindow as any);
    
    // Setup mock webContents
    mockWebContents = [
      { 
        isDestroyed: () => false, 
        send: vi.fn() 
      },
      { 
        isDestroyed: () => false, 
        send: vi.fn() 
      },
    ];

    (webContents.getAllWebContents as MockedFunction<typeof webContents.getAllWebContents>)
      .mockReturnValue(mockWebContents);

    // Initialize IPC handlers
    initIPC(mockWindow as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockIpcEvent = {
    sender: {
      send: vi.fn(),
    },
  } as any;

  describe('TABS_CREATE', () => {
    it('should create a tab and broadcast update', async () => {
      // Arrange
      const testUrl = 'https://example.com';
      const mockSnapshot = {
        tabs: [{ id: 1, url: testUrl, title: 'Example', incognito: false }],
        currentTabId: 1,
      };
      mockTabManager.getSnapshot.mockReturnValue(mockSnapshot);

      // Act
      const handler = mockIpcHandlers[CHANNELS.TABS_CREATE];
      expect(handler).toBeDefined();
      
      await handler(mockIpcEvent, { url: testUrl });
      
      // Wait for any pending promises to resolve
      await new Promise(resolve => setImmediate(resolve));

      // Assert
      expect(mockTabManager.createTab).toHaveBeenCalledWith(testUrl, true);
      
      // Verify broadcast was called
      mockWebContents.forEach(wc => {
        expect(wc.send).toHaveBeenCalledWith(CHANNELS.TABS_UPDATED, mockSnapshot);
      });
    });

    it('should handle missing URL', async () => {
      // Act
      const handler = (ipcMain.on as MockedFunction<typeof ipcMain.on>).mock.calls.find(
        (call: any[]) => call[0] === CHANNELS.TABS_CREATE
      )?.[1];
      
      if (!handler) {
        throw new Error('Handler not found for TABS_CREATE event');
      }
      
      await handler(mockIpcEvent, {});
      await new Promise(resolve => setImmediate(resolve));

      // Assert
      expect(mockTabManager.createTab).toHaveBeenCalledWith(undefined, true);
    });
  });

  describe('TABS_CLOSE', () => {
    it('should close a tab and broadcast update', async () => {
      // Arrange
      const tabId = 1;
      const mockSnapshot = { tabs: [], currentTabId: null };
      mockTabManager.getSnapshot.mockReturnValue(mockSnapshot);

      // Act
      const handler = mockIpcHandlers[CHANNELS.TABS_CLOSE];
      expect(handler).toBeDefined();
      
      await handler(mockIpcEvent, { tabId: tabId.toString() });
      await new Promise(resolve => setImmediate(resolve));

      // Assert
      expect(mockTabManager.closeTab).toHaveBeenCalledWith(tabId);
      
      // Verify broadcast was called
      mockWebContents.forEach(wc => {
        expect(wc.send).toHaveBeenCalledWith(CHANNELS.TABS_UPDATED, mockSnapshot);
      });
    });

    it('should handle invalid tab ID', async () => {
      // Act
      const handler = (ipcMain.on as MockedFunction<typeof ipcMain.on>).mock.calls.find(
        (call: any[]) => call[0] === CHANNELS.TABS_CLOSE
      )?.[1];
      
      if (!handler) {
        throw new Error('Handler not found for TABS_CLOSE event');
      }
      
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await handler(mockIpcEvent, { tabId: '' });
      await new Promise(resolve => setImmediate(resolve));

      // Assert
      expect(mockTabManager.closeTab).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid tab ID provided for closing tab');
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('TABS_NAVIGATE', () => {
    it('should navigate a tab and broadcast update', async () => {
      // Arrange
      const tabId = 1;
      const url = 'https://new-url.com';
      const mockSnapshot = {
        tabs: [{ id: tabId, url, title: 'New Page', incognito: false }],
        currentTabId: tabId,
      };
      mockTabManager.getSnapshot.mockReturnValue(mockSnapshot);

      // Act
      const handler = mockIpcHandlers[CHANNELS.TABS_NAVIGATE];
      expect(handler).toBeDefined();
      
      await handler(mockIpcEvent, { tabId: tabId.toString(), url });
      await new Promise(resolve => setImmediate(resolve));

      // Assert
      expect(mockTabManager.navigate).toHaveBeenCalledWith(tabId, url);
      
      // Verify broadcast was called
      mockWebContents.forEach(wc => {
        expect(wc.send).toHaveBeenCalledWith(CHANNELS.TABS_UPDATED, mockSnapshot);
      });
    });
  });

  it('should handle empty webContents list', async () => {
    // Arrange
    (webContents.getAllWebContents as MockedFunction<typeof webContents.getAllWebContents>)
      .mockReturnValueOnce([]);
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Act - trigger any IPC event that would call broadcastTabs
    const handler = mockIpcHandlers[CHANNELS.TABS_CREATE];
    expect(handler).toBeDefined();
    
    await handler(mockIpcEvent, { url: 'https://example.com' });
    await new Promise(resolve => setImmediate(resolve));

    // Assert
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(mockTabManager.createTab).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });
});
