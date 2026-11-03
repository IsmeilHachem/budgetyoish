if (typeof window === 'undefined') {
  global.window = {};
}
if (!global.window.localStorage) {
  let store = {};
  global.window.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
  global.localStorage = global.window.localStorage;
}

import { vi } from 'vitest'

// Mock Date functions for jsdom environment
// Store original functions first
const originalDateUTC = Date.UTC;
const originalDateNow = Date.now;

// Override Date.UTC globally - ensure it works in JSDOM
Date.UTC = function(year, month, day, hour, minute, second, millisecond) {
  // Use the original Date.UTC if available, otherwise create manually
  if (originalDateUTC) {
    return originalDateUTC(year, month, day, hour || 0, minute || 0, second || 0, millisecond || 0);
  }
  // Fallback: create date manually
  return new Date(year, month, day, hour || 0, minute || 0, second || 0, millisecond || 0).getTime();
};

// Override Date.now globally
Date.now = function() {
  if (originalDateNow) {
    return originalDateNow();
  }
  // Fallback: get current time
  return new Date().getTime();
};

// Ensure they're available on global object
global.Date.UTC = Date.UTC;
global.Date.now = Date.now;

// Also ensure Date.now is available on the Date constructor
if (!Date.now) {
  Date.now = function() {
    return new Date().getTime();
  };
}

// Mock HTMLCanvasElement for Chart.js
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function() {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Array(4) }),
      putImageData: () => {},
      createImageData: () => ({ data: new Array(4) }),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    };
  };
} 