// Mock the electron module before importing anything
const mockBrowserWindow = jest.fn().mockImplementation(() => ({
  webContents: {
    getLastWebPreferences: jest.fn().mockReturnValue({}),
  },
  isDestroyed: jest.fn().mockReturnValue(false),
  close: jest.fn(),
  show: jest.fn(),
  focus: jest.fn(),
  isMinimized: jest.fn().mockReturnValue(false),
  restore: jest.fn(),
  removeMenu: jest.fn(),
  once: jest.fn(),
  loadFile: jest.fn(),
  on: jest.fn(),
}));

const mockApp = {
  isReady: jest.fn().mockReturnValue(true),
  whenReady: jest.fn().mockResolvedValue(undefined),
  getAppPath: jest.fn().mockReturnValue('/mock/app/path'),
  quit: jest.fn(),
  requestSingleInstanceLock: jest.fn().mockReturnValue(true),
  on: jest.fn(),
};

const mockIpcMain = {
  on: jest.fn(),
};

jest.mock('electron', () => ({
  app: mockApp,
  BrowserWindow: mockBrowserWindow,
  ipcMain: mockIpcMain,
}));

// Import after setting up the mock
import { createWindow } from '../../src/main/windowFactory';

// Get a reference to the mocked BrowserWindow
const mockedBrowserWindow = mockBrowserWindow as jest.Mock;

describe('windowFactory security defaults', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    mockedBrowserWindow.mockClear();
    // Example for app, if its methods were mocked and need clearing:
    // mockedApp.isReady.mockClear(); 
  });

  it('creates a window with secure defaults', () => {
    createWindow(); // Call the function that creates the window
    
    // Use the typed mock for assertions
    expect(mockedBrowserWindow).toHaveBeenCalledWith(
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
