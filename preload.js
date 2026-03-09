const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  navigate: (url) => ipcRenderer.send("navigate", url),
  newTab: (url) => ipcRenderer.send("new-tab", url),
  switchTab: (i) => ipcRenderer.send("switch-tab", i),
  closeTab: (i) => ipcRenderer.send("close-tab", i),
  navAction: (action) => ipcRenderer.send("nav-action", action),
  zoom: (delta) => ipcRenderer.send("zoom", delta),
  onUrlChange: (callback) => ipcRenderer.on("url-change", (_, url) => callback(url)),
  onDownload: (callback) => ipcRenderer.on("download", (_, info) => callback(info)),
  onTabTitle: (callback) => ipcRenderer.on("tab-title", (_, data) => callback(data)),
  onTabClosed: (callback) => ipcRenderer.on("tab-closed", (_, index) => callback(index))
});