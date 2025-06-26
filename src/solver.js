// Auto-solve functionality for puzzle maker

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

// Animate a piece to a target position with rotation
function animatePieceToPosition(
  piece,
  targetX,
  targetY,
  targetRotation,
  delay = 0,
  onUpdateCallback = null
) {
  if (!piece.element) return;

  setTimeout(() => {
    const duration = 800; // Animation duration in ms
    const startTime = Date.now();
    const startX = piece.x;
    const startY = piece.y;
    const startRotation = piece.rotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      // Interpolate position and rotation
      piece.x = startX + (targetX - startX) * easeOut;
      piece.y = startY + (targetY - startY) * easeOut;
      piece.rotation =
        startRotation + (targetRotation - startRotation) * easeOut;

      // Update the piece transform directly
      if (piece.element) {
        piece.element.style.left = `${piece.x}px`;
        piece.element.style.top = `${piece.y}px`;
        piece.element.style.transform = `rotate(${piece.rotation}deg)`;
      }

      // Notify callback for any updates needed
      if (onUpdateCallback) {
        onUpdateCallback();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, delay);
}

// Solve puzzle by animating pieces to their correct positions
export function solvePuzzle(
  gridRows,
  gridColumns,
  onUpdateCallback = null,
  onCompleteCallback = null
) {
  const puzzleContainer = document.getElementById('puzzle-container');
  if (!puzzleContainer) return;

  const pieces = Array.from(puzzleContainer.querySelectorAll('.puzzle-piece'));
  if (pieces.length === 0) return;

  // Calculate the solved puzzle layout based on current grid size
  const rows = gridRows;
  const cols = gridColumns;

  // Calculate container center and piece dimensions for grid layout
  const containerRect = puzzleContainer.getBoundingClientRect();
  const containerCenterX = containerRect.width / 2;
  const containerCenterY = containerRect.height / 2;

  // Get piece dimensions (assume all pieces are similar size)
  const firstPieceCanvas = pieces[0].querySelector('canvas');
  const pieceWidth = firstPieceCanvas.width;
  const pieceHeight = firstPieceCanvas.height;

  // Calculate grid layout dimensions
  const gridWidth = cols * pieceWidth;
  const gridHeight = rows * pieceHeight;
  const startX = containerCenterX - gridWidth / 2;
  const startY = containerCenterY - gridHeight / 2;

  // Animate each piece to its correct position
  pieces.forEach((pieceElement, index) => {
    const pieceData = getPieceDataByElement(pieceElement);
    if (!pieceData) return;

    const targetPosition = pieceData.originalPosition;
    const targetRow = Math.floor(targetPosition / cols);
    const targetCol = targetPosition % cols;

    // Calculate target position
    const targetX = startX + targetCol * pieceWidth;
    const targetY = startY + targetRow * pieceHeight;
    const targetRotation = 0; // Pieces should be unrotated in solved state

    // Get current piece data or create it
    let piece = pieceData;
    if (!piece.x && !piece.y && piece.rotation === undefined) {
      // If piece doesn't have position data, get it from DOM
      const currentRect = pieceElement.getBoundingClientRect();
      piece.x = currentRect.left;
      piece.y = currentRect.top;
      piece.rotation = 0;
      piece.element = pieceElement;
    }

    // Animate the piece to its target position
    animatePieceToPosition(
      piece,
      targetX,
      targetY,
      targetRotation,
      index * 100,
      onUpdateCallback
    );
  });

  // Check completion after all animations are done
  const maxDelay = pieces.length * 100 + 1000; // Animation duration + buffer
  if (onCompleteCallback) {
    setTimeout(onCompleteCallback, maxDelay);
  }
}
