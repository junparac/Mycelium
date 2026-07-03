const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  
  readMarkdownFile: (filePath) => ipcRenderer.invoke('read-markdown-file', filePath),

  getMarkdownFiles: (folderPath) => ipcRenderer.invoke('get-markdown-files', folderPath),

  openVaultDialog: () => ipcRenderer.invoke('dialog:openVault'),

  openLocalFolder: (path) => ipcRenderer.send('open-local-folder', path),

  saveMarkdownFile: (filePath, content) => ipcRenderer.invoke('save-markdown-file', filePath, content),

  deleteMarkdownFile: (filePath) => ipcRenderer.invoke('delete-markdown-file', filePath),

  saveSynonyms: (data) => ipcRenderer.send('save-synonyms', data),

  loadSynonyms: () => ipcRenderer.invoke('load-synonyms'),

  executePythonScript: (path) => ipcRenderer.send('run-python-script', path),

  openExternalLink: (url) => ipcRenderer.send('open-external-link', url),
});
