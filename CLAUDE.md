# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Testing:**

- `npm test` - Run all tests with Vitest
- `npm run test:run` - Same as above (alias)

**Code Formatting:**

- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check formatting without making changes

**Running the Application:**

- Open `index.html` in a browser directly (no build step required)
- The app uses ES modules and runs entirely in the browser

## Architecture

This is a browser-based image puzzle application with a modular ES6 architecture:

**Entry Point:**

- `index.html` + `script.js` - Main UI and drag/drop handlers
- `styles.css` - All styling including puzzle piece interactions

**Core Modules (`src/`):**

- `puzzle.js` - Main orchestrator, state management, and display logic
- `pieceManager.js` - Image splitting, piece creation, and file handling
- `positioning.js` - Collision detection and piece positioning algorithms
- `interaction.js` - Mouse/drag interactions and legacy HTML5 drag-drop support
- `completion.js` - Puzzle completion detection and success UI

**Key Design Patterns:**

- **Dual interaction modes**: New mouse-based free positioning + legacy HTML5 drag-drop (for test compatibility)
- **Dual display modes**: Grid layout (for tests) vs. free positioning (for gameplay) - automatically detected
- **Viewport-based scaling**: Pieces scale to 40% of minimum viewport dimension, with test mode override
- **Legacy compatibility**: Tests use `testMode` parameter for deterministic 1:1 pixel sizing

**State Management:**

- Global `puzzleActive` flag tracks if puzzle is in progress
- `puzzlePieces` array maintains piece state and positions
- Modules communicate via explicit imports and getter functions

**Testing Setup:**

- Vitest with jsdom environment
- Global mocks for Image constructor and Canvas context in `test/setup.js`
- Tests verify both legacy grid-based swapping and new free-positioning completion logic
