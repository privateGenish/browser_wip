module.exports = {
  preset: 'ts-jest/presets/default-esm', // Use ESM preset
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // ts-jest ESM preset usually handles this, but explicitly defining can help:
    '^(\\.{1,2}/.*)\\.js$': '$1', 
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  // The preset handles most transform and globals config for ts-jest.
  // Ensure your tsconfig.json has "esModuleInterop": true and "isolatedModules": true.
};
