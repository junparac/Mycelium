// utils/electronModules.js

const isElectron = process.env.ELECTRON === 'true';

let fs = null;
let path = null;
let dialog = null;

if (isElectron && typeof window !== 'undefined' && window.require) {
  try {
    const electron = window.require('electron');
    fs = window.require('fs');
    path = window.require('path');
    dialog = electron.dialog || (electron.remote && electron.remote.dialog);
  } catch (error) {
    console.warn('Electron modules not available:', error);
  }
}

export function getElectronModules() {
  return { fs, path, dialog };
}
