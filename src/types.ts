export type Hemisphere = 'Northern' | 'Southern';

export type DisplayMode = 'particles' | 'vectors' | 'both';

export type PressureRegionType = 'polygon' | 'radial';

export type DrawingTarget = 'pressure' | 'temperature';

export interface Point {
  x: number;
  y: number;
}

export interface PressureSystem {
  id: string;
  type: PressureRegionType;
  val: number; // in hPa (e.g., 940 to 1040)
  points?: Point[]; // for polygon type
  cx: number;
  cy: number;
  radius?: number; // for radial type
  label?: string; // Optional custom name
}

export interface TempSystem {
  id: string;
  type: PressureRegionType;
  val: number; // Sea Surface Temperature in °C (e.g., 10 to 35)
  points?: Point[]; // for polygon type
  cx: number;
  cy: number;
  radius?: number; // for radial type
  label?: string; // Optional custom name e.g. "暖池 Warm Pool", "湧升冷水"
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  birth: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface SimSettings {
  basePressure: number; // Base pressure in hPa (e.g., 1013 hPa)
  baseSST: number; // Base Sea Surface Temperature in °C (e.g., 28°C)
  centerLatitude: number; // Map center latitude in degrees (-90 to +90)
  centerLongitude: number; // Map center longitude in degrees (-180 to +180)
  hemisphere: Hemisphere; // Derived from latitude or forced
  coriolisStrength: number; // Coriolis scaling factor
  surfaceFriction: number; // Cross-isobar angle factor (0 to 1)
  particleCount: number; // Density of wind particles
  particleSpeed: number; // Speed scale
  showIsobars: number; // Isobar spacing in hPa (0 = off, e.g. 4 hPa)
  showHeatmap: boolean; // Pressure overlay gradient
  showSSTHeatmap: boolean; // Sea Surface Temperature overlay gradient
  showVectorGrid: boolean; // Wind vector arrows grid
  showCloudsAndRain: boolean; // Cloud/rain visual effects in low pressure
  showPhenomenaIcons: boolean; // Typhoons & Fronts icons
  showTyphoons?: boolean; // Separate toggle for Typhoon/Tropical Cyclone effects
  showFronts?: boolean; // Separate toggle for Cold/Warm/Stationary/Occluded Fronts
  showLatLonGrid: boolean; // 1x1 map square Lat/Lon grid lines
  displayMode: DisplayMode;
  isPaused: boolean;
  timeSpeed: number; // 0.5x, 1x, 2x
  autoEvolve?: boolean; // Dynamic pressure evolution (strengthen/weaken/dissipate)
  showProbePanel?: boolean; // Toggle display of mouse probe card
}

export type PhenomenonType = 'typhoon' | 'tropical_cyclone' | 'cold_front' | 'warm_front' | 'stationary_front' | 'occluded_front';

export interface DetectedPhenomenon {
  id: string;
  type: PhenomenonType;
  name: string;
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  pressure: number;
  sst: number;
  windSpeed: number;
  intensityLabel: string;
  points?: Point[]; // for front lines
}

export interface ProbeData {
  x: number;
  y: number;
  canvasWidth?: number;
  canvasHeight?: number;
  lat: number;
  lon: number;
  pressure: number; // hPa
  sst: number; // Sea Surface Temperature in °C
  windSpeed: number; // m/s
  windDirectionAngle: number; // degrees 0-360
  windDirectionText: string; // e.g., "東北風"
  coriolisF: number; // Coriolis parameter f in 10^-4 /s
  verticalMotion: 'rising' | 'sinking' | 'neutral'; // 上升氣流 / 下沉氣流
  cloudCover: number; // 0-100%
  rainIntensity: number; // mm/h
  gradient: number; // hPa / km
  phenomenon: string; // Detected weather state / phenomenon
}

export interface WeatherPreset {
  id: string;
  name: string;
  description: string;
  iconName: string;
  basePressure: number;
  baseSST: number;
  centerLatitude: number;
  centerLongitude: number;
  systems: Omit<PressureSystem, 'id'>[];
  tempSystems?: Omit<TempSystem, 'id'>[];
}

