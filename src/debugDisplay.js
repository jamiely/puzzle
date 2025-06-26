// Debug display functionality for piece IDs and numbers

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

// Update piece ID display based on toggle state
export function updatePieceIdDisplay(showPieceIds) {
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

// Update piece number display based on toggle state
export function updatePieceNumberDisplay(showPieceNumbers) {
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
