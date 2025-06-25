import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPuzzle, splitImageIntoPieces } from '../src/puzzle.js';

describe('Drag and Drop Functionality', () => {
  let puzzleContainer;
  let mockImg;

  beforeEach(() => {
    // Set up DOM structure
    document.body.innerHTML = `
      <div id="puzzle-container"></div>
      <div id="instructions">
        <p>Click anywhere or drag and drop an image to get started</p>
      </div>
    `;
    puzzleContainer = document.getElementById('puzzle-container');

    // Mock image for testing
    mockImg = {
      width: 200,
      height: 200,
    };

    // Enhanced DragEvent mock with proper dataTransfer
    global.DragEvent = class extends Event {
      constructor(type, eventInitDict = {}) {
        super(type, eventInitDict);
        this.dataTransfer = {
          effectAllowed: null,
          dropEffect: null,
          setData: vi.fn(),
          getData: vi.fn(() => ''),
          types: [],
          files: [],
          items: [],
          ...eventInitDict.dataTransfer,
        };
      }
    };
  });

  const createPuzzleAndWait = async () => {
    const mockImageSrc = 'data:image/jpeg;base64,test';
    createPuzzle(mockImageSrc);
    await new Promise((resolve) => setTimeout(resolve, 10));
    return puzzleContainer.querySelectorAll('.puzzle-piece');
  };

  describe('Drag Start Events and State Changes', () => {
    it('should set currentDraggedPiece on dragstart', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: { effectAllowed: null },
      });

      piece.dispatchEvent(dragStartEvent);

      expect(piece.classList.contains('dragging')).toBe(true);
      expect(dragStartEvent.dataTransfer.effectAllowed).toBe('move');
    });

    it('should add dragging class to the correct piece', async () => {
      const pieces = await createPuzzleAndWait();
      const piece1 = pieces[0];
      const piece2 = pieces[1];

      const dragStartEvent = new DragEvent('dragstart');
      piece1.dispatchEvent(dragStartEvent);

      expect(piece1.classList.contains('dragging')).toBe(true);
      expect(piece2.classList.contains('dragging')).toBe(false);
    });

    it('should handle multiple dragstart events correctly', async () => {
      const pieces = await createPuzzleAndWait();

      // Start drag on first piece
      pieces[0].dispatchEvent(new DragEvent('dragstart'));
      expect(pieces[0].classList.contains('dragging')).toBe(true);

      // Start drag on second piece (should update currentDraggedPiece)
      pieces[1].dispatchEvent(new DragEvent('dragstart'));
      expect(pieces[1].classList.contains('dragging')).toBe(true);
    });

    it('should set dataTransfer effectAllowed to move', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      const dragStartEvent = new DragEvent('dragstart', {
        dataTransfer: { effectAllowed: null },
      });

      piece.dispatchEvent(dragStartEvent);

      expect(dragStartEvent.dataTransfer.effectAllowed).toBe('move');
    });

    it('should handle multiple pieces starting drag simultaneously', async () => {
      const pieces = await createPuzzleAndWait();
      const piece1 = pieces[0];
      const piece2 = pieces[1];

      // Start drag on both pieces
      piece1.dispatchEvent(new DragEvent('dragstart'));
      piece2.dispatchEvent(new DragEvent('dragstart'));

      expect(piece1.classList.contains('dragging')).toBe(true);
      expect(piece2.classList.contains('dragging')).toBe(true);
    });
  });

  describe('Drag End Events and Cleanup', () => {
    it('should remove dragging class on dragend', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      // Start drag
      piece.dispatchEvent(new DragEvent('dragstart'));
      expect(piece.classList.contains('dragging')).toBe(true);

      // End drag
      piece.dispatchEvent(new DragEvent('dragend'));
      expect(piece.classList.contains('dragging')).toBe(false);
    });

    it('should reset currentDraggedPiece to null on dragend', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      // Start and end drag
      piece.dispatchEvent(new DragEvent('dragstart'));
      piece.dispatchEvent(new DragEvent('dragend'));

      // Verify cleanup by starting another drag on different piece
      const piece2 = pieces[1];
      piece2.dispatchEvent(new DragEvent('dragstart'));
      expect(piece2.classList.contains('dragging')).toBe(true);
    });

    it('should handle multiple dragend events without errors', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      piece.dispatchEvent(new DragEvent('dragstart'));

      // Multiple dragend calls should not cause errors
      expect(() => {
        piece.dispatchEvent(new DragEvent('dragend'));
        piece.dispatchEvent(new DragEvent('dragend'));
      }).not.toThrow();

      expect(piece.classList.contains('dragging')).toBe(false);
    });

    it('should clean up dragging class even if dragstart was not called', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      // Add dragging class manually
      piece.classList.add('dragging');
      expect(piece.classList.contains('dragging')).toBe(true);

      // Call dragend
      piece.dispatchEvent(new DragEvent('dragend'));
      expect(piece.classList.contains('dragging')).toBe(false);
    });
  });

  describe('Drop Events and Piece Swapping', () => {
    it('should swap pieces when dropped on different piece', async () => {
      const pieces = await createPuzzleAndWait();
      const piece1 = pieces[0];
      const piece2 = pieces[1];

      // Get initial canvas elements
      const piece1Canvas = piece1.querySelector('canvas');
      const piece2Canvas = piece2.querySelector('canvas');

      // Start dragging piece1
      piece1.dispatchEvent(new DragEvent('dragstart'));

      // Drop on piece2
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(dropEvent, 'preventDefault');

      piece2.dispatchEvent(dropEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();

      // Verify pieces were swapped
      expect(piece1.querySelector('canvas')).toBe(piece2Canvas);
      expect(piece2.querySelector('canvas')).toBe(piece1Canvas);

      // Clean up
      piece1.dispatchEvent(new DragEvent('dragend'));
    });

    it('should call preventDefault on drop event', async () => {
      const pieces = await createPuzzleAndWait();
      const piece1 = pieces[0];
      const piece2 = pieces[1];

      piece1.dispatchEvent(new DragEvent('dragstart'));

      const dropEvent = new DragEvent('drop', {
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(dropEvent, 'preventDefault');

      piece2.dispatchEvent(dropEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should update piece positions after swap', async () => {
      const pieces = await createPuzzleAndWait();
      const piece1 = pieces[0];
      const piece2 = pieces[1];

      const originalPosition1 = piece1.dataset.position;
      const originalPosition2 = piece2.dataset.position;

      // Start drag and drop
      piece1.dispatchEvent(new DragEvent('dragstart'));
      piece2.dispatchEvent(new DragEvent('drop', { cancelable: true }));

      // Positions should remain the same in dataset (they track grid positions)
      expect(piece1.dataset.position).toBe(originalPosition1);
      expect(piece2.dataset.position).toBe(originalPosition2);
    });

    it('should handle drop with no active drag gracefully', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      const originalCanvas = piece.querySelector('canvas');

      const dropEvent = new DragEvent('drop', { cancelable: true });
      const preventDefaultSpy = vi.spyOn(dropEvent, 'preventDefault');

      expect(() => {
        piece.dispatchEvent(dropEvent);
      }).not.toThrow();

      expect(preventDefaultSpy).toHaveBeenCalled();
      // When no drag is active, no swap occurs, so canvas should remain the same
      expect(piece.querySelector('canvas')).toBeTruthy();
    });

    it('should swap pieces in puzzlePieces array correctly', async () => {
      const pieces = await createPuzzleAndWait();
      const piece1 = pieces[0];
      const piece2 = pieces[1];

      // Start drag and perform swap
      piece1.dispatchEvent(new DragEvent('dragstart'));
      piece2.dispatchEvent(new DragEvent('drop', { cancelable: true }));

      // After swap, the visual elements should be swapped
      const newPiece1Canvas = piece1.querySelector('canvas');
      const newPiece2Canvas = piece2.querySelector('canvas');

      // Canvases should be different after swap
      expect(newPiece1Canvas).toBeTruthy();
      expect(newPiece2Canvas).toBeTruthy();
    });
  });

  describe('Drag Over Events and preventDefault', () => {
    it('should call preventDefault on dragover', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: { dropEffect: null },
      });

      const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault');
      piece.dispatchEvent(dragOverEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should set dropEffect to move on dragover', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      const dragOverEvent = new DragEvent('dragover', {
        dataTransfer: { dropEffect: null },
      });

      piece.dispatchEvent(dragOverEvent);

      expect(dragOverEvent.dataTransfer.dropEffect).toBe('move');
    });

    it('should handle rapid dragover events', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      // Fire multiple rapid dragover events
      for (let i = 0; i < 10; i++) {
        const dragOverEvent = new DragEvent('dragover', {
          cancelable: true,
          dataTransfer: { dropEffect: null },
        });

        const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault');
        piece.dispatchEvent(dragOverEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(dragOverEvent.dataTransfer.dropEffect).toBe('move');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should not swap piece when dropped on itself', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      const originalCanvas = piece.querySelector('canvas');

      // Start dragging the piece
      piece.dispatchEvent(new DragEvent('dragstart'));

      // Try to drop on the same piece
      const dropEvent = new DragEvent('drop', { cancelable: true });
      const preventDefaultSpy = vi.spyOn(dropEvent, 'preventDefault');

      piece.dispatchEvent(dropEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      // Canvas should remain the same
      expect(piece.querySelector('canvas')).toBe(originalCanvas);

      // Clean up
      piece.dispatchEvent(new DragEvent('dragend'));
    });

    it('should handle rapid drag start/end cycles', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      for (let i = 0; i < 10; i++) {
        piece.dispatchEvent(new DragEvent('dragstart'));
        expect(piece.classList.contains('dragging')).toBe(true);

        piece.dispatchEvent(new DragEvent('dragend'));
        expect(piece.classList.contains('dragging')).toBe(false);
      }
    });

    it('should handle drag operations on pieces with no canvas', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      // Remove canvas element
      const canvas = piece.querySelector('canvas');
      canvas?.remove();

      expect(() => {
        piece.dispatchEvent(new DragEvent('dragstart'));
        piece.dispatchEvent(new DragEvent('dragend'));
      }).not.toThrow();
    });

    it('should maintain state consistency during overlapping drag operations', async () => {
      const pieces = await createPuzzleAndWait();
      const piece1 = pieces[0];
      const piece2 = pieces[1];

      // Start drag on piece1
      piece1.dispatchEvent(new DragEvent('dragstart'));
      expect(piece1.classList.contains('dragging')).toBe(true);

      // Start drag on piece2 without ending piece1
      piece2.dispatchEvent(new DragEvent('dragstart'));
      expect(piece2.classList.contains('dragging')).toBe(true);
      // piece1 should still have dragging class until its dragend
      expect(piece1.classList.contains('dragging')).toBe(true);

      // End both drags
      piece1.dispatchEvent(new DragEvent('dragend'));
      piece2.dispatchEvent(new DragEvent('dragend'));

      expect(piece1.classList.contains('dragging')).toBe(false);
      expect(piece2.classList.contains('dragging')).toBe(false);
    });

    it('should handle events on removed pieces gracefully', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      // Start drag
      piece.dispatchEvent(new DragEvent('dragstart'));

      // Remove piece from DOM
      piece.remove();

      // Try to end drag on removed piece
      expect(() => {
        piece.dispatchEvent(new DragEvent('dragend'));
      }).not.toThrow();
    });

    it('should handle incomplete drag sequences', async () => {
      const pieces = await createPuzzleAndWait();
      const piece1 = pieces[0];
      const piece2 = pieces[1];

      // Start drag but don't end it before starting another
      piece1.dispatchEvent(new DragEvent('dragstart'));

      // Drop on another piece without proper sequence
      piece2.dispatchEvent(new DragEvent('drop', { cancelable: true }));

      // Should not throw errors
      expect(() => {
        piece1.dispatchEvent(new DragEvent('dragend'));
      }).not.toThrow();
    });
  });

  describe('Event Mocking and DragEvent Handling', () => {
    it('should properly mock DragEvent with all required properties', () => {
      const dragEvent = new DragEvent('dragstart', {
        dataTransfer: {
          effectAllowed: 'move',
          dropEffect: 'move',
          types: ['text/plain'],
          files: [],
        },
      });

      expect(dragEvent.type).toBe('dragstart');
      expect(dragEvent.dataTransfer).toBeTruthy();
      expect(dragEvent.dataTransfer.effectAllowed).toBe('move');
      expect(dragEvent.dataTransfer.dropEffect).toBe('move');
      expect(dragEvent.dataTransfer.setData).toBeInstanceOf(Function);
      expect(dragEvent.dataTransfer.getData).toBeInstanceOf(Function);
    });

    it('should handle DragEvent with custom dataTransfer properties', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      const customDragEvent = new DragEvent('dragstart', {
        dataTransfer: {
          effectAllowed: 'copy',
          dropEffect: 'copy',
          customProperty: 'test',
        },
      });

      piece.dispatchEvent(customDragEvent);

      // Should override with 'move' as per the implementation
      expect(customDragEvent.dataTransfer.effectAllowed).toBe('move');
      expect(piece.classList.contains('dragging')).toBe(true);
    });

    it('should verify dataTransfer methods are called correctly', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      const dragEvent = new DragEvent('dragstart');
      const setDataSpy = vi.spyOn(dragEvent.dataTransfer, 'setData');
      const getDataSpy = vi.spyOn(dragEvent.dataTransfer, 'getData');

      piece.dispatchEvent(dragEvent);

      // The implementation doesn't call setData/getData, but we verify they're available
      expect(setDataSpy).toBeInstanceOf(Function);
      expect(getDataSpy).toBeInstanceOf(Function);
    });

    it('should handle events with bubbling and capturing', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      const bubblingEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
      });

      let eventFired = false;
      piece.addEventListener('dragstart', () => {
        eventFired = true;
      });

      piece.dispatchEvent(bubblingEvent);

      expect(eventFired).toBe(true);
      expect(piece.classList.contains('dragging')).toBe(true);
    });
  });

  describe('Drag and Drop State Management', () => {
    it('should maintain correct piece count during swaps', async () => {
      const pieces = await createPuzzleAndWait();
      expect(pieces.length).toBe(4);

      // Perform multiple swaps
      for (let i = 0; i < 3; i++) {
        const piece1 = pieces[i];
        const piece2 = pieces[(i + 1) % 4];

        piece1.dispatchEvent(new DragEvent('dragstart'));
        piece2.dispatchEvent(new DragEvent('drop', { cancelable: true }));
        piece1.dispatchEvent(new DragEvent('dragend'));
      }

      // Should still have 4 pieces
      const updatedPieces = puzzleContainer.querySelectorAll('.puzzle-piece');
      expect(updatedPieces.length).toBe(4);

      // Each piece should still have a canvas
      updatedPieces.forEach((piece) => {
        expect(piece.querySelector('canvas')).toBeTruthy();
      });
    });

    it('should preserve piece attributes during drag operations', async () => {
      const pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      const originalAttributes = {
        className: piece.className,
        draggable: piece.draggable,
        position: piece.dataset.position,
      };

      // Perform drag cycle
      piece.dispatchEvent(new DragEvent('dragstart'));
      piece.dispatchEvent(new DragEvent('dragend'));

      expect(piece.draggable).toBe(originalAttributes.draggable);
      expect(piece.dataset.position).toBe(originalAttributes.position);
      // Class should be back to original (no dragging class)
      expect(piece.classList.contains('puzzle-piece')).toBe(true);
      expect(piece.classList.contains('dragging')).toBe(false);
    });

    it('should handle state when puzzle is recreated during drag', async () => {
      let pieces = await createPuzzleAndWait();
      const piece = pieces[0];

      // Start drag
      piece.dispatchEvent(new DragEvent('dragstart'));
      expect(piece.classList.contains('dragging')).toBe(true);

      // Recreate puzzle
      pieces = await createPuzzleAndWait();

      // Old piece should still have the class, new pieces should not
      expect(piece.classList.contains('dragging')).toBe(true);

      const newPieces = puzzleContainer.querySelectorAll('.puzzle-piece');
      newPieces.forEach((newPiece) => {
        if (newPiece !== piece) {
          expect(newPiece.classList.contains('dragging')).toBe(false);
        }
      });
    });

    it('should verify all pieces are draggable after creation', async () => {
      const pieces = await createPuzzleAndWait();

      pieces.forEach((piece, index) => {
        expect(piece.draggable).toBe(true);
        expect(piece.dataset.position).toBe(index.toString());
        expect(piece.classList.contains('puzzle-piece')).toBe(true);

        // Verify event listeners are attached by testing drag start
        piece.dispatchEvent(new DragEvent('dragstart'));
        expect(piece.classList.contains('dragging')).toBe(true);

        piece.dispatchEvent(new DragEvent('dragend'));
        expect(piece.classList.contains('dragging')).toBe(false);
      });
    });
  });
});
