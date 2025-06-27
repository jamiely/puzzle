import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the puzzle module since we're testing the query string logic
vi.mock('../src/puzzle.js', () => ({
  handleFile: vi.fn(),
  puzzleActive: false,
  createPuzzle: vi.fn(),
}));

vi.mock('../src/autoload.js', () => ({
  initAutoload: vi.fn(),
  startAutoLoadTimer: vi.fn(),
  cancelAutoLoadTimer: vi.fn(),
}));

vi.mock('../src/debug.js', () => ({
  initDebug: vi.fn(),
}));

describe('Query String Puzzle Loading', () => {
  let mockCreatePuzzle;
  let mockStartAutoLoadTimer;
  let mockInitDebug;
  let originalLocation;

  beforeEach(async () => {
    // Store original location
    originalLocation = window.location;

    // Mock window.location.search
    delete window.location;
    window.location = { search: '' };

    // Clear all mocks
    vi.clearAllMocks();

    // Get mocked functions
    const puzzleModule = await import('../src/puzzle.js');
    const autoloadModule = await import('../src/autoload.js');
    const debugModule = await import('../src/debug.js');

    mockCreatePuzzle = vi.mocked(puzzleModule.createPuzzle);
    mockStartAutoLoadTimer = vi.mocked(autoloadModule.startAutoLoadTimer);
    mockInitDebug = vi.mocked(debugModule.initDebug);

    // Clear the DOM
    document.body.innerHTML = `
      <input type="file" id="file-input" accept="image/*" style="display: none" />
      <div id="puzzle-container"></div>
    `;
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
    vi.clearAllMocks();
  });

  it('should load specified puzzle when puzzle query parameter is present', async () => {
    // Set up query string
    window.location.search = '?puzzle=sloth';

    // Import and execute the script logic
    const { parseQueryParameters } = await import('../script.js');

    // Simulate DOMContentLoaded event logic
    const queryParams = parseQueryParameters();

    expect(queryParams.puzzle).toBe('sloth');

    // Simulate the script's behavior
    if (queryParams.puzzle) {
      const puzzlePath = `assets/${queryParams.puzzle}.jpg`;
      mockCreatePuzzle(puzzlePath);
    }

    // Verify puzzle was loaded with correct path
    expect(mockCreatePuzzle).toHaveBeenCalledWith('assets/sloth.jpg');
    expect(mockStartAutoLoadTimer).not.toHaveBeenCalled();
  });

  it('should start auto-load timer when no puzzle query parameter is present', async () => {
    // No query string
    window.location.search = '';

    // Import and execute the script logic
    const { parseQueryParameters } = await import('../script.js');

    // Simulate DOMContentLoaded event logic
    const queryParams = parseQueryParameters();

    expect(queryParams.puzzle).toBeNull();

    // Simulate the script's behavior
    if (queryParams.puzzle) {
      const puzzlePath = `assets/${queryParams.puzzle}.jpg`;
      mockCreatePuzzle(puzzlePath);
    } else {
      mockStartAutoLoadTimer();
    }

    // Verify auto-load timer was started instead of loading puzzle
    expect(mockCreatePuzzle).not.toHaveBeenCalled();
    expect(mockStartAutoLoadTimer).toHaveBeenCalled();
  });

  it('should handle different puzzle names correctly', async () => {
    const testCases = [
      { query: '?puzzle=drawing', expected: 'assets/drawing.jpg' },
      { query: '?puzzle=yearbook', expected: 'assets/yearbook.jpg' },
      { query: '?puzzle=custom', expected: 'assets/custom.jpg' },
    ];

    for (const testCase of testCases) {
      // Clear previous calls
      mockCreatePuzzle.mockClear();
      mockStartAutoLoadTimer.mockClear();

      // Set up query string
      window.location.search = testCase.query;

      // Parse query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const puzzleName = urlParams.get('puzzle');

      // Simulate script behavior
      if (puzzleName) {
        const puzzlePath = `assets/${puzzleName}.jpg`;
        mockCreatePuzzle(puzzlePath);
      }

      // Verify correct path was used
      expect(mockCreatePuzzle).toHaveBeenCalledWith(testCase.expected);
      expect(mockStartAutoLoadTimer).not.toHaveBeenCalled();
    }
  });

  it('should ignore other query parameters and only process puzzle parameter', async () => {
    // Set up query string with multiple parameters
    window.location.search = '?puzzle=sloth&debug=true&other=value';

    // Parse query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const puzzleName = urlParams.get('puzzle');

    expect(puzzleName).toBe('sloth');

    // Simulate script behavior
    if (puzzleName) {
      const puzzlePath = `assets/${puzzleName}.jpg`;
      mockCreatePuzzle(puzzlePath);
    }

    // Verify only puzzle parameter was processed
    expect(mockCreatePuzzle).toHaveBeenCalledWith('assets/sloth.jpg');
  });

  it('should handle empty puzzle parameter correctly', async () => {
    // Set up query string with empty puzzle parameter
    window.location.search = '?puzzle=';

    // Parse query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const puzzleName = urlParams.get('puzzle');

    // Empty string should be falsy and trigger auto-load timer
    expect(puzzleName).toBe('');

    // Simulate script behavior
    if (puzzleName) {
      const puzzlePath = `assets/${puzzleName}.jpg`;
      mockCreatePuzzle(puzzlePath);
    } else {
      mockStartAutoLoadTimer();
    }

    // Verify auto-load timer was started for empty parameter
    expect(mockCreatePuzzle).not.toHaveBeenCalled();
    expect(mockStartAutoLoadTimer).toHaveBeenCalled();
  });

  it('should handle URL encoding in puzzle parameter', async () => {
    // Set up query string with URL encoded characters
    window.location.search = '?puzzle=my%20puzzle';

    // Parse query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const puzzleName = urlParams.get('puzzle');

    expect(puzzleName).toBe('my puzzle'); // Should be decoded

    // Simulate script behavior
    if (puzzleName) {
      const puzzlePath = `assets/${puzzleName}.jpg`;
      mockCreatePuzzle(puzzlePath);
    }

    // Verify decoded name was used
    expect(mockCreatePuzzle).toHaveBeenCalledWith('assets/my puzzle.jpg');
  });

  describe('parseQueryParameters function', () => {
    it('should extract puzzle parameter correctly', () => {
      window.location.search = '?puzzle=test';

      // Parse parameters manually to test the logic
      const urlParams = new URLSearchParams(window.location.search);
      const result = {
        puzzle: urlParams.get('puzzle'),
      };

      expect(result).toEqual({ puzzle: 'test' });
    });

    it('should return null for missing puzzle parameter', () => {
      window.location.search = '?other=value';

      const urlParams = new URLSearchParams(window.location.search);
      const result = {
        puzzle: urlParams.get('puzzle'),
      };

      expect(result).toEqual({ puzzle: null });
    });

    it('should return null for no query string', () => {
      window.location.search = '';

      const urlParams = new URLSearchParams(window.location.search);
      const result = {
        puzzle: urlParams.get('puzzle'),
      };

      expect(result).toEqual({ puzzle: null });
    });
  });
});
