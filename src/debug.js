// Debug functionality for puzzle maker

let debugMenuVisible = false;
let showPieceIds = true;
let showPieceNumbers = false;
let gridRows = 3;
let gridColumns = 3;
let pieceScale = 50;
let pendingGridRows = 3;
let pendingGridColumns = 3;
let pendingPieceScale = 50;
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
  const debugCancel = document.getElementById('debug-cancel');
  const debugSubmit = document.getElementById('debug-submit');
  const showPieceIdsCheckbox = document.getElementById('show-piece-ids');
  const showPieceNumbersCheckbox =
    document.getElementById('show-piece-numbers');
  const gridRowsInput = document.getElementById('grid-rows');
  const gridColumnsInput = document.getElementById('grid-columns');
  const pieceScaleInput = document.getElementById('piece-scale');

  // Handle cancel button - close menu and revert changes
  debugCancel.addEventListener('click', () => {
    // Revert pending changes to current values
    gridRowsInput.value = gridRows;
    gridColumnsInput.value = gridColumns;
    pieceScaleInput.value = pieceScale;
    pendingGridRows = gridRows;
    pendingGridColumns = gridColumns;
    pendingPieceScale = pieceScale;
    hideDebugMenu();
  });

  // Handle submit button - apply changes and close menu
  debugSubmit.addEventListener('click', () => {
    // Apply pending changes
    const hasGridChanges =
      pendingGridRows !== gridRows || pendingGridColumns !== gridColumns;
    const hasScaleChanges = pendingPieceScale !== pieceScale;

    gridRows = pendingGridRows;
    gridColumns = pendingGridColumns;
    pieceScale = pendingPieceScale;

    // Reslice puzzle if any settings changed
    if (hasGridChanges || hasScaleChanges) {
      reslicePuzzleIfActive();
    }

    hideDebugMenu();
  });

  // Initialize checkbox states to match current settings
  showPieceIdsCheckbox.checked = showPieceIds;
  showPieceNumbersCheckbox.checked = showPieceNumbers;

  // Handle piece ID toggle (immediate effect)
  showPieceIdsCheckbox.addEventListener('change', (e) => {
    showPieceIds = e.target.checked;
    updatePieceIdDisplay();
  });

  // Handle piece numbers toggle (immediate effect)
  showPieceNumbersCheckbox.addEventListener('change', (e) => {
    showPieceNumbers = e.target.checked;
    updatePieceNumberDisplay();
  });

  // Handle grid size changes (store as pending)
  gridRowsInput.addEventListener('change', (e) => {
    pendingGridRows = parseInt(e.target.value) || 3;
  });

  gridColumnsInput.addEventListener('change', (e) => {
    pendingGridColumns = parseInt(e.target.value) || 3;
  });

  // Handle piece scale changes (store as pending)
  pieceScaleInput.addEventListener('change', (e) => {
    pendingPieceScale = parseInt(e.target.value) || 50;
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
      // Treat Escape as cancel
      debugCancel.click();
    } else if (e.key.toLowerCase() === 'a') {
      e.preventDefault();
      togglePieceIds();
    } else if (e.key.toLowerCase() === 's') {
      e.preventDefault();
      togglePieceNumbers();
    }
  });
}

// Show debug menu
function showDebugMenu() {
  const debugMenu = document.getElementById('debug-menu');
  const gridRowsInput = document.getElementById('grid-rows');
  const gridColumnsInput = document.getElementById('grid-columns');
  const pieceScaleInput = document.getElementById('piece-scale');

  // Initialize pending values to current values
  pendingGridRows = gridRows;
  pendingGridColumns = gridColumns;
  pendingPieceScale = pieceScale;
  gridRowsInput.value = gridRows;
  gridColumnsInput.value = gridColumns;
  pieceScaleInput.value = pieceScale;

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

// Toggle piece numbers on/off
function togglePieceNumbers() {
  showPieceNumbers = !showPieceNumbers;
  const showPieceNumbersCheckbox =
    document.getElementById('show-piece-numbers');
  if (showPieceNumbersCheckbox) {
    showPieceNumbersCheckbox.checked = showPieceNumbers;
  }
  updatePieceNumberDisplay();
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

// Update piece number positions (call this when pieces move)
export function updatePieceNumberPositions() {
  if (!showPieceNumbers) return;

  // Simply call updatePieceNumberDisplay to recalculate everything
  updatePieceNumberDisplay();
}

// Calculate top-left position for a piece number
function calculatePieceNumberPosition(pieceElement) {
  const canvas = pieceElement.querySelector('canvas');
  if (!canvas) return { left: 0, top: 0 };

  // Get the piece's bounding rect to find the center
  const pieceRect = pieceElement.getBoundingClientRect();
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Calculate the center of the piece
  const centerX = pieceRect.left + pieceRect.width / 2;
  const centerY = pieceRect.top + pieceRect.height / 2;

  // Position at top-left relative to center (opposite of IDs)
  const offsetX = canvasWidth * 0.49; // Same distance as IDs but opposite direction
  const offsetY = canvasHeight * 0.49;

  return {
    left: centerX - offsetX,
    top: centerY - offsetY,
  };
}

// Update piece number display based on toggle state
function updatePieceNumberDisplay() {
  // Remove all existing piece numbers
  const existingNumbers = document.querySelectorAll('.piece-number');
  existingNumbers.forEach((number) => number.remove());

  if (!showPieceNumbers) return;

  const puzzleContainer = document.getElementById('puzzle-container');
  if (!puzzleContainer) return;

  const pieces = Array.from(puzzleContainer.querySelectorAll('.puzzle-piece'));

  pieces.forEach((pieceElement, index) => {
    // Find the piece data to get originalPosition
    const pieceData = getPieceDataByElement(pieceElement);
    if (!pieceData) return;

    // Add piece number if enabled
    const pieceNumber = document.createElement('div');
    pieceNumber.className = 'piece-number';
    pieceNumber.textContent = (pieceData.originalPosition + 1).toString();

    // Calculate position for top-left of piece
    const position = calculatePieceNumberPosition(pieceElement);
    pieceNumber.style.left = `${position.left}px`;
    pieceNumber.style.top = `${position.top}px`;

    // Add to document body instead of piece element to avoid rotation
    document.body.appendChild(pieceNumber);

    // Store reference to piece element for cleanup
    pieceNumber.dataset.pieceIndex = index;
  });
}

// Helper function to get piece data by DOM element
function getPieceDataByElement(pieceElement) {
  // Get piece data stored in DOM element by puzzle.js
  if (pieceElement.pieceData) {
    return pieceElement.pieceData;
  }

  // Fallback: use the element index as original position
  const puzzleContainer = document.getElementById('puzzle-container');
  if (!puzzleContainer) return null;

  const pieces = Array.from(puzzleContainer.querySelectorAll('.puzzle-piece'));
  const elementIndex = pieces.indexOf(pieceElement);

  return { originalPosition: elementIndex };
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

export function getPieceScale() {
  return pieceScale;
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
