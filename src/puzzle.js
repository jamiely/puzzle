export let puzzleActive = false;

export function createPuzzle(imageSrc) {
  const img = new Image();
  img.onload = () => {
    const pieces = splitImageIntoPieces(img);
    displayPuzzle(pieces);
  };
  img.src = imageSrc;
}

export function splitImageIntoPieces(img) {
  const pieceWidth = img.width / 2;
  const pieceHeight = img.height / 2;
  const pieces = [];

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = pieceWidth;
      canvas.height = pieceHeight;

      ctx.drawImage(
        img,
        col * pieceWidth,
        row * pieceHeight,
        pieceWidth,
        pieceHeight,
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

export function displayPuzzle(pieces) {
  const puzzleContainer = document.getElementById('puzzle-container');
  const instructions = document.getElementById('instructions');

  puzzleContainer.innerHTML = '';
  puzzleContainer.style.display = 'grid';
  instructions.style.display = 'none';
  puzzleActive = true;

  pieces.forEach((piece, index) => {
    const pieceContainer = document.createElement('div');
    pieceContainer.className = 'puzzle-piece';
    pieceContainer.appendChild(piece.canvas);
    puzzleContainer.appendChild(pieceContainer);
  });
}

export function handleFile(file) {
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      createPuzzle(e.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    alert('Please select an image file.');
  }
}
