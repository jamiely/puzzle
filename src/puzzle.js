export let puzzleActive = false;
let puzzlePieces = [];
let currentDraggedPiece = null;
let selectedPiece = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

export function createPuzzle(imageSrc) {
  const img = new Image();
  img.onload = () => {
    const pieces = splitImageIntoPieces(img);
    displayPuzzle(pieces);
  };
  img.src = imageSrc;
}

export function splitImageIntoPieces(img) {
  // Scale pieces to be up to 40% of the minimum viewport dimension
  const minViewportDim = Math.min(window.innerWidth, window.innerHeight);
  const maxPuzzleSize = minViewportDim * 0.4 * 2; // 40% for each piece, so 80% total for puzzle
  const scale = Math.min(maxPuzzleSize / img.width, maxPuzzleSize / img.height);
  
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;
  const pieceWidth = scaledWidth / 2;
  const pieceHeight = scaledHeight / 2;
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

export function displayPuzzle(pieces) {
  const puzzleContainer = document.getElementById('puzzle-container');
  const instructions = document.getElementById('instructions');

  puzzleContainer.innerHTML = '';
  puzzleContainer.style.display = 'block';
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
    
    // Position pieces in a scattered pattern, accounting for piece size and avoiding overlaps
    const pieceWidth = piece.canvas.width;
    const pieceHeight = piece.canvas.height;
    const containerWidth = window.innerWidth - pieceWidth - 20;
    const containerHeight = window.innerHeight - pieceHeight - 20;
    
    let x, y, attempts = 0;
    const maxAttempts = 50;
    
    // Try to find a non-overlapping position
    do {
      x = 10 + Math.random() * containerWidth;
      y = 10 + Math.random() * containerHeight;
      attempts++;
    } while (attempts < maxAttempts && isOverlapping(x, y, pieceWidth, pieceHeight, placedPieces));
    
    // Random rotation in increments of 30 degrees (0, 30, 60, 90, 120, etc.)
    const rotationOptions = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    const randomRotation = rotationOptions[Math.floor(Math.random() * rotationOptions.length)];
    
    pieceContainer.style.left = `${x}px`;
    pieceContainer.style.top = `${y}px`;
    pieceContainer.style.transform = `rotate(${randomRotation}deg)`;
    
    // Store position and rotation data
    piece.x = x;
    piece.y = y;
    piece.rotation = randomRotation;
    piece.element = pieceContainer;
    
    // Add to placed pieces for collision detection
    placedPieces.push({ x, y, width: pieceWidth, height: pieceHeight });

    // Make piece draggable and selectable
    makePieceInteractive(pieceContainer, piece, index);

    puzzleContainer.appendChild(pieceContainer);
  });
  
  // Add keyboard event listener for rotation
  document.addEventListener('keydown', handleKeyDown);
}

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function isOverlapping(x, y, width, height, placedPieces) {
  const padding = 20; // Minimum space between pieces
  return placedPieces.some(placed => {
    return x < placed.x + placed.width + padding &&
           x + width + padding > placed.x &&
           y < placed.y + placed.height + padding &&
           y + height + padding > placed.y;
  });
}

function makePieceInteractive(container, piece, position) {
  container.tabIndex = 0; // Make focusable for keyboard events
  
  // Mouse down - start drag
  container.addEventListener('mousedown', (e) => {
    e.preventDefault();
    selectPiece(piece);
    
    const rect = container.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    isDragging = true;
    container.classList.add('dragging');
    
    // Add global mouse move and up listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });
  
  // Click to select
  container.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isDragging) {
      selectPiece(piece);
    }
  });
}

function handleMouseMove(e) {
  if (!isDragging || !selectedPiece) return;
  
  const x = e.clientX - dragOffset.x;
  const y = e.clientY - dragOffset.y;
  
  // Keep pieces within viewport bounds
  const maxX = window.innerWidth - selectedPiece.element.offsetWidth;
  const maxY = window.innerHeight - selectedPiece.element.offsetHeight;
  
  const clampedX = Math.max(0, Math.min(x, maxX));
  const clampedY = Math.max(0, Math.min(y, maxY));
  
  selectedPiece.x = clampedX;
  selectedPiece.y = clampedY;
  
  updatePieceTransform(selectedPiece);
}

function handleMouseUp() {
  if (isDragging && selectedPiece) {
    selectedPiece.element.classList.remove('dragging');
    isDragging = false;
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    checkPuzzleCompletion();
  }
}

function selectPiece(piece) {
  // Deselect previous piece
  if (selectedPiece) {
    selectedPiece.element.classList.remove('selected');
  }
  
  // Select new piece
  selectedPiece = piece;
  piece.element.classList.add('selected');
  piece.element.focus();
}

function updatePieceTransform(piece) {
  piece.element.style.left = `${piece.x}px`;
  piece.element.style.top = `${piece.y}px`;
  piece.element.style.transform = `rotate(${piece.rotation}deg)`;
}

function handleKeyDown(e) {
  if (!selectedPiece) return;
  
  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      selectedPiece.rotation -= 30;
      updatePieceTransform(selectedPiece);
      checkPuzzleCompletion();
      break;
    case 'ArrowRight':
      e.preventDefault();
      selectedPiece.rotation += 30;
      updatePieceTransform(selectedPiece);
      checkPuzzleCompletion();
      break;
  }
}

// Legacy swap function - no longer used in free positioning mode
// Kept for backwards compatibility with tests
function swapPieces(piece1, piece2) {
  // This function is not used in free positioning mode
  // Pieces are positioned arbitrarily by dragging
}

function checkPuzzleCompletion() {
  // For free positioning mode, check if pieces are positioned correctly relative to each other
  // and have correct rotation (0 degrees or multiples of 360)
  const tolerance = 50; // pixels
  const rotationTolerance = 15; // degrees
  
  // Define the expected relative positions (2x2 grid)
  const expectedLayout = [
    { row: 0, col: 0 }, // top-left
    { row: 0, col: 1 }, // top-right  
    { row: 1, col: 0 }, // bottom-left
    { row: 1, col: 1 }, // bottom-right
  ];
  
  // Check if all pieces are properly rotated (close to 0, 360, 720, etc.)
  const allRotatedCorrectly = puzzlePieces.every(piece => {
    const normalizedRotation = ((piece.rotation % 360) + 360) % 360;
    return Math.abs(normalizedRotation) < rotationTolerance || 
           Math.abs(normalizedRotation - 360) < rotationTolerance;
  });
  
  if (!allRotatedCorrectly) return;
  
  // Find the piece that should be top-left (originalPosition 0)
  const topLeftPiece = puzzlePieces.find(piece => piece.originalPosition === 0);
  if (!topLeftPiece) return;
  
  // Use top-left piece as reference point
  const baseX = topLeftPiece.x;
  const baseY = topLeftPiece.y;
  const pieceWidth = topLeftPiece.canvas.width;
  const pieceHeight = topLeftPiece.canvas.height;
  
  // Check if all pieces are in correct relative positions
  const isComplete = puzzlePieces.every(piece => {
    const expectedPos = expectedLayout[piece.originalPosition];
    const expectedX = baseX + (expectedPos.col * pieceWidth);
    const expectedY = baseY + (expectedPos.row * pieceHeight);
    
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
