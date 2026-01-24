/**
 * Scenario Similarity Unit Tests
 *
 * Tests for the similarity functions including:
 * - Cosine similarity calculation
 * - Edge cases and error handling
 */

import { describe, expect, it } from 'vitest';

import { cosineSimilarity } from './similarity';

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const vector = [1, 2, 3, 4, 5];
    const result = cosineSimilarity(vector, vector);
    expect(result).toBeCloseTo(1, 10);
  });

  it('should return 0 for orthogonal vectors', () => {
    const a = [1, 0];
    const b = [0, 1];
    const result = cosineSimilarity(a, b);
    expect(result).toBeCloseTo(0, 10);
  });

  it('should return -1 for opposite vectors', () => {
    const a = [1, 2, 3];
    const b = [-1, -2, -3];
    const result = cosineSimilarity(a, b);
    expect(result).toBeCloseTo(-1, 10);
  });

  it('should handle normalized vectors correctly', () => {
    // Two unit vectors at 60 degrees have cosine similarity of 0.5
    const a = [1, 0];
    const b = [0.5, Math.sqrt(3) / 2]; // 60 degree rotation
    const result = cosineSimilarity(a, b);
    expect(result).toBeCloseTo(0.5, 5);
  });

  it('should handle non-normalized vectors', () => {
    // Scaling a vector should not change the cosine similarity
    const a = [1, 2, 3];
    const b = [2, 4, 6]; // Same direction, scaled by 2
    const result = cosineSimilarity(a, b);
    expect(result).toBeCloseTo(1, 10);
  });

  it('should handle vectors with different magnitudes', () => {
    const a = [3, 4]; // magnitude 5
    const b = [6, 8]; // magnitude 10, same direction
    const result = cosineSimilarity(a, b);
    expect(result).toBeCloseTo(1, 10);
  });

  it('should throw error for vectors of different lengths', () => {
    const a = [1, 2, 3];
    const b = [1, 2];
    expect(() => cosineSimilarity(a, b)).toThrow('Vectors must have same length');
  });

  it('should return 0 for zero vectors', () => {
    const a = [0, 0, 0];
    const b = [1, 2, 3];
    const result = cosineSimilarity(a, b);
    expect(result).toBe(0);
  });

  it('should return 0 for two zero vectors', () => {
    const a = [0, 0, 0];
    const b = [0, 0, 0];
    const result = cosineSimilarity(a, b);
    expect(result).toBe(0);
  });

  it('should handle high-dimensional vectors', () => {
    // Simulate embedding vectors (typically 1536 dimensions for text-embedding-3-small)
    const dim = 1536;
    const a = Array.from({ length: dim }, (_, i) => Math.sin(i));
    const b = Array.from({ length: dim }, (_, i) => Math.sin(i));
    const result = cosineSimilarity(a, b);
    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle high-dimensional dissimilar vectors', () => {
    const dim = 1536;
    const a = Array.from({ length: dim }, (_, i) => Math.sin(i));
    const b = Array.from({ length: dim }, (_, i) => Math.cos(i));
    const result = cosineSimilarity(a, b);
    // Should be between -1 and 1, but not 1
    expect(result).toBeLessThan(1);
    expect(result).toBeGreaterThanOrEqual(-1);
  });

  it('should produce consistent results for partial similarity', () => {
    const a = [1, 0, 1, 0];
    const b = [1, 1, 0, 0];
    const result = cosineSimilarity(a, b);
    // Expected: (1*1 + 0*1 + 1*0 + 0*0) / (sqrt(2) * sqrt(2)) = 1/2 = 0.5
    expect(result).toBeCloseTo(0.5, 10);
  });

  it('should handle negative values correctly', () => {
    const a = [-1, 2, -3];
    const b = [1, -2, 3];
    const result = cosineSimilarity(a, b);
    // Opposite directions
    expect(result).toBeCloseTo(-1, 10);
  });

  it('should handle mixed positive and negative values', () => {
    const a = [1, -1, 1];
    const b = [1, 1, -1];
    const result = cosineSimilarity(a, b);
    // (1 - 1 - 1) / (sqrt(3) * sqrt(3)) = -1/3
    expect(result).toBeCloseTo(-1 / 3, 10);
  });

  it('should handle very small values without underflow', () => {
    const a = [1e-10, 2e-10, 3e-10];
    const b = [1e-10, 2e-10, 3e-10];
    const result = cosineSimilarity(a, b);
    expect(result).toBeCloseTo(1, 5);
  });

  it('should handle empty arrays', () => {
    const a: number[] = [];
    const b: number[] = [];
    const result = cosineSimilarity(a, b);
    // 0/0 case, returns 0 per implementation
    expect(result).toBe(0);
  });
});
