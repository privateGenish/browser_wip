import { BrowserWindow, BrowserView, session, Session } from 'electron';
import { TabManager } from '../../src/main/TabManager';

// Define mock BrowserView type for TypeScript
interface MockBrowserView {
  webContents: {
    loadURL: import('vitest').Mock<[string], Promise<void>>;
    setWindowOpenHandler: import('vitest').Mock;
    on: import('vitest').Mock;
    session: Session;
  };
  setBounds: import('vitest').Mock;
  [key: string]: unknown;
}

// Track mock BrowserView instances
const mockBrowserViewInstances: MockBrowserView[] = [];

// Mock Electron modules
vi.mock('electron', () => ({
  BrowserView: vi.fn().mockImplementation(({ webPreferences }) => {
    const mockWebContents = {
      loadURL: vi.fn().mockImplementation((url) => {
        if (url.startsWith('file://')) {
          return Promise.reject(new Error('Unsafe URL'));
        }
        return Promise.resolve();
      }),
      setWindowOpenHandler: vi.fn(),
      on: vi.fn(),
      session: webPreferences?.session || {}
    };

    const mockView: MockBrowserView = {
      webContents: mockWebContents,
      setBounds: vi.fn()
    };

    mockBrowserViewInstances.push(mockView);
    return mockView;
  }),

  BrowserWindow: vi.fn().mockImplementation(() => ({
    addBrowserView: vi.fn(),
    getContentSize: vi.fn().mockReturnValue([1024, 768]),
    on: vi.fn(),
    setBounds: vi.fn(),
    destroy: vi.fn()
  })),

  session: {
    fromPartition: vi.fn().mockImplementation(() => ({
      // Mock session methods as needed
      webRequest: {
        onHeadersReceived: vi.fn(),
      },
    } as unknown as Session)),
    defaultSession: {}
  },

  shell: {
    openExternal: vi.fn()
  }
}));

describe('TabManager', () => {
  let tabManager: TabManager;
  let mockWin: BrowserWindow;

  beforeEach(() => {
    vi.clearAllMocks();
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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
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
