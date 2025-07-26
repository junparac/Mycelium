const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readMarkdownContent: (filePath) => ipcRenderer.invoke('read-markdown-content', filePath),
  readMarkdownFile: (filePath) => ipcRenderer.invoke('read-markdown-file', filePath),
  getMarkdownFiles: (folderPath) => ipcRenderer.invoke('get-markdown-files', folderPath),
  openVaultDialog: () => ipcRenderer.invoke('dialog:openVault'),
  saveMarkdownFile: (filePath, content) => ipcRenderer.invoke('save-markdown-file', filePath, content),
  deleteMarkdownFile: (filePath) => ipcRenderer.invoke('delete-markdown-file', filePath),
  saveSynonyms: (data) => ipcRenderer.send('save-synonyms', data),
  loadSynonyms: () => ipcRenderer.invoke('load-synonyms'),
});
