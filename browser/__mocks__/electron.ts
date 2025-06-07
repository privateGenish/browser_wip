import { jest } from '@jest/globals';

// Mock implementation of the electron module
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

const app = {
  isReady: jest.fn().mockReturnValue(true),
  whenReady: jest.fn(() => Promise.resolve() as Promise<void>),
  getAppPath: jest.fn().mockReturnValue('/mock/app/path'),
  quit: jest.fn(),
  requestSingleInstanceLock: jest.fn().mockReturnValue(true),
  on: jest.fn(),
};

const ipcMain = {
  on: jest.fn(),
};

export {
  app,
  mockBrowserWindow as BrowserWindow,
  ipcMain,
};
