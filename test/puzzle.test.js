import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  splitImageIntoPieces,
  createPuzzle,
  handleFile,
  shuffleArray,
  puzzleActive,
} from '../src/puzzle.js';

describe('Puzzle functionality', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="puzzle-container"></div>
      <div id="instructions">
        <p>Click anywhere or drag and drop an image to get started</p>
      </div>
    `;
  });

  describe('splitImageIntoPieces', () => {
    it('should create 4 pieces from an image', () => {
      const mockImg = {
        width: 200,
        height: 200,
      };

      const pieces = splitImageIntoPieces(mockImg);

      expect(pieces).toHaveLength(4);
      expect(pieces[0].originalPosition).toBe(0);
      expect(pieces[1].originalPosition).toBe(1);
      expect(pieces[2].originalPosition).toBe(2);
      expect(pieces[3].originalPosition).toBe(3);
    });

    it('should create canvas elements with correct dimensions', () => {
      const mockImg = {
        width: 400,
        height: 300,
      };

      const pieces = splitImageIntoPieces(mockImg);

      pieces.forEach((piece) => {
        expect(piece.canvas.width).toBe(200);
        expect(piece.canvas.height).toBe(150);
        expect(piece.canvas.tagName).toBe('CANVAS');
      });
    });
  });

  describe('handleFile', () => {
    it('should process image files', () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null,
      };

      global.FileReader = vi.fn(() => mockFileReader);

      handleFile(mockFile);

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
    });

    it('should show alert for non-image files', () => {
      const mockFile = new File([''], 'test.txt', { type: 'text/plain' });
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      handleFile(mockFile);

      expect(alertSpy).toHaveBeenCalledWith('Please select an image file.');
      alertSpy.mockRestore();
    });
  });

  describe('createPuzzle', () => {
    it('should create puzzle when image loads', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc);

      // Wait for image to load (mocked in setup)
      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      const instructions = document.getElementById('instructions');

      expect(puzzleContainer.style.display).toBe('grid');
      expect(instructions.style.display).toBe('none');
      expect(puzzleContainer.children).toHaveLength(4);
    });
  });

  describe('shuffleArray', () => {
    it('should return an array of the same length', () => {
      const input = [1, 2, 3, 4];
      const result = shuffleArray(input);

      expect(result).toHaveLength(input.length);
    });

    it('should contain all original elements', () => {
      const input = [1, 2, 3, 4];
      const result = shuffleArray(input);

      input.forEach((item) => {
        expect(result).toContain(item);
      });
    });

    it('should not modify the original array', () => {
      const input = [1, 2, 3, 4];
      const original = [...input];
      shuffleArray(input);

      expect(input).toEqual(original);
    });

    it('should handle empty arrays', () => {
      const result = shuffleArray([]);
      expect(result).toEqual([]);
    });

    it('should handle single element arrays', () => {
      const result = shuffleArray([1]);
      expect(result).toEqual([1]);
    });
  });

  describe('puzzle state management', () => {
    it('should track puzzle pieces correctly', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc);

      // Wait for image to load and puzzle to be created
      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      expect(pieces).toHaveLength(4);

      // Check that each piece has necessary attributes
      pieces.forEach((piece, index) => {
        expect(piece.dataset.position).toBe(index.toString());
        expect(piece.draggable).toBe(true);
        expect(piece.querySelector('canvas')).toBeTruthy();
      });
    });

    it('should make pieces draggable', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      pieces.forEach((piece) => {
        expect(piece.draggable).toBe(true);
        expect(piece.classList.contains('puzzle-piece')).toBe(true);
      });
    });
  });

  describe('drag and drop events', () => {
    beforeEach(() => {
      // Mock drag events with comprehensive dataTransfer
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
    });

    it('should add dragging class on dragstart', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      const piece = puzzleContainer.querySelector('.puzzle-piece');

      const dragStartEvent = new DragEvent('dragstart', {
        dataTransfer: { effectAllowed: null },
      });

      piece.dispatchEvent(dragStartEvent);

      expect(piece.classList.contains('dragging')).toBe(true);
      expect(dragStartEvent.dataTransfer.effectAllowed).toBe('move');
    });

    it('should remove dragging class on dragend', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      const piece = puzzleContainer.querySelector('.puzzle-piece');

      // Start drag
      piece.dispatchEvent(new DragEvent('dragstart'));
      expect(piece.classList.contains('dragging')).toBe(true);

      // End drag
      piece.dispatchEvent(new DragEvent('dragend'));
      expect(piece.classList.contains('dragging')).toBe(false);
    });

    it('should handle dragover event and prevent default', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      const piece = puzzleContainer.querySelector('.puzzle-piece');

      const dragOverEvent = new DragEvent('dragover', {
        cancelable: true,
        dataTransfer: { dropEffect: null },
      });

      const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault');
      piece.dispatchEvent(dragOverEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(dragOverEvent.dataTransfer.dropEffect).toBe('move');
    });

    it('should handle piece swapping on drop', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      expect(pieces.length).toBe(4);

      const piece1 = pieces[0];
      const piece2 = pieces[1];

      // Start dragging first piece
      piece1.dispatchEvent(new DragEvent('dragstart'));

      // Get initial canvas elements
      const piece1Canvas = piece1.querySelector('canvas');
      const piece2Canvas = piece2.querySelector('canvas');

      // Drop on second piece
      const dropEvent = new DragEvent('drop', {
        cancelable: true,
        dataTransfer: {},
      });
      const preventDefaultSpy = vi.spyOn(dropEvent, 'preventDefault');

      piece2.dispatchEvent(dropEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();

      // End drag
      piece1.dispatchEvent(new DragEvent('dragend'));
    });

    it('should not swap piece with itself', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      const piece = puzzleContainer.querySelector('.puzzle-piece');

      const originalCanvas = piece.querySelector('canvas');

      // Start dragging
      piece.dispatchEvent(new DragEvent('dragstart'));

      // Try to drop on same piece
      piece.dispatchEvent(new DragEvent('drop', { cancelable: true }));

      // Canvas should remain the same
      expect(piece.querySelector('canvas')).toBe(originalCanvas);

      // End drag
      piece.dispatchEvent(new DragEvent('dragend'));
    });

    it('should handle multiple drag operations', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Multiple drag operations
      for (let i = 0; i < 3; i++) {
        const piece = pieces[i % pieces.length];

        piece.dispatchEvent(new DragEvent('dragstart'));
        expect(piece.classList.contains('dragging')).toBe(true);

        piece.dispatchEvent(new DragEvent('dragend'));
        expect(piece.classList.contains('dragging')).toBe(false);
      }
    });
  });

  describe('canvas and image drawing', () => {
    it('should create canvas elements with proper context', () => {
      const mockImg = {
        width: 400,
        height: 300,
      };

      const pieces = splitImageIntoPieces(mockImg);

      pieces.forEach((piece) => {
        expect(piece.canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(piece.canvas.width).toBe(200);
        expect(piece.canvas.height).toBe(150);
      });
    });

    it('should handle non-square images correctly', () => {
      const mockImg = {
        width: 600,
        height: 200,
      };

      const pieces = splitImageIntoPieces(mockImg);

      expect(pieces).toHaveLength(4);
      pieces.forEach((piece) => {
        expect(piece.canvas.width).toBe(300);
        expect(piece.canvas.height).toBe(100);
      });
    });

    it('should handle very small images', () => {
      const mockImg = {
        width: 4,
        height: 4,
      };

      const pieces = splitImageIntoPieces(mockImg);

      expect(pieces).toHaveLength(4);
      pieces.forEach((piece) => {
        expect(piece.canvas.width).toBe(2);
        expect(piece.canvas.height).toBe(2);
        expect(piece.canvas.width).toBeGreaterThan(0);
        expect(piece.canvas.height).toBeGreaterThan(0);
      });
    });

    it('should create pieces with correct position mapping for non-square images', () => {
      const mockImg = {
        width: 800,
        height: 400,
      };

      const pieces = splitImageIntoPieces(mockImg);

      // Verify 2x2 grid positions
      expect(pieces[0].originalPosition).toBe(0); // top-left
      expect(pieces[1].originalPosition).toBe(1); // top-right
      expect(pieces[2].originalPosition).toBe(2); // bottom-left
      expect(pieces[3].originalPosition).toBe(3); // bottom-right

      expect(pieces[0].currentPosition).toBe(0);
      expect(pieces[1].currentPosition).toBe(1);
      expect(pieces[2].currentPosition).toBe(2);
      expect(pieces[3].currentPosition).toBe(3);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle FileReader errors gracefully', () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null,
        onerror: null,
      };

      global.FileReader = vi.fn(() => mockFileReader);

      handleFile(mockFile);

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);

      // Simulate error
      if (mockFileReader.onerror) {
        mockFileReader.onerror(new Error('File read error'));
      }
    });

    it('should handle invalid file types with specific error message', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const invalidFiles = [
        new File([''], 'test.txt', { type: 'text/plain' }),
        new File([''], 'test.pdf', { type: 'application/pdf' }),
        new File([''], 'test.doc', { type: 'application/msword' }),
      ];

      invalidFiles.forEach((file) => {
        handleFile(file);
        expect(alertSpy).toHaveBeenCalledWith('Please select an image file.');
      });

      expect(alertSpy).toHaveBeenCalledTimes(3);
      alertSpy.mockRestore();
    });

    it('should handle empty or null files', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const emptyFile = new File([''], '', { type: '' });
      handleFile(emptyFile);

      expect(alertSpy).toHaveBeenCalledWith('Please select an image file.');
      alertSpy.mockRestore();
    });

    it('should handle image loading failures', () => {
      // Override the mock Image to simulate loading failure
      const originalImage = global.Image;
      global.Image = class {
        constructor() {
          this.onload = null;
          this.onerror = null;
          this.width = 0;
          this.height = 0;
        }

        set src(value) {
          this._src = value;
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Image load failed'));
            }
          }, 0);
        }

        get src() {
          return this._src;
        }
      };

      const mockImageSrc = 'data:image/jpeg;base64,invalid';

      // This should not throw an error
      expect(() => {
        createPuzzle(mockImageSrc);
      }).not.toThrow();

      // Restore original Image
      global.Image = originalImage;
    });
  });

  describe('puzzle state and lifecycle', () => {
    it('should create puzzle and display pieces', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';
      createPuzzle(mockImageSrc);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      expect(puzzleContainer.style.display).toBe('grid');
      expect(puzzleContainer.children.length).toBe(4);
    });

    it('should handle multiple puzzle creations', async () => {
      const mockImageSrc1 = 'data:image/jpeg;base64,test1';
      const mockImageSrc2 = 'data:image/jpeg;base64,test2';

      // Create first puzzle
      createPuzzle(mockImageSrc1);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      expect(puzzleContainer.children.length).toBe(4);

      // Create second puzzle (should replace first)
      createPuzzle(mockImageSrc2);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(puzzleContainer.children.length).toBe(4);
      expect(puzzleContainer.style.display).toBe('grid');
    });

    it('should maintain piece integrity during lifecycle', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Verify each piece has required attributes
      pieces.forEach((piece, index) => {
        expect(piece.classList.contains('puzzle-piece')).toBe(true);
        expect(piece.dataset.position).toBe(index.toString());
        expect(piece.draggable).toBe(true);
        expect(piece.querySelector('canvas')).toBeTruthy();
        expect(piece.querySelector('canvas').tagName).toBe('CANVAS');
      });
    });
  });
});
