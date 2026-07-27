import { PressureSystem, TempSystem, SimSettings, Point, ProbeData, DetectedPhenomenon } from '../types';

/**
 * Calculates local Sea Surface Temperature (SST in °C) at (x, y)
 */
export function getSSTAt(
  x: number,
  y: number,
  width: number,
  height: number,
  baseSST: number,
  tempSystems: TempSystem[] = []
): number {
  let deltaT = 0;

  for (const sys of tempSystems) {
    if (sys.type === 'radial') {
      const cx = sys.cx * width;
      const cy = sys.cy * height;
      const radiusPx = (sys.radius ?? 0.25) * Math.min(width, height);
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      const sysDelta = sys.val - baseSST;
      const influence = Math.exp(-Math.pow(dist / radiusPx, 2));
      deltaT += sysDelta * influence;
    } else if (sys.type === 'polygon' && sys.points && sys.points.length >= 3) {
      const cx = sys.cx * width;
      const cy = sys.cy * height;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      let avgR = 0;
      for (const pt of sys.points) {
        avgR += Math.hypot(pt.x * width - cx, pt.y * height - cy);
      }
      avgR = (avgR / sys.points.length) || 100;

      const sysDelta = sys.val - baseSST;
      const influence = Math.exp(-Math.pow(dist / avgR, 2));
      deltaT += sysDelta * influence;
    }
  }

  // Slight thermal gradient with latitude (warmer near equator y=0.5, slightly cooler north/south)
  const normY = y / height; // 0 (North) to 1 (South)
  const latFactor = Math.cos((normY - 0.5) * Math.PI) * 1.5;

  return Math.max(0, Math.min(42, baseSST + deltaT + (latFactor - 1.0)));
}

/**
 * Calculates the pressure value at a given coordinate (x, y) in canvas space.
 */
export function getPressureAt(
  x: number,
  y: number,
  width: number,
  height: number,
  basePressure: number,
  systems: PressureSystem[]
): number {
  let deltaP = 0;

  for (const sys of systems) {
    if (sys.type === 'radial') {
      const cx = sys.cx * width;
      const cy = sys.cy * height;
      const radiusPx = (sys.radius ?? 0.25) * Math.min(width, height);
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      // Smooth Gaussian influence curve
      const sysDelta = sys.val - basePressure;
      const influence = Math.exp(-Math.pow(dist / radiusPx, 2));
      deltaP += sysDelta * influence;
    } else if (sys.type === 'polygon' && sys.points && sys.points.length >= 3) {
      // Polygon distance calculation
      const cx = sys.cx * width;
      const cy = sys.cy * height;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      let avgR = 0;
      for (const pt of sys.points) {
        avgR += Math.hypot(pt.x * width - cx, pt.y * height - cy);
      }
      avgR = (avgR / sys.points.length) || 100;

      const sysDelta = sys.val - basePressure;
      const influence = Math.exp(-Math.pow(dist / avgR, 2));
      deltaP += sysDelta * influence;
    }
  }

  return basePressure + deltaP;
}

/**
 * Calculates Coriolis parameter f = 2 * Omega * sin(lat)
 * Omega = 7.2921 x 10^-5 rad/s
 */
export function getCoriolisParameter(latitude: number): number {
  const Omega = 7.2921e-5;
  const latRad = (latitude * Math.PI) / 180;
  return 2 * Omega * Math.sin(latRad);
}

/**
 * Calculates pressure gradient force vector at (x, y)
 */
export function getPressureGradient(
  x: number,
  y: number,
  width: number,
  height: number,
  basePressure: number,
  systems: PressureSystem[]
): { gx: number; gy: number; p: number } {
  const delta = 4; // Step for numerical derivative
  const p = getPressureAt(x, y, width, height, basePressure, systems);
  const px1 = getPressureAt(x + delta, y, width, height, basePressure, systems);
  const px0 = getPressureAt(x - delta, y, width, height, basePressure, systems);
  const py1 = getPressureAt(x, y + delta, width, height, basePressure, systems);
  const py0 = getPressureAt(x, y - delta, width, height, basePressure, systems);

  // Pressure gradient force points from High to Low pressure (- grad P)
  const gx = -(px1 - px0) / (2 * delta);
  const gy = -(py1 - py0) / (2 * delta);

  return { gx, gy, p };
}

/**
 * Calculates velocity (wind vector) at (x, y) considering PGF, Coriolis parameter f (from latitude), SST buoyancy, and Surface Friction
 */
export function getWindVector(
  x: number,
  y: number,
  width: number,
  height: number,
  settings: SimSettings,
  systems: PressureSystem[],
  tempSystems: TempSystem[] = []
): { vx: number; vy: number; pressure: number; sst: number; gradientMag: number } {
  const { basePressure, baseSST, centerLatitude, coriolisStrength, surfaceFriction, particleSpeed } = settings;
  const { gx, gy, p } = getPressureGradient(x, y, width, height, basePressure, systems);
  const sst = getSSTAt(x, y, width, height, baseSST, tempSystems);

  const gradMag = Math.hypot(gx, gy);
  if (gradMag === 0) {
    return { vx: 0, vy: 0, pressure: p, sst, gradientMag: 0 };
  }

  // Compute latitude at point (y scale: -5 deg to +5 deg around centerLatitude)
  const pointLat = centerLatitude + (0.5 - y / height) * 6.0;
  const f = getCoriolisParameter(pointLat) * (coriolisStrength ?? 1.0);

  // Coriolis deflection angle:
  // At latitude = 0 (Equator): f = 0 -> deflection angle = 0 (wind blows straight from H -> L)
  // At latitude > 0 (Northern): deflects to the right (+deg)
  // At latitude < 0 (Southern): deflects to the left (-deg)
  // Max deflection ~85 deg geostrophic flow, reduced by surface friction
  const normLat = Math.max(-1, Math.min(1, pointLat / 90.0));
  const maxDeflection = (Math.PI / 2) * 0.90 * (1 - surfaceFriction * 0.45);
  const deflAngle = Math.sin(normLat * (Math.PI / 2)) * maxDeflection;

  // Thermal enhancement: warm sea surface (SST >= 26.5°C) fuels wind convergence speed
  const thermalBoost = sst >= 26.5 ? 1.0 + (sst - 26.5) * 0.04 : 1.0;

  const forceScale = 42.0 * particleSpeed * thermalBoost;
  const cosA = Math.cos(deflAngle);
  const sinA = Math.sin(deflAngle);

  // Rotate PGF vector
  let vx = (gx * cosA - gy * sinA) * forceScale;
  let vy = (gx * sinA + gy * cosA) * forceScale;

  // Apply surface friction damping
  const frictionDamp = 1.0 - surfaceFriction * 0.35;
  vx *= frictionDamp;
  vy *= frictionDamp;

  return { vx, vy, pressure: p, sst, gradientMag: gradMag };
}

/**
 * Detects active meteorological phenomena (Typhoons, Tropical Cyclones, Cold Fronts, Warm Fronts, Stationary Fronts, Occluded Fronts)
 */
export function detectWeatherPhenomena(
  width: number,
  height: number,
  settings: SimSettings,
  systems: PressureSystem[],
  tempSystems: TempSystem[] = []
): DetectedPhenomenon[] {
  const result: DetectedPhenomenon[] = [];

  // 1. Detect Typhoons & Tropical Cyclones
  systems.forEach((sys) => {
    const cx = sys.cx * width;
    const cy = sys.cy * height;
    const p = getPressureAt(cx, cy, width, height, settings.basePressure, systems);
    const sst = getSSTAt(cx, cy, width, height, settings.baseSST, tempSystems);
    const sysLat = settings.centerLatitude + (0.5 - sys.cy) * 6.0;

    if (p <= 998 && sst >= 26.0 && Math.abs(sysLat) >= 3.5) {
      let name = '熱帶性低氣壓';
      let intensityLabel = 'TD (Tropical Depression)';
      let type: 'typhoon' | 'tropical_cyclone' = 'tropical_cyclone';

      if (p < 950) {
        name = '強烈颱風 (Severe Typhoon)';
        intensityLabel = 'Cat 4-5 Typhoon (中心氣壓 <950 hPa)';
        type = 'typhoon';
      } else if (p < 980) {
        name = '中度颱風 (Moderate Typhoon)';
        intensityLabel = 'Cat 2-3 Typhoon (950-979 hPa)';
        type = 'typhoon';
      } else if (p < 995) {
        name = '輕度颱風 (Tropical Storm)';
        intensityLabel = 'Tropical Storm (980-994 hPa)';
        type = 'typhoon';
      }

      result.push({
        id: `phenom_typhoon_${sys.id}`,
        type,
        name,
        x: sys.cx,
        y: sys.cy,
        pressure: Math.round(p),
        sst: Math.round(sst * 10) / 10,
        windSpeed: Math.round((1013 - p) * 0.9),
        intensityLabel
      });
    }
  });

  // 2. Automatic Detection of Frontal Systems (冷鋒, 暖鋒, 滯留鋒, 錮囚鋒)
  const lowSystems = systems.filter((s) => s.val < settings.basePressure);
  const highSystems = systems.filter((s) => s.val > settings.basePressure);

  const northSST = getSSTAt(width * 0.5, height * 0.15, width, height, settings.baseSST, tempSystems);
  const southSST = getSSTAt(width * 0.5, height * 0.85, width, height, settings.baseSST, tempSystems);
  const westSST = getSSTAt(width * 0.15, height * 0.5, width, height, settings.baseSST, tempSystems);
  const eastSST = getSSTAt(width * 0.85, height * 0.5, width, height, settings.baseSST, tempSystems);

  const tempDiffNS = southSST - northSST;

  lowSystems.forEach((lowSys, idx) => {
    const cx = lowSys.cx;
    const cy = lowSys.cy;
    const p = lowSys.val;
    const isNorthern = settings.hemisphere === 'Northern';

    // A1. Occluded Front (錮囚鋒): Deep low pressure (p <= 992 hPa) with cold air wrapping around
    if (p <= 992 && Math.abs(settings.centerLatitude) >= 15.0) {
      const occStart = { x: Math.max(0.05, cx - 0.08), y: Math.max(0.05, cy - 0.12) };
      const occMid = { x: cx, y: cy };
      const occEnd = { x: Math.min(0.95, cx + 0.10), y: Math.min(0.95, cy + 0.08) };

      result.push({
        id: `phenom_occ_front_${idx}`,
        type: 'occluded_front',
        name: '氣旋錮囚鋒面 (Occluded Front)',
        x: cx,
        y: cy - 0.04,
        pressure: Math.round(p),
        sst: Math.round(getSSTAt(cx * width, cy * height, width, height, settings.baseSST, tempSystems) * 10) / 10,
        windSpeed: Math.round((1013 - p) * 0.85),
        intensityLabel: '冷鋒追平暖鋒之錮囚結構',
        points: [occStart, occMid, occEnd]
      });

      result.push({
        id: `phenom_cold_front_occ_${idx}`,
        type: 'cold_front',
        name: '氣旋冷鋒 (Cold Front)',
        x: cx - 0.18,
        y: cy + 0.2,
        pressure: Math.round(p + 6),
        sst: Math.round(westSST * 10) / 10,
        windSpeed: 16,
        intensityLabel: '強烈冷氣團南下輻合帶',
        points: [
          occEnd,
          { x: Math.max(0.05, cx - 0.12), y: Math.min(0.95, cy + 0.22) },
          { x: Math.max(0.02, cx - 0.28), y: Math.min(0.98, cy + 0.42) }
        ]
      });

      result.push({
        id: `phenom_warm_front_occ_${idx}`,
        type: 'warm_front',
        name: '氣旋暖鋒 (Warm Front)',
        x: cx + 0.22,
        y: cy + 0.08,
        pressure: Math.round(p + 8),
        sst: Math.round(eastSST * 10) / 10,
        windSpeed: 12,
        intensityLabel: '暖氣團推升冷空氣帶',
        points: [
          occEnd,
          { x: Math.min(0.95, cx + 0.22), y: Math.min(0.95, cy + 0.12) },
          { x: Math.min(0.98, cx + 0.38), y: Math.min(0.98, cy + 0.18) }
        ]
      });

      return;
    }

    // A2. Stationary Front (滯留鋒): Cold north vs warm south meet along trough line
    const hasNorthColdHigh = highSystems.some((h) => h.cy < cy);
    const hasSouthWarmHigh = highSystems.some((h) => h.cy > cy);

    if (tempDiffNS >= 3.5 || (hasNorthColdHigh && hasSouthWarmHigh)) {
      result.push({
        id: `phenom_stat_front_${idx}`,
        type: 'stationary_front',
        name: '梅雨對流滯留鋒面 (Stationary Front)',
        x: cx,
        y: cy,
        pressure: Math.round(p),
        sst: Math.round(settings.baseSST * 10) / 10,
        windSpeed: 15,
        intensityLabel: '北方冷高壓與南方暖氣團對峙帶',
        points: [
          { x: Math.max(0.05, cx - 0.42), y: Math.max(0.05, cy - 0.06) },
          { x: cx, y: cy },
          { x: Math.min(0.95, cx + 0.42), y: Math.min(0.95, cy + 0.06) }
        ]
      });

      return;
    }

    // A3. Standard Cold Front & Warm Front pair extending from low pressure cyclone center
    const coldEndX = Math.max(0.05, cx - 0.32);
    const coldEndY = isNorthern ? Math.min(0.95, cy + 0.35) : Math.max(0.05, cy - 0.35);

    result.push({
      id: `phenom_cold_front_${idx}`,
      type: 'cold_front',
      name: '低壓氣旋冷鋒 (Cold Front)',
      x: (cx + coldEndX) / 2,
      y: (cy + coldEndY) / 2,
      pressure: Math.round(p + 5),
      sst: Math.round(westSST * 10) / 10,
      windSpeed: 16,
      intensityLabel: '冷氣團推擠暖空氣',
      points: [
        { x: cx, y: cy },
        { x: (cx + coldEndX) / 2, y: (cy + coldEndY) / 2 },
        { x: coldEndX, y: coldEndY }
      ]
    });

    const warmEndX = Math.min(0.95, cx + 0.35);
    const warmEndY = isNorthern ? Math.min(0.95, cy + 0.08) : Math.max(0.05, cy - 0.08);

    result.push({
      id: `phenom_warm_front_${idx}`,
      type: 'warm_front',
      name: '低壓氣旋暖鋒 (Warm Front)',
      x: (cx + warmEndX) / 2,
      y: (cy + warmEndY) / 2,
      pressure: Math.round(p + 6),
      sst: Math.round(eastSST * 10) / 10,
      windSpeed: 12,
      intensityLabel: '暖氣團沿冷空氣爬升',
      points: [
        { x: cx, y: cy },
        { x: (cx + warmEndX) / 2, y: (cy + warmEndY) / 2 },
        { x: warmEndX, y: warmEndY }
      ]
    });
  });

  // Case B: Strong Cold Surge High without low pressure center
  if (lowSystems.length === 0) {
    const coldHigh = highSystems.find((h) => h.val >= 1028);
    if (coldHigh) {
      const cx = coldHigh.cx;
      const cy = coldHigh.cy;
      const frontY = Math.min(0.85, cy + 0.35);

      result.push({
        id: 'phenom_cold_surge_front',
        type: 'cold_front',
        name: '寒潮大陸冷鋒 (Cold Front)',
        x: cx,
        y: frontY,
        pressure: Math.round(coldHigh.val - 12),
        sst: Math.round(settings.baseSST * 10) / 10,
        windSpeed: 18,
        intensityLabel: '強烈冷高壓南下強冷鋒',
        points: [
          { x: Math.max(0.05, cx - 0.38), y: Math.max(0.1, frontY - 0.08) },
          { x: cx, y: frontY },
          { x: Math.min(0.95, cx + 0.38), y: Math.min(0.9, frontY + 0.08) }
        ]
      });
    }
  }

  return result;
}

/**
 * Converts wind angle to Traditional Chinese compass direction text
 */
export function getWindDirectionText(degrees: number): string {
  const dirs = [
    '北風', '東北偏北風', '東北風', '東北偏東風',
    '東風', '東南偏東風', '東南風', '東南偏南風',
    '南風', '西南偏南風', '西南風', '西南偏西風',
    '西風', '西北偏西風', '西北風', '西北偏北風'
  ];
  const idx = Math.round((degrees % 360) / 22.5) % 16;
  return dirs[idx];
}

/**
 * Calculates complete weather probe metrics at a specific point (x, y)
 */
export function getProbeData(
  x: number,
  y: number,
  width: number,
  height: number,
  settings: SimSettings,
  systems: PressureSystem[],
  tempSystems: TempSystem[] = []
): ProbeData {
  const { vx, vy, pressure, sst, gradientMag } = getWindVector(x, y, width, height, settings, systems, tempSystems);

  // Calculate latitude & longitude of probe point
  const normX = x / width;
  const normY = y / height;
  const lat = Math.round((settings.centerLatitude + (0.5 - normY) * 6.0) * 100) / 100;
  const lon = Math.round((settings.centerLongitude + (normX - 0.5) * 6.0) * 100) / 100;

  // Coriolis f in 10^-4 / s
  const coriolisF = Math.round(getCoriolisParameter(lat) * 1e4 * 100) / 100;

  // Speed in m/s
  const speedPx = Math.hypot(vx, vy);
  const windSpeedMs = Math.round(speedPx * 1.8 * 10) / 10;

  // Wind direction (where wind comes FROM)
  const fromAngle = (Math.atan2(-vy, -vx) * (180 / Math.PI) + 360) % 360;
  const windDirText = getWindDirectionText(fromAngle);

  // Pressure difference
  const pDiff = settings.basePressure - pressure;

  let verticalMotion: 'rising' | 'sinking' | 'neutral' = 'neutral';
  let cloudCover = 0;
  let rainIntensity = 0;

  if (pDiff > 2) {
    verticalMotion = 'rising';
    cloudCover = Math.min(100, Math.round(30 + pDiff * 4 + gradientMag * 200));
    rainIntensity = pDiff > 8 ? Math.min(150, Math.round((pDiff - 8) * 4.2)) : 0;
  } else if (pDiff < -2) {
    verticalMotion = 'sinking';
    cloudCover = Math.max(0, Math.round(15 - Math.abs(pDiff) * 2));
    rainIntensity = 0;
  } else {
    verticalMotion = 'neutral';
    cloudCover = Math.round(Math.max(5, 20 + pDiff * 2));
    rainIntensity = 0;
  }

  // Determine local phenomenon status description
  let phenomenon = '氣溫與風場平穩';
  if (pressure <= 995 && sst >= 26.5 && Math.abs(lat) >= 3.5) {
    phenomenon = `🌀 颱風強對流區 (SST ${sst.toFixed(1)}°C 能量充沛)`;
  } else if (pDiff > 10) {
    phenomenon = '🌧️ 強烈低壓氣旋帶 (上升氣流旺盛)';
  } else if (pDiff < -10) {
    phenomenon = '☀️ 沉降高壓區 (晴朗穩定無雲)';
  } else if (sst >= 29.5) {
    phenomenon = '🔥 赤道/熱帶高溫暖池區 (氣熱對流潛能大)';
  } else if (sst <= 15.0) {
    phenomenon = '❄️ 低溫寒冷水體 (平流霧或冷氣團帶)';
  }

  return {
    x,
    y,
    canvasWidth: width,
    canvasHeight: height,
    lat,
    lon,
    pressure: Math.round(pressure * 10) / 10,
    sst: Math.round(sst * 10) / 10,
    windSpeed: windSpeedMs,
    windDirectionAngle: Math.round(fromAngle),
    windDirectionText: windDirText,
    coriolisF,
    verticalMotion,
    cloudCover,
    rainIntensity,
    gradient: Math.round(gradientMag * 1000 * 10) / 10,
    phenomenon
  };
}

/**
 * Map pressure to RGB color for heatmap background
 */
export function getPressureColor(pressure: number, basePressure: number): string {
  const diff = pressure - basePressure;

  if (diff < 0) {
    const intensity = Math.min(1, Math.abs(diff) / 30);
    const r = Math.round(15 + intensity * 220);
    const g = Math.round(23 + (1 - intensity) * 30);
    const b = Math.round(42 + intensity * 60);
    const alpha = 0.12 + intensity * 0.45;
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
  } else {
    const intensity = Math.min(1, Math.abs(diff) / 30);
    const r = Math.round(15 + (1 - intensity) * 20);
    const g = Math.round(60 + intensity * 140);
    const b = Math.round(120 + intensity * 135);
    const alpha = 0.12 + intensity * 0.45;
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
  }
}

/**
 * Map Sea Surface Temperature (SST in °C) to rich ocean thermal colors
 */
export function getSSTColor(sst: number): string {
  // Range: 5°C (deep blue) -> 20°C (cyan) -> 26.5°C (warm green-yellow) -> 32°C (magenta-red)
  if (sst < 15) {
    const ratio = Math.max(0, (sst - 5) / 10);
    const r = Math.round(10 + ratio * 20);
    const g = Math.round(40 + ratio * 100);
    const b = Math.round(130 + ratio * 100);
    return `rgba(${r}, ${g}, ${b}, 0.35)`;
  } else if (sst < 26.5) {
    const ratio = (sst - 15) / 11.5;
    const r = Math.round(30 + ratio * 160);
    const g = Math.round(140 + ratio * 60);
    const b = Math.round(230 - ratio * 150);
    return `rgba(${r}, ${g}, ${b}, 0.38)`;
  } else {
    // SST >= 26.5°C (Typhoon spawning thermal threshold!)
    const ratio = Math.min(1, (sst - 26.5) / 7.5);
    const r = Math.round(220 + ratio * 35);
    const g = Math.round(120 - ratio * 90);
    const b = Math.round(60 + ratio * 90);
    const alpha = 0.38 + ratio * 0.20;
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
  }
}

/**
 * Dynamically evolves pressure systems over time (strengthens on warm water, weakens & dissipates on cool water)
 */
export function evolvePressureSystems(
  systems: PressureSystem[],
  tempSystems: TempSystem[],
  settings: SimSettings,
  dt: number
): PressureSystem[] {
  if (dt <= 0 || systems.length === 0) return systems;

  const speedMultiplier = settings.timeSpeed || 1.0;
  const effectiveDt = dt * speedMultiplier;

  const updated: PressureSystem[] = [];

  for (const sys of systems) {
    let newVal = sys.val;
    let newCx = sys.cx;
    let newCy = sys.cy;
    let newLabel = sys.label;

    // Estimate SST under system center
    const sst = getSSTAt(newCx * 1000, newCy * 800, 1000, 800, settings.baseSST, tempSystems);
    const isLow = sys.val < settings.basePressure;
    const isHigh = sys.val > settings.basePressure;

    if (isLow) {
      if (sst >= 26.5) {
        // Warm ocean fuels low pressure cyclone (STRENGTHENS)
        const sstSurplus = sst - 26.5;
        const strengthenRate = 0.5 + sstSurplus * 0.4; // hPa per second
        newVal = Math.max(905, newVal - strengthenRate * effectiveDt);

        if (newVal < 945) {
          newLabel = `強烈颱風 (${Math.round(newVal)} hPa)`;
        } else if (newVal < 975) {
          newLabel = `中度颱風 (${Math.round(newVal)} hPa)`;
        } else if (newVal < 995) {
          newLabel = `輕度颱風 (${Math.round(newVal)} hPa)`;
        } else {
          newLabel = `熱帶低壓 (${Math.round(newVal)} hPa)`;
        }

        // Slight steering drift in trade winds (westward / poleward)
        const isNorthern = settings.hemisphere === 'Northern';
        const driftX = -0.0012 * effectiveDt;
        const driftY = (isNorthern ? -0.0008 : 0.0008) * effectiveDt;

        newCx = Math.max(0.05, Math.min(0.95, newCx + driftX));
        newCy = Math.max(0.05, Math.min(0.95, newCy + driftY));
      } else {
        // Cool ocean (< 26.5°C) -> WEAKENS & DISSIPATES
        const coolDeficit = 26.5 - sst;
        const weakenRate = 0.5 + coolDeficit * 0.4; // hPa per second
        newVal = newVal + weakenRate * effectiveDt;

        if (newVal >= settings.basePressure - 1.0) {
          // System has completely dissipated into background atmosphere!
          continue;
        } else {
          newLabel = `消散中氣旋 (${Math.round(newVal)} hPa)`;
        }
      }
    } else if (isHigh) {
      // High pressure gentle relaxation if extremely high + pulsation
      if (sys.val > settings.basePressure + 30) {
        newVal -= 0.25 * effectiveDt;
      }
      const pulse = Math.sin(Date.now() * 0.001 + sys.cx * 10) * 0.05 * effectiveDt;
      newVal += pulse;
      newLabel = `高壓系統 (${Math.round(newVal)} hPa)`;
    }

    // Move polygon points if system center drifted
    let newPoints = sys.points;
    if (sys.points && (newCx !== sys.cx || newCy !== sys.cy)) {
      const dx = newCx - sys.cx;
      const dy = newCy - sys.cy;
      newPoints = sys.points.map((p) => ({
        x: Math.max(0.02, Math.min(0.98, p.x + dx)),
        y: Math.max(0.02, Math.min(0.98, p.y + dy))
      }));
    }

    updated.push({
      ...sys,
      val: Math.round(newVal * 10) / 10,
      cx: newCx,
      cy: newCy,
      points: newPoints,
      label: newLabel
    });
  }

  return updated;
}

