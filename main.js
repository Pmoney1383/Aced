const { app, BrowserWindow, Menu, ipcMain, session, shell, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
function send(route) { if (win) win.webContents.send('navigate', route); }

const overlay = () => (nativeTheme.shouldUseDarkColors
  ? { color: '#0b0e1f', symbolColor: '#f2f4ff', height: 40 }
  : { color: '#eceff8', symbolColor: '#10142b', height: 40 });

function createWindow() {
  win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 920, minHeight: 640,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0b0e1f' : '#eceff8', title: 'Aced', titleBarStyle: 'hidden', titleBarOverlay: overlay(), autoHideMenuBar: true, icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true }
  });
  win.setMenuBarVisibility(false);
  nativeTheme.on('updated', () => { try { win.setTitleBarOverlay(overlay()); win.setBackgroundColor(nativeTheme.shouldUseDarkColors ? '#0b0e1f' : '#eceff8'); } catch { /* ignore */ } });
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
ipcMain.on('win:action', (e, a) => {
  const w = BrowserWindow.fromWebContents(e.sender); if (!w) return; const wc = w.webContents;
  switch (a) {
    case 'minimize': w.minimize(); break;
    case 'maximize': w.isMaximized() ? w.unmaximize() : w.maximize(); break;
    case 'close': w.close(); break;
    case 'quit': app.quit(); break;
    case 'reload': wc.reload(); break;
    case 'devtools': wc.toggleDevTools(); break;
    case 'zoomIn': wc.setZoomLevel(wc.getZoomLevel() + 0.5); break;
    case 'zoomOut': wc.setZoomLevel(wc.getZoomLevel() - 0.5); break;
    case 'zoomReset': wc.setZoomLevel(0); break;
    case 'fullscreen': w.setFullScreen(!w.isFullScreen()); break;
    case 'undo': wc.undo(); break; case 'redo': wc.redo(); break; case 'cut': wc.cut(); break;
    case 'copy': wc.copy(); break; case 'paste': wc.paste(); break; case 'selectAll': wc.selectAll(); break;
  }
});
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
