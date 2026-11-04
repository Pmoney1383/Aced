const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('aced', {
  saveResult: (session) => ipcRenderer.invoke('results:save', session),
  openResults: () => ipcRenderer.invoke('results:open'),
  listInterviewers: () => ipcRenderer.invoke('interviewers:list'),
  onNavigate: (cb) => ipcRenderer.on('navigate', (_e, route) => cb(route))
});
