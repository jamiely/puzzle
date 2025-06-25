import { updatePieceTransform } from './positioning.js';
import { checkPuzzleCompletion } from './completion.js';
import { getPuzzlePieces } from './puzzle.js';
import { updatePieceIdPositions } from './debug.js';

// Interaction state
let selectedPiece = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let currentDraggedPiece = null;

export function makePieceInteractive(container, piece, position) {
  container.tabIndex = 0; // Make focusable for keyboard events

  // Add legacy drag and drop support for tests
  container.draggable = true;

  // Legacy HTML5 drag and drop events (for test compatibility)
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
        piece: getPuzzlePieces()[parseInt(container.dataset.position)],
        position: parseInt(container.dataset.position),
      });
    }
  });

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
  updatePieceIdPositions();
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

export function handleKeyDown(e) {
  if (!selectedPiece) return;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      selectedPiece.rotation -= 30;
      updatePieceTransform(selectedPiece);
      updatePieceIdPositions();
      checkPuzzleCompletion();
      break;
    case 'ArrowRight':
      e.preventDefault();
      selectedPiece.rotation += 30;
      updatePieceTransform(selectedPiece);
      updatePieceIdPositions();
      checkPuzzleCompletion();
      break;
  }
}

// Legacy swap function - kept for backwards compatibility with tests
export function swapPieces(piece1, piece2) {
  // Swap the canvas elements
  const temp = piece1.container.firstChild;
  piece1.container.appendChild(piece2.container.firstChild);
  piece2.container.appendChild(temp);

  // Update the pieces array
  const puzzlePieces = getPuzzlePieces();
  const tempPiece = puzzlePieces[piece1.position];
  puzzlePieces[piece1.position] = puzzlePieces[piece2.position];
  puzzlePieces[piece2.position] = tempPiece;

  // Update current positions
  puzzlePieces[piece1.position].currentPosition = piece1.position;
  puzzlePieces[piece2.position].currentPosition = piece2.position;

  checkPuzzleCompletion();
}

// Export getters for state (needed for tests)
export function getSelectedPiece() {
  return selectedPiece;
}

export function getIsDragging() {
  return isDragging;
}

export function getCurrentDraggedPiece() {
  return currentDraggedPiece;
}
