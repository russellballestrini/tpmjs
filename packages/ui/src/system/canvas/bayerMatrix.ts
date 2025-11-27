/**
 * Bayer Matrix for Ordered Dithering
 *
 * 8×8 Bayer matrix used for ordered dithering algorithms.
 * Values are normalized to 0-255 range for easy threshold comparison.
 *
 * This creates the characteristic halftone/dot-matrix pattern
 * while avoiding the randomness of error-diffusion dithering.
 */

/**
 * Standard 8×8 Bayer matrix (normalized to 0-255)
 *
 * Formula: bayerMatrix[y][x] = (originalValue / 64) * 255
 * where original values range from 0-63
 */
export const BAYER_MATRIX_8X8: number[][] = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
].map((row) => row.map((val) => Math.floor((val / 64) * 255)));

/**
 * 4×4 Bayer matrix for mobile/performance optimization
 *
 * Smaller matrix = faster computation, less detailed dithering
 * Use this on mobile devices or for subtle effects
 */
export const BAYER_MATRIX_4X4: number[][] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((val) => Math.floor((val / 16) * 255)));

/**
 * Get the appropriate Bayer matrix based on device capabilities
 *
 * @param preferLowDetail - Force 4×4 matrix for performance
 * @returns Bayer matrix (either 8×8 or 4×4)
 */
export function getBayerMatrix(preferLowDetail = false): number[][] {
  // Use smaller matrix on mobile or when explicitly requested
  if (preferLowDetail || (typeof window !== 'undefined' && window.innerWidth < 640)) {
    return BAYER_MATRIX_4X4;
  }

  return BAYER_MATRIX_8X8;
}

/**
 * Get matrix size (4 or 8)
 */
export function getBayerMatrixSize(matrix: number[][]): number {
  return matrix.length;
}
