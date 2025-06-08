import { BrowserWindow, BrowserView, session, Session } from 'electron';
import { TabManager } from '../../src/main/TabManager';

// Define mock BrowserView type for TypeScript
interface MockBrowserView {
  webContents: {
    loadURL: jest.Mock<Promise<void>, [string]>;
    setWindowOpenHandler: jest.Mock;
    on: jest.Mock;
    session: Session;
  };
  setBounds: jest.Mock;
  [key: string]: unknown;
}

// Track mock BrowserView instances
const mockBrowserViewInstances: MockBrowserView[] = [];

// Mock Electron modules
jest.mock('electron', () => ({
  BrowserView: jest.fn().mockImplementation(({ webPreferences }) => {
    const mockWebContents = {
      loadURL: jest.fn().mockImplementation((url) => {
        if (url.startsWith('file://')) {
          return Promise.reject(new Error('Unsafe URL'));
        }
        return Promise.resolve();
      }),
      setWindowOpenHandler: jest.fn(),
      on: jest.fn(),
      session: webPreferences?.session || {}
    };

    const mockView: MockBrowserView = {
      webContents: mockWebContents,
      setBounds: jest.fn()
    };

    mockBrowserViewInstances.push(mockView);
    return mockView;
  }),

  BrowserWindow: jest.fn().mockImplementation(() => ({
    addBrowserView: jest.fn(),
    getContentSize: jest.fn().mockReturnValue([1024, 768]),
    on: jest.fn(),
    setBounds: jest.fn(),
    destroy: jest.fn()
  })),

  session: {
    fromPartition: jest.fn().mockImplementation(() => ({
      // Mock session methods as needed
      webRequest: {
        onHeadersReceived: jest.fn(),
      },
    } as unknown as Session)),
    defaultSession: {}
  },

  shell: {
    openExternal: jest.fn()
  }
}));

describe('TabManager', () => {
  let tabManager: TabManager;
  let mockWin: BrowserWindow;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBrowserViewInstances.length = 0;
    
    mockWin = new BrowserWindow();
    tabManager = new TabManager(mockWin);
  });

  describe('createTab', () => {
    it('should create a tab with secure defaults', () => {
      // Act
      tabManager.createTab('https://example.com');

      // Assert
      expect(BrowserView).toHaveBeenCalledTimes(1);
      expect(mockWin.addBrowserView).toHaveBeenCalledTimes(1);
      
      const mockView = mockBrowserViewInstances[0];
      expect(mockView.webContents.loadURL).toHaveBeenCalledWith('https://example.com');
      
      // Verify secure defaults
      expect(BrowserView).toHaveBeenCalledWith(expect.objectContaining({
        webPreferences: expect.objectContaining({
          contextIsolation: true,
          sandbox: true,
          nodeIntegration: false
        })
      }));
    });

    it('should create an incognito tab with a separate session', () => {
      // Act
      tabManager.createTab('https://example.com', true);

      // Assert
      expect(session.fromPartition).toHaveBeenCalledWith(
        expect.stringMatching(/^tab-\d+$/),
        { cache: false }
      );
    });

    it('should handle unsafe URLs by logging an error', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      tabManager.createTab('file:///etc/passwd');
      
      // Wait for the promise to settle (loadURL is async)
      await new Promise(process.nextTick);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(consoleErrorSpy.mock.calls[0][0].message).toContain('Unsafe URL');
      
      // Clean up
      consoleErrorSpy.mockRestore();
    });

    it('should set correct bounds for tabs', () => {
      // Act
      tabManager.createTab('https://example.com');

      // Assert
      const mockView = mockBrowserViewInstances[0];
      expect(mockView.setBounds).toHaveBeenCalledWith({
        x: 0,
        y: 40,
        width: 1024,
        height: 728 // 768 (window height) - 40 (navbar height)
      });
    });
  });
});
