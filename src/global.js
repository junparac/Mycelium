// src/global.js

(function () {
  if (typeof global === 'undefined') {
    if (typeof globalThis !== 'undefined') {
      globalThis.global = globalThis;
    } else if (typeof window !== 'undefined') {
      window.global = window;
    } else if (typeof self !== 'undefined') {
      self.global = self;
    }
  }
})();