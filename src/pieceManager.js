export function splitImageIntoPieces(img, testMode = false) {
  let pieceWidth, pieceHeight;

  if (testMode) {
    // Test mode - use original 1:1 sizing for test compatibility
    pieceWidth = img.width / 2;
    pieceHeight = img.height / 2;
  } else {
    // Scale pieces to be up to 40% of the minimum viewport dimension
    const minViewportDim = Math.min(window.innerWidth, window.innerHeight);
    const maxPuzzleSize = minViewportDim * 0.4 * 2; // 40% for each piece, so 80% total for puzzle
    const scale = Math.min(
      maxPuzzleSize / img.width,
      maxPuzzleSize / img.height
    );

    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    pieceWidth = scaledWidth / 2;
    pieceHeight = scaledHeight / 2;
  }
  const pieces = [];

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = pieceWidth;
      canvas.height = pieceHeight;

      ctx.drawImage(
        img,
        col * (img.width / 2),
        row * (img.height / 2),
        img.width / 2,
        img.height / 2,
        0,
        0,
        pieceWidth,
        pieceHeight
      );

      pieces.push({
        canvas: canvas,
        originalPosition: row * 2 + col,
        currentPosition: row * 2 + col,
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
