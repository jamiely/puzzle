export function splitImageIntoPieces(
  img,
  testMode = false,
  rows = 2,
  cols = 2
) {
  let pieceWidth, pieceHeight;

  if (testMode) {
    // Test mode - use original 1:1 sizing for test compatibility
    pieceWidth = img.width / cols;
    pieceHeight = img.height / rows;
  } else {
    // Scale pieces to be up to 40% of the minimum viewport dimension
    const minViewportDim = Math.min(window.innerWidth, window.innerHeight);
    const maxPuzzleSize = minViewportDim * 0.4 * Math.max(rows, cols); // Scale based on grid size
    const scale = Math.min(
      maxPuzzleSize / img.width,
      maxPuzzleSize / img.height
    );

    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    pieceWidth = scaledWidth / cols;
    pieceHeight = scaledHeight / rows;
  }
  const pieces = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = pieceWidth;
      canvas.height = pieceHeight;

      ctx.drawImage(
        img,
        col * (img.width / cols),
        row * (img.height / rows),
        img.width / cols,
        img.height / rows,
        0,
        0,
        pieceWidth,
        pieceHeight
      );

      pieces.push({
        canvas: canvas,
        originalPosition: row * cols + col,
        currentPosition: row * cols + col,
        testMode: testMode,
      });
    }
  }

  return pieces;
}

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function handleFile(file, createPuzzleCallback) {
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      createPuzzleCallback(e.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    alert('Please select an image file.');
  }
}
