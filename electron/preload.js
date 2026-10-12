// Preload script for HRM Desktop Application
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hrmDesktop', {
  isElectron: true,
  platform: process.platform,
  version: '1.0.0',
});
