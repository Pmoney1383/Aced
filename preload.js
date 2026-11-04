const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('aced', {
  listInterviewers: () => ipcRenderer.invoke('interviewers:list'),
  onNavigate: (cb) => ipcRenderer.on('navigate', (_e, route) => cb(route))
});
