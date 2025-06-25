import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  splitImageIntoPieces,
  createPuzzle,
  handleFile,
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
});
