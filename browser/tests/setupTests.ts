// Mock global objects needed for tests

// Mock Electron renderer process
if (!global.window) {
  // @ts-expect-error - Mocking window for tests
  global.window = {};
}

// Mock process.versions.electron for tests
Object.defineProperty(process.versions, 'electron', {
  value: '30.5.1',
  configurable: true
});
