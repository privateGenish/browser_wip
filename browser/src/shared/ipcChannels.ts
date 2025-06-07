/**
 * Central registry of all IPC channel names used by main, preload, and renderer processes.
 * Ensures type safety and eliminates string mismatches across the codebase.
 * 
 * Channel naming convention: 
 * - Use colons (:) for namespacing related operations
 * - Use kebab-case for multi-word channel names
 * - Keep names consistent with their action and domain
 */

export const CHANNELS = {
  // Main process communication
  MAIN_PROCESS_MESSAGE: 'main-process-message',
  
  // Tab management channels
  TABS_CREATE: 'tabs:create',
  TABS_CLOSE: 'tabs:close',
  TABS_SWITCH: 'tabs:switch',
  TABS_NAVIGATE: 'tabs:navigate',
  TABS_GO_BACK: 'tabs:go-back',
  TABS_GO_FORWARD: 'tabs:go-forward',
  TABS_RELOAD: 'tabs:reload',
  TABS_UPDATED: 'tabs:updated',
} as const;

// Export the channel values as a type for type-safe usage
export type Channel = typeof CHANNELS[keyof typeof CHANNELS];
