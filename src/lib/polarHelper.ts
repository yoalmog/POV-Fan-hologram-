/**
 * Polar mapping & Color conversion utilities for POV LED Hologram Displays
 * Specifically customized for 2-arm (45 LEDs per arm) WS2812B systems.
 */

export interface PolarPixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Samples a rectangular source canvas into a 120 x 45 polar coordinate matrix.
 * Num Sectors = 120 (columns)
 * Num LEDs = 45 (rows, where row 0 is the center, row 44 is the outer tip)
 */
export function convertImageToPolar(
  sourceCanvas: HTMLCanvasElement,
  sectorsCount: number = 120,
  ledsCount: number = 45,
  hallOffsetDegrees: number = 0
): PolarPixel[][] {
  const ctx = sourceCanvas.getContext("2d");
  if (!ctx) return createEmptyPolarMap(sectorsCount, ledsCount);

  const { width, height } = sourceCanvas;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(centerX, centerY) * 0.95; // 5% padding to avoid edge cutoff

  // Get full image pixel data for fast lookup
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const polarMap: PolarPixel[][] = [];

  for (let s = 0; s < sectorsCount; s++) {
    const sectorPixels: PolarPixel[] = [];
    
    // Convert sector index to angle (radians).
    // The rotation can be adjusted by the hallOffsetDegrees
    const angleRad = (s * (360 / sectorsCount) + hallOffsetDegrees) * (Math.PI / 180);

    for (let r = 0; r < ledsCount; r++) {
      // Linear radius distance (0 at center, 1 at the absolute outer LED tip)
      const rRatio = r / (ledsCount - 1);
      const currentRadius = rRatio * maxRadius;

      // Cartesian coordinate on source image
      // Adding 0.5 to center the sampling point
      const x = Math.round(centerX + currentRadius * Math.cos(angleRad));
      const y = Math.round(centerY + currentRadius * Math.sin(angleRad));

      // Guard boundaries
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const i = (y * width + x) * 4;
        sectorPixels.push({
          r: data[i],
          g: data[i + 1],
          b: data[i + 2],
          a: data[i + 3]
        });
      } else {
        sectorPixels.push({ r: 0, g: 0, b: 0, a: 0 });
      }
    }
    
    polarMap.push(sectorPixels);
  }

  return polarMap;
}

/**
 * Creates a blank polar black map
 */
export function createEmptyPolarMap(sectors: number, leds: number): PolarPixel[][] {
  const map: PolarPixel[][] = [];
  for (let s = 0; s < sectors; s++) {
    const col: PolarPixel[] = [];
    for (let r = 0; r < leds; r++) {
      col.push({ r: 0, g: 0, b: 0, a: 0 });
    }
    map.push(col);
  }
  return map;
}

/**
 * Convert separate RGB values to uint16_t (RGB565)
 * Red 5 bits [15:11], Green 6 bits [10:5], Blue 5 bits [4:0]
 */
export function convertToRGB565(r: number, g: number, b: number): number {
  const r5 = (r >> 3) & 0x1F;
  const g6 = (g >> 2) & 0x3F;
  const b5 = (b >> 3) & 0x1F;
  return (r5 << 11) | (g6 << 5) | b5;
}

/**
 * Convert separate RGB values to uint8_t (RGB332)
 * Red 3 bits [7:5], Green 3 bits [4:2], Blue 2 bits [1:0]
 */
export function convertToRGB332(r: number, g: number, b: number): number {
  const r3 = (r >> 5) & 0x07;
  const g3 = (g >> 5) & 0x07;
  const b2 = (b >> 6) & 0x03;
  return (r3 << 5) | (g3 << 2) | b2;
}

/**
 * Helper to turn a packed RBG representation into standard CSS color
 */
export function rgb565ToCSS(val565: number): string {
  const r = ((val565 >> 11) & 0x1F) << 3;
  const g = ((val565 >> 5) & 0x3F) << 2;
  const b = (val565 & 0x1F) << 3;
  return `rgb(${r}, ${g}, ${b})`;
}

export function rgb332ToCSS(val332: number): string {
  const r = ((val332 >> 5) & 0x07) << 5;
  const g = ((val332 >> 2) & 0x07) << 5;
  const b = (val332 & 0x03) << 6;
  return `rgb(${r}, ${g}, ${b})`;
}
