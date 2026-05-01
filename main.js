import { app, BrowserWindow } from "electron";
import http from "http";

const APP_URL = "http://localhost:3000";
let mainWindow;
let serverModuleLoaded = false;

async function startBundledServer() {
  if (serverModuleLoaded || !app.isPackaged) {
    return;
  }

  serverModuleLoaded = true;
  await import("./server.js");
}

function checkServerReady() {
  return new Promise((resolve) => {
    const request = http.get(APP_URL, () => {
      request.destroy();
      resolve(true);
    });

    request.on("error", () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (await checkServerReady()) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

async function createWindow() {
  await startBundledServer();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true
    }
  });

  const serverReady = await waitForServer();

  if (serverReady) {
    await mainWindow.loadURL(APP_URL);
    return;
  }

  await mainWindow.loadURL(
    "data:text/html;charset=UTF-8," +
      encodeURIComponent(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 32px; background: #f5f5f5; color: #1f2937;">
            <h1>EasyProxi</h1>
            <p>Could not connect to http://localhost:3000.</p>
            <p>Make sure the server is running, then reopen the app.</p>
          </body>
        </html>
      `)
  );
}

app.whenReady().then(async () => {
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
