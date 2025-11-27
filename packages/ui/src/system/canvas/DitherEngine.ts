/**
 * DitherEngine - Core Bayer Dithering Algorithm
 *
 * Provides high-performance canvas-based text dithering using
 * ordered Bayer matrix dithering. Supports pre-computed animation frames
 * for reveal and pulse effects.
 */

import { getBayerMatrix, getBayerMatrixSize } from './bayerMatrix';

export interface DitherOptions {
  /** Font string (e.g., "bold 120px Space Grotesk") */
  font: string;
  /** Dithering threshold (0-255, lower = more black pixels) */
  threshold: number;
  /** Text color (default: currentColor) */
  color?: string;
  /** Canvas scaling for high-DPI displays */
  scale?: number;
  /** Use low-detail matrix for performance */
  lowDetail?: boolean;
}

export class DitherEngine {
  private bayerMatrix: number[][];
  private matrixSize: number;

  constructor(lowDetail = false) {
    this.bayerMatrix = getBayerMatrix(lowDetail);
    this.matrixSize = getBayerMatrixSize(this.bayerMatrix);
  }

  /**
   * Generate dithered text as ImageData
   *
   * @param text - Text to dither
   * @param options - Dithering options
   * @param width - Canvas width (optional, auto-calculated if not provided)
   * @param height - Canvas height (optional, auto-calculated if not provided)
   * @returns ImageData with dithered text
   */
  ditherText(text: string, options: DitherOptions, width?: number, height?: number): ImageData {
    // SSR safety: return empty ImageData if not in browser
    if (typeof document === 'undefined') {
      // Return 1x1 transparent ImageData for SSR
      return new ImageData(1, 1);
    }

    const { font, threshold, color = '#000000', scale = 1 } = options;

    // Create temporary canvas to measure text
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) throw new Error('Failed to get 2D context');

    tempCtx.font = font;
    const metrics = tempCtx.measureText(text);

    // Calculate dimensions
    const w =
      width ||
      Math.ceil(metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight + 20) * scale;
    const h =
      height ||
      Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 20) * scale;

    // Set canvas size
    tempCanvas.width = w;
    tempCanvas.height = h;

    // Draw text
    tempCtx.scale(scale, scale);
    tempCtx.font = font;
    tempCtx.fillStyle = color;
    tempCtx.textBaseline = 'top';
    tempCtx.fillText(text, 10, 10);

    // Get image data
    const imageData = tempCtx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Apply Bayer dithering
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;

        // Convert to grayscale
        const r = data[i] ?? 0;
        const g = data[i + 1] ?? 0;
        const b = data[i + 2] ?? 0;
        const a = data[i + 3] ?? 0;

        // Skip fully transparent pixels
        if (a === 0) continue;

        const grayscale = r * 0.299 + g * 0.587 + b * 0.114;

        // Get Bayer matrix value
        const bayerValue = this.bayerMatrix[y % this.matrixSize]?.[x % this.matrixSize] ?? 0;

        // Apply threshold with Bayer value
        const output = grayscale > threshold + bayerValue ? 255 : 0;

        data[i] = output;
        data[i + 1] = output;
        data[i + 2] = output;
        data[i + 3] = output === 255 ? 0 : 255; // Invert alpha for black pixels
      }
    }

    return imageData;
  }

  /**
   * Generate reveal animation frames
   *
   * Animates threshold from 255 (hidden) to 0 (fully visible)
   *
   * @param text - Text to animate
   * @param options - Dithering options (threshold will be overridden)
   * @param steps - Number of frames (default: 60 = 1s at 60fps)
   * @returns Array of ImageData frames
   */
  generateRevealFrames(text: string, options: DitherOptions, steps = 60): ImageData[] {
    const frames: ImageData[] = [];

    for (let i = 0; i < steps; i++) {
      // Ease-out curve for smooth reveal
      const progress = this.easeOutCubic(i / (steps - 1));
      const threshold = Math.floor(255 - progress * 255);

      const frameData = this.ditherText(text, {
        ...options,
        threshold,
      });

      frames.push(frameData);
    }

    return frames;
  }

  /**
   * Generate pulse animation frames
   *
   * Oscillates threshold for a breathing/pulsing effect
   *
   * @param text - Text to animate
   * @param options - Dithering options
   * @param phases - Number of frames in full cycle (default: 30)
   * @returns Array of ImageData frames
   */
  generatePulseFrames(text: string, options: DitherOptions, phases = 30): ImageData[] {
    const frames: ImageData[] = [];
    const baseThreshold = options.threshold || 128;
    const amplitude = 40; // Pulse intensity

    for (let i = 0; i < phases; i++) {
      // Sine wave oscillation
      const progress = Math.sin((i / phases) * Math.PI * 2);
      const threshold = Math.floor(baseThreshold + progress * amplitude);

      const frameData = this.ditherText(text, {
        ...options,
        threshold: Math.max(0, Math.min(255, threshold)),
      });

      frames.push(frameData);
    }

    return frames;
  }

  /**
   * Ease-out cubic curve for smooth animations
   */
  private easeOutCubic(t: number): number {
    return 1 - (1 - t) ** 3;
  }
}

/**
 * Singleton instance for reuse across components
 */
let ditherEngineInstance: DitherEngine | null = null;

export function getDitherEngine(lowDetail = false): DitherEngine {
  if (!ditherEngineInstance) {
    ditherEngineInstance = new DitherEngine(lowDetail);
  }
  return ditherEngineInstance;
}
