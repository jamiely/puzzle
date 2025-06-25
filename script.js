import { handleFile, puzzleActive, createPuzzle } from './src/puzzle.js';
import {
  initAutoload,
  startAutoLoadTimer,
  cancelAutoLoadTimer,
} from './src/autoload.js';
import { initDebug } from './src/debug.js';

const fileInput = document.getElementById('file-input');

// Initialize autoload module
initAutoload(createPuzzle, () => puzzleActive);

document.addEventListener('click', () => {
  if (!puzzleActive) {
    cancelAutoLoadTimer();
    fileInput.click();
  }
});

// Page-wide drag and drop events
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  document.body.classList.add('dragover');
});

document.addEventListener('dragleave', (e) => {
  if (e.clientX === 0 && e.clientY === 0) {
    document.body.classList.remove('dragover');
  }
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  document.body.classList.remove('dragover');
  cancelAutoLoadTimer();

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  cancelAutoLoadTimer();
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

// Start the auto-load timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
  startAutoLoadTimer();
  initDebug();
});
