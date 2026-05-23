export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface ConvertOptions {
  brightness: number;
  contrast: number;
  threshold: number;
  invert: boolean;
  saturation?: number;
  grayscale?: boolean;
  thresholdMode?: boolean;
  alphaThreshold?: number;
}

export function convertImageToPolar(
  canvas: HTMLCanvasElement,
  numLeds: number,
  numSectors: number,
  options: ConvertOptions
): Promise<RGBColor[][]> {
  return new Promise((resolve) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve([]);

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    
    // Web Worker script as string
    const workerScript = `
      self.onmessage = function(e) {
        const { imgData, width, height, numLeds, numSectors, options } = e.data;
        const pixels = imgData.data;
        const cx = width / 2;
        const cy = height / 2;
        const maxRadius = Math.min(cx, cy) * (options.imageScale || 0.95);
        
        const polarMatrix = [];
        
        const bFactor = options.brightness;
        const cFactor = (options.contrast + 100) / 100;
        const satFactor = options.saturation !== undefined ? (options.saturation + 100) / 100 : 1;
        const thresholdVal = options.threshold ?? 128;
        const alphaThresh = options.alphaThreshold ?? 20;

        // Bilinear interpolation helper
        function getPixel(x, y) {
          x = Math.max(0, Math.min(width - 1, x));
          y = Math.max(0, Math.min(height - 1, y));
          const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
          return {
            r: pixels[idx],
            g: pixels[idx + 1],
            b: pixels[idx + 2],
            a: pixels[idx + 3]
          };
        }

        function getBilinearPixel(x, y) {
          const x1 = Math.floor(x);
          const y1 = Math.floor(y);
          const x2 = Math.min(x1 + 1, width - 1);
          const y2 = Math.min(y1 + 1, height - 1);
          
          const dx = x - x1;
          const dy = y - y1;
          
          const p11 = getPixel(x1, y1);
          const p21 = getPixel(x2, y1);
          const p12 = getPixel(x1, y2);
          const p22 = getPixel(x2, y2);
          
          const r = p11.r * (1 - dx) * (1 - dy) + p21.r * dx * (1 - dy) + p12.r * (1 - dx) * dy + p22.r * dx * dy;
          const g = p11.g * (1 - dx) * (1 - dy) + p21.g * dx * (1 - dy) + p12.g * (1 - dx) * dy + p22.g * dx * dy;
          const b = p11.b * (1 - dx) * (1 - dy) + p21.b * dx * (1 - dy) + p12.b * (1 - dx) * dy + p22.b * dx * dy;
          const a = p11.a * (1 - dx) * (1 - dy) + p21.a * dx * (1 - dy) + p12.a * (1 - dx) * dy + p22.a * dx * dy;
          
          return { r, g, b, a };
        }

        for (let s = 0; s < numSectors; s++) {
          const sectorAngle = (s * 2 * Math.PI) / numSectors;
          // Offset by -90 degrees so top of image maps to sector 0
          const renderAngle = sectorAngle - Math.PI / 2;
          const cosAngle = Math.cos(renderAngle);
          const sinAngle = Math.sin(renderAngle);
          const radialSlice = [];

          for (let l = 0; l < numLeds; l++) {
            // Apply scale logic properly. The LED mapping rDistance ranges from 0 to maxRadius.
            // If the image is non-square and we want to preserve its aspect fit, we adjust cx, cy based on original bounds.
            const rDistance = (l / (numLeds - 1)) * maxRadius;
            const srcX = cx + rDistance * cosAngle;
            const srcY = cy + rDistance * sinAngle;

            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
              const { r: pr, g: pg, b: pb, a: pa } = getBilinearPixel(srcX, srcY);
              let r = pr, g = pg, b = pb, a = pa;

              if (a < alphaThresh) {
                r = 0; g = 0; b = 0;
              } else {
                const alphaRatio = a / 255;
                r = Math.round(r * alphaRatio);
                g = Math.round(g * alphaRatio);
                b = Math.round(b * alphaRatio);
              }

              r = Math.min(255, Math.max(0, r + bFactor));
              g = Math.min(255, Math.max(0, g + bFactor));
              b = Math.min(255, Math.max(0, b + bFactor));

              r = Math.min(255, Math.max(0, (r - 128) * cFactor + 128));
              g = Math.min(255, Math.max(0, (g - 128) * cFactor + 128));
              b = Math.min(255, Math.max(0, (b - 128) * cFactor + 128));

              if (options.saturation !== undefined && options.saturation !== 0) {
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                r = Math.min(255, Math.max(0, gray + (r - gray) * satFactor));
                g = Math.min(255, Math.max(0, gray + (g - gray) * satFactor));
                b = Math.min(255, Math.max(0, gray + (b - gray) * satFactor));
              }

              if (options.grayscale) {
                const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                r = gray; g = gray; b = gray;
              }

              if (options.thresholdMode) {
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                const val = gray >= thresholdVal ? 255 : 0;
                r = val; g = val; b = val;
              }

              if (options.invert) {
                r = 255 - r; g = 255 - g; b = 255 - b;
              }

              radialSlice.push({ r: Math.round(r), g: Math.round(g), b: Math.round(b) });
            } else {
              radialSlice.push({ r: 0, g: 0, b: 0 });
            }
          }
          polarMatrix.push(radialSlice);
        }
        
        self.postMessage(polarMatrix);
      };
    `;
    
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    const worker = new Worker(blobUrl);
    
    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
      URL.revokeObjectURL(blobUrl); // cleanup
    };
    
    worker.postMessage({ imgData, width, height, numLeds, numSectors, options });
  });
}

export function generateDefaultLogo(numLeds: number, numSectors: number): RGBColor[][] {
  const polarMatrix: RGBColor[][] = [];
  for (let s = 0; s < numSectors; s++) {
    const angle = (s * 2 * Math.PI) / numSectors;
    const radialSlice: RGBColor[] = [];
    for (let l = 0; l < numLeds; l++) {
      let r = 0; let g = 0; let b = 0;
      if (l <= 5) {
        const pulse = 150 + Math.floor(Math.sin((s / numSectors) * 4 * Math.PI) * 105);
        r = Math.floor(pulse * 0.1);
        g = pulse;
        b = Math.floor(pulse * 0.8);
      } else if (Math.abs(l - 20) <= 2) {
        const timeFactor = (s + Math.floor(Date.now() / 60)) % numSectors;
        if (timeFactor % Math.floor(numSectors / 3) < 4) {
          r = 255; g = 50; b = 150;
        } else {
          r = 0; g = 100; b = 180;
        }
      } else if (Math.abs(l - 35) <= 1) {
        const isSymmetricNode = (s % Math.floor(numSectors / 4) === 0);
        if (isSymmetricNode) {
          r = 255; g = 180; b = 0;
        } else if (s % 6 === 0) {
          r = 0; g = 200; b = 255;
        }
      } else if (l === numLeds - 2) {
        if (s % 15 === 0) {
          r = 100; g = 100; b = 100;
        }
      }
      radialSlice.push({ r, g, b });
    }
    polarMatrix.push(radialSlice);
  }
  return polarMatrix;
}
