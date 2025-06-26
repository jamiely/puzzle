// Import puzzle pieces from main module
import { getPuzzlePieces } from './puzzle.js';

export function checkPuzzleCompletion() {
  const puzzlePieces = getPuzzlePieces();

  // Check for legacy grid-based completion (for tests compatibility)
  const isLegacyComplete = puzzlePieces.every(
    (piece, index) => piece.originalPosition === index
  );

  if (isLegacyComplete) {
    setTimeout(() => {
      showCompletionMessage();
    }, 100);
    return;
  }

  // For free positioning mode, check if pieces are positioned correctly relative to each other
  // and have correct rotation (0 degrees or multiples of 360)
  const tolerance = 50; // pixels
  const rotationTolerance = 15; // degrees

  // Only check free positioning if pieces have x/y coordinates
  if (!puzzlePieces[0] || typeof puzzlePieces[0].x === 'undefined') {
    return;
  }

  // Define the expected relative positions (2x2 grid)
  const expectedLayout = [
    { row: 0, col: 0 }, // top-left
    { row: 0, col: 1 }, // top-right
    { row: 1, col: 0 }, // bottom-left
    { row: 1, col: 1 }, // bottom-right
  ];

  // Check if all pieces are properly rotated (close to 0, 360, 720, etc.)
  const allRotatedCorrectly = puzzlePieces.every((piece) => {
    const normalizedRotation = ((piece.rotation % 360) + 360) % 360;
    return (
      Math.abs(normalizedRotation) < rotationTolerance ||
      Math.abs(normalizedRotation - 360) < rotationTolerance
    );
  });

  if (!allRotatedCorrectly) return;

  // Find the piece that should be top-left (originalPosition 0)
  const topLeftPiece = puzzlePieces.find(
    (piece) => piece.originalPosition === 0
  );
  if (!topLeftPiece) return;

  // Use top-left piece as reference point
  const baseX = topLeftPiece.x;
  const baseY = topLeftPiece.y;
  const pieceWidth = topLeftPiece.canvas.width;
  const pieceHeight = topLeftPiece.canvas.height;

  // Check if all pieces are in correct relative positions
  const isComplete = puzzlePieces.every((piece) => {
    const expectedPos = expectedLayout[piece.originalPosition];
    const expectedX = baseX + expectedPos.col * pieceWidth;
    const expectedY = baseY + expectedPos.row * pieceHeight;

    const deltaX = Math.abs(piece.x - expectedX);
    const deltaY = Math.abs(piece.y - expectedY);

    return deltaX < tolerance && deltaY < tolerance;
  });

  if (isComplete) {
    setTimeout(() => {
      showCompletionMessage();
    }, 100);
  }
}

function showCompletionMessage() {
  const puzzleContainer = document.getElementById('puzzle-container');

  // Add completion styling
  puzzleContainer.classList.add('completed');

  // Create completion overlay
  const overlay = document.createElement('div');
  overlay.className = 'completion-overlay';
  overlay.innerHTML = `
    <div class="completion-message">
      <h2>🎉 Puzzle Completed! 🎉</h2>
      <p>Great job! Drop another image to start a new puzzle.</p>
    </div>
  `;

  document.body.appendChild(overlay);

  // Remove overlay after 3 seconds
  setTimeout(() => {
    overlay.remove();
  }, 3000);
}
