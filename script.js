import { handleFile, puzzleActive, createPuzzle } from './src/puzzle.js';
import { initDebug } from './src/debug.js';
import { initializeConfigFromQueryParams } from './src/debugConfig.js';

const fileInput = document.getElementById('file-input');

document.addEventListener('click', () => {
  if (!puzzleActive) {
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

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

// Parse URL query parameters for puzzle selection and configuration
export function parseQueryParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Parse numeric parameters with validation
  const parseIntParam = (value, defaultValue, min, max) => {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < min || parsed > max) return defaultValue;
    return parsed;
  };
  
  return {
    puzzle: urlParams.get('puzzle'),
    rows: parseIntParam(urlParams.get('rows'), null, 2, 10),
    columns: parseIntParam(urlParams.get('columns'), null, 2, 10),
    scale: parseIntParam(urlParams.get('scale'), null, 25, 200),
  };
}

// Load puzzle with error handling
async function loadPuzzleFromPath(puzzlePath) {
  try {
    // Test if the image exists by creating an Image object
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Image loaded successfully, create the puzzle
        createPuzzle(puzzlePath);
        resolve();
      };

      img.onerror = () => {
        // Image failed to load
        console.warn(`Puzzle image not found: ${puzzlePath}.`);
        reject(new Error(`Image not found: ${puzzlePath}`));
      };

      img.src = puzzlePath;
    });
  } catch (error) {
    console.warn(`Error loading puzzle: ${error.message}.`);
  }
}

// Load puzzle from query parameter
document.addEventListener('DOMContentLoaded', async () => {
  const queryParams = parseQueryParameters();
  
  // Initialize configuration from query parameters
  initializeConfigFromQueryParams(queryParams);
  
  initDebug();

  if (queryParams.puzzle) {
    // Immediately load the specified puzzle
    const puzzlePath = `assets/${queryParams.puzzle}.jpg`;
    await loadPuzzleFromPath(puzzlePath);
  }
});
