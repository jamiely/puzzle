import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isOverlapping,
  findNonOverlappingPosition,
  generatePerimeterPositions,
  calculateDistanceFromCenter,
  getRandomRotation,
} from '../src/positioning.js';

describe('Positioning functionality', () => {
  beforeEach(() => {
    // Mock window dimensions for consistent testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
  });

  describe('isOverlapping', () => {
    it('should detect overlapping pieces', () => {
      const placedPieces = [{ x: 100, y: 100, width: 50, height: 50 }];

      // Overlapping case
      expect(isOverlapping(120, 120, 50, 50, placedPieces)).toBe(true);

      // Non-overlapping case (with padding)
      expect(isOverlapping(200, 200, 50, 50, placedPieces)).toBe(false);
    });

    it('should account for padding in overlap detection', () => {
      const placedPieces = [{ x: 100, y: 100, width: 50, height: 50 }];

      // Just touching with padding (20px) should be considered overlapping
      // Piece 1: x=100-150, Piece 2: x=150-200, padding=20, so 150+20 > 150 = true
      expect(isOverlapping(150, 100, 50, 50, placedPieces)).toBe(true);

      // Outside padding range should be fine
      expect(isOverlapping(171, 100, 50, 50, placedPieces)).toBe(false);
    });
  });

  describe('calculateDistanceFromCenter', () => {
    it('should calculate distance from viewport center correctly', () => {
      // Center of viewport is (600, 400)

      // Piece at center should have minimal distance
      const centerDistance = calculateDistanceFromCenter(575, 375, 50, 50);
      expect(centerDistance).toBe(0);

      // Piece away from center should have larger distance
      const cornerDistance = calculateDistanceFromCenter(0, 0, 50, 50);
      expect(cornerDistance).toBeGreaterThan(centerDistance);
    });
  });

  describe('generatePerimeterPositions', () => {
    it('should generate positions around the perimeter', () => {
      const positions = generatePerimeterPositions(100, 100, 1000, 600, 10);

      expect(positions.length).toBeGreaterThan(0);

      // Check that positions include edges (allowing for randomness)
      const topEdgePositions = positions.filter((pos) => pos.y <= 50);
      const bottomEdgePositions = positions.filter((pos) => pos.y >= 500);
      const leftEdgePositions = positions.filter((pos) => pos.x <= 50);
      const rightEdgePositions = positions.filter((pos) => pos.x >= 850);

      // Should have at least some positions on different edges
      const totalEdgePositions =
        topEdgePositions.length +
        bottomEdgePositions.length +
        leftEdgePositions.length +
        rightEdgePositions.length;
      expect(totalEdgePositions).toBeGreaterThan(0);
    });

    it('should add randomness to perimeter positions', () => {
      const positions1 = generatePerimeterPositions(100, 100, 1000, 600, 10);
      const positions2 = generatePerimeterPositions(100, 100, 1000, 600, 10);

      // Due to randomness, positions should be different
      const firstPositionsMatch = positions1.every((pos1, index) => {
        const pos2 = positions2[index];
        return pos1 && pos2 && pos1.x === pos2.x && pos1.y === pos2.y;
      });

      expect(firstPositionsMatch).toBe(false);
    });
  });

  describe('findNonOverlappingPosition', () => {
    it('should find non-overlapping position when space is available', () => {
      const placedPieces = [{ x: 100, y: 100, width: 50, height: 50 }];

      const position = findNonOverlappingPosition(50, 50, placedPieces);

      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(position.x).toBeGreaterThanOrEqual(10);
      expect(position.y).toBeGreaterThanOrEqual(10);

      // Verify the returned position doesn't overlap
      expect(isOverlapping(position.x, position.y, 50, 50, placedPieces)).toBe(
        false
      );
    });

    it('should prefer spreading pieces apart', () => {
      // Test that multiple pieces get spread out
      const placedPieces = [];
      const positions = [];

      // Place 3 pieces and verify they get spread apart
      for (let i = 0; i < 3; i++) {
        const position = findNonOverlappingPosition(100, 100, placedPieces);
        positions.push(position);
        placedPieces.push({
          x: position.x,
          y: position.y,
          width: 100,
          height: 100,
        });
      }

      // Calculate average distance between pieces
      let totalDistance = 0;
      let pairCount = 0;

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          totalDistance += Math.sqrt(dx * dx + dy * dy);
          pairCount++;
        }
      }

      const averageDistance = totalDistance / pairCount;

      // Pieces should be reasonably spread apart (more than just minimum spacing)
      expect(averageDistance).toBeGreaterThan(150);
    });

    it('should handle very crowded scenarios gracefully', () => {
      // Create many placed pieces to simulate crowded space
      const placedPieces = [];
      for (let x = 0; x < 1000; x += 80) {
        for (let y = 0; y < 600; y += 80) {
          placedPieces.push({ x, y, width: 60, height: 60 });
        }
      }

      // Should still find a position or return something valid
      const position = findNonOverlappingPosition(50, 50, placedPieces);
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
    });
  });

  describe('getRandomRotation', () => {
    it('should return rotation in 30-degree increments', () => {
      const validRotations = [
        0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
      ];

      for (let i = 0; i < 20; i++) {
        const rotation = getRandomRotation();
        expect(validRotations).toContain(rotation);
      }
    });

    it('should produce variety in rotations', () => {
      const rotations = new Set();

      for (let i = 0; i < 50; i++) {
        rotations.add(getRandomRotation());
      }

      // Should produce at least a few different rotations
      expect(rotations.size).toBeGreaterThan(2);
    });
  });

  describe('Integration: piece distribution', () => {
    it('should distribute multiple pieces without overlapping', () => {
      const placedPieces = [];
      const positions = [];

      // Try to place 4 pieces (typical puzzle size)
      for (let i = 0; i < 4; i++) {
        const position = findNonOverlappingPosition(100, 100, placedPieces);
        positions.push(position);

        placedPieces.push({
          x: position.x,
          y: position.y,
          width: 100,
          height: 100,
        });
      }

      // Verify no overlaps between any pieces
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const pos1 = positions[i];
          const pos2 = positions[j];

          const isOverlap = isOverlapping(pos1.x, pos1.y, 100, 100, [
            { x: pos2.x, y: pos2.y, width: 100, height: 100 },
          ]);

          expect(isOverlap).toBe(false);
        }
      }
    });

    it('should spread pieces across the viewport', () => {
      const placedPieces = [];
      const positions = [];

      // Place 4 pieces
      for (let i = 0; i < 4; i++) {
        const position = findNonOverlappingPosition(100, 100, placedPieces);
        positions.push(position);

        placedPieces.push({
          x: position.x,
          y: position.y,
          width: 100,
          height: 100,
        });
      }

      // Calculate spread - pieces should not all be clustered in one area
      const xPositions = positions.map((p) => p.x);
      const yPositions = positions.map((p) => p.y);

      const xRange = Math.max(...xPositions) - Math.min(...xPositions);
      const yRange = Math.max(...yPositions) - Math.min(...yPositions);

      // Should have reasonable spread (not all pieces in tiny area)
      expect(xRange).toBeGreaterThan(200);
      expect(yRange).toBeGreaterThan(150);
    });
  });
});
