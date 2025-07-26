
import './global';
console.log("🚀 React app started");

window.addEventListener('error', event => {
  if (event.message && event.message.includes('ResizeObserver loop')) {
    event.stopImmediatePropagation();
  }
});

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
