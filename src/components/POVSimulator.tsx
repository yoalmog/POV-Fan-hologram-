import React, { useEffect, useRef, useState } from "react";
import { POVConfig, SUPPORTED_EFFECTS } from "../types";
import { RGBColor } from "../lib/polarConverter";

interface POVSimulatorProps {
  config: POVConfig;
  polarData: RGBColor[][];
  showPhysicalRotor: boolean;
  hallSensorOffset: number; // in degrees
  simSpeed?: number;
  isCalibrating?: boolean;
}

export const POVSimulator: React.FC<POVSimulatorProps> = ({
  config,
  polarData,
  showPhysicalRotor,
  hallSensorOffset,
  simSpeed,
  isCalibrating,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 350, height: 350 });
  const animationRef = useRef<number | null>(null);
  
  // Track rotational angle of the arms in radians
  const angleRef = useRef<number>(0);
  const renderTimeRef = useRef<number>(0);
  const [currentRpm, setCurrentRpm] = useState(config.rpm);

  // Monitor element sizing natively to fit in responsive grids fluidly
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      const size = Math.min(width, height || width);
      setDimensions({ width: size, height: size });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update speed values smoothly representation
  useEffect(() => {
    setCurrentRpm(config.rpm);
  }, [config.rpm]);

  // Convert HSV to standard RGB format
  const hsvToRgb = (h: number, s: number, v: number): RGBColor => {
    h = (h % 360) / 360;
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  };

  // Converts heat value to yellow-orange-red fire bytes
  const getHeatColor = (heat: number): RGBColor => {
    // 0 to 255
    const r = Math.min(255, heat * 2);
    const g = Math.min(255, Math.max(0, heat - 80) * 2);
    const b = Math.min(255, Math.max(0, heat - 180) * 4);
    return { r, g, b };
  };

  // Core Simulation Renderer Hook
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (sysTime: number) => {
      const delta = (sysTime - lastTime) / 1000; // seconds
      const deltaMs = sysTime - lastTime;
      lastTime = sysTime;

      const simMultiplier = simSpeed !== undefined ? simSpeed : 1;
      renderTimeRef.current += deltaMs * simMultiplier;
      const time = renderTimeRef.current;

      // Increment rotation angle based on configured RPM
      // RPM / 60 = revs per second. * 2 * PI = rads per second.
      const radPerSec = (currentRpm / 60) * 2 * Math.PI;
      angleRef.current = (angleRef.current + radPerSec * delta) % (2 * Math.PI);

      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;
      const maxRadius = cx * 0.9;
      const numLeds = config.numLeds; // 45 per arm
      const numSectors = config.numSectors; // 120 sectors

      // 1. PERSISTENCE OF VISION SIMULATION FADE EFFECT
      // If we are showing physical rotor arms, we fade intermediate pixels less aggressively.
      // If blending into a hologram, we draw high-decay background to merge loops flawlessly.
      if (showPhysicalRotor) {
        ctx.fillStyle = "rgba(5, 5, 5, 0.25)"; // Fast clear to highlight physical movement
      } else {
        ctx.fillStyle = "rgba(5, 5, 5, 0.08)"; // Slow decay trails create a beautiful glowing mesh!
      }
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw faint physical guides
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius, 0, 2 * Math.PI);
      ctx.stroke();

      if (isCalibrating || showPhysicalRotor) {
        // Draw 0 Degree Trigger point
        ctx.strokeStyle = "rgba(255, 0, 0, 0.4)"; // Trigger point marker
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxRadius * Math.cos(0), cy + maxRadius * Math.sin(0));
        ctx.stroke();
        
        if (isCalibrating) {
           // Draw Offset point
           ctx.strokeStyle = "rgba(0, 255, 255, 0.8)"; // Offset Target
           ctx.beginPath();
           ctx.moveTo(cx, cy);
           const offsetRad = (config.hallOffset * Math.PI) / 180;
           ctx.lineTo(cx + maxRadius * Math.cos(offsetRad), cy + maxRadius * Math.sin(offsetRad));
           ctx.stroke();
           ctx.fillStyle = "rgba(0, 255, 255, 1)";
           ctx.font = "10px monospace";
           ctx.fillText(`Offset: ${config.hallOffset}°`, cx + (maxRadius * 0.5) * Math.cos(offsetRad) + 5, cy + (maxRadius * 0.5) * Math.sin(offsetRad));
        }
        ctx.setLineDash([]);
      }

      // Help drawing coordinates: At current frame, where are the two spinning arms?
      const baseAngle = angleRef.current + (hallSensorOffset * Math.PI) / 180; // Add physical hall sync shift

      // Array holding drawing sectors: Arm A draws at angle θ, Arm B draws at θ + π.
      const arms = [
        { angle: baseAngle, offsetSectors: 0 },
        { angle: baseAngle + Math.PI, offsetSectors: Math.floor(numSectors / 2) }
      ];

      // Clean off physical lines rendering
      if (showPhysicalRotor) {
        arms.forEach((arm) => {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(
            cx + maxRadius * Math.cos(arm.angle),
            cy + maxRadius * Math.sin(arm.angle)
          );
          ctx.stroke();

          // Draw the physical center axis screw
          ctx.fillStyle = "#1e293b";
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // Draw active LEDs along the rotating arms
      arms.forEach((arm, armIdx) => {
        // Find which angular sector the arm is currently traversing
        let normalizedAngle = arm.angle % (2 * Math.PI);
        if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
        
        const currentSector = Math.floor((normalizedAngle / (2 * Math.PI)) * numSectors) % numSectors;

        // Calculate Sequence Effects
        let effA = config.activeEffect;
        let effB = config.activeEffectArmB;
        if (config.isSequenceActive && config.sequenceSteps && config.sequenceSteps.length > 0) {
          const totalDuration = config.sequenceSteps.reduce((acc, step) => acc + step.durationMs, 0);
          const sequenceTime = (time * 1000) % totalDuration;
          let cumulative = 0;
          for (const step of config.sequenceSteps) {
            cumulative += step.durationMs;
            if (sequenceTime <= cumulative) {
              effA = step.armA_Effect;
              effB = step.armB_Effect;
              break;
            }
          }
        }

        // Separate arm indices active effects
        const activeEff = (config.separateArmControl && armIdx === 1) 
          ? effB 
          : ((armIdx === 1 && config.isSequenceActive) ? effB : effA);

        // Extract dynamic config values for effects
        const speedMult = (config.effectSpeed !== undefined ? config.effectSpeed : 100) / 100;
        const distMult = (config.effectDensity !== undefined ? config.effectDensity : 100) / 100;
        const intMult = (config.effectIntensity !== undefined ? config.effectIntensity : 100) / 100;

        for (let l = 0; l < numLeds; l++) {
          const radialDist = (l / (numLeds - 1)) * maxRadius;
          const ledX = cx + radialDist * Math.cos(arm.angle);
          const ledY = cy + radialDist * Math.sin(arm.angle);

          // Get color for this LED based on the active selected effect and sector position
          let color: RGBColor = { r: 0, g: 0, b: 0 };
          const s = currentSector;

          switch (activeEff) {
            case 0: // EFFECT 0: CUSTOM LOGO / POLAR FILE INDEX
              {
                const baseColor = polarData[s]?.[l] || { r: 0, g: 0, b: 0 };
                // Separate arm B gets inverted visual stream
                if (config.separateArmControl && armIdx === 1) {
                  const isBlack = baseColor.r < 10 && baseColor.g < 10 && baseColor.b < 10;
                  color = isBlack ? { r: 0, g: 0, b: 0 } : { r: 255 - baseColor.r, g: 255 - baseColor.g, b: 255 - baseColor.b };
                } else {
                  color = baseColor;
                }
              }
              break;

            case 1: // EFFECT 1: HOLOGRAPHIC ANALOG CLOCK
              {
                const isMarker = s % (numSectors / 12) === 0;
                if (isMarker && l > 38) {
                  color = { r: 180, g: 180, b: 200 }; // Dial scale lines
                } else {
                  // Draw rotating hands
                  const now = new Date();
                  const secs = now.getSeconds() + now.getMilliseconds() / 1000;
                  const mins = now.getMinutes() + secs / 60;
                  const hrs = (now.getHours() % 12) + mins / 60;

                  const secSector = Math.floor((secs / 60) * numSectors) % numSectors;
                  const minSector = Math.floor((mins / 60) * numSectors) % numSectors;
                  const hrSector = Math.floor((hrs / 12) * numSectors) % numSectors;

                  if (s === secSector && l > 10) {
                    color = { r: 255, g: 30, b: 30 }; // Red ticking seconds hand
                  } else if (s === minSector && l < 38 && l > 4) {
                    color = { r: 0, g: 255, b: 120 }; // Bright green minutes hand
                  } else if (s === hrSector && l < 28 && l > 4) {
                    color = { r: 0, g: 180, b: 255 }; // Electric blue hours hand
                  }
                }
              }
              break;

            case 2: // EFFECT 2: HSV RAINBOW SPIN VORTEX
              {
                const hue = (s * 360) / numSectors + l * 4 + time * (0.05 * speedMult);
                color = hsvToRgb(hue, 1, intMult);
              }
              break;

            case 3: // EFFECT 3: MILITARY SONAR/RADAR
              {
                const sweepPtr = Math.floor((time * 0.08) * numSectors) % numSectors;
                const distOffset = (sweepPtr + numSectors - s) % numSectors;
                if (distOffset === 0) {
                  color = { r: 100, g: 255, b: 140 }; // Sweep line
                } else if (distOffset < 30) {
                  const greenScale = (30 - distOffset) / 30;
                  color = { r: 0, g: Math.floor(220 * greenScale), b: Math.floor(40 * greenScale) };
                }
              }
              break;

            case 4: // EFFECT 4: HYPNOTIC DUAL SPIRAL
              {
                const phase = Math.floor(time * (0.04 * speedMult) * numSectors);
                const spiralPos1 = ((s * numLeds) / numSectors * distMult + phase) % numLeds;
                const spiralPos2 = (((s + numSectors / 2) * numLeds) / numSectors * distMult + phase) % numLeds;
                const targetL = Math.floor(spiralPos1);
                const targetL2 = Math.floor(spiralPos2);

                if (l === targetL || l === targetL2) {
                  color = { r: 0, g: 220, b: 255 }; // Ice cyan spiral lines
                }
              }
              break;

            case 5: // EFFECT 5: DIGITAL MATRIX TORRENT
              {
                const dropIdx = Math.floor(time * (0.15 * speedMult) * numLeds) % (numLeds + 10);
                const isCodeSector = s % 10 === 0;
                const tailLen = Math.max(2, Math.floor(8 * distMult));
                if (isCodeSector && l < dropIdx && l > dropIdx - tailLen) {
                  const intensityVal = Math.floor((tailLen - (dropIdx - l)) * (255 / tailLen));
                  color = { r: 0, g: intensityVal, b: 0 }; // Matrix neon green trail
                }
              }
              break;

            case 6: // EFFECT 6: TURBULENT FIRE RINGS
              {
                const noiseFactor = Math.sin(s * 0.15 + time * (0.01 * speedMult)) * Math.cos(l * 0.15 - time * (0.005 * speedMult));
                const heat = Math.floor((noiseFactor + 1) * 110 + (numLeds - l) * 1.5);
                const heatC = getHeatColor(Math.max(0, Math.min(255, heat)));
                color = { r: heatC.r * intMult, g: heatC.g * intMult, b: heatC.b * intMult };
              }
              break;

            case 7: // EFFECT 7: STARFIELD HYPERJUMP
              {
                const speed = Math.floor(time * (0.3 * speedMult) * numLeds);
                const isStar = s % 15 === 0;
                const starGap = Math.max(2, Math.floor(12 / distMult));
                const starPositions = [
                  speed % numLeds,
                  (speed + starGap) % numLeds,
                  (speed + starGap * 2.5) % numLeds
                ];
                if (isStar && starPositions.includes(l)) {
                  color = { r: 255, g: 255, b: 255 }; // Flying Star
                }
              }
              break;

            case 8: // EFFECT 8: CYBERNETIC MANDALA
              {
                const spoke = s % (numSectors / 6) === 0;
                const concentric = l === 15 || l === 28 || l === 42;
                const dynamicWave = l === Math.floor(Math.sin(s * 0.2 + time * 0.003) * 8 + 24);
                if (spoke || concentric || dynamicWave) {
                  color = { r: 212, g: 60, b: 255 }; // Majestic cyber purple
                }
              }
              break;

            case 9: // EFFECT 9: TURNING WIREFRAME GLOBE
              {
                const rot = Math.floor(time * 0.05 * numSectors) % numSectors;
                const isLong = (s + rot) % (numSectors / 10) === 0;
                const isLat = l === 8 || l === 18 || l === 28 || l === 38;
                if (isLong || isLat) {
                  color = { r: 30, g: 255, b: 200 }; // Neon turquoise globe lines
                }
              }
              break;

            case 10: // EFFECT 10: PULSING ECG CYBER HEART
              {
                const theta = (s * 2 * Math.PI) / numSectors;
                const pulse = 0.82 + 0.18 * Math.sin(time * 0.012);
                // Cardioid approximation mapped to LED radius index
                const rFormula = 18 * (1 - Math.cos(theta + Math.PI / 2)) * pulse;
                const targetLed = Math.floor(rFormula) + 6;

                if (l === targetLed) {
                  color = { r: 255, g: 0, b: 85 }; // Bright Hot Pink pulsing heart
                }
              }
              break;

            case 11: // EFFECT 11: CONCENTRIC SCROLL TEXT
              {
                const position = Math.floor(time * 0.15 * numSectors) % numSectors;
                const textDiff = (s + numSectors - position) % numSectors;
                const marqueeStr = (config.separateArmControl && armIdx === 1) 
                  ? (config.scrollTextArmB || "SPIN POV")
                  : (config.scrollText || "WS2812B POV");
                const totalTextSectors = marqueeStr.length * 8;

                if (textDiff < totalTextSectors && l > 18 && l < 32) {
                  const charIdx = Math.floor(textDiff / 8);
                  const colIdx = textDiff % 8;
                  const charCode = marqueeStr.charCodeAt(charIdx);
                  
                  // Generate visual letters with logical stripes mapping
                  if ((charCode + colIdx + l) % 3 === 0) {
                    color = { r: 255, g: 190, b: 0 }; // Yellow illuminated letter cells
                  }
                }
              }
              break;

            case 12: // EFFECT 12: PLASMA CLOUDS
              {
                 const noiseFactor = Math.sin(s * 0.1 * distMult + time * 0.005 * speedMult) * Math.cos(l * 0.2 * distMult + time * 0.008 * speedMult);
                 const noiseVal = Math.floor(((noiseFactor + 1) / 2) * 255);
                 const hue = 160 + (noiseVal / 3); // Blue to Violet
                 const c = hsvToRgb(hue, 1, noiseVal / 255);
                 color = { r: Math.floor(c.r * intMult), g: Math.floor(c.g * intMult), b: Math.floor(c.b * intMult) };
              }
              break;

            case 13: // EFFECT 13: QUANTUM COMETS
              {
                 const comet1 = Math.floor(time * (0.05 * speedMult) * numSectors) % numSectors;
                 const comet2 = (numSectors - (Math.floor(time * (0.07 * speedMult) * numSectors) % numSectors)) % numSectors;
                 const radiusPattern = Math.floor(l * 4 * distMult) % numLeds;
                 
                 let d1 = Math.abs(s - comet1);
                 if (d1 > numSectors / 2) d1 = numSectors - d1;
                 
                 let d2 = Math.abs(s - comet2);
                 if (d2 > numSectors / 2) d2 = numSectors - d2;
                 
                 if (d1 < 10 && l === radiusPattern) {
                   const intensity = Math.max(0, 1 - (d1 / 10));
                   color = { r: 0, g: Math.floor(255 * intensity), b: Math.floor(255 * intensity) };
                 } else if (d2 < 10 && l === (numLeds - radiusPattern - 1)) {
                   const intensity = Math.max(0, 1 - (d2 / 10));
                   color = { r: Math.floor(255 * intensity), g: 0, b: Math.floor(255 * intensity) };
                 }
              }
              break;

            case 14: // EFFECT 14: SYNC - DUAL DNA HELIX
              {
                // Synchronized: Arm A draws blue wave, Arm B draws red wave.
                // DNA base pairs link them together.
                const speedPhase = time * 0.1 * speedMult;
                const waveRad1 = Math.floor(22 + Math.sin(s * 0.1 + speedPhase) * 15);
                const waveRad2 = Math.floor(22 + Math.sin(s * 0.1 + speedPhase + Math.PI) * 15);

                const isArmA = armIdx === 0;
                
                // Draw Sine Waves
                if (l === waveRad1 && isArmA) {
                  color = { r: 50, g: 150, b: 255 }; // Cyan/Blue
                } else if (l === waveRad2 && !isArmA) {
                  color = { r: 255, g: 50, b: 100 }; // Pink/Red
                }
                
                // Draw Base Pairs connecting the strands periodically
                if (s % 10 === 0) {
                  const minRad = Math.min(waveRad1, waveRad2);
                  const maxRad = Math.max(waveRad1, waveRad2);
                  if (l > minRad && l < maxRad) {
                    // alternate pair colors
                    if (l % 2 === 0) color = { r: 200, g: 255, b: 200 };
                    else color = { r: 255, g: 200, b: 255 };
                  }
                }
              }
              break;

            case 15: // EFFECT 15: SYNC - PING PONG PULSE
              {
                // Synchronized: Light bounces between Arm A and Arm B, radially or angularly.
                const isArmA = armIdx === 0;
                const pingSpeed = time * (0.8 * speedMult);
                const pingOscillator = Math.sin(pingSpeed);
                const isPingOnA = pingOscillator > 0;
                
                // Radius expands and collapses based on absolute sine
                const pingRad = Math.floor(numLeds - 2 - Math.abs(pingOscillator) * 35);
                
                if (l === pingRad) {
                   if (isArmA && isPingOnA) {
                     color = { r: 0, g: 255, b: 255 };
                   } else if (!isArmA && !isPingOnA) {
                     color = { r: 255, g: 0, b: 255 };
                   }
                }
                
                // Add trailing glow
                if (Math.abs(l - pingRad) <= 2) {
                   if (isArmA && isPingOnA) {
                     color = { r: 0, g: Math.floor(255 / (Math.abs(l - pingRad) + 1)), b: Math.floor(255 / (Math.abs(l - pingRad) + 1)) };
                   } else if (!isArmA && !isPingOnA) {
                     color = { r: Math.floor(255 / (Math.abs(l - pingRad) + 1)), g: 0, b: Math.floor(255 / (Math.abs(l - pingRad) + 1)) };
                   }
                }
              }
              break;

            case 16: // EFFECT 16: SYNC - INTERLOCKING GEARS
              {
                // Draw 2 concentric cogwheels rotating
                const rotation = time * 0.05 * speedMult;
                const teethCount = 12;
                
                // Gear 1 (Arm A & B)
                const gear1Rad = 30 + Math.sin(s * (teethCount * Math.PI * 2 / numSectors) + rotation) * 4;
                // Gear 2 (Inner Gear) - rotates opposite direction
                const gear2Rad = 15 + Math.sin(s * (8 * Math.PI * 2 / numSectors) - rotation * 1.5) * 3;
                
                if (Math.abs(l - Math.floor(gear1Rad)) <= 1) {
                  // Outer Gear
                  color = (armIdx === 0) ? { r: 200, g: 150, b: 50 } : { r: 255, g: 180, b: 70 };
                } else if (Math.abs(l - Math.floor(gear2Rad)) <= 1) {
                  // Inner Gear
                  color = { r: 100, g: 100, b: 150 };
                }
                
                // Connecting spokes
                if (s % 20 === 0 && l < 30) {
                  color = { r: 100, g: 100, b: 100 };
                }
              }
              break;

            case 17: // EFFECT 17: HYPNOTIC SPIRAL
              {
                const spiralPhase = time * speedMult * 5.0;
                const armsNumber = 3;
                const spiralVal = (s * armsNumber * Math.PI * 2 / numSectors) + spiralPhase;
                const ledMatch = Math.floor(((Math.sin(spiralVal) + 1) / 2) * numLeds);
                if (Math.abs(l - ledMatch) <= 2) {
                  color = { r: Math.min(255, l * 5), g: Math.max(0, 255 - l * 3), b: 255 };
                }
              }
              break;

            case 18: // EFFECT 18: RADAR SWEEPER
              {
                const sweepPhase = Math.floor(time * speedMult * 20) % numSectors;
                let dist = s - sweepPhase;
                if (dist < 0) dist += numSectors;
                if (dist < 15) {
                  const intensity = Math.max(0, 255 - (dist * 17));
                  color = { r: 0, g: intensity, b: 0 };
                }
                if (l % 10 === 0 && Math.sin(s * l) > 0.98) {
                  color = { r: 255, g: 255, b: 255 };
                }
              }
              break;

            case 19: // EFFECT 19: KINETIC FIRE RING
              {
                const baseRad = Math.floor(numLeds * 0.7);
                const noise = Math.sin(s * 0.5 + time * speedMult * 10) * Math.cos(s * 0.2 - time * speedMult * 8) * 4;
                const activeRad = Math.floor(baseRad + noise);
                if (Math.abs(l - activeRad) <= 3) {
                  const heat = Math.max(0, 255 - Math.abs(l - activeRad) * 60);
                  color = { r: heat, g: Math.floor(heat * 0.5), b: 0 };
                }
              }
              break;

            case 20: // EFFECT 20: SYNC - PARTICLE COLLISION
              {
                const isArmA = armIdx === 0;
                const tBase = time * speedMult * 0.5;
                const cycle = tBase - Math.floor(tBase);
                if (cycle < 0.5) {
                  const rA = Math.floor(numLeds - (cycle * 2 * numLeds));
                  if (isArmA && Math.abs(l - rA) <= 1) color = { r: 0, g: 255, b: 255 };
                  if (!isArmA && Math.abs(l - rA) <= 1) color = { r: 255, g: 0, b: 255 };
                } else {
                  const exp = (cycle - 0.5) * 2; 
                  if (s % 5 === 0) {
                    const ptRad = Math.floor(exp * numLeds + Math.sin(s) * 5);
                    if (Math.abs(l - ptRad) <= 1) color = { r: 255, g: Math.max(0, 255 - Math.floor(exp * 255)), b: 0 };
                  }
                }
              }
              break;

            case 21: // EFFECT 21: BREATHING RAINBOW
              {
                const dim = (Math.sin(time * speedMult * 2) + 1) / 2;
                const rCalc = Math.floor(Math.sin(time * speedMult + l * 0.1) * 127 + 128);
                const gCalc = Math.floor(Math.sin(time * speedMult + l * 0.1 + 2) * 127 + 128);
                const bCalc = Math.floor(Math.sin(time * speedMult + l * 0.1 + 4) * 127 + 128);
                color = { 
                  r: Math.floor(rCalc * dim), 
                  g: Math.floor(gCalc * dim), 
                  b: Math.floor(bCalc * dim) 
                };
              }
              break;

            case 22: // EFFECT 22: MATRIX RAIN
              {
                const t = time * speedMult * 0.5;
                const dropPos = Math.floor(numLeds - ((t * 10 + s * 3) % numLeds));
                if (l <= dropPos && l > dropPos - 5) {
                   const brightness = Math.max(0, 255 - (dropPos - l) * 50);
                   color = { r: 0, g: brightness, b: 0 };
                } else if (l === dropPos - 5) {
                   color = { r: 150, g: 255, b: 150 };
                }
              }
              break;

            case 23: // EFFECT 23: PULSATING SUPERNOVA
              {
                const t = time * speedMult * 0.01;
                const coreRad = Math.floor(10 + Math.sin(t * 2.0) * 5);
                if (l < coreRad) {
                   color = { r: 255, g: 200, b: 100 };
                } else {
                   const outerLimit = Math.floor(coreRad + 15 + Math.sin(s * 0.5 + t * 5.0) * 8);
                   if (l >= coreRad && l < outerLimit) {
                      const gVal = Math.floor(100 + Math.sin(s * 0.2 + t) * 50);
                      const bVal = Math.floor(200 + Math.sin(s * 0.3 - t) * 50);
                      color = { r: 0, g: Math.max(0, gVal), b: Math.max(0, bVal) };
                   }
                }
              }
              break;

            case 24: // EFFECT 24: STROBE COLOR RING
              {
                const t = time * speedMult * 0.015;
                const ringPos = Math.floor(t * 20.0) % numLeds;
                if (Math.abs(l - ringPos) <= 2) {
                   if (Math.floor(t * 10.0) % 2 === 0) {
                      const hue = (Math.floor(t * 50.0 + s * 2.0) % 255) * (360/255);
                      color = hsvToRgb(hue, 1, 1);
                   } else {
                      color = { r: 0, g: 0, b: 0 };
                   }
                }
              }
              break;

            default:
              color = { r: 0, g: 0, b: 0 };
          }

          // Apply brightness setting (config.brightness is 0-255)
          const bScale = config.brightness / 255;
          const rDraw = Math.floor(color.r * bScale);
          const gDraw = Math.floor(color.g * bScale);
          const bDraw = Math.floor(color.b * bScale);

          // Draw the LED glowing circle if illuminated
          if (rDraw > 5 || gDraw > 5 || bDraw > 5) {
            ctx.beginPath();
            ctx.arc(ledX, ledY, showPhysicalRotor ? 4 : 2.5, 0, 2 * Math.PI);
            ctx.fillStyle = `rgb(${rDraw}, ${gDraw}, ${bDraw})`;
            ctx.fill();

            // Add neon light bloom overlay when rendering full hologram POV mode
            if (!showPhysicalRotor) {
              ctx.beginPath();
              ctx.arc(ledX, ledY, 6, 0, 2 * Math.PI);
              ctx.fillStyle = `rgba(${rDraw}, ${gDraw}, ${bDraw}, 0.15)`;
              ctx.fill();
            }
          }
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [dimensions, config.activeEffect, config.activeEffectArmB, config.separateArmControl, polarData, config.brightness, currentRpm, showPhysicalRotor, hallSensorOffset, config.scrollText, config.scrollTextArmB, config.isSequenceActive, config.sequenceSteps, simSpeed, isCalibrating]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-square flex items-center justify-center overflow-hidden bg-black/40 rounded-full border border-white/5"
      id="POV-canvas-parent"
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width * window.devicePixelRatio}
        height={dimensions.height * window.devicePixelRatio}
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
        className="rounded-full shadow-2xl"
        id="POV-rotating-stage"
      />

      {isCalibrating && (
        <div className="absolute inset-0 border-2 border-amber-500/40 rounded-full animate-pulse flex items-center justify-center pointer-events-none">
          <div className="w-1 h-full bg-amber-500/20 absolute left-1/2 -translate-x-1/2" />
        </div>
      )}
    </div>
  );
};
