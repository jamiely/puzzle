export function isOverlapping(x, y, width, height, placedPieces) {
  const padding = 20; // Minimum space between pieces
  return placedPieces.some((placed) => {
    return (
      x < placed.x + placed.width + padding &&
      x + width + padding > placed.x &&
      y < placed.y + placed.height + padding &&
      y + height + padding > placed.y
    );
  });
}

export function findNonOverlappingPosition(
  pieceWidth,
  pieceHeight,
  placedPieces
) {
  const containerWidth = window.innerWidth - pieceWidth - 20;
  const containerHeight = window.innerHeight - pieceHeight - 20;

  let x,
    y,
    attempts = 0;
  const maxAttempts = 50;

  // Try to find a non-overlapping position
  do {
    x = 10 + Math.random() * containerWidth;
    y = 10 + Math.random() * containerHeight;
    attempts++;
  } while (
    attempts < maxAttempts &&
    isOverlapping(x, y, pieceWidth, pieceHeight, placedPieces)
  );

  return { x, y };
}

export function getRandomRotation() {
  // Random rotation in increments of 30 degrees (0, 30, 60, 90, 120, etc.)
  const rotationOptions = [
    0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
  ];
  return rotationOptions[Math.floor(Math.random() * rotationOptions.length)];
}

export function updatePieceTransform(piece) {
  piece.element.style.left = `${piece.x}px`;
  piece.element.style.top = `${piece.y}px`;
  piece.element.style.transform = `rotate(${piece.rotation}deg)`;
}
