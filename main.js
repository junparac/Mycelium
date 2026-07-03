const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true,
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

ipcMain.on('open-local-folder', (event, folderPath) => {
  if (folderPath) {
    console.log(`📂 Electron is opening folder path: ${folderPath}`);
    shell.openPath(folderPath); // This triggers native Windows File Explorer safely!
  }
});

ipcMain.on('open-external-link', (event, url) => {
  if (url) {
    console.log(`🌐 Electron passing web URL to default browser: ${url}`);
    shell.openExternal(url); // This natively fires up Chrome/Edge to load the page!
  }
});

ipcMain.on('run-python-script', (event, scriptPath) => {
  if (scriptPath) {
    console.log(`🐍 Electron executing Python script: ${scriptPath}`);
    
    // 🎯 Extract the directory and the filename automatically!
    const scriptDir = path.dirname(scriptPath);
    const scriptName = path.basename(scriptPath);

    // 🚀 Dynamically open cmd, move to the file's folder, and run it
    exec(`start cmd /k "cd /d "${scriptDir}" && python "${scriptName}""`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Script execution error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Script stderr: ${stderr}`);
        return;
      }
      console.log(`Script output: ${stdout}`);
    });
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
