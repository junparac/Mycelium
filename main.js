const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    }
  });

  win.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('read-markdown-content', async (event, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return '';
  }
});

ipcMain.handle('dialog:openVault', async () => {
  console.log('Open Vault dialog requested');
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('get-markdown-files', async (_, folderPath) => {
  try {
    const files = fs.readdirSync(folderPath);
    return files.filter(f => f.endsWith('.md'));
  } catch (err) {
    console.error('Error reading directory:', err);
    return [];
  }
});

ipcMain.handle('read-markdown-file', async (event, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
});

ipcMain.handle('save-markdown-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving markdown file:', err);
    throw err;
  }
});

ipcMain.handle('delete-markdown-file', async (event, filePath) => {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.on('save-synonyms', (event, data) => {
  const filePath = path.join(__dirname, 'synonyms.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving synonyms.json:', err);
  }
});

ipcMain.handle('load-synonyms', () => {
  const filePath = path.join(__dirname, 'synonyms.json');
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.warn('Could not load synonyms.json. Returning empty object.');
    return {};
  }
});
