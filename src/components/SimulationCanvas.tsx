import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  SimSettings,
  PressureSystem,
  TempSystem,
  Point,
  Particle,
  ProbeData,
  PressureRegionType,
  DrawingTarget
} from '../types';
import {
  getPressureAt,
  getSSTAt,
  getWindVector,
  getProbeData,
  getPressureColor,
  getSSTColor,
  detectWeatherPhenomena,
  evolvePressureSystems
} from '../utils/physicsEngine';

/**
 * Renders standard international front line symbols (Triangles, Semi-circles, Colors)
 * according to WMO / CWB / NOAA meteorological chart standards.
 */
function drawInternationalFrontLine(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  type: 'cold_front' | 'warm_front' | 'stationary_front' | 'occluded_front',
  width: number,
  height: number
) {
  if (!points || points.length < 2) return;

  const pxPoints = points.map((p) => ({ x: p.x * width, y: p.y * height }));

  const segments: {
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    len: number;
    accumDist: number;
  }[] = [];

  let totalLen = 0;
  for (let i = 0; i < pxPoints.length - 1; i++) {
    const p1 = pxPoints[i];
    const p2 = pxPoints[i + 1];
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (len > 0) {
      segments.push({ p1, p2, len, accumDist: totalLen });
      totalLen += len;
    }
  }

  if (totalLen === 0) return;

  ctx.save();
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Base front line stroke(s)
  if (type === 'cold_front') {
    ctx.strokeStyle = '#2563eb'; // Blue
    ctx.beginPath();
    pxPoints.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  } else if (type === 'warm_front') {
    ctx.strokeStyle = '#dc2626'; // Red
    ctx.beginPath();
    pxPoints.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  } else if (type === 'occluded_front') {
    ctx.strokeStyle = '#9333ea'; // Purple
    ctx.beginPath();
    pxPoints.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  } else if (type === 'stationary_front') {
    for (let i = 0; i < pxPoints.length - 1; i++) {
      ctx.strokeStyle = i % 2 === 0 ? '#2563eb' : '#dc2626';
      ctx.beginPath();
      ctx.moveTo(pxPoints[i].x, pxPoints[i].y);
      ctx.lineTo(pxPoints[i + 1].x, pxPoints[i + 1].y);
      ctx.stroke();
    }
  }

  // 2. Front symbols (triangles & semi-circles)
  const stepDist = 32;
  const startOffset = Math.min(18, totalLen * 0.1);
  const numSymbols = Math.floor((totalLen - startOffset) / stepDist);

  for (let s = 0; s <= numSymbols; s++) {
    const targetDist = startOffset + s * stepDist;
    if (targetDist > totalLen) break;

    const seg = segments.find((sg) => targetDist >= sg.accumDist && targetDist <= sg.accumDist + sg.len);
    if (!seg) continue;

    const t = (targetDist - seg.accumDist) / seg.len;
    const px = seg.p1.x + t * (seg.p2.x - seg.p1.x);
    const py = seg.p1.y + t * (seg.p2.y - seg.p1.y);

    const tx = (seg.p2.x - seg.p1.x) / seg.len;
    const ty = (seg.p2.y - seg.p1.y) / seg.len;
    const angle = Math.atan2(ty, tx);

    const nx = -ty;
    const ny = tx;

    if (type === 'cold_front') {
      drawFrontTriangle(ctx, px, py, tx, ty, nx, ny, '#2563eb', 13, 11);
    } else if (type === 'warm_front') {
      drawFrontSemiCircle(ctx, px, py, angle, true, '#dc2626', 7);
    } else if (type === 'stationary_front') {
      if (s % 2 === 0) {
        drawFrontTriangle(ctx, px, py, tx, ty, nx, ny, '#2563eb', 13, 11);
      } else {
        drawFrontSemiCircle(ctx, px, py, angle, false, '#dc2626', 7);
      }
    } else if (type === 'occluded_front') {
      if (s % 2 === 0) {
        drawFrontTriangle(ctx, px, py, tx, ty, nx, ny, '#9333ea', 13, 11);
      } else {
        drawFrontSemiCircle(ctx, px, py, angle, true, '#9333ea', 7);
      }
    }
  }

  ctx.restore();
}

function drawFrontTriangle(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  tx: number,
  ty: number,
  nx: number,
  ny: number,
  color: string,
  baseWidth: number,
  height: number
) {
  const hw = baseWidth / 2;
  const p1x = px - tx * hw;
  const p1y = py - ty * hw;
  const p2x = px + tx * hw;
  const p2y = py + ty * hw;
  const apexX = px + nx * height;
  const apexY = py + ny * height;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(p1x, p1y);
  ctx.lineTo(apexX, apexY);
  ctx.lineTo(p2x, p2y);
  ctx.closePath();
  ctx.fill();
}

function drawFrontSemiCircle(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  tangentAngle: number,
  pointingRight: boolean,
  color: string,
  radius: number
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const startAngle = pointingRight ? tangentAngle : tangentAngle + Math.PI;
  const endAngle = startAngle + Math.PI;

  ctx.arc(px, py, radius, startAngle, endAngle, false);
  ctx.closePath();
  ctx.fill();
}

interface SimulationCanvasProps {
  settings: SimSettings;
  systems: PressureSystem[];
  onSystemsChange: (systems: PressureSystem[]) => void;
  tempSystems?: TempSystem[];
  onTempSystemsChange?: (systems: TempSystem[]) => void;
  drawingTarget?: DrawingTarget;
  isDrawing: boolean;
  drawingType: PressureRegionType;
  drawingVal: number;
  drawingPoints: Point[];
  onAddPoint: (pt: Point) => void;
  isDeleteMode: boolean;
  onProbeUpdate: (probe: ProbeData | null) => void;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  settings,
  systems,
  onSystemsChange,
  tempSystems = [],
  onTempSystemsChange,
  drawingTarget = 'pressure',
  isDrawing,
  drawingType,
  drawingVal,
  drawingPoints,
  onAddPoint,
  isDeleteMode,
  onProbeUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const hoverSystemIdRef = useRef<string | null>(null);
  const lastSystemUpdateRef = useRef<number>(0);

  const systemsRef = useRef(systems);
  const tempSystemsRef = useRef(tempSystems);
  const settingsRef = useRef(settings);

  useEffect(() => {
    systemsRef.current = systems;
  }, [systems]);

  useEffect(() => {
    tempSystemsRef.current = tempSystems;
  }, [tempSystems]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const [mousePos, setMousePos] = useState<Point | null>(null);

  // Initialize/Respawn particles
  const initParticles = useCallback((count: number, width: number, height: number) => {
    const arr: Particle[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        birth: Date.now() - Math.random() * 5000,
        life: 0,
        maxLife: 3000 + Math.random() * 4000,
        size: 1.2 + Math.random() * 1.5
      });
    }
    particlesRef.current = arr;
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    // Adjust particle array size if particleCount changes
    if (particlesRef.current.length !== settings.particleCount) {
      initParticles(settings.particleCount, width, height);
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Auto-evolve pressure systems over time when simulation is running
      if (!settingsRef.current.isPaused && settingsRef.current.autoEvolve !== false && systemsRef.current.length > 0) {
        const evolved = evolvePressureSystems(systemsRef.current, tempSystemsRef.current, settingsRef.current, dt);
        if (evolved !== systemsRef.current) {
          systemsRef.current = evolved;
          if (time - lastSystemUpdateRef.current > 120) {
            lastSystemUpdateRef.current = time;
            onSystemsChange(evolved);
          }
        }
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Base Canvas Background & Heatmaps (SST vs Pressure)
      if (settings.showSSTHeatmap) {
        const step = 16;
        for (let x = 0; x < width; x += step) {
          for (let y = 0; y < height; y += step) {
            const sst = getSSTAt(x + step / 2, y + step / 2, width, height, settings.baseSST, tempSystems);
            ctx.fillStyle = getSSTColor(sst);
            ctx.fillRect(x, y, step, step);
          }
        }
      } else if (settings.showHeatmap) {
        const step = 16;
        for (let x = 0; x < width; x += step) {
          for (let y = 0; y < height; y += step) {
            const p = getPressureAt(x + step / 2, y + step / 2, width, height, settings.basePressure, systems);
            ctx.fillStyle = getPressureColor(p, settings.basePressure);
            ctx.fillRect(x, y, step, step);
          }
        }
      } else {
        // Base dark oceanic canvas background
        ctx.fillStyle = '#080f21';
        ctx.fillRect(0, 0, width, height);
      }

      // 1.1 1*1 Square Latitude / Longitude Grid Lines
      if (settings.showLatLonGrid) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        const gridCols = 5;
        const gridRows = 5;

        for (let i = 1; i < gridCols; i++) {
          const gx = (width / gridCols) * i;
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, height);
          ctx.stroke();

          // Longitude text
          const lon = settings.centerLongitude + (i / gridCols - 0.5) * 6.0;
          ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
          ctx.font = '9px monospace';
          ctx.fillText(`${lon.toFixed(1)}°E`, gx + 3, 12);
        }

        for (let j = 1; j < gridRows; j++) {
          const gy = (height / gridRows) * j;
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(width, gy);
          ctx.stroke();

          // Latitude text
          const lat = settings.centerLatitude + (0.5 - j / gridRows) * 6.0;
          ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
          ctx.font = '9px monospace';
          ctx.fillText(`${lat >= 0 ? `${lat.toFixed(1)}°N` : `${Math.abs(lat).toFixed(1)}°S`}`, 5, gy - 3);
        }
        ctx.setLineDash([]);
      }

      // 2. Isobar Lines (等壓線)
      if (settings.showIsobars > 0) {
        const interval = settings.showIsobars; // e.g., 4 hPa
        const step = 20; // Contour sampling grid
        const cols = Math.ceil(width / step);
        const rows = Math.ceil(height / step);

        // Pre-sample grid pressure
        const grid: number[][] = [];
        for (let r = 0; r <= rows; r++) {
          grid[r] = [];
          for (let c = 0; c <= cols; c++) {
            grid[r][c] = getPressureAt(c * step, r * step, width, height, settings.basePressure, systems);
          }
        }

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';

        const minP = Math.floor(settings.basePressure - 60);
        const maxP = Math.ceil(settings.basePressure + 60);

        for (let targetP = minP; targetP <= maxP; targetP += interval) {
          ctx.beginPath();
          let drawnLabelCount = 0;

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const p0 = grid[r][c];
              const p1 = grid[r][c + 1];
              const p2 = grid[r + 1][c + 1];
              const p3 = grid[r + 1][c];

              const minVal = Math.min(p0, p1, p2, p3);
              const maxVal = Math.max(p0, p1, p2, p3);

              if (targetP >= minVal && targetP <= maxVal) {
                const x1 = c * step + step * ((targetP - p0) / ((p1 - p0) || 1));
                const y1 = r * step;
                const x2 = c * step + step * ((targetP - p3) / ((p2 - p3) || 1));
                const y2 = (r + 1) * step;

                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);

                if (drawnLabelCount < 2 && c % 6 === 0 && r % 6 === 0) {
                  ctx.fillText(`${targetP}`, x1 + 2, y1 - 2);
                  drawnLabelCount++;
                }
              }
            }
          }
          ctx.stroke();
        }
      }

      // 3. Vector Arrows Grid (風的流向流動箭頭)
      if (settings.showVectorGrid || settings.displayMode === 'vectors' || settings.displayMode === 'both') {
        const vStep = 34;
        ctx.lineWidth = 1.2;
        for (let x = vStep / 2; x < width; x += vStep) {
          for (let y = vStep / 2; y < height; y += vStep) {
            const { vx, vy } = getWindVector(x, y, width, height, settings, systems, tempSystems);
            const speed = Math.hypot(vx, vy);
            if (speed > 0.1) {
              const angle = Math.atan2(vy, vx);
              const len = Math.min(22, speed * 2.6);

              // Color based on wind speed (cyan to red)
              ctx.strokeStyle = speed > 4 ? '#f87171' : speed > 2.2 ? '#facc15' : '#38bdf8';
              ctx.beginPath();
              ctx.moveTo(x, y);
              const endX = x + Math.cos(angle) * len;
              const endY = y + Math.sin(angle) * len;
              ctx.lineTo(endX, endY);

              // Arrow head
              ctx.lineTo(
                endX - 5 * Math.cos(angle - Math.PI / 6),
                endY - 5 * Math.sin(angle - Math.PI / 6)
              );
              ctx.stroke();
            }
          }
        }
      }

      // 4. Update & Draw Wind Flowing Particles
      if (settings.displayMode !== 'vectors') {
        const now = Date.now();

        particlesRef.current.forEach((p) => {
          if (!settings.isPaused) {
            const { vx, vy } = getWindVector(p.x, p.y, width, height, settings, systems, tempSystems);

            p.vx = p.vx * 0.85 + vx * 0.15;
            p.vy = p.vy * 0.85 + vy * 0.15;

            p.x += p.vx * (settings.timeSpeed || 1);
            p.y += p.vy * (settings.timeSpeed || 1);
            p.life = now - p.birth;

            if (
              p.x < 0 ||
              p.x > width ||
              p.y < 0 ||
              p.y > height ||
              p.life > p.maxLife
            ) {
              p.x = Math.random() * width;
              p.y = Math.random() * height;
              p.vx = (Math.random() - 0.5) * 0.5;
              p.vy = (Math.random() - 0.5) * 0.5;
              p.birth = now;
              p.maxLife = 3000 + Math.random() * 4000;
            }
          }

          const lifeFactor = Math.sin((p.life / p.maxLife) * Math.PI);
          const pSpeed = Math.hypot(p.vx, p.vy);

          const opacity = (0.3 + lifeFactor * 0.65).toFixed(2);
          ctx.fillStyle = pSpeed > 4 ? `rgba(248, 113, 113, ${opacity})` :
                          pSpeed > 2 ? `rgba(250, 204, 21, ${opacity})` :
                          `rgba(224, 242, 254, ${opacity})`;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = p.size * 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5);
          ctx.stroke();
        });
      }

      // 5. Cloud & Rain Visual Effects in Low Pressure Centers
      if (settings.showCloudsAndRain) {
        systems.forEach((sys) => {
          if (sys.val < settings.basePressure - 3) {
            const cx = sys.cx * width;
            const cy = sys.cy * height;
            const r = (sys.radius || 0.25) * Math.min(width, height);
            const intensity = Math.min(1, (settings.basePressure - sys.val) / 30);

            const cloudCount = 8;
            ctx.fillStyle = `rgba(203, 213, 225, ${(intensity * 0.18).toFixed(2)})`;
            for (let i = 0; i < cloudCount; i++) {
              const ang = (time * 0.0003 * (settings.hemisphere === 'Northern' ? -1 : 1)) + (i * Math.PI * 2) / cloudCount;
              const dist = r * 0.45;
              const ox = cx + Math.cos(ang) * dist;
              const oy = cy + Math.sin(ang) * dist;

              ctx.beginPath();
              ctx.arc(ox, oy, r * 0.38, 0, Math.PI * 2);
              ctx.fill();
            }

            if (intensity > 0.3 && !settings.isPaused) {
              ctx.strokeStyle = `rgba(96, 165, 250, ${(intensity * 0.5).toFixed(2)})`;
              ctx.lineWidth = 1.5;
              const rainCount = Math.round(intensity * 18);
              for (let i = 0; i < rainCount; i++) {
                const rx = cx + (Math.sin(i * 99 + time * 0.005) * r * 0.6);
                const ry = cy + (Math.cos(i * 33 + time * 0.005) * r * 0.6);
                ctx.beginPath();
                ctx.moveTo(rx, ry);
                ctx.lineTo(rx - 2, ry + 6);
                ctx.stroke();
              }
            }
          }
        });
      }

      // 6. Detected Weather Phenomena Special Rendering (Typhoons & Fronts)
      const renderTyphoons = settings.showTyphoons !== false && settings.showPhenomenaIcons !== false;
      const renderFronts = settings.showFronts !== false && settings.showPhenomenaIcons !== false;

      if (renderTyphoons || renderFronts) {
        const phenomena = detectWeatherPhenomena(width, height, settings, systems, tempSystems);

        phenomena.forEach((phenom) => {
          const px = phenom.x * width;
          const py = phenom.y * height;

          if ((phenom.type === 'typhoon' || phenom.type === 'tropical_cyclone') && renderTyphoons) {
            // Rotating Typhoon Spiral Arms
            const spiralRadius = 50;
            const spiralSpeed = (time * 0.003) * (settings.hemisphere === 'Northern' ? -1 : 1);

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(spiralSpeed);

            // Draw 4 spiral typhoon arms
            ctx.strokeStyle = phenom.type === 'typhoon' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(245, 158, 11, 0.85)';
            ctx.lineWidth = 3;

            for (let a = 0; a < 4; a++) {
              ctx.beginPath();
              const baseA = (a * Math.PI) / 2;
              for (let t = 0; t < Math.PI * 1.2; t += 0.1) {
                const r = 12 + t * 14;
                const angle = baseA + t;
                const sx = Math.cos(angle) * r;
                const sy = Math.sin(angle) * r;
                if (t === 0) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
              }
              ctx.stroke();
            }

            // Central Typhoon Eye (颱風眼)
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#0f172a';
            ctx.fill();
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();

            // Typhoon Badge Tag
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.fillRect(px - 65, py - 62, 130, 24);
            ctx.strokeStyle = phenom.type === 'typhoon' ? '#f87171' : '#fbbf24';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px - 65, py - 62, 130, 24);

            ctx.fillStyle = phenom.type === 'typhoon' ? '#fca5a5' : '#fef08a';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`🌀 ${phenom.name}`, px, py - 46);
          } else if (
            renderFronts &&
            (phenom.type === 'cold_front' ||
             phenom.type === 'warm_front' ||
             phenom.type === 'stationary_front' ||
             phenom.type === 'occluded_front') &&
            phenom.points &&
            phenom.points.length >= 2
          ) {
            // Render international front line symbols (Triangles & Semi-circles)
            drawInternationalFrontLine(ctx, phenom.points, phenom.type, width, height);

            // Front Label Badge
            const borderColor =
              phenom.type === 'cold_front' ? '#3b82f6' :
              phenom.type === 'warm_front' ? '#ef4444' :
              phenom.type === 'stationary_front' ? '#3b82f6' : '#a855f7';

            const textColor =
              phenom.type === 'cold_front' ? '#93c5fd' :
              phenom.type === 'warm_front' ? '#fca5a5' :
              phenom.type === 'stationary_front' ? '#e9d5ff' : '#f3e8ff';

            const iconStr =
              phenom.type === 'cold_front' ? '❄️' :
              phenom.type === 'warm_front' ? '🔥' :
              phenom.type === 'stationary_front' ? '🌧️' : '🟣';

            const badgeW = 150;
            const badgeH = 22;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            ctx.fillRect(px - badgeW / 2, py - 40, badgeW, badgeH);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px - badgeW / 2, py - 40, badgeW, badgeH);

            ctx.fillStyle = textColor;
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${iconStr} ${phenom.name}`, px, py - 25);
          }
        });
      }

      // 7. Temperature Systems Display (TempSystem)
      tempSystems.forEach((tSys) => {
        const cx = tSys.cx * width;
        const cy = tSys.cy * height;
        const r = (tSys.radius || 0.25) * Math.min(width, height);
        const isWarm = tSys.val >= 26.5;

        // Boundary circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = isWarm ? 'rgba(244, 63, 94, 0.6)' : 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Small SST badge
        ctx.fillStyle = isWarm ? '#881337' : '#0369a1';
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${tSys.val}°C`, cx, cy);
      });

      // 8. Pressure System Markers (H & L Big Badges)
      systems.forEach((sys) => {
        const cx = sys.cx * width;
        const cy = sys.cy * height;
        const isLow = sys.val < settings.basePressure;
        const isHovered = hoverSystemIdRef.current === sys.id || (isDeleteMode && mousePos && Math.hypot(cx - mousePos.x, cy - mousePos.y) < 45);

        // System outer boundary pulse
        ctx.beginPath();
        const r = (sys.radius || 0.25) * Math.min(width, height);
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = isLow
          ? (isHovered ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.25)')
          : (isHovered ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.25)');
        ctx.lineWidth = isHovered ? 2.5 : 1.2;
        if (isHovered) ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Polygon boundary if polygon system
        if (sys.type === 'polygon' && sys.points && sys.points.length >= 3) {
          ctx.beginPath();
          sys.points.forEach((pt, idx) => {
            const px = pt.x * width;
            const py = pt.y * height;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.closePath();
          ctx.fillStyle = isLow ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)';
          ctx.fill();
        }

        // Center Badge Circle
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fillStyle = isLow ? '#991b1b' : '#1e3a8a';
        ctx.fill();
        ctx.strokeStyle = isLow ? '#f87171' : '#60a5fa';
        ctx.lineWidth = 2;
        ctx.stroke();

        // H or L Letter
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isLow ? 'L' : 'H', cx, cy - 1);

        // hPa Value Label Pill below badge
        const textVal = `${sys.val} hPa`;
        ctx.font = 'bold 11px sans-serif';
        const txtWidth = ctx.measureText(textVal).width;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(cx - txtWidth / 2 - 6, cy + 26, txtWidth + 12, 18);
        ctx.strokeStyle = isLow ? '#f87171' : '#60a5fa';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - txtWidth / 2 - 6, cy + 26, txtWidth + 12, 18);

        ctx.fillStyle = isLow ? '#fca5a5' : '#93c5fd';
        ctx.fillText(textVal, cx, cy + 35);

        if (sys.label) {
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(sys.label, cx, cy + 50);
        }
      });

      // 9. Interactive Drawing Overlay Mode (Pressure or Temperature)
      if (isDrawing && drawingPoints.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = drawingTarget === 'temperature'
          ? '#f43f5e'
          : drawingVal < settings.basePressure ? '#f87171' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);

        drawingPoints.forEach((pt, i) => {
          const px = pt.x * width;
          const py = pt.y * height;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });

        if (mousePos) {
          ctx.lineTo(mousePos.x, mousePos.y);
        }

        ctx.stroke();
        ctx.setLineDash([]);

        // Points handle dots
        drawingPoints.forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.x * width, pt.y * height, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#facc15';
          ctx.fill();
        });
      }

      // 10. Delete mode hover visual
      if (isDeleteMode && mousePos) {
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 35, 0, Math.PI * 2);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    settings,
    systems,
    tempSystems,
    drawingTarget,
    isDrawing,
    drawingType,
    drawingVal,
    drawingPoints,
    isDeleteMode,
    mousePos,
    initParticles
  ]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      initParticles(settings.particleCount, canvas.width, canvas.height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initParticles, settings.particleCount]);

  // Mouse / Touch Event Handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normalizedPt: Point = { x: x / canvas.width, y: y / canvas.height };

    // 1. Delete Mode: Remove pressure or temperature system near click
    if (isDeleteMode) {
      const remainingPressure = systems.filter((sys) => {
        const cx = sys.cx * canvas.width;
        const cy = sys.cy * canvas.height;
        return Math.hypot(cx - x, cy - y) > 50;
      });
      onSystemsChange(remainingPressure);

      if (onTempSystemsChange) {
        const remainingTemp = tempSystems.filter((tSys) => {
          const cx = tSys.cx * canvas.width;
          const cy = tSys.cy * canvas.height;
          return Math.hypot(cx - x, cy - y) > 50;
        });
        onTempSystemsChange(remainingTemp);
      }
      return;
    }

    // 2. Drawing Mode:
    if (isDrawing) {
      if (drawingTarget === 'temperature' && onTempSystemsChange) {
        if (drawingType === 'radial') {
          const newTSys: TempSystem = {
            id: 'tsys_' + Date.now(),
            type: 'radial',
            val: drawingVal,
            cx: normalizedPt.x,
            cy: normalizedPt.y,
            radius: 0.25,
            label: `海水 ${drawingVal}°C`
          };
          onTempSystemsChange([...tempSystems, newTSys]);
        } else {
          onAddPoint(normalizedPt);
        }
      } else {
        if (drawingType === 'radial') {
          const newSys: PressureSystem = {
            id: 'sys_' + Date.now(),
            type: 'radial',
            val: drawingVal,
            cx: normalizedPt.x,
            cy: normalizedPt.y,
            radius: 0.25,
            label: drawingVal < settings.basePressure ? '自訂低壓' : '自訂高壓'
          };
          onSystemsChange([...systems, newSys]);
        } else {
          onAddPoint(normalizedPt);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    // Update real-time probe data
    const probe = getProbeData(x, y, canvas.width, canvas.height, settings, systems, tempSystems);
    onProbeUpdate(probe);

    // Check hovered system for delete or focus highlight
    let foundId: string | null = null;
    for (const sys of systems) {
      const cx = sys.cx * canvas.width;
      const cy = sys.cy * canvas.height;
      if (Math.hypot(cx - x, cy - y) < 45) {
        foundId = sys.id;
        break;
      }
    }
    hoverSystemIdRef.current = foundId;
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    onProbeUpdate(null);
    hoverSystemIdRef.current = null;
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`w-full h-full block ${
          isDrawing ? 'cursor-crosshair' : isDeleteMode ? 'cursor-pointer' : 'cursor-default'
        }`}
      />

      {/* Mode Overlay Badge */}
      {isDrawing && (
        <div className="absolute top-4 left-4 z-20 px-3.5 py-2 bg-emerald-950/90 border border-emerald-500/80 rounded-xl text-emerald-200 text-xs font-bold shadow-lg flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>
            正在繪製 {drawingTarget === 'temperature' ? '海水溫度區' : '氣壓區'} ({drawingType === 'radial' ? '點擊地圖直接放置中心' : '依次點擊地圖標記多邊形頂點'})
          </span>
        </div>
      )}

      {isDeleteMode && (
        <div className="absolute top-4 left-4 z-20 px-3.5 py-2 bg-red-950/90 border border-red-500/80 rounded-xl text-red-200 text-xs font-bold shadow-lg flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span>刪除模式啟用中：點擊任何氣壓或海水溫度中心即可移除</span>
        </div>
      )}
    </div>
  );
};

