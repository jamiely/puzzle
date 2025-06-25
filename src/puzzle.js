export let puzzleActive = false;
let puzzlePieces = [];
let currentDraggedPiece = null;

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

  // Shuffle pieces for puzzle challenge
  const shuffledPieces = shuffleArray([...pieces]);
  puzzlePieces = shuffledPieces;

  shuffledPieces.forEach((piece, index) => {
    const pieceContainer = document.createElement('div');
    pieceContainer.className = 'puzzle-piece';
    pieceContainer.dataset.position = index;
    pieceContainer.appendChild(piece.canvas);

    // Make piece draggable
    makePieceDraggable(pieceContainer, piece, index);

    puzzleContainer.appendChild(pieceContainer);
  });
}

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function makePieceDraggable(container, piece, position) {
  container.draggable = true;

  container.addEventListener('dragstart', (e) => {
    currentDraggedPiece = { container, piece, position };
    container.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  container.addEventListener('dragend', () => {
    container.classList.remove('dragging');
    currentDraggedPiece = null;
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    if (currentDraggedPiece && currentDraggedPiece.container !== container) {
      swapPieces(currentDraggedPiece, {
        container,
        piece: puzzlePieces[parseInt(container.dataset.position)],
        position: parseInt(container.dataset.position),
      });
    }
  });
}

function swapPieces(piece1, piece2) {
  // Swap the canvas elements
  const temp = piece1.container.firstChild;
  piece1.container.appendChild(piece2.container.firstChild);
  piece2.container.appendChild(temp);

  // Update the pieces array
  const tempPiece = puzzlePieces[piece1.position];
  puzzlePieces[piece1.position] = puzzlePieces[piece2.position];
  puzzlePieces[piece2.position] = tempPiece;

  // Update current positions
  puzzlePieces[piece1.position].currentPosition = piece1.position;
  puzzlePieces[piece2.position].currentPosition = piece2.position;

  checkPuzzleCompletion();
}

function checkPuzzleCompletion() {
  const isComplete = puzzlePieces.every(
    (piece, index) => piece.originalPosition === index
  );

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
