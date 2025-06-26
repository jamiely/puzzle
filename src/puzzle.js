import {
  splitImageIntoPieces,
  shuffleArray,
  handleFile as handleFileInternal,
} from './pieceManager.js';
import {
  findNonOverlappingPosition,
  getRandomRotation,
} from './positioning.js';
import {
  makePieceInteractive,
  handleKeyDown,
  getCurrentDraggedPiece as getInteractionCurrentDraggedPiece,
} from './interaction.js';
import {
  getGridRows,
  getGridColumns,
  getPieceScale,
  setCurrentPuzzle,
  updatePieceIdPositions,
  updatePieceNumberPositions,
} from './debug.js';

// Global state
export let puzzleActive = false;
let puzzlePieces = [];

export function createPuzzle(imageSrc, testMode = false) {
  const img = new Image();
  img.onload = () => {
    const rows = testMode ? 2 : getGridRows();
    const cols = testMode ? 2 : getGridColumns();
    const scale = testMode ? 100 : getPieceScale();
    const pieces = splitImageIntoPieces(img, testMode, rows, cols, scale);
    displayPuzzle(pieces);

    // Register this puzzle with debug system for auto-reslicing (only if not in test mode)
    if (!testMode) {
      setCurrentPuzzle(imageSrc, createPuzzle);
    }
  };
  img.src = imageSrc;
}

export function displayPuzzle(pieces) {
  const puzzleContainer = document.getElementById('puzzle-container');
  const instructions = document.getElementById('instructions');

  puzzleContainer.innerHTML = '';

  // Use grid mode only for tests, free positioning for normal gameplay
  // Tests pass a testMode parameter or set a specific flag, normal gameplay uses free positioning
  const useGridMode = pieces.length > 0 && pieces[0].testMode === true;
  puzzleContainer.style.display = useGridMode ? 'grid' : 'block';

  if (useGridMode) {
    // Calculate grid dimensions for test mode
    const totalPieces = pieces.length;
    const cols =
      Math.sqrt(totalPieces) === Math.floor(Math.sqrt(totalPieces))
        ? Math.sqrt(totalPieces)
        : 2; // Default to 2 columns if not a perfect square
    puzzleContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  }

  instructions.style.display = 'none';
  puzzleActive = true;

  // Shuffle pieces for puzzle challenge
  const shuffledPieces = shuffleArray([...pieces]);
  puzzlePieces = shuffledPieces;

  const placedPieces = [];

  shuffledPieces.forEach((piece, index) => {
    const pieceContainer = document.createElement('div');
    pieceContainer.className = 'puzzle-piece';
    pieceContainer.dataset.position = index;
    pieceContainer.appendChild(piece.canvas);

    if (useGridMode) {
      // Grid mode - simple layout for tests
      piece.currentPosition = index;
      piece.element = pieceContainer;
    } else {
      // Free positioning mode - scatter pieces around
      const pieceWidth = piece.canvas.width;
      const pieceHeight = piece.canvas.height;

      const { x, y } = findNonOverlappingPosition(
        pieceWidth,
        pieceHeight,
        placedPieces
      );
      const randomRotation = getRandomRotation();

      pieceContainer.style.left = `${x}px`;
      pieceContainer.style.top = `${y}px`;
      pieceContainer.style.transform = `rotate(${randomRotation}deg)`;

      // Store position and rotation data
      piece.x = x;
      piece.y = y;
      piece.rotation = randomRotation;
      piece.element = pieceContainer;
      piece.width = pieceWidth;
      piece.height = pieceHeight;

      // Add to placed pieces for collision detection
      placedPieces.push({ x, y, width: pieceWidth, height: pieceHeight });
    }

    // Store piece data reference in DOM element for debug system
    pieceContainer.pieceData = piece;

    // Make piece draggable and selectable
    makePieceInteractive(pieceContainer, piece, index);

    puzzleContainer.appendChild(pieceContainer);
  });

  // Assign stable IDs based on initial visual position (only once)
  assignStableIds();

  // Add keyboard event listener for rotation
  document.addEventListener('keydown', handleKeyDown);

  // Update debug displays after pieces are created
  updatePieceIdPositions();
  updatePieceNumberPositions();
}

// Assign stable IDs based on initial visual position
function assignStableIds() {
  const puzzleContainer = document.getElementById('puzzle-container');
  if (!puzzleContainer) return;

  const pieces = Array.from(puzzleContainer.querySelectorAll('.puzzle-piece'));

  // Sort pieces by their initial visual position (left to right, top to bottom)
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

  // Assign stable ID to each piece based on sorted order
  sortedPieces.forEach((pieceElement, index) => {
    if (pieceElement.pieceData) {
      pieceElement.pieceData.stableId = index;
    }
  });
}

// Getters for other modules to access state
export function getPuzzlePieces() {
  return puzzlePieces;
}

export function getCurrentDraggedPiece() {
  return getInteractionCurrentDraggedPiece();
}

// Wrapper function to maintain API compatibility
export function handleFile(file) {
  return handleFileInternal(file, createPuzzle);
}

// Re-export functions that tests expect to import from puzzle.js
export { splitImageIntoPieces, shuffleArray };
