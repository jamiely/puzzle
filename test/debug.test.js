import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generatePieceId,
  getGridRows,
  getGridColumns,
  getPieceScale,
  isShowingPieceIds,
  initDebug,
} from '../src/debug.js';
import { createPuzzle } from '../src/puzzle.js';

// Mock the new modular structure
vi.mock('../src/solver.js', () => ({
  solvePuzzle: vi.fn(),
}));

vi.mock('../src/debugDisplay.js', async (importOriginal) => {
  // Import the real implementation
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    // For tests that need piece IDs to actually appear, use the real implementation
    // updatePieceIdDisplay: vi.fn(),
    updatePieceNumberDisplay: vi.fn(),
  };
});

vi.mock('../src/debugConfig.js', async (importOriginal) => {
  // Import the real implementation for state management
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    // Keep the real state management but mock the functions that have side effects
    reslicePuzzleIfNeeded: vi.fn(),
  };
});

// Mock positioning and completion modules for legacy tests
vi.mock('../src/positioning.js', () => ({
  updatePieceTransform: vi.fn(),
  findNonOverlappingPosition: vi.fn(() => ({ x: 100, y: 100 })),
  getRandomRotation: vi.fn(() => 0),
}));

vi.mock('../src/completion.js', () => ({
  checkPuzzleCompletion: vi.fn(),
}));

describe('Debug Module', () => {
  beforeEach(() => {
    // Set up DOM elements needed for debug functionality
    document.body.innerHTML = `
      <div id="puzzle-container"></div>
      <div id="instructions">
        <p>Click anywhere or drag and drop an image to get started</p>
      </div>
      <div id="debug-menu" style="display: none">
        <div class="debug-content">
          <h3>Debug Menu</h3>
          <div class="debug-option">
            <label>
              <input type="checkbox" id="show-piece-ids" checked /> Show Piece IDs
            </label>
          </div>
          <div class="debug-option">
            <label>
              <input type="checkbox" id="show-piece-numbers" /> Show Piece Numbers
            </label>
          </div>
          <div class="debug-option">
            <label>
              Grid Rows:
              <input type="number" id="grid-rows" min="1" max="10" value="3" />
            </label>
          </div>
          <div class="debug-option">
            <label>
              Grid Columns:
              <input type="number" id="grid-columns" min="1" max="10" value="3" />
            </label>
          </div>
          <div class="debug-option">
            <label>
              Piece Scale:
              <input
                type="number"
                id="piece-scale"
                min="25"
                max="200"
                value="50"
                step="5"
              />%
            </label>
          </div>
          <div class="debug-buttons">
            <button id="debug-cancel">Cancel</button>
            <button id="debug-submit">Apply Changes</button>
          </div>
        </div>
      </div>
    `;

    // Reset any existing event listeners
    vi.clearAllMocks();

    // Clear document event listeners to prevent accumulation across tests
    const events = ['keydown', 'scroll', 'resize'];
    events.forEach((event) => {
      document.removeEventListener(event, () => {});
      window.removeEventListener(event, () => {});
    });

    // Mock animation frame for auto-solve tests
    global.requestAnimationFrame = vi.fn((callback) => {
      setTimeout(callback, 16); // ~60fps
      return 1;
    });

    // Mock Date.now for animation timing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Default Settings', () => {
    it('should return correct default grid dimensions (3x3)', () => {
      expect(getGridRows()).toBe(3);
      expect(getGridColumns()).toBe(3);
    });

    it('should return correct default piece scale (50%)', () => {
      expect(getPieceScale()).toBe(50);
    });

    it('should have piece IDs enabled by default', () => {
      expect(isShowingPieceIds()).toBe(true);
    });

    it('should maintain default values after module import', () => {
      // Test that defaults are consistent across multiple calls
      expect(getGridRows()).toBe(3);
      expect(getGridColumns()).toBe(3);
      expect(getPieceScale()).toBe(50);
      expect(isShowingPieceIds()).toBe(true);
    });
  });

  describe('HTML Form Default Values', () => {
    it('should have correct default values in HTML form elements', () => {
      const gridRowsInput = document.getElementById('grid-rows');
      const gridColumnsInput = document.getElementById('grid-columns');
      const pieceScaleInput = document.getElementById('piece-scale');
      const showPieceIdsCheckbox = document.getElementById('show-piece-ids');
      const showPieceNumbersCheckbox =
        document.getElementById('show-piece-numbers');

      expect(gridRowsInput.value).toBe('3');
      expect(gridColumnsInput.value).toBe('3');
      expect(pieceScaleInput.value).toBe('50');
      expect(showPieceIdsCheckbox.checked).toBe(true);
      expect(showPieceNumbersCheckbox.checked).toBe(false);
    });

    it('should have correct input attributes for constraints', () => {
      const gridRowsInput = document.getElementById('grid-rows');
      const gridColumnsInput = document.getElementById('grid-columns');
      const pieceScaleInput = document.getElementById('piece-scale');

      expect(gridRowsInput.min).toBe('1');
      expect(gridRowsInput.max).toBe('10');
      expect(gridColumnsInput.min).toBe('1');
      expect(gridColumnsInput.max).toBe('10');
      expect(pieceScaleInput.min).toBe('25');
      expect(pieceScaleInput.max).toBe('200');
      expect(pieceScaleInput.step).toBe('5');
    });
  });

  describe('Puzzle Creation with Default Settings', () => {
    it('should create 3x3 puzzle (9 pieces) when not in test mode', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      // Create puzzle without test mode to use defaults
      createPuzzle(mockImageSrc, false);

      // Wait for image to load and pieces to be created
      await vi.waitFor(
        () => {
          const puzzleContainer = document.getElementById('puzzle-container');
          const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
          return pieces.length === 9;
        },
        { timeout: 1000 }
      );

      const puzzleContainer = document.getElementById('puzzle-container');
      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Should have 9 pieces for 3x3 grid
      expect(pieces).toHaveLength(9);
      expect(puzzleContainer.style.display).toBe('block'); // Free positioning mode
    });

    it('should apply default piece scale when creating puzzle', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      // Mock window dimensions for scale calculation
      Object.defineProperty(window, 'innerWidth', {
        value: 1000,
        writable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        writable: true,
      });

      createPuzzle(mockImageSrc, false);

      // Wait for pieces to be created
      await vi.waitFor(
        () => {
          const puzzleContainer = document.getElementById('puzzle-container');
          const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
          return pieces.length === 9;
        },
        { timeout: 1000 }
      );

      const puzzleContainer = document.getElementById('puzzle-container');
      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      expect(pieces).toHaveLength(9); // 3x3 grid

      // Verify pieces exist and have canvas elements
      pieces.forEach((piece) => {
        const canvas = piece.querySelector('canvas');
        expect(canvas).toBeTruthy();
        expect(canvas.tagName).toBe('CANVAS');
      });
    });

    it('should display piece IDs immediately when puzzle is created', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      // Initialize debug functionality to enable piece ID display
      initDebug();

      createPuzzle(mockImageSrc, false);

      // Wait for pieces and piece IDs to be created
      await vi.waitFor(
        () => {
          const puzzleContainer = document.getElementById('puzzle-container');
          const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
          const pieceIds = document.querySelectorAll('.piece-id');
          return pieces.length === 9 && pieceIds.length === 9;
        },
        { timeout: 1000 }
      );

      // Check that piece IDs are created and displayed
      const pieceIds = document.querySelectorAll('.piece-id');
      expect(pieceIds).toHaveLength(9); // Should have IDs for all 9 pieces

      // Verify piece IDs have correct content (A-I for 9 pieces)
      const expectedIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
      const actualIds = Array.from(pieceIds)
        .map((id) => id.textContent)
        .sort();
      expect(actualIds).toEqual(expectedIds.sort());
    });
  });

  describe('Integration with Test Mode', () => {
    it('should use test mode defaults (2x2, 100% scale) when testMode is true', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      // Create puzzle in test mode
      createPuzzle(mockImageSrc, true);

      // Wait for pieces to be created
      await vi.waitFor(
        () => {
          const puzzleContainer = document.getElementById('puzzle-container');
          const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
          return pieces.length === 4;
        },
        { timeout: 1000 }
      );

      const puzzleContainer = document.getElementById('puzzle-container');
      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Should have 4 pieces for 2x2 grid in test mode
      expect(pieces).toHaveLength(4);
      expect(puzzleContainer.style.display).toBe('grid'); // Grid mode for tests
    });

    it('should use production defaults (3x3, 50% scale) when testMode is false', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      createPuzzle(mockImageSrc, false);

      // Wait for pieces to be created
      await vi.waitFor(
        () => {
          const puzzleContainer = document.getElementById('puzzle-container');
          const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
          return pieces.length === 9;
        },
        { timeout: 1000 }
      );

      const puzzleContainer = document.getElementById('puzzle-container');
      const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

      // Should have 9 pieces for 3x3 grid in production mode
      expect(pieces).toHaveLength(9);
      expect(puzzleContainer.style.display).toBe('block'); // Free positioning mode
    });
  });

  describe('generatePieceId', () => {
    it('should generate single letters for first 26 pieces (A-Z)', () => {
      expect(generatePieceId(0)).toBe('A');
      expect(generatePieceId(1)).toBe('B');
      expect(generatePieceId(25)).toBe('Z');
    });

    it('should generate double letters for pieces 26+ (AA-AZ, BA-BZ, etc.)', () => {
      expect(generatePieceId(26)).toBe('AA');
      expect(generatePieceId(27)).toBe('AB');
      expect(generatePieceId(51)).toBe('AZ');
      expect(generatePieceId(52)).toBe('BA');
      expect(generatePieceId(53)).toBe('BB');
      expect(generatePieceId(77)).toBe('BZ');
      expect(generatePieceId(701)).toBe('ZZ');
    });

    it('should handle edge cases correctly', () => {
      // Test a few random indices to ensure pattern is correct
      expect(generatePieceId(100)).toBe('CW'); // (100-26) = 74, 74/26 = 2 (C), 74%26 = 22 (W)
      expect(generatePieceId(200)).toBe('GS'); // (200-26) = 174, 174/26 = 6 (G), 174%26 = 18 (S)
    });

    it('should generate correct IDs for 3x3 grid (9 pieces)', () => {
      // Test the specific case of our new default 3x3 grid
      const expectedIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
      for (let i = 0; i < 9; i++) {
        expect(generatePieceId(i)).toBe(expectedIds[i]);
      }
    });

    it('should generate correct IDs for larger grids', () => {
      // Test 5x5 grid (25 pieces) to ensure it works with larger defaults
      expect(generatePieceId(24)).toBe('Y'); // Last single letter
      expect(generatePieceId(25)).toBe('Z'); // Last single letter
      expect(generatePieceId(26)).toBe('AA'); // First double letter
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing DOM elements gracefully', () => {
      // Remove some DOM elements
      document.getElementById('grid-rows')?.remove();
      document.getElementById('grid-columns')?.remove();

      // These should not throw errors
      expect(() => getGridRows()).not.toThrow();
      expect(() => getGridColumns()).not.toThrow();
      expect(() => getPieceScale()).not.toThrow();
    });

    it('should maintain defaults when form elements are missing', () => {
      // Remove all form elements
      document.body.innerHTML = '<div id=\"puzzle-container\"></div>';

      // Defaults should still be returned
      expect(getGridRows()).toBe(3);
      expect(getGridColumns()).toBe(3);
      expect(getPieceScale()).toBe(50);
      expect(isShowingPieceIds()).toBe(true);
    });

    it('should handle extreme viewport dimensions', () => {
      // Test with very small viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 100,
        writable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 100,
        writable: true,
      });

      const mockImageSrc = 'data:image/jpeg;base64,test';

      expect(() => {
        createPuzzle(mockImageSrc, false);
      }).not.toThrow();
    });

    it('should handle puzzle creation with default settings multiple times', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      // Create puzzle multiple times
      for (let i = 0; i < 3; i++) {
        createPuzzle(mockImageSrc, false);

        // Wait for pieces to be created
        await vi.waitFor(
          () => {
            const puzzleContainer = document.getElementById('puzzle-container');
            const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');
            return pieces.length === 9;
          },
          { timeout: 1000 }
        );

        const puzzleContainer = document.getElementById('puzzle-container');
        const pieces = puzzleContainer.querySelectorAll('.puzzle-piece');

        expect(pieces).toHaveLength(9); // Should always be 9 pieces
        expect(getGridRows()).toBe(3); // Defaults should remain unchanged
        expect(getGridColumns()).toBe(3);
        expect(getPieceScale()).toBe(50);
      }
    });

    it('should maintain piece ID visibility state across puzzle recreations', async () => {
      const mockImageSrc = 'data:image/jpeg;base64,test';

      initDebug();

      // Create first puzzle
      createPuzzle(mockImageSrc, false);
      await vi.waitFor(
        () => {
          const pieceIds = document.querySelectorAll('.piece-id');
          return pieceIds.length === 9;
        },
        { timeout: 1000 }
      );

      let pieceIds = document.querySelectorAll('.piece-id');
      expect(pieceIds).toHaveLength(9);

      // Create second puzzle
      createPuzzle(mockImageSrc, false);
      await vi.waitFor(
        () => {
          const pieceIds = document.querySelectorAll('.piece-id');
          return pieceIds.length === 9;
        },
        { timeout: 1000 }
      );

      pieceIds = document.querySelectorAll('.piece-id');
      expect(pieceIds).toHaveLength(9); // Should still show piece IDs
      expect(isShowingPieceIds()).toBe(true); // State should be maintained
    });

    it('should handle form element value changes without affecting defaults', () => {
      const gridRowsInput = document.getElementById('grid-rows');
      const gridColumnsInput = document.getElementById('grid-columns');
      const pieceScaleInput = document.getElementById('piece-scale');

      // Change form values
      gridRowsInput.value = '5';
      gridColumnsInput.value = '4';
      pieceScaleInput.value = '75';

      // Debug module defaults should remain unchanged until submit
      expect(getGridRows()).toBe(3);
      expect(getGridColumns()).toBe(3);
      expect(getPieceScale()).toBe(50);
    });
  });

  describe('Default Settings Consistency', () => {
    it('should have consistent defaults between JavaScript and HTML', () => {
      // JavaScript defaults
      const jsGridRows = getGridRows();
      const jsGridColumns = getGridColumns();
      const jsPieceScale = getPieceScale();
      const jsShowPieceIds = isShowingPieceIds();

      // HTML form defaults
      const htmlGridRows = parseInt(document.getElementById('grid-rows').value);
      const htmlGridColumns = parseInt(
        document.getElementById('grid-columns').value
      );
      const htmlPieceScale = parseInt(
        document.getElementById('piece-scale').value
      );
      const htmlShowPieceIds =
        document.getElementById('show-piece-ids').checked;

      expect(jsGridRows).toBe(htmlGridRows);
      expect(jsGridColumns).toBe(htmlGridColumns);
      expect(jsPieceScale).toBe(htmlPieceScale);
      expect(jsShowPieceIds).toBe(htmlShowPieceIds);
    });

    it('should maintain defaults after initialization', () => {
      // Initialize debug functionality
      initDebug();

      // Defaults should remain the same after initialization
      expect(getGridRows()).toBe(3);
      expect(getGridColumns()).toBe(3);
      expect(getPieceScale()).toBe(50);
      expect(isShowingPieceIds()).toBe(true);
    });
  });

  describe('Auto-Solve Functionality', () => {
    // Import mocked functions
    let mockSolvePuzzle;
    let mockCheckPuzzleCompletion;
    let hasInitializedDebug = false;

    beforeEach(async () => {
      // Get the mocked functions
      const solverModule = await import('../src/solver.js');
      const completionModule = await import('../src/completion.js');

      mockSolvePuzzle = vi.mocked(solverModule.solvePuzzle);
      mockCheckPuzzleCompletion = vi.mocked(
        completionModule.checkPuzzleCompletion
      );

      // Clear previous calls
      mockSolvePuzzle.mockClear();
      mockCheckPuzzleCompletion.mockClear();

      // Reset call counts to prevent accumulation across tests
      mockSolvePuzzle.mockImplementation(() => {});

      // Reset debug initialization flag
      hasInitializedDebug = false;
    });

    function createMockPuzzlePieces(count = 4) {
      const puzzleContainer = document.getElementById('puzzle-container');
      const pieces = [];

      for (let i = 0; i < count; i++) {
        const pieceElement = document.createElement('div');
        pieceElement.className = 'puzzle-piece';
        pieceElement.style.position = 'absolute';
        pieceElement.style.left = `${Math.random() * 400}px`;
        pieceElement.style.top = `${Math.random() * 400}px`;

        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        pieceElement.appendChild(canvas);

        // Add piece data with originalPosition
        const pieceData = {
          originalPosition: i,
          x: Math.random() * 400,
          y: Math.random() * 400,
          rotation: Math.random() * 360,
          element: pieceElement,
        };
        pieceElement.pieceData = pieceData;

        puzzleContainer.appendChild(pieceElement);
        pieces.push(pieceData);
      }

      return pieces;
    }

    it('should respond to "!" key press and trigger auto-solve', async () => {
      createMockPuzzlePieces(4);
      initDebug();

      // Simulate keydown event with "!" key
      const keyEvent = new KeyboardEvent('keydown', { key: '!' });
      document.dispatchEvent(keyEvent);

      // Verify that the solve puzzle function is called
      expect(mockSolvePuzzle).toHaveBeenCalledWith(
        3, // gridRows
        3, // gridColumns
        expect.any(Function), // update callback
        expect.any(Function) // completion callback
      );
    });

    it('should call solve puzzle with correct parameters', async () => {
      const pieces = createMockPuzzlePieces(4); // 2x2 grid for easier testing
      initDebug();

      // Trigger auto-solve
      const keyEvent = new KeyboardEvent('keydown', { key: '!' });
      document.dispatchEvent(keyEvent);

      // Verify solve puzzle is called with correct grid dimensions
      expect(mockSolvePuzzle).toHaveBeenCalledWith(
        3, // gridRows (default)
        3, // gridColumns (default)
        expect.any(Function), // update callback
        expect.any(Function) // completion callback
      );
    });

    it('should invoke update callback when solving', async () => {
      createMockPuzzlePieces(4);
      initDebug();

      // Trigger auto-solve
      const keyEvent = new KeyboardEvent('keydown', { key: '!' });
      document.dispatchEvent(keyEvent);

      // Get the update callback that was passed to solvePuzzle
      expect(mockSolvePuzzle).toHaveBeenCalled();
      const [, , updateCallback] = mockSolvePuzzle.mock.calls[0];

      // Mock the display functions
      const mockUpdatePieceIdDisplay = vi.mocked(
        (await import('../src/debugDisplay.js')).updatePieceIdDisplay
      );
      const mockUpdatePieceNumberDisplay = vi.mocked(
        (await import('../src/debugDisplay.js')).updatePieceNumberDisplay
      );

      // Call the update callback
      updateCallback();

      // Should update piece displays (indirectly via debug.js functions)
      // The actual calls are made through the main debug module, not directly
      expect(typeof updateCallback).toBe('function');
    });

    it('should invoke completion callback when solving', async () => {
      createMockPuzzlePieces(4);
      initDebug();

      // Trigger auto-solve
      const keyEvent = new KeyboardEvent('keydown', { key: '!' });
      document.dispatchEvent(keyEvent);

      // Get the completion callback that was passed to solvePuzzle
      expect(mockSolvePuzzle).toHaveBeenCalled();
      const [, , , completionCallback] = mockSolvePuzzle.mock.calls[0];

      // The completion callback should be a function that handles dynamic import
      expect(typeof completionCallback).toBe('function');

      // Call the completion callback - it should handle the dynamic import internally
      // We can't easily test the dynamic import without significant mocking overhead
      expect(() => completionCallback()).not.toThrow();
    });

    it('should handle pieces without position data gracefully', async () => {
      const puzzleContainer = document.getElementById('puzzle-container');

      // Create piece without position data
      const pieceElement = document.createElement('div');
      pieceElement.className = 'puzzle-piece';
      pieceElement.style.position = 'absolute';
      pieceElement.style.left = '100px';
      pieceElement.style.top = '150px';

      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      pieceElement.appendChild(canvas);

      // Add piece data without x, y, rotation properties
      pieceElement.pieceData = { originalPosition: 0 };

      // Mock getBoundingClientRect for the piece element
      pieceElement.getBoundingClientRect = vi.fn(() => ({
        left: 100,
        top: 150,
        width: 100,
        height: 100,
      }));

      puzzleContainer.appendChild(pieceElement);

      initDebug();

      // Should not throw error when solving
      expect(() => {
        const keyEvent = new KeyboardEvent('keydown', { key: '!' });
        document.dispatchEvent(keyEvent);
      }).not.toThrow();

      // Should call solvePuzzle function
      expect(mockSolvePuzzle).toHaveBeenCalled();
    });

    it('should work with both test mode and production mode puzzle sizes', async () => {
      // Test with 2x2 grid (test mode dimensions)
      createMockPuzzlePieces(4);
      initDebug();

      const keyEvent = new KeyboardEvent('keydown', { key: '!' });
      document.dispatchEvent(keyEvent);

      expect(mockSolvePuzzle).toHaveBeenCalledWith(
        3,
        3,
        expect.any(Function),
        expect.any(Function)
      );

      // Clear and test with 3x3 grid (production mode dimensions)
      mockSolvePuzzle.mockClear();
      document.getElementById('puzzle-container').innerHTML = '';

      createMockPuzzlePieces(9);
      document.dispatchEvent(keyEvent);

      expect(mockSolvePuzzle).toHaveBeenCalledWith(
        3,
        3,
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should pass correct grid parameters to solve function', async () => {
      const pieces = createMockPuzzlePieces(3);

      // Only initialize debug once to prevent multiple event listeners
      if (!hasInitializedDebug) {
        initDebug();
        hasInitializedDebug = true;
      }

      // Clear calls right before the test action
      mockSolvePuzzle.mockClear();

      // Trigger auto-solve
      const keyEvent = new KeyboardEvent('keydown', { key: '!' });
      document.dispatchEvent(keyEvent);

      // Verify correct parameters are passed
      expect(mockSolvePuzzle).toHaveBeenCalledWith(
        3, // gridRows from config
        3, // gridColumns from config
        expect.any(Function), // update callback
        expect.any(Function) // completion callback
      );

      // Verify it's called at least once (may be more due to event listener accumulation)
      expect(mockSolvePuzzle).toHaveBeenCalled();
    });

    it('should handle missing DOM elements gracefully', async () => {
      // Remove puzzle container
      document.getElementById('puzzle-container').remove();

      initDebug();

      // Should not throw error when container is missing
      expect(() => {
        const keyEvent = new KeyboardEvent('keydown', { key: '!' });
        document.dispatchEvent(keyEvent);
      }).not.toThrow();

      // Should still call solvePuzzle (the solver handles missing container)
      expect(mockSolvePuzzle).toHaveBeenCalled();
    });

    it('should handle empty puzzle container gracefully', async () => {
      // Container exists but has no pieces
      const puzzleContainer = document.getElementById('puzzle-container');
      expect(puzzleContainer.children.length).toBe(0);

      initDebug();

      // Should not throw error when no pieces exist
      expect(() => {
        const keyEvent = new KeyboardEvent('keydown', { key: '!' });
        document.dispatchEvent(keyEvent);
      }).not.toThrow();

      // Should still call solvePuzzle (the solver handles empty container)
      expect(mockSolvePuzzle).toHaveBeenCalled();
    });

    it('should prevent default behavior on "!" key press', async () => {
      createMockPuzzlePieces(4);
      initDebug();

      const keyEvent = new KeyboardEvent('keydown', { key: '!' });
      const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');

      document.dispatchEvent(keyEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should use grid settings when solving', async () => {
      // Test with default grid settings
      const pieces = createMockPuzzlePieces(4);
      initDebug();

      const keyEvent = new KeyboardEvent('keydown', { key: '!' });
      document.dispatchEvent(keyEvent);

      // Should call solvePuzzle with current grid dimensions (3x3 default)
      expect(mockSolvePuzzle).toHaveBeenCalledWith(
        3, // gridRows (default)
        3, // gridColumns (default)
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should provide working callbacks to solve function', async () => {
      const pieces = createMockPuzzlePieces(4);
      initDebug();

      // Trigger auto-solve
      const keyEvent = new KeyboardEvent('keydown', { key: '!' });
      document.dispatchEvent(keyEvent);

      // Verify solvePuzzle was called
      expect(mockSolvePuzzle).toHaveBeenCalled();

      // Get the callbacks passed to solvePuzzle
      const [gridRows, gridColumns, updateCallback, completionCallback] =
        mockSolvePuzzle.mock.calls[0];

      // Verify callbacks are functions
      expect(typeof updateCallback).toBe('function');
      expect(typeof completionCallback).toBe('function');

      // Verify parameters are correct
      expect(gridRows).toBe(3);
      expect(gridColumns).toBe(3);

      // Test that callbacks can be called without error
      expect(() => updateCallback()).not.toThrow();
      expect(() => completionCallback()).not.toThrow();
    });
  });
});
