import { BrowserWindow, WebContentsView, session, Session } from 'electron';
import { TabManager } from '../../src/main/TabManager';

// Define mock WebContentsView type for TypeScript
interface MockWebContentsView {
  webContents: {
    loadURL: import('vitest').Mock<[string], Promise<void>>;
    setWindowOpenHandler: import('vitest').Mock;
    on: import('vitest').Mock;
    session: Session;
  };
  setBounds: import('vitest').Mock;
  setVisible: import('vitest').Mock;
  [key: string]: unknown;
}

// Track mock WebContentsView instances
const mockWebContentsViewInstances: MockWebContentsView[] = [];

// Mock Electron modules
vi.mock('electron', () => ({
  WebContentsView: vi.fn().mockImplementation(({ webPreferences }) => {
    const mockWebContents = {
      loadURL: vi.fn().mockImplementation((url) => {
        if (url.startsWith('file://')) {
          return Promise.reject(new Error('Unsafe URL'));
        }
        return Promise.resolve();
      }),
      setWindowOpenHandler: vi.fn(),
      on: vi.fn(),
      session: webPreferences?.session || {},
      canGoBack: vi.fn().mockReturnValue(true),
      canGoForward: vi.fn().mockReturnValue(true),
      goBack: vi.fn(),
      goForward: vi.fn(),
      reload: vi.fn(),
      getURL: vi.fn().mockReturnValue('https://example.com'),
      getTitle: vi.fn().mockReturnValue('Example Title')
    };

    const mockView: MockWebContentsView = {
      webContents: mockWebContents,
      setBounds: vi.fn(),
      setVisible: vi.fn()
    };

    mockWebContentsViewInstances.push(mockView);
    return mockView;
  }),

  BrowserWindow: vi.fn().mockImplementation(() => ({
    contentView: {
      addChildView: vi.fn(),
      removeChildView: vi.fn(),
      children: []
    },
    getContentSize: vi.fn().mockReturnValue([1024, 768]),
    on: vi.fn(),
    setBounds: vi.fn(),
    destroy: vi.fn()
  })),

  session: {
    fromPartition: vi.fn().mockImplementation(() => ({
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
    mockWebContentsViewInstances.length = 0;
    
    mockWin = new BrowserWindow();
    tabManager = new TabManager(mockWin);
  });

  describe('createTab', () => {
    it('should create a tab with secure defaults', () => {
      // Act
      tabManager.createTab('https://example.com');

      // Assert
      expect(WebContentsView).toHaveBeenCalledTimes(1);
      expect(mockWin.contentView.addChildView).toHaveBeenCalledTimes(1);
      
      const mockView = mockWebContentsViewInstances[0];
      expect(mockView.webContents.loadURL).toHaveBeenCalledWith('https://example.com');
      
      // Verify secure defaults
      expect(WebContentsView).toHaveBeenCalledWith(expect.objectContaining({
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
      const mockView = mockWebContentsViewInstances[0];
      expect(mockView.setBounds).toHaveBeenCalledWith({
        x: 0,
        y: 40,
        width: 1024,
        height: 728 // 768 (window height) - 40 (navbar height)
      });
    });
  });
});
