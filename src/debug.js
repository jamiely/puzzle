// Debug functionality for puzzle maker
import { solvePuzzle } from './solver.js';
import {
  updatePieceIdDisplay,
  updatePieceNumberDisplay,
  generatePieceId,
} from './debugDisplay.js';
import {
  isDebugMenuVisible,
  setDebugMenuVisible,
  isShowingPieceIds,
  setShowPieceIds,
  isShowingPieceNumbers,
  setShowPieceNumbers,
  getGridRows,
  getGridColumns,
  getPieceScale,
  setPendingGridRows,
  setPendingGridColumns,
  setPendingPieceScale,
  applyPendingChanges,
  revertPendingChanges,
  initializePendingValues,
  reslicePuzzleIfNeeded,
  setCurrentPuzzle,
} from './debugConfig.js';

// Re-export for backwards compatibility
export { generatePieceId } from './debugDisplay.js';
export {
  isDebugMenuVisible,
  isShowingPieceIds,
  getGridRows,
  getGridColumns,
  getPieceScale,
  setCurrentPuzzle,
} from './debugConfig.js';

// Update piece displays - called from other modules
export function updatePieceIdPositions() {
  updatePieceIdDisplay(isShowingPieceIds());
}

export function updatePieceNumberPositions() {
  updatePieceNumberDisplay(isShowingPieceNumbers());
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
    revertPendingChanges();
    gridRowsInput.value = getGridRows();
    gridColumnsInput.value = getGridColumns();
    pieceScaleInput.value = getPieceScale();
    hideDebugMenu();
  });

  // Handle submit button - apply changes and close menu
  debugSubmit.addEventListener('click', () => {
    // Apply pending changes
    const { hasGridChanges, hasScaleChanges } = applyPendingChanges();

    // Reslice puzzle if any settings changed
    if (hasGridChanges || hasScaleChanges) {
      reslicePuzzleIfNeeded();
    }

    hideDebugMenu();
  });

  // Initialize checkbox states to match current settings
  showPieceIdsCheckbox.checked = isShowingPieceIds();
  showPieceNumbersCheckbox.checked = isShowingPieceNumbers();

  // Handle piece ID toggle (immediate effect)
  showPieceIdsCheckbox.addEventListener('change', (e) => {
    setShowPieceIds(e.target.checked);
    updatePieceIdPositions();
  });

  // Handle piece numbers toggle (immediate effect)
  showPieceNumbersCheckbox.addEventListener('change', (e) => {
    setShowPieceNumbers(e.target.checked);
    updatePieceNumberPositions();
  });

  // Handle grid size changes (store as pending)
  gridRowsInput.addEventListener('change', (e) => {
    setPendingGridRows(parseInt(e.target.value) || 3);
  });

  gridColumnsInput.addEventListener('change', (e) => {
    setPendingGridColumns(parseInt(e.target.value) || 3);
  });

  // Handle piece scale changes (store as pending)
  pieceScaleInput.addEventListener('change', (e) => {
    setPendingPieceScale(parseInt(e.target.value) || 50);
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
    if (e.key === '?' && !isDebugMenuVisible()) {
      e.preventDefault();
      showDebugMenu();
    } else if (e.key === 'Escape' && isDebugMenuVisible()) {
      e.preventDefault();
      // Treat Escape as cancel
      debugCancel.click();
    } else if (e.key.toLowerCase() === 'a') {
      e.preventDefault();
      togglePieceIds();
    } else if (e.key.toLowerCase() === 's') {
      e.preventDefault();
      togglePieceNumbers();
    } else if (e.key === '!') {
      e.preventDefault();
      solvePuzzleAction();
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
  initializePendingValues();
  gridRowsInput.value = getGridRows();
  gridColumnsInput.value = getGridColumns();
  pieceScaleInput.value = getPieceScale();

  debugMenu.style.display = 'flex';
  setDebugMenuVisible(true);
}

// Hide debug menu
function hideDebugMenu() {
  const debugMenu = document.getElementById('debug-menu');
  debugMenu.style.display = 'none';
  setDebugMenuVisible(false);
}

// Toggle piece IDs on/off
function togglePieceIds() {
  setShowPieceIds(!isShowingPieceIds());
  const showPieceIdsCheckbox = document.getElementById('show-piece-ids');
  if (showPieceIdsCheckbox) {
    showPieceIdsCheckbox.checked = isShowingPieceIds();
  }
  updatePieceIdPositions();
}

// Toggle piece numbers on/off
function togglePieceNumbers() {
  setShowPieceNumbers(!isShowingPieceNumbers());
  const showPieceNumbersCheckbox =
    document.getElementById('show-piece-numbers');
  if (showPieceNumbersCheckbox) {
    showPieceNumbersCheckbox.checked = isShowingPieceNumbers();
  }
  updatePieceNumberPositions();
}

// Solve puzzle action
function solvePuzzleAction() {
  solvePuzzle(
    getGridRows(),
    getGridColumns(),
    () => {
      // Update callback
      updatePieceIdPositions();
      updatePieceNumberPositions();
    },
    () => {
      // Completion callback - import and call completion check
      import('./completion.js').then((module) => {
        module.checkPuzzleCompletion();
      });
    }
  );
}
