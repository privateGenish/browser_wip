// Define the SHAPE of a BrowserWindow instance for our mocks
const mockBrowserWindowInstanceDetails = {
  webContents: {
    getLastWebPreferences: vi.fn().mockReturnValue({}),
  },
  isDestroyed: vi.fn().mockReturnValue(false),
  close: vi.fn(),
  show: vi.fn(),
  focus: vi.fn(),
  isMinimized: vi.fn().mockReturnValue(false),
  restore: vi.fn(),
  removeMenu: vi.fn(),
  once: vi.fn(),
  loadFile: vi.fn(),
  on: vi.fn(),
};

vi.mock('electron', () => {
  // This is the mock for the BrowserWindow constructor
  const internalMockBrowserWindowConstructor = vi.fn().mockImplementation(() => mockBrowserWindowInstanceDetails);

  const mockApp = {
    isReady: vi.fn().mockReturnValue(true),
    whenReady: vi.fn().mockResolvedValue(undefined),
    getAppPath: vi.fn().mockReturnValue('/mock/app/path'),
    quit: vi.fn(),
    requestSingleInstanceLock: vi.fn().mockReturnValue(true),
    on: vi.fn(),
  };

  const mockIpcMain = {
    on: vi.fn(),
  };

  return {
    app: mockApp,
    BrowserWindow: internalMockBrowserWindowConstructor, // Use the constructor defined *inside* the factory
    ipcMain: mockIpcMain,
  };
});

// Import after setting up the mock.
import * as electron from 'electron'; // Import all of electron
import { createWindow } from '../../src/main/windowFactory';

// Get a reference to the mocked BrowserWindow constructor for assertions
// vi.mocked() provides the correct type for the mocked constructor
const MockedBrowserWindowConstructor = vi.mocked(electron.BrowserWindow);

describe('windowFactory security defaults', () => {
  beforeEach(() => {
    MockedBrowserWindowConstructor.mockClear();
    
    // Clear mocks on the instance details
    Object.values(mockBrowserWindowInstanceDetails).forEach(mockFn => {
      if (typeof mockFn === 'function' && 'mockClear' in mockFn) {
        (mockFn as import('vitest').Mock).mockClear();
      }
    });
    // Specifically clear nested mocks if any
    mockBrowserWindowInstanceDetails.webContents.getLastWebPreferences.mockClear();
  });

  it('creates a window with secure defaults', () => {
    createWindow(); // Call the function that creates the window
    
    // Use the typed mock for assertions
    expect(MockedBrowserWindowConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        webPreferences: expect.objectContaining({
          contextIsolation: true,
          sandbox: true,
          nodeIntegration: false,
          webSecurity: true,
        }),
      })
    );
  });
});
