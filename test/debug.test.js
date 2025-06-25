import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generatePieceId } from '../src/debug.js';

describe('Debug Module', () => {
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
  });
});
