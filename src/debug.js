// Debug functionality for puzzle maker

let debugMenuVisible = false;
let showPieceIds = false;
let gridRows = 2;
let gridColumns = 2;
let currentImageSrc = null;
let createPuzzleCallback = null;

// Generate piece ID in A-Z, AA-ZZ format
export function generatePieceId(index) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  if (index < 26) {
    // A-Z (0-25)
    return alphabet[index];
  } else {
    // AA-ZZ (26-701)
    const first = Math.floor((index - 26) / 26);
    const second = (index - 26) % 26;
    return alphabet[first] + alphabet[second];
  }
}

// Initialize debug functionality
export function initDebug() {
  const debugMenu = document.getElementById('debug-menu');
  const debugClose = document.getElementById('debug-close');
  const showPieceIdsCheckbox = document.getElementById('show-piece-ids');
  const gridRowsInput = document.getElementById('grid-rows');
  const gridColumnsInput = document.getElementById('grid-columns');

  // Close debug menu
  debugClose.addEventListener('click', hideDebugMenu);

  // Handle piece ID toggle
  showPieceIdsCheckbox.addEventListener('change', (e) => {
    showPieceIds = e.target.checked;
    updatePieceIdDisplay();
  });

  // Handle grid size changes
  gridRowsInput.addEventListener('change', (e) => {
    gridRows = parseInt(e.target.value) || 2;
    reslicePuzzleIfActive();
  });

  gridColumnsInput.addEventListener('change', (e) => {
    gridColumns = parseInt(e.target.value) || 2;
    reslicePuzzleIfActive();
  });

  // Close debug menu when clicking outside
  debugMenu.addEventListener('click', (e) => {
    if (e.target === debugMenu) {
      hideDebugMenu();
    }
  });

  // Update piece ID positions on scroll/resize
  window.addEventListener('scroll', updatePieceIdPositions);
  window.addEventListener('resize', updatePieceIdPositions);

  // Global keyboard event listener
  document.addEventListener('keydown', (e) => {
    if (e.key === '?' && !debugMenuVisible) {
      e.preventDefault();
      showDebugMenu();
    } else if (e.key === 'Escape' && debugMenuVisible) {
      e.preventDefault();
      hideDebugMenu();
    } else if (e.key.toLowerCase() === 'a') {
      e.preventDefault();
      togglePieceIds();
    }
  });
}

// Show debug menu
function showDebugMenu() {
  const debugMenu = document.getElementById('debug-menu');
  debugMenu.style.display = 'flex';
  debugMenuVisible = true;
}

// Hide debug menu
function hideDebugMenu() {
  const debugMenu = document.getElementById('debug-menu');
  debugMenu.style.display = 'none';
  debugMenuVisible = false;
}

// Toggle piece IDs on/off
function togglePieceIds() {
  showPieceIds = !showPieceIds;
  const showPieceIdsCheckbox = document.getElementById('show-piece-ids');
  if (showPieceIdsCheckbox) {
    showPieceIdsCheckbox.checked = showPieceIds;
  }
  updatePieceIdDisplay();
}

// Calculate top-right position for a piece ID
function calculatePieceIdPosition(pieceElement) {
  const canvas = pieceElement.querySelector('canvas');
  if (!canvas) return { left: 0, top: 0 };

  // Get the canvas bounding rect (this accounts for rotation)
  const canvasRect = canvas.getBoundingClientRect();

  // Calculate the center of the piece
  const centerX = canvasRect.left + canvasRect.width / 2;
  const centerY = canvasRect.top + canvasRect.height / 2;

  // Use the original canvas dimensions for consistent offset
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Calculate a small offset towards top-right (screen coordinates)
  // Use a smaller offset so it appears closer to the piece
  const offsetX = canvasWidth * 0.49;
  const offsetY = canvasHeight * 0.49;

  return {
    left: centerX + offsetX,
    top: centerY - offsetY,
  };
}

// Update piece ID display based on toggle state
function updatePieceIdDisplay() {
  // Remove all existing piece IDs
  const existingIds = document.querySelectorAll('.piece-id');
  existingIds.forEach((id) => id.remove());

  if (!showPieceIds) return;

  const puzzleContainer = document.getElementById('puzzle-container');
  if (!puzzleContainer) return;

  const pieces = Array.from(puzzleContainer.querySelectorAll('.puzzle-piece'));

  // Sort pieces by position (left to right, top to bottom)
  const sortedPieces = pieces.sort((a, b) => {
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();

    // First sort by top position (y), then by left position (x)
    const yDiff = rectA.top - rectB.top;
    if (Math.abs(yDiff) > 10) {
      // 10px tolerance for "same row"
      return yDiff;
    }
    return rectA.left - rectB.left;
  });

  sortedPieces.forEach((pieceElement, index) => {
    // Add piece ID if enabled
    const pieceId = document.createElement('div');
    pieceId.className = 'piece-id';
    pieceId.textContent = generatePieceId(index);

    // Calculate position for top-right of piece
    const position = calculatePieceIdPosition(pieceElement);
    pieceId.style.left = `${position.left}px`;
    pieceId.style.top = `${position.top}px`;

    // Add to document body instead of piece element to avoid rotation
    document.body.appendChild(pieceId);

    // Store reference to piece element for cleanup
    pieceId.dataset.pieceIndex = index;
  });
}

// Update piece ID positions (call this when pieces move)
export function updatePieceIdPositions() {
  if (!showPieceIds) return;

  // When pieces move, we need to reassign IDs based on new positions
  // Simply call updatePieceIdDisplay to recalculate everything
  updatePieceIdDisplay();
}

// Getter for current state
export function isShowingPieceIds() {
  return showPieceIds;
}

export function isDebugMenuVisible() {
  return debugMenuVisible;
}

export function getGridRows() {
  return gridRows;
}

export function getGridColumns() {
  return gridColumns;
}

// Set the current image source and puzzle creation callback for auto-reslicing
export function setCurrentPuzzle(imageSrc, puzzleCreator) {
  currentImageSrc = imageSrc;
  createPuzzleCallback = puzzleCreator;
}

// Reslice puzzle if one is currently active
function reslicePuzzleIfActive() {
  if (currentImageSrc && createPuzzleCallback) {
    // Small delay to ensure UI updates are complete
    setTimeout(() => {
      createPuzzleCallback(currentImageSrc);
    }, 100);
  }
}
