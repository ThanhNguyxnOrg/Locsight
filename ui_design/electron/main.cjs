const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("node:path");
const { collectSourceFiles } = require("./fileScanner.cjs");
const smokeTest = process.env.CBA_SMOKE_TEST === "1";

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#070a0f",
    title: "Codebase Analyzer",
    show: !smokeTest,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (smokeTest) {
    mainWindow.webContents.once("did-finish-load", async () => {
      try {
        const title = await mainWindow.webContents.executeJavaScript("document.title");
        if (!title || !String(title).includes("Codebase Analyzer")) {
          throw new Error("Unexpected renderer title");
        }
        app.quit();
      } catch (error) {
        console.error(error);
        process.exitCode = 1;
        app.quit();
      }
    });

    mainWindow.webContents.once("did-fail-load", (_event, code, description) => {
      console.error(`Renderer failed to load: ${description} (${code})`);
      process.exitCode = 1;
      app.quit();
    });
  }

  mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

ipcMain.handle("cba:pick-directory", async (event, ignoreRules = []) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(browserWindow ?? undefined, {
    properties: ["openDirectory"],
    title: "Choose a source folder",
  });

  if (result.canceled || !result.filePaths[0]) {
    return null;
  }

  const rootPath = result.filePaths[0];
  const { files, scanStats } = await collectSourceFiles(rootPath, Array.isArray(ignoreRules) ? ignoreRules : []);
  return {
    rootPath: path.basename(rootPath),
    files,
    scanStats,
  };
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
