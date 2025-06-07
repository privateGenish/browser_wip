import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import { createWindow } from '../src/main/windowFactory'
import path from 'node:path'

// Single instance lock
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
  // process.exit() is sometimes used here, but app.quit() is generally preferred
  // for allowing Electron to clean up properly.
  // We return here to prevent the rest of the main process code from running.
  // However, in a real scenario, you might want to ensure this is the absolute
  // first thing that runs, potentially even before other imports if they have side effects.
  // For this exercise, placing it after imports but before app logic is fine.
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    const currentWindow = BrowserWindow.getAllWindows()[0];
    if (currentWindow) {
      if (currentWindow.isMinimized()) currentWindow.restore();
      currentWindow.focus();
      // Optionally, you can handle commandLine and workingDirectory here
      // if you want the second instance to pass arguments to the first.
    }
  });
}
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    // The mainWindow variable in windowFactory is nulled out on 'closed' event.
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow(); // Use the imported window factory
  }
})

app.whenReady()
  .then(() => {
    createWindow();
  })
  .catch((err) => {
    console.error('Failed to create main window:', err);
    // Optionally, you could use a dialog to show the error to the user
    // import { dialog } from 'electron';
    // dialog.showErrorBox('Window Creation Failed', err.message);
    app.quit();
  });

