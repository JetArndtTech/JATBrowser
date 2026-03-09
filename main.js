const { app, BrowserWindow, BrowserView, ipcMain, Menu, session, globalShortcut } = require("electron");

let win;
let tabs = [];
let currentTab = -1;
const MAX_TABS = 12;

// ------------------------
// APP READY
// ------------------------
app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "JAT12",
    icon: __dirname + "/icon.ico",
    webPreferences: {
      preload: __dirname + "/preload.js"
    }
  });

  Menu.setApplicationMenu(null);
  win.loadFile("index.html");

  createTab("https://www.google.com");

  win.on("resize", () => { if(tabs[currentTab]) resizeView(tabs[currentTab]); });

  // ---------------- downloads ----------------
  session.defaultSession.on("will-download", (e, item) => {
    const info = { name: item.getFilename(), total: item.getTotalBytes() };
    win.webContents.send("download", info);

    // track progress
    item.on("updated", (_, state) => {
      if (state === "progressing" && !item.isPaused()) {
        win.webContents.send("download-progress", { name: item.getFilename(), received: item.getReceivedBytes(), total: item.getTotalBytes() });
      }
    });

    item.once("done", (_, state) => {
      win.webContents.send("download-done", { name: item.getFilename(), state });
    });
  });

  // ---------------- zoom ----------------
  globalShortcut.register("CommandOrControl+=", () => zoom(0.1));
  globalShortcut.register("CommandOrControl+-", () => zoom(-0.1));
  globalShortcut.register("CommandOrControl+0", () => zoomReset());
});

// ------------------------
// HELPERS
// ------------------------
function normalizeUrl(input) {
  if (!input.startsWith("http://") && !input.startsWith("https://")) input = "https://" + input;
  return input;
}

function resizeView(view) {
  const [w, h] = win.getContentSize();
  const topbarHeight = 64 + 40; // tabs + nav
  const downloadsHeight = 150; // reserve space for downloads panel
  const bottomOffset = downloadsVisible ? downloadsHeight : 0;
  view.setBounds({ x: 0, y: topbarHeight, width: w, height: h - topbarHeight - bottomOffset });
}

// ------------------------
// TAB FUNCTIONS
// ------------------------
function createTab(url) {
  if (tabs.length >= MAX_TABS) return;

  const view = new BrowserView({ webPreferences: { zoomFactor: 1.0 } });
  const finalUrl = normalizeUrl(url) || "https://www.google.com";
  view.webContents.loadURL(finalUrl);

  view.webContents.setWindowOpenHandler(({ url }) => {
    createTab(url);
    return { action: 'deny' };
  });

  view.webContents.on("page-title-updated", (_, title) => {
    const shortTitle = title.length > 25 ? title.slice(0,22) + "..." : title;
    win.webContents.send("tab-title", { index: tabs.indexOf(view), title: shortTitle });
    if (tabs.indexOf(view) === currentTab) win.webContents.send("url-change", view.webContents.getURL());
  });

  view.webContents.on("did-navigate", (_, url) => win.webContents.send("url-change", new URL(url).href));
  view.webContents.on("did-navigate-in-page", (_, url) => win.webContents.send("url-change", new URL(url).href));

  tabs.push(view);
  switchTab(tabs.length - 1);
  resizeView(view);
}

function switchTab(index) {
  if (!tabs[index]) return;
  if (currentTab >= 0 && tabs[currentTab]) win.removeBrowserView(tabs[currentTab]);
  currentTab = index;
  if (tabs[currentTab]) {
    win.setBrowserView(tabs[currentTab]);
    resizeView(tabs[currentTab]);
    win.webContents.send("url-change", tabs[currentTab].webContents.getURL());
  }
}

function closeTab(index) {
  if (!tabs[index]) return;

  const view = tabs[index];
  win.removeBrowserView(view);
  view.webContents.destroy(); // stop audio/video

  tabs.splice(index, 1);
  currentTab = Math.min(currentTab, tabs.length - 1);
  if (currentTab >= 0 && tabs[currentTab]) {
    win.setBrowserView(tabs[currentTab]);
    resizeView(tabs[currentTab]);
    win.webContents.send("url-change", tabs[currentTab].webContents.getURL());
  }

  win.webContents.send("tab-closed", index);
}

// ------------------------
// ZOOM HANDLERS
// ------------------------
function zoom(delta) {
  const wc = tabs[currentTab]?.webContents;
  if (!wc) return;
  const current = wc.getZoomFactor();
  wc.setZoomFactor(Math.min(2, Math.max(0.25, current + delta)));
}

function zoomReset() {
  const wc = tabs[currentTab]?.webContents;
  if (!wc) return;
  wc.setZoomFactor(1.0);
}

// ------------------------
// IPC HANDLERS
// ------------------------
ipcMain.on("new-tab", (_, url) => createTab(url));
ipcMain.on("switch-tab", (_, i) => switchTab(i));
ipcMain.on("close-tab", (_, i) => closeTab(i));
ipcMain.on("navigate", (_, url) => {
  if (!tabs[currentTab]) return;

  let finalUrl = url.trim();
  const isUrl = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}/i.test(finalUrl);
  if (!isUrl) finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
  else if (!finalUrl.startsWith("http")) finalUrl = "https://" + finalUrl;

  tabs[currentTab].webContents.loadURL(finalUrl);
});

ipcMain.on("nav-action", (_, action) => {
  const wc = tabs[currentTab]?.webContents;
  if (!wc) return;
  if (action === "back" && wc.canGoBack()) wc.goBack();
  if (action === "forward" && wc.canGoForward()) wc.goForward();
  if (action === "refresh") wc.reload();
});

ipcMain.on("zoom", (_, delta) => zoom(delta));

// ------------------------
// DOWNLOAD PANEL TOGGLE
// ------------------------
let downloadsVisible = false;
ipcMain.on("toggle-downloads", () => {
  downloadsVisible = !downloadsVisible;
  if (tabs[currentTab]) resizeView(tabs[currentTab]);
  win.webContents.send("downloads-visible", downloadsVisible);
});