/**
 * Centralized IPC channel names for type-safe communication between main and renderer processes.
 * All channel names should be defined here to prevent string mismatches and ensure type safety.
 */

export const CHANNELS = {
  /**
   * Renderer -> Main: Request to create a new tab
   * Payload: { url?: string, active?: boolean }
   */
  TABS_CREATE: 'tabs-create',

  /**
   * Renderer -> Main: Request to close a tab
   * Payload: { tabId: string }
   */
  TABS_CLOSE: 'tabs-close',

  /**
   * Renderer -> Main: Request to switch to a different tab
   * Payload: { tabId: string }
   */
  TABS_SWITCH: 'tabs-switch',

  /**
   * Renderer -> Main: Request to navigate a tab to a new URL
   * Payload: { tabId: string, url: string }
   */
  TABS_NAVIGATE: 'tabs-navigate',

  /**
   * Renderer -> Main: Request to navigate back in tab history
   * Payload: { tabId: string }
   */
  TABS_BACK: 'tabs-back',

  /**
   * Renderer -> Main: Request to navigate forward in tab history
   * Payload: { tabId: string }
   */
  TABS_FORWARD: 'tabs-forward',

  /**
   * Renderer -> Main: Request to reload the current tab
   * Payload: { tabId: string, bypassCache?: boolean }
   */
  TABS_RELOAD: 'tabs-reload',

  /**
   * Main -> Renderer: Notification that tabs state has been updated
   * Payload: { tabs: TabState[], activeTabId: string }
   */
  TABS_UPDATED: 'tabs-updated',
} as const;

/**
 * Union type of all possible IPC channel names for type safety
 */
export type ChannelName = typeof CHANNELS[keyof typeof CHANNELS];
