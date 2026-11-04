const { app, BrowserWindow, Menu, ipcMain, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
function send(route) { if (win) win.webContents.send('navigate', route); }

function createWindow() {
  win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 920, minHeight: 640,
    backgroundColor: '#0b0e1f', title: 'Aced', icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true }
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  if (process.env.ACED_DEBUG) win.webContents.on('console-message', (_e, lvl, msg, line, src) => console.log(`[renderer:${lvl}] ${msg} (${src}:${line})`));
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { label: 'File', submenu: [
      { label: 'Settings…', accelerator: 'CmdOrCtrl+,', click: () => send('settings') },
      { type: 'separator' }, isMac ? { role: 'close' } : { role: 'quit' } ] },
    { label: 'Practice', submenu: [
      { label: 'Home', accelerator: 'CmdOrCtrl+0', click: () => send('home') },
      { label: 'Cognitive Tests', accelerator: 'CmdOrCtrl+1', click: () => send('cognitive') },
      { label: 'Video Interview', accelerator: 'CmdOrCtrl+2', click: () => send('interview') },
      { label: 'Technical Questions', accelerator: 'CmdOrCtrl+3', click: () => send('technical') } ] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { role: 'windowMenu' }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

const resultsDir = () => path.join(app.getPath('documents'), 'Aced', 'results');
ipcMain.handle('results:save', (_e, session) => {
  const dir = resultsDir();
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const kind = session && session.type === 'interview' ? 'interview' : 'cognitive';
  const body = JSON.stringify(session, null, 2);
  const file = path.join(dir, `${kind}-${stamp}.json`);
  fs.writeFileSync(file, body);
  fs.writeFileSync(path.join(dir, `latest-${kind}.json`), body);
  return { file, dir };
});
ipcMain.handle('results:open', () => { const d = resultsDir(); fs.mkdirSync(d, { recursive: true }); return shell.openPath(d); });
ipcMain.handle('interviewers:list', () => {
  const dir = path.join(__dirname, 'assets', 'interviewers');
  try { return fs.readdirSync(dir).filter(f => f.endsWith('.mp4')); } catch { return []; }
});

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(permission === 'media'));
  buildMenu();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
