const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appAPI', {
  loadQuestions: () => ipcRenderer.invoke('load-questions'),
  setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),
  exportData: (filePath, data) => ipcRenderer.invoke('export-data', filePath, data),
  importData: (filePath) => ipcRenderer.invoke('import-data', filePath),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
});
