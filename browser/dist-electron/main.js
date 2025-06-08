import { BrowserWindow, Menu, app, shell } from "electron";
import { fileURLToPath as fileURLToPath$1 } from "node:url";
import path from "node:path";
import { dirname } from "path";
import { fileURLToPath } from "url";
const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
let mainWindow = null;
function createWindow() {
  var _a;
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
      preload: path.join(_dirname, "../preload/index.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });
  if (process.env.NODE_ENV !== "development" && process.env.DEBUG !== "true") {
    Menu.setApplicationMenu(null);
  }
  mainWindow.once("ready-to-show", () => {
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.focus();
    if (!app.isPackaged) ;
  });
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  const loadApp = async () => {
    if (!mainWindow) return;
    try {
      if (devServerUrl) {
        await mainWindow.loadURL(devServerUrl);
      } else {
        const indexPath = path.join(app.getAppPath(), "dist", "renderer", "index.html");
        await mainWindow.loadFile(indexPath);
      }
    } catch (error) {
      console.error("Failed to load app:", error);
    }
  };
  void loadApp();
  const handleWindowOpen = (details) => {
    if (details.url.startsWith("http")) {
      shell.openExternal(details.url).catch(console.error);
    }
    return { action: "deny" };
  };
  if ((_a = mainWindow == null ? void 0 : mainWindow.webContents) == null ? void 0 : _a.setWindowOpenHandler) {
    mainWindow.webContents.setWindowOpenHandler(handleWindowOpen);
  }
  const cleanup = () => {
    if (!mainWindow) return;
    mainWindow.off("closed", cleanup);
    mainWindow = null;
  };
  mainWindow.on("closed", cleanup);
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
const __dirname = path.dirname(fileURLToPath$1(import.meta.url));
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
