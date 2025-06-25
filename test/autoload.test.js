import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initAutoload,
  startAutoLoadTimer,
  cancelAutoLoadTimer,
  isAutoLoadTimerActive,
  getConfig,
  updateConfig,
  resetAutoloadState,
} from '../src/autoload.js';

describe('Autoload Module', () => {
  let mockLoadCallback;
  let mockIsActiveCheck;

  beforeEach(() => {
    vi.useFakeTimers();
    mockLoadCallback = vi.fn();
    mockIsActiveCheck = vi.fn(() => false);

    // Reset module state completely
    resetAutoloadState();
    initAutoload(mockLoadCallback, mockIsActiveCheck);
  });

  afterEach(() => {
    vi.useRealTimers();
    cancelAutoLoadTimer();
    resetAutoloadState();
  });

  describe('initAutoload', () => {
    it('should initialize with default configuration', () => {
      const config = getConfig();
      expect(config.imagePath).toBe('assets/sloth.jpg');
      expect(config.delay).toBe(3000);
      expect(config.isTimerActive).toBe(false);
    });

    it('should initialize with custom configuration', () => {
      resetAutoloadState();
      initAutoload(mockLoadCallback, mockIsActiveCheck, {
        imagePath: 'custom/image.jpg',
        delay: 5000,
      });

      const config = getConfig();
      expect(config.imagePath).toBe('custom/image.jpg');
      expect(config.delay).toBe(5000);
    });
  });

  describe('startAutoLoadTimer', () => {
    it('should start the timer and call load callback after delay', () => {
      startAutoLoadTimer();
      expect(isAutoLoadTimerActive()).toBe(true);

      // Fast-forward time by 3 seconds
      vi.advanceTimersByTime(3000);

      expect(mockLoadCallback).toHaveBeenCalledWith('assets/sloth.jpg');
      expect(isAutoLoadTimerActive()).toBe(false);
    });

    it('should not start timer if one is already running', () => {
      startAutoLoadTimer();
      const firstTimerActive = isAutoLoadTimerActive();

      startAutoLoadTimer(); // Try to start again

      expect(firstTimerActive).toBe(true);
      expect(isAutoLoadTimerActive()).toBe(true);

      // Only one callback should be scheduled
      vi.advanceTimersByTime(3000);
      expect(mockLoadCallback).toHaveBeenCalledTimes(1);
    });

    it('should not call load callback if puzzle is already active', () => {
      mockIsActiveCheck.mockReturnValue(true);

      startAutoLoadTimer();
      vi.advanceTimersByTime(3000);

      expect(mockLoadCallback).not.toHaveBeenCalled();
      expect(isAutoLoadTimerActive()).toBe(false);
    });

    it('should not call load callback if callbacks are not initialized', () => {
      initAutoload(null, null);

      startAutoLoadTimer();
      vi.advanceTimersByTime(3000);

      expect(mockLoadCallback).not.toHaveBeenCalled();
    });
  });

  describe('cancelAutoLoadTimer', () => {
    it('should cancel the timer before it fires', () => {
      startAutoLoadTimer();
      expect(isAutoLoadTimerActive()).toBe(true);

      cancelAutoLoadTimer();
      expect(isAutoLoadTimerActive()).toBe(false);

      vi.advanceTimersByTime(3000);
      expect(mockLoadCallback).not.toHaveBeenCalled();
    });

    it('should do nothing if no timer is running', () => {
      expect(isAutoLoadTimerActive()).toBe(false);

      // Should not throw or cause issues
      cancelAutoLoadTimer();

      expect(isAutoLoadTimerActive()).toBe(false);
    });
  });

  describe('isAutoLoadTimerActive', () => {
    it('should return false when no timer is running', () => {
      expect(isAutoLoadTimerActive()).toBe(false);
    });

    it('should return true when timer is running', () => {
      startAutoLoadTimer();
      expect(isAutoLoadTimerActive()).toBe(true);
    });

    it('should return false after timer completes', () => {
      startAutoLoadTimer();
      vi.advanceTimersByTime(3000);
      expect(isAutoLoadTimerActive()).toBe(false);
    });

    it('should return false after timer is cancelled', () => {
      startAutoLoadTimer();
      cancelAutoLoadTimer();
      expect(isAutoLoadTimerActive()).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = getConfig();
      expect(config).toEqual({
        imagePath: 'assets/sloth.jpg',
        delay: 3000,
        isTimerActive: false,
      });
    });

    it('should reflect timer state changes', () => {
      startAutoLoadTimer();
      expect(getConfig().isTimerActive).toBe(true);

      cancelAutoLoadTimer();
      expect(getConfig().isTimerActive).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update image path', () => {
      updateConfig({ imagePath: 'new/path.jpg' });
      expect(getConfig().imagePath).toBe('new/path.jpg');
    });

    it('should update delay', () => {
      updateConfig({ delay: 5000 });
      expect(getConfig().delay).toBe(5000);
    });

    it('should update both image path and delay', () => {
      updateConfig({
        imagePath: 'another/path.jpg',
        delay: 1000,
      });

      const config = getConfig();
      expect(config.imagePath).toBe('another/path.jpg');
      expect(config.delay).toBe(1000);
    });

    it('should not affect existing timer', () => {
      startAutoLoadTimer();
      updateConfig({ delay: 1000 });

      // Original timer should still fire after 3 seconds, not 1
      vi.advanceTimersByTime(1000);
      expect(mockLoadCallback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2000); // Total 3 seconds
      expect(mockLoadCallback).toHaveBeenCalled();
    });

    it('should use new delay for subsequent timers', () => {
      // Start fresh with clean state
      resetAutoloadState();
      initAutoload(mockLoadCallback, mockIsActiveCheck);
      updateConfig({ delay: 1000 });

      startAutoLoadTimer();
      vi.advanceTimersByTime(1000);

      expect(mockLoadCallback).toHaveBeenCalledWith('assets/sloth.jpg');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple start/cancel cycles', () => {
      // Start timer
      startAutoLoadTimer();
      expect(isAutoLoadTimerActive()).toBe(true);

      // Cancel before it fires
      cancelAutoLoadTimer();
      expect(isAutoLoadTimerActive()).toBe(false);

      // Start again
      startAutoLoadTimer();
      expect(isAutoLoadTimerActive()).toBe(true);

      // Let it fire
      vi.advanceTimersByTime(3000);
      expect(mockLoadCallback).toHaveBeenCalledTimes(1);
      expect(isAutoLoadTimerActive()).toBe(false);
    });

    it('should work with custom configuration end-to-end', () => {
      initAutoload(mockLoadCallback, mockIsActiveCheck, {
        imagePath: 'test/image.png',
        delay: 2000,
      });

      startAutoLoadTimer();
      vi.advanceTimersByTime(2000);

      expect(mockLoadCallback).toHaveBeenCalledWith('test/image.png');
    });

    it('should handle rapid configuration changes', () => {
      updateConfig({ imagePath: 'first.jpg' });
      updateConfig({ imagePath: 'second.jpg' });
      updateConfig({ imagePath: 'final.jpg' });

      startAutoLoadTimer();
      vi.advanceTimersByTime(3000);

      expect(mockLoadCallback).toHaveBeenCalledWith('final.jpg');
    });
  });
});
