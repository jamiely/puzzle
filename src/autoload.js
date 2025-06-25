// Autoload state
let autoLoadTimer = null;
let defaultImagePath = 'assets/sloth.jpg';
let autoLoadDelay = 3000; // 3 seconds
let loadCallback = null;
let isActiveCheck = null;

/**
 * Reset module state - useful for testing
 */
export function resetAutoloadState() {
  if (autoLoadTimer) {
    clearTimeout(autoLoadTimer);
  }
  autoLoadTimer = null;
  defaultImagePath = 'assets/sloth.jpg';
  autoLoadDelay = 3000;
  loadCallback = null;
  isActiveCheck = null;
}

/**
 * Initialize the autoload module
 * @param {Function} onLoad - Callback function to call when auto-loading
 * @param {Function} checkIfActive - Function that returns true if puzzle is already active
 * @param {Object} options - Optional configuration
 * @param {string} options.imagePath - Path to default image
 * @param {number} options.delay - Delay in milliseconds before auto-loading
 */
export function initAutoload(onLoad, checkIfActive, options = {}) {
  loadCallback = onLoad;
  isActiveCheck = checkIfActive;

  if (options.imagePath) {
    defaultImagePath = options.imagePath;
  }

  if (options.delay !== undefined) {
    autoLoadDelay = options.delay;
  }
}

/**
 * Start the auto-load timer
 */
export function startAutoLoadTimer() {
  if (autoLoadTimer) return; // Timer already running

  autoLoadTimer = setTimeout(() => {
    if (loadCallback && isActiveCheck && !isActiveCheck()) {
      loadCallback(defaultImagePath);
    }
    autoLoadTimer = null;
  }, autoLoadDelay);
}

/**
 * Cancel the auto-load timer
 */
export function cancelAutoLoadTimer() {
  if (autoLoadTimer) {
    clearTimeout(autoLoadTimer);
    autoLoadTimer = null;
  }
}

/**
 * Check if auto-load timer is currently running
 * @returns {boolean} True if timer is active
 */
export function isAutoLoadTimerActive() {
  return autoLoadTimer !== null;
}

/**
 * Get current configuration
 * @returns {Object} Current autoload configuration
 */
export function getConfig() {
  return {
    imagePath: defaultImagePath,
    delay: autoLoadDelay,
    isTimerActive: isAutoLoadTimerActive(),
  };
}

/**
 * Update configuration
 * @param {Object} options - New configuration options
 */
export function updateConfig(options = {}) {
  if (options.imagePath) {
    defaultImagePath = options.imagePath;
  }

  if (options.delay !== undefined) {
    autoLoadDelay = options.delay;
  }
}
