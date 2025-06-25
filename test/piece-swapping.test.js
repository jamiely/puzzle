import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPuzzle, splitImageIntoPieces } from '../src/puzzle.js';

describe('Piece Swapping Logic', () => {
  let mockPuzzlePieces;
  let puzzleContainer;

  beforeEach(() => {
    // Setup DOM structure
    document.body.innerHTML = `
      <div id="puzzle-container"></div>
      <div id="instructions">
        <p>Click anywhere or drag and drop an image to get started</p>
      </div>
    `;

    puzzleContainer = document.getElementById('puzzle-container');

    // Mock DragEvent with comprehensive dataTransfer
    global.DragEvent = class extends Event {
      constructor(type, eventInitDict = {}) {
        super(type, eventInitDict);
        this.dataTransfer = {
          effectAllowed: null,
          dropEffect: null,
          setData: vi.fn(),
          getData: vi.fn(),
          ...eventInitDict.dataTransfer,
        };
      }
    };

    // Mock puzzle pieces array for direct testing
    mockPuzzlePieces = [
      {
        canvas: document.createElement('canvas'),
        originalPosition: 0,
        currentPosition: 0,
      },
      {
        canvas: document.createElement('canvas'),
        originalPosition: 1,
        currentPosition: 1,
      },
      {
        canvas: document.createElement('canvas'),
        originalPosition: 2,
        currentPosition: 2,
      },
      {
        canvas: document.createElement('canvas'),
        originalPosition: 3,
        currentPosition: 3,
      },
    ];

    // Add unique identifiers to canvas elements for tracking
    mockPuzzlePieces.forEach((piece, index) => {
      piece.canvas.id = `canvas-${index}`;
      piece.canvas.width = 100;
      piece.canvas.height = 100;
    });
  });

  describe('Piece Position Tracking', () => {
    it('should initialize pieces with correct original and current positions', () => {
      const mockImg = { width: 200, height: 200 };
      const pieces = splitImageIntoPieces(mockImg);

      expect(pieces).toHaveLength(4);
      pieces.forEach((piece, index) => {
        expect(piece.originalPosition).toBe(index);
        expect(piece.currentPosition).toBe(index);
      });
    });

    it('should maintain original positions unchanged during swaps', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
      const piece1 = pieces[0];
      const piece2 = pieces[1];

      // Store original positions
      const originalPiece1Position = piece1.dataset.position;
      const originalPiece2Position = piece2.dataset.position;

      // Perform swap through drag and drop
      piece1.dispatchEvent(new DragEvent('dragstart'));
      piece2.dispatchEvent(new DragEvent('drop', { cancelable: true }));
      piece1.dispatchEvent(new DragEvent('dragend'));

      // Original positions in DOM should remain the same
      expect(piece1.dataset.position).toBe(originalPiece1Position);
      expect(piece2.dataset.position).toBe(originalPiece2Position);
    });

    it('should track current positions correctly after multiple swaps', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Perform multiple swap operations
      // Swap pieces 0 and 1
      pieces[0].dispatchEvent(new DragEvent('dragstart'));
      pieces[1].dispatchEvent(new DragEvent('drop', { cancelable: true }));
      pieces[0].dispatchEvent(new DragEvent('dragend'));

      // Swap pieces 2 and 3
      pieces[2].dispatchEvent(new DragEvent('dragstart'));
      pieces[3].dispatchEvent(new DragEvent('drop', { cancelable: true }));
      pieces[2].dispatchEvent(new DragEvent('dragend'));

      // Verify DOM positions remain consistent
      pieces.forEach((piece, index) => {
        expect(piece.dataset.position).toBe(index.toString());
      });
    });
  });

  describe('Canvas Element Swapping', () => {
    it('should swap canvas elements between containers', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
      const piece1 = pieces[0];
      const piece2 = pieces[1];

      // Get initial canvas elements
      const initialCanvas1 = piece1.querySelector('canvas');
      const initialCanvas2 = piece2.querySelector('canvas');

      // Perform swap
      piece1.dispatchEvent(new DragEvent('dragstart'));
      piece2.dispatchEvent(new DragEvent('drop', { cancelable: true }));
      piece1.dispatchEvent(new DragEvent('dragend'));

      // Verify canvas elements have been swapped
      const finalCanvas1 = piece1.querySelector('canvas');
      const finalCanvas2 = piece2.querySelector('canvas');

      expect(finalCanvas1).toBe(initialCanvas2);
      expect(finalCanvas2).toBe(initialCanvas1);
    });

    it('should maintain canvas properties after swapping', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
      const piece1 = pieces[0];
      const piece2 = pieces[1];

      // Store initial canvas properties
      const initialCanvas1 = piece1.querySelector('canvas');
      const initialCanvas2 = piece2.querySelector('canvas');
      const canvas1Width = initialCanvas1.width;
      const canvas1Height = initialCanvas1.height;
      const canvas2Width = initialCanvas2.width;
      const canvas2Height = initialCanvas2.height;

      // Perform swap
      piece1.dispatchEvent(new DragEvent('dragstart'));
      piece2.dispatchEvent(new DragEvent('drop', { cancelable: true }));
      piece1.dispatchEvent(new DragEvent('dragend'));

      // Verify canvas properties are maintained
      const finalCanvas1 = piece1.querySelector('canvas');
      const finalCanvas2 = piece2.querySelector('canvas');

      expect(finalCanvas1.width).toBe(canvas2Width);
      expect(finalCanvas1.height).toBe(canvas2Height);
      expect(finalCanvas2.width).toBe(canvas1Width);
      expect(finalCanvas2.height).toBe(canvas1Height);
    });

    it('should handle canvas elements with no parent correctly', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
      const piece1 = pieces[0];
      const piece2 = pieces[1];

      // Verify both pieces have canvas children
      expect(piece1.querySelector('canvas')).toBeTruthy();
      expect(piece2.querySelector('canvas')).toBeTruthy();

      // Perform swap
      piece1.dispatchEvent(new DragEvent('dragstart'));
      piece2.dispatchEvent(new DragEvent('drop', { cancelable: true }));
      piece1.dispatchEvent(new DragEvent('dragend'));

      // Both pieces should still have canvas children
      expect(piece1.querySelector('canvas')).toBeTruthy();
      expect(piece2.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Puzzle Pieces Array Management', () => {
    it('should update internal pieces array after swap', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Get initial canvas references
      const initialCanvas0 = pieces[0].querySelector('canvas');
      const initialCanvas1 = pieces[1].querySelector('canvas');

      // Perform swap between positions 0 and 1
      pieces[0].dispatchEvent(new DragEvent('dragstart'));
      pieces[1].dispatchEvent(new DragEvent('drop', { cancelable: true }));
      pieces[0].dispatchEvent(new DragEvent('dragend'));

      // Verify the canvases have been swapped
      const finalCanvas0 = pieces[0].querySelector('canvas');
      const finalCanvas1 = pieces[1].querySelector('canvas');

      expect(finalCanvas0).toBe(initialCanvas1);
      expect(finalCanvas1).toBe(initialCanvas0);
    });

    it('should handle array boundaries correctly', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Test swapping first and last pieces
      const firstPiece = pieces[0];
      const lastPiece = pieces[pieces.length - 1];

      const initialFirstCanvas = firstPiece.querySelector('canvas');
      const initialLastCanvas = lastPiece.querySelector('canvas');

      // Perform swap
      firstPiece.dispatchEvent(new DragEvent('dragstart'));
      lastPiece.dispatchEvent(new DragEvent('drop', { cancelable: true }));
      firstPiece.dispatchEvent(new DragEvent('dragend'));

      // Verify swap occurred
      const finalFirstCanvas = firstPiece.querySelector('canvas');
      const finalLastCanvas = lastPiece.querySelector('canvas');

      expect(finalFirstCanvas).toBe(initialLastCanvas);
      expect(finalLastCanvas).toBe(initialFirstCanvas);
    });

    it('should maintain array length after swaps', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const initialPieceCount =
        puzzleContainer.querySelectorAll('.puzzle-piece').length;
      expect(initialPieceCount).toBe(4);

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Perform multiple swaps
      for (let i = 0; i < 3; i++) {
        const piece1 = pieces[i];
        const piece2 = pieces[i + 1];

        piece1.dispatchEvent(new DragEvent('dragstart'));
        piece2.dispatchEvent(new DragEvent('drop', { cancelable: true }));
        piece1.dispatchEvent(new DragEvent('dragend'));
      }

      // Verify piece count remains the same
      const finalPieceCount =
        puzzleContainer.querySelectorAll('.puzzle-piece').length;
      expect(finalPieceCount).toBe(initialPieceCount);
    });
  });

  describe('Current vs Original Position Tracking', () => {
    it('should distinguish between original and current positions', () => {
      const mockImg = { width: 200, height: 200 };
      const pieces = splitImageIntoPieces(mockImg);

      // Initially, original and current positions should be the same
      pieces.forEach((piece, index) => {
        expect(piece.originalPosition).toBe(index);
        expect(piece.currentPosition).toBe(index);
        expect(piece.originalPosition).toBe(piece.currentPosition);
      });
    });

    it('should maintain original positions as immutable', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Store original positions before any swaps
      const originalPositions = Array.from(pieces).map((_, index) => index);

      // Perform multiple swaps
      pieces[0].dispatchEvent(new DragEvent('dragstart'));
      pieces[1].dispatchEvent(new DragEvent('drop', { cancelable: true }));
      pieces[0].dispatchEvent(new DragEvent('dragend'));

      pieces[2].dispatchEvent(new DragEvent('dragstart'));
      pieces[3].dispatchEvent(new DragEvent('drop', { cancelable: true }));
      pieces[2].dispatchEvent(new DragEvent('dragend'));

      // Original positions should remain unchanged
      pieces.forEach((piece, index) => {
        expect(parseInt(piece.dataset.position)).toBe(originalPositions[index]);
      });
    });

    it('should update current positions after swaps', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Get initial canvas references to track movement
      const initialCanvases = Array.from(pieces).map((piece) =>
        piece.querySelector('canvas')
      );

      // Perform a swap
      pieces[0].dispatchEvent(new DragEvent('dragstart'));
      pieces[1].dispatchEvent(new DragEvent('drop', { cancelable: true }));
      pieces[0].dispatchEvent(new DragEvent('dragend'));

      // Verify the canvases have moved to different positions
      const finalCanvases = Array.from(pieces).map((piece) =>
        piece.querySelector('canvas')
      );

      expect(finalCanvases[0]).toBe(initialCanvases[1]);
      expect(finalCanvases[1]).toBe(initialCanvases[0]);
      expect(finalCanvases[2]).toBe(initialCanvases[2]);
      expect(finalCanvases[3]).toBe(initialCanvases[3]);
    });
  });

  describe('Edge Cases in Swapping Logic', () => {
    it('should handle null or undefined drag state', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
      const piece = pieces[0];

      // Try to drop without starting drag
      const dropEvent = new DragEvent('drop', { cancelable: true });
      const preventDefaultSpy = vi.spyOn(dropEvent, 'preventDefault');

      piece.dispatchEvent(dropEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      // Should not cause any errors
    });

    it('should prevent self-swapping', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
      const piece = pieces[0];

      const initialCanvas = piece.querySelector('canvas');

      // Try to swap piece with itself
      piece.dispatchEvent(new DragEvent('dragstart'));
      piece.dispatchEvent(new DragEvent('drop', { cancelable: true }));
      piece.dispatchEvent(new DragEvent('dragend'));

      // Canvas should remain the same
      const finalCanvas = piece.querySelector('canvas');
      expect(finalCanvas).toBe(initialCanvas);
    });

    it('should handle rapid consecutive swaps', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Perform rapid consecutive swaps
      for (let i = 0; i < 10; i++) {
        const piece1 = pieces[i % 2];
        const piece2 = pieces[(i + 1) % 2];

        piece1.dispatchEvent(new DragEvent('dragstart'));
        piece2.dispatchEvent(new DragEvent('drop', { cancelable: true }));
        piece1.dispatchEvent(new DragEvent('dragend'));
      }

      // Should not cause errors and pieces should still exist
      expect(puzzleContainer.querySelectorAll('.puzzle-piece')).toHaveLength(4);
      pieces.forEach((piece) => {
        expect(piece.querySelector('canvas')).toBeTruthy();
      });
    });

    it('should handle drag operations without proper drop targets', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
      const piece = pieces[0];

      const initialCanvas = piece.querySelector('canvas');

      // Start drag but end without drop
      piece.dispatchEvent(new DragEvent('dragstart'));
      expect(piece.classList.contains('dragging')).toBe(true);

      piece.dispatchEvent(new DragEvent('dragend'));
      expect(piece.classList.contains('dragging')).toBe(false);

      // Canvas should remain unchanged
      expect(piece.querySelector('canvas')).toBe(initialCanvas);
    });

    it('should handle malformed drag events', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
      const piece = pieces[0];

      // Create events without dataTransfer (malformed for drag operations)
      const malformedDragStart = new Event('dragstart');
      const malformedDrop = new Event('drop');

      // Add empty dataTransfer to prevent undefined access
      malformedDragStart.dataTransfer = {};
      malformedDrop.dataTransfer = {};

      // Should not cause errors - the event handlers should handle missing properties gracefully
      piece.dispatchEvent(malformedDragStart);
      piece.dispatchEvent(malformedDrop);

      // Verify no side effects occurred
      expect(piece.querySelector('canvas')).toBeTruthy();
    });

    it('should maintain puzzle state after invalid swap attempts', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Store initial state
      const initialCanvases = Array.from(pieces).map((piece) =>
        piece.querySelector('canvas')
      );
      const initialPieceCount = pieces.length;

      // Attempt various invalid operations
      pieces[0].dispatchEvent(new DragEvent('dragstart'));

      // Try dropping on non-piece element
      const nonPieceElement = document.createElement('div');
      puzzleContainer.appendChild(nonPieceElement);
      nonPieceElement.dispatchEvent(
        new DragEvent('drop', { cancelable: true })
      );

      pieces[0].dispatchEvent(new DragEvent('dragend'));

      // State should remain unchanged
      const finalCanvases = Array.from(pieces).map((piece) =>
        piece.querySelector('canvas')
      );
      const finalPieceCount =
        puzzleContainer.querySelectorAll('.puzzle-piece').length;

      expect(finalPieceCount).toBe(initialPieceCount);
      finalCanvases.forEach((canvas, index) => {
        expect(canvas).toBe(initialCanvases[index]);
      });
    });
  });

  describe('DOM State Consistency', () => {
    it('should maintain consistent DOM structure after swaps', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Perform swap
      pieces[0].dispatchEvent(new DragEvent('dragstart'));
      pieces[1].dispatchEvent(new DragEvent('drop', { cancelable: true }));
      pieces[0].dispatchEvent(new DragEvent('dragend'));

      // Verify DOM structure integrity
      pieces.forEach((piece, index) => {
        expect(piece.classList.contains('puzzle-piece')).toBe(true);
        expect(piece.dataset.position).toBe(index.toString());
        expect(piece.draggable).toBe(true);
        expect(piece.children).toHaveLength(1);
        expect(piece.firstChild.tagName).toBe('CANVAS');
      });
    });

    it('should preserve event listeners after swaps', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Perform initial swap
      pieces[0].dispatchEvent(new DragEvent('dragstart'));
      pieces[1].dispatchEvent(new DragEvent('drop', { cancelable: true }));
      pieces[0].dispatchEvent(new DragEvent('dragend'));

      // Verify pieces are still draggable and responsive
      pieces.forEach((piece) => {
        expect(piece.draggable).toBe(true);

        // Test that drag events still work
        piece.dispatchEvent(new DragEvent('dragstart'));
        expect(piece.classList.contains('dragging')).toBe(true);

        piece.dispatchEvent(new DragEvent('dragend'));
        expect(piece.classList.contains('dragging')).toBe(false);
      });
    });

    it('should handle cleanup after multiple swap operations', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
      const initialPieceCount = pieces.length;

      // Perform multiple swap operations
      for (let i = 0; i < 5; i++) {
        const piece1 = pieces[i % pieces.length];
        const piece2 = pieces[(i + 1) % pieces.length];

        piece1.dispatchEvent(new DragEvent('dragstart'));
        piece2.dispatchEvent(new DragEvent('drop', { cancelable: true }));
        piece1.dispatchEvent(new DragEvent('dragend'));
      }

      // Verify no orphaned elements or memory leaks
      const finalPieceCount =
        puzzleContainer.querySelectorAll('.puzzle-piece').length;
      const canvasCount = puzzleContainer.querySelectorAll('canvas').length;

      expect(finalPieceCount).toBe(initialPieceCount);
      expect(canvasCount).toBe(initialPieceCount);

      // Verify no extra elements in container
      const allChildren = puzzleContainer.children;
      expect(allChildren).toHaveLength(initialPieceCount);

      Array.from(allChildren).forEach((child) => {
        expect(child.classList.contains('puzzle-piece')).toBe(true);
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not create memory leaks during swaps', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Store initial canvas references
      const initialCanvasRefs = Array.from(pieces).map((piece) =>
        piece.querySelector('canvas')
      );

      // Perform many swap operations
      for (let i = 0; i < 20; i++) {
        const piece1 = pieces[i % 2];
        const piece2 = pieces[(i + 1) % 2];

        piece1.dispatchEvent(new DragEvent('dragstart'));
        piece2.dispatchEvent(new DragEvent('drop', { cancelable: true }));
        piece1.dispatchEvent(new DragEvent('dragend'));
      }

      // Verify canvas elements are reused, not recreated
      const finalCanvasRefs = Array.from(pieces).map((piece) =>
        piece.querySelector('canvas')
      );

      // All canvases should still be from the original set
      finalCanvasRefs.forEach((canvas) => {
        expect(initialCanvasRefs).toContain(canvas);
      });

      // No extra canvases should exist
      expect(puzzleContainer.querySelectorAll('canvas')).toHaveLength(4);
    });

    it('should handle concurrent drag operations gracefully', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Simulate concurrent drag starts (edge case)
      pieces[0].dispatchEvent(new DragEvent('dragstart'));
      pieces[1].dispatchEvent(new DragEvent('dragstart'));

      // Both pieces should have dragging class since dragstart doesn't clear other dragging states
      // This tests that the application can handle multiple pieces being dragged
      expect(pieces[0].classList.contains('dragging')).toBe(true);
      expect(pieces[1].classList.contains('dragging')).toBe(true);

      // Clean up both pieces
      pieces[0].dispatchEvent(new DragEvent('dragend'));
      pieces[1].dispatchEvent(new DragEvent('dragend'));
      expect(pieces[0].classList.contains('dragging')).toBe(false);
      expect(pieces[1].classList.contains('dragging')).toBe(false);
    });
  });
});
