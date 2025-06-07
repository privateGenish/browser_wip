import { BrowserWindow, app } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __filename = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename);
let mainWindow = null;
function createWindow() {
  if (mainWindow) return mainWindow;
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    // defer until ready-to-show
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0f0f0f",
    // dark neutral
    webPreferences: {
      preload: path.join(__dirname$1, "../preload/index.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: process.env.DEBUG === "true",
      spellcheck: false
    }
  });
  if (process.env.NODE_ENV !== "development" && process.env.DEBUG !== "true") {
    mainWindow.removeMenu();
  }
  mainWindow.once("ready-to-show", () => mainWindow == null ? void 0 : mainWindow.show());
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
    if (process.env.DEBUG === "true") {
      mainWindow.webContents.openDevTools();
    }
  } else {
    const indexPath = path.join(app.getAppPath(), "dist", "renderer", "index.html");
    void mainWindow.loadFile(indexPath);
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  return mainWindow;
}
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const currentWindow = BrowserWindow.getAllWindows()[0];
    if (currentWindow) {
      if (currentWindow.isMinimized()) currentWindow.restore();
      currentWindow.focus();
    }
  });
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
}).catch((err) => {
  console.error("Failed to create main window:", err);
  app.quit();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
