import { describe, it, expect, beforeEach } from 'vitest';
import { splitImageIntoPieces } from '../src/pieceManager.js';
import { createPuzzle } from '../src/puzzle.js';
import { getGridRows, getGridColumns, getPieceScale } from '../src/debug.js';

describe('Default Settings Integration Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="puzzle-container"></div>
      <div id="instructions">
        <p>Click anywhere or drag and drop an image to get started</p>
      </div>
    `;
  });

  describe('pieceManager Integration', () => {
    it('should create correct number of pieces with default grid settings', () => {
      const mockImg = {
        width: 300,
        height: 300,
      };

      // Use default settings (3x3 grid)
      const rows = getGridRows();
      const cols = getGridColumns();
      const pieces = splitImageIntoPieces(mockImg, false, rows, cols, 50);

      // Should create 9 pieces for 3x3 grid
      expect(pieces).toHaveLength(9);

      // Verify piece positions for 3x3 grid
      const expectedPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      pieces.forEach((piece, index) => {
        expect(piece.originalPosition).toBe(expectedPositions[index]);
        expect(piece.currentPosition).toBe(expectedPositions[index]);
      });
    });

    it('should apply default piece scale correctly', () => {
      const mockImg = {
        width: 600,
        height: 400,
      };

      // Mock viewport dimensions
      Object.defineProperty(window, 'innerWidth', {
        value: 1200,
        writable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        writable: true,
      });

      const rows = getGridRows();
      const cols = getGridColumns();
      const scale = getPieceScale(); // 50%
      const pieces = splitImageIntoPieces(mockImg, false, rows, cols, scale);

      expect(pieces).toHaveLength(9);

      // All pieces should have consistent dimensions
      const firstPieceWidth = pieces[0].canvas.width;
      const firstPieceHeight = pieces[0].canvas.height;

      pieces.forEach((piece) => {
        expect(piece.canvas.width).toBe(firstPieceWidth);
        expect(piece.canvas.height).toBe(firstPieceHeight);
        expect(piece.canvas.width).toBeGreaterThan(0);
        expect(piece.canvas.height).toBeGreaterThan(0);
      });
    });

    it('should handle non-square images with default 3x3 grid', () => {
      const mockImg = {
        width: 900,
        height: 600, // 3:2 aspect ratio
      };

      const rows = getGridRows();
      const cols = getGridColumns();
      const pieces = splitImageIntoPieces(mockImg, false, rows, cols, 50);

      expect(pieces).toHaveLength(9);

      // Each piece should be 1/3 of original dimensions
      const expectedPieceWidth = mockImg.width / cols; // 300
      const expectedPieceHeight = mockImg.height / rows; // 200

      // Note: actual canvas dimensions will be scaled, but proportion should be maintained
      pieces.forEach((piece) => {
        const aspectRatio = piece.canvas.width / piece.canvas.height;
        const expectedAspectRatio = expectedPieceWidth / expectedPieceHeight;
        expect(Math.abs(aspectRatio - expectedAspectRatio)).toBeLessThan(0.1);
      });
    });

    it('should create proper grid layout with default settings', () => {
      const mockImg = {
        width: 450,
        height: 450,
      };

      const pieces = splitImageIntoPieces(mockImg, false, 3, 3, 50);

      // Verify that we have a proper 3x3 grid arrangement
      const positions = pieces.map((p) => p.originalPosition).sort();
      expect(positions).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);

      // Check that positions correspond to correct grid coordinates
      pieces.forEach((piece) => {
        const pos = piece.originalPosition;
        const row = Math.floor(pos / 3);
        const col = pos % 3;

        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThan(3);
        expect(col).toBeGreaterThanOrEqual(0);
        expect(col).toBeLessThan(3);
      });
    });
  });

  describe('Puzzle Creation Integration', () => {
    it('should create puzzle with correct default dimensions', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, false);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Should use default 3x3 grid (9 pieces)
      expect(pieces).toHaveLength(9);
      expect(getGridRows()).toBe(3);
      expect(getGridColumns()).toBe(3);
    });

    it('should differentiate between test mode and production defaults', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      // Test mode should use 2x2 grid
      createPuzzle(mockImageSrc, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      let puzzleContainer = document.getElementById('puzzle-container');
      let pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
      expect(pieces).toHaveLength(4); // 2x2 grid

      // Production mode should use 3x3 grid
      createPuzzle(mockImageSrc, false);
      await new Promise((resolve) => setTimeout(resolve, 10));

      puzzleContainer = document.getElementById('puzzle-container');
      pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
      expect(pieces).toHaveLength(9); // 3x3 grid
    });

    it('should maintain puzzle functionality with default settings', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, false);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const puzzleContainer = document.getElementById('puzzle-container');
      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Verify puzzle pieces have required attributes
      pieces.forEach((piece, index) => {
        expect(piece.classList.contains('puzzle-piece')).toBe(true);
        expect(piece.dataset.position).toBe(index.toString());

        const canvas = piece.querySelector('canvas');
        expect(canvas).toBeTruthy();
        expect(canvas.tagName).toBe('CANVAS');
      });

      // Should be in free positioning mode (not grid)
      expect(puzzleContainer.style.display).toBe('block');
    });
  });

  describe('Scale Calculation with Defaults', () => {
    it('should calculate correct piece scale for different viewport sizes', () => {
      const mockImg = {
        width: 600,
        height: 400,
      };

      // Test with large viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        writable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 1080,
        writable: true,
      });

      let pieces = splitImageIntoPieces(mockImg, false, 3, 3, 50);
      const largePieceSize = pieces[0].canvas.width;

      // Test with smaller viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 800,
        writable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 600,
        writable: true,
      });

      pieces = splitImageIntoPieces(mockImg, false, 3, 3, 50);
      const smallPieceSize = pieces[0].canvas.width;

      // Smaller viewport should result in smaller pieces
      expect(smallPieceSize).toBeLessThan(largePieceSize);
      expect(smallPieceSize).toBeGreaterThan(0);
    });

    it('should respect 50% default scale factor', () => {
      const mockImg = {
        width: 300,
        height: 300,
      };

      Object.defineProperty(window, 'innerWidth', {
        value: 1000,
        writable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 1000,
        writable: true,
      });

      // Compare 50% scale vs 100% scale
      const pieces50 = splitImageIntoPieces(mockImg, false, 3, 3, 50);
      const pieces100 = splitImageIntoPieces(mockImg, false, 3, 3, 100);

      const size50 = pieces50[0].canvas.width;
      const size100 = pieces100[0].canvas.width;

      // 50% scale should be approximately half the size of 100% scale
      const ratio = size50 / size100;
      expect(ratio).toBeCloseTo(0.5, 1);
    });
  });

  describe('Grid Layout Verification', () => {
    it('should create proper 3x3 grid layout with correct positioning', () => {
      const mockImg = {
        width: 300,
        height: 300,
      };

      const pieces = splitImageIntoPieces(mockImg, false, 3, 3, 100);

      // Verify we have exactly 9 pieces
      expect(pieces).toHaveLength(9);

      // Group pieces by row
      const rows = [[], [], []];
      pieces.forEach((piece) => {
        const row = Math.floor(piece.originalPosition / 3);
        rows[row].push(piece);
      });

      // Each row should have 3 pieces
      rows.forEach((row) => {
        expect(row).toHaveLength(3);
      });

      // Verify column distribution
      const cols = [[], [], []];
      pieces.forEach((piece) => {
        const col = piece.originalPosition % 3;
        cols[col].push(piece);
      });

      // Each column should have 3 pieces
      cols.forEach((col) => {
        expect(col).toHaveLength(3);
      });
    });

    it('should handle different aspect ratios with 3x3 grid', () => {
      // Test with wide image
      const wideImg = { width: 600, height: 200 };
      const widePieces = splitImageIntoPieces(wideImg, false, 3, 3, 100);

      expect(widePieces).toHaveLength(9);
      expect(widePieces[0].canvas.width).toBeGreaterThan(
        widePieces[0].canvas.height
      );

      // Test with tall image
      const tallImg = { width: 200, height: 600 };
      const tallPieces = splitImageIntoPieces(tallImg, false, 3, 3, 100);

      expect(tallPieces).toHaveLength(9);
      expect(tallPieces[0].canvas.height).toBeGreaterThan(
        tallPieces[0].canvas.width
      );
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing test suites', () => {
      const mockImg = {
        width: 400,
        height: 400,
      };

      // Test mode should still work with 2x2 grid
      const testPieces = splitImageIntoPieces(mockImg, true, 2, 2, 100);
      expect(testPieces).toHaveLength(4);
      expect(testPieces[0].testMode).toBe(true);

      // Production mode should use new defaults
      const prodPieces = splitImageIntoPieces(mockImg, false, 3, 3, 50);
      expect(prodPieces).toHaveLength(9);
      expect(prodPieces[0].testMode).toBe(false);
    });

    it('should allow custom grid sizes when explicitly provided', () => {
      const mockImg = {
        width: 400,
        height: 400,
      };

      // Custom 2x3 grid
      const customPieces = splitImageIntoPieces(mockImg, false, 2, 3, 75);
      expect(customPieces).toHaveLength(6);

      // Verify positions are correct for 2x3 grid
      const positions = customPieces.map((p) => p.originalPosition).sort();
      expect(positions).toEqual([0, 1, 2, 3, 4, 5]);
    });
  });
});
