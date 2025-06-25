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

export function calculateDistanceFromCenter(x, y, width, height) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const pieceCenterX = x + width / 2;
  const pieceCenterY = y + height / 2;

  return Math.sqrt(
    Math.pow(pieceCenterX - centerX, 2) + Math.pow(pieceCenterY - centerY, 2)
  );
}

export function findNonOverlappingPosition(
  pieceWidth,
  pieceHeight,
  placedPieces
) {
  const containerWidth = window.innerWidth - pieceWidth - 20;
  const containerHeight = window.innerHeight - pieceHeight - 20;
  const margin = 10;

  // Strategy 1: Try positioning around the perimeter first for better spread
  const perimeterPositions = generatePerimeterPositions(
    pieceWidth,
    pieceHeight,
    containerWidth,
    containerHeight,
    margin
  );

  // Try perimeter positions first
  for (const pos of perimeterPositions) {
    if (!isOverlapping(pos.x, pos.y, pieceWidth, pieceHeight, placedPieces)) {
      return pos;
    }
  }

  // Strategy 2: Try strategic grid-like positions for remaining pieces
  const gridCols = Math.floor(containerWidth / (pieceWidth + 60)); // 60px spacing
  const gridRows = Math.floor(containerHeight / (pieceHeight + 60));

  if (gridCols > 0 && gridRows > 0) {
    const gridPositions = [];
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        gridPositions.push({
          x: margin + col * (pieceWidth + 60) + Math.random() * 40 - 20, // Add some randomness
          y: margin + row * (pieceHeight + 60) + Math.random() * 40 - 20,
        });
      }
    }

    // Shuffle grid positions for variety
    for (let i = gridPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gridPositions[i], gridPositions[j]] = [
        gridPositions[j],
        gridPositions[i],
      ];
    }

    // Try grid positions
    for (const pos of gridPositions) {
      if (!isOverlapping(pos.x, pos.y, pieceWidth, pieceHeight, placedPieces)) {
        return pos;
      }
    }
  }

  // Strategy 3: Fallback to random positioning with collision detection
  let x,
    y,
    attempts = 0;
  const maxAttempts = 100;

  do {
    x = margin + Math.random() * containerWidth;
    y = margin + Math.random() * containerHeight;
    attempts++;
  } while (
    attempts < maxAttempts &&
    isOverlapping(x, y, pieceWidth, pieceHeight, placedPieces)
  );

  return { x, y };
}

export function generatePerimeterPositions(
  pieceWidth,
  pieceHeight,
  containerWidth,
  containerHeight,
  margin
) {
  const positions = [];
  const spacing = 80; // Space between perimeter positions

  // Top edge
  for (let x = margin; x <= containerWidth - pieceWidth; x += spacing) {
    positions.push({
      x: x + Math.random() * 30 - 15,
      y: margin + Math.random() * 20,
    });
  }

  // Bottom edge
  for (let x = margin; x <= containerWidth - pieceWidth; x += spacing) {
    positions.push({
      x: x + Math.random() * 30 - 15,
      y: containerHeight - pieceHeight + Math.random() * 20 - 10,
    });
  }

  // Left edge
  for (
    let y = margin + spacing;
    y <= containerHeight - pieceHeight - spacing;
    y += spacing
  ) {
    positions.push({
      x: margin + Math.random() * 20,
      y: y + Math.random() * 30 - 15,
    });
  }

  // Right edge
  for (
    let y = margin + spacing;
    y <= containerHeight - pieceHeight - spacing;
    y += spacing
  ) {
    positions.push({
      x: containerWidth - pieceWidth + Math.random() * 20 - 10,
      y: y + Math.random() * 30 - 15,
    });
  }

  // Shuffle perimeter positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  return positions;
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
