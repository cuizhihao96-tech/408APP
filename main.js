const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 750,
    minWidth: 420,
    minHeight: 650,
    resizable: true,
    title: '408刷题助手',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 置顶开关
ipcMain.on('set-always-on-top', (_event, flag) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(flag, 'screen-saver');
  }
});

// 加载题目数据
ipcMain.handle('load-questions', async () => {
  try {
    const fs = require('fs');
    const dataPath = path.join(__dirname, 'data', 'questions.json');
    const raw = await fs.promises.readFile(dataPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('读取题目数据失败:', err.message);
    return [];
  }
});

// 导出数据
ipcMain.handle('export-data', async (_event, filePath, data) => {
  try {
    const fs = require('fs');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('导出失败:', err.message);
    return false;
  }
});

// 导入数据
ipcMain.handle('import-data', async (_event, filePath) => {
  try {
    const fs = require('fs');
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('导入失败:', err.message);
    return null;
  }
});

// 文件对话框
ipcMain.handle('show-save-dialog', async (_event, options) => {
  if (!mainWindow) return { canceled: true };
  return dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('show-open-dialog', async (_event, options) => {
  if (!mainWindow) return { canceled: true };
  return dialog.showOpenDialog(mainWindow, options);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => { app.quit(); });
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
