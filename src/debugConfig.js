// Debug configuration and state management

// Debug state
let debugState = {
  menuVisible: false,
  showPieceIds: true,
  showPieceNumbers: false,
  gridRows: 3,
  gridColumns: 3,
  pieceScale: 50,
  pendingGridRows: 3,
  pendingGridColumns: 3,
  pendingPieceScale: 50,
  currentImageSrc: null,
  createPuzzleCallback: null,
};

// Getters for current state
export function isDebugMenuVisible() {
  return debugState.menuVisible;
}

export function isShowingPieceIds() {
  return debugState.showPieceIds;
}

export function isShowingPieceNumbers() {
  return debugState.showPieceNumbers;
}

export function getGridRows() {
  return debugState.gridRows;
}

export function getGridColumns() {
  return debugState.gridColumns;
}

export function getPieceScale() {
  return debugState.pieceScale;
}

export function getCurrentImageSrc() {
  return debugState.currentImageSrc;
}

export function getCreatePuzzleCallback() {
  return debugState.createPuzzleCallback;
}

// Setters for state
export function setDebugMenuVisible(visible) {
  debugState.menuVisible = visible;
}

export function setShowPieceIds(show) {
  debugState.showPieceIds = show;
}

export function setShowPieceNumbers(show) {
  debugState.showPieceNumbers = show;
}

export function setGridRows(rows) {
  debugState.gridRows = rows;
}

export function setGridColumns(columns) {
  debugState.gridColumns = columns;
}

export function setPieceScale(scale) {
  debugState.pieceScale = scale;
}

export function setPendingGridRows(rows) {
  debugState.pendingGridRows = rows;
}

export function setPendingGridColumns(columns) {
  debugState.pendingGridColumns = columns;
}

export function setPendingPieceScale(scale) {
  debugState.pendingPieceScale = scale;
}

export function setCurrentPuzzle(imageSrc, puzzleCreator) {
  debugState.currentImageSrc = imageSrc;
  debugState.createPuzzleCallback = puzzleCreator;
}

// Apply pending changes to current state
export function applyPendingChanges() {
  const hasGridChanges =
    debugState.pendingGridRows !== debugState.gridRows ||
    debugState.pendingGridColumns !== debugState.gridColumns;
  const hasScaleChanges =
    debugState.pendingPieceScale !== debugState.pieceScale;

  debugState.gridRows = debugState.pendingGridRows;
  debugState.gridColumns = debugState.pendingGridColumns;
  debugState.pieceScale = debugState.pendingPieceScale;

  return { hasGridChanges, hasScaleChanges };
}

// Revert pending changes to current values
export function revertPendingChanges() {
  debugState.pendingGridRows = debugState.gridRows;
  debugState.pendingGridColumns = debugState.gridColumns;
  debugState.pendingPieceScale = debugState.pieceScale;
}

// Initialize pending values to current values
export function initializePendingValues() {
  debugState.pendingGridRows = debugState.gridRows;
  debugState.pendingGridColumns = debugState.gridColumns;
  debugState.pendingPieceScale = debugState.pieceScale;
}

// Initialize config from query parameters or defaults
export function initializeConfigFromQueryParams(queryParams) {
  if (queryParams.rows !== null) {
    debugState.gridRows = queryParams.rows;
    debugState.pendingGridRows = queryParams.rows;
  }
  if (queryParams.columns !== null) {
    debugState.gridColumns = queryParams.columns;
    debugState.pendingGridColumns = queryParams.columns;
  }
  if (queryParams.scale !== null) {
    debugState.pieceScale = queryParams.scale;
    debugState.pendingPieceScale = queryParams.scale;
  }
}

// Reslice puzzle if one is currently active
export function reslicePuzzleIfNeeded() {
  if (debugState.currentImageSrc && debugState.createPuzzleCallback) {
    // Small delay to ensure UI updates are complete
    setTimeout(() => {
      debugState.createPuzzleCallback(debugState.currentImageSrc);
    }, 100);
  }
}
