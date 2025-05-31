// src/types/starmap.ts
// 🌟 MAIN TYPE DEFINITIONS FILE 🌟
// Comprehensive type definitions for the starmap system

// Note: THREE.js types are available globally when @types/three is installed

// === CORE INTERFACES ===
export interface StarEvent {
  slug: string;
  year: number;
  title: string;
  description?: string;
  era: string;
  isKeyEvent?: boolean;
  uniqueId?: string;
}

export interface ConstellationConfig {
  centerAzimuth: number;
  centerElevation: number;
  spread: number;
  pattern: string;
}

export interface PatternPosition {
  azOffset: number;
  elOffset: number;
}

export interface ConstellationPattern {
  [patternName: string]: PatternPosition[];
}

export interface ConnectionPattern {
  [patternName: string]: [number, number][];
}

// === STAR MANAGEMENT ===
export interface StarUserData extends StarEvent {
  mainColor: string;
  starType: StarType;
  uniqueId: string;
  era: string;
  constellationPosition: PatternPosition;
  isSelected: boolean;
  isHovered: boolean;
  animationStartTime: number;
  lastUpdateTime: number;
}

export interface OrbitalRingUserData {
  type: 'base' | 'selected' | 'init';
  parentStar: string;
  animationPhase: number;
  rotationSpeed: number;
  pulseSpeed?: number;
  scaleBase?: number;
  startTime?: number;
  duration?: number;
  scaleStart?: number;
  scaleEnd?: number;
}

export type StarType = 'point' | 'classic' | 'sparkle' | 'refraction' | 'halo' | 'subtle';

export type RingType = 'base' | 'selected' | 'init';

// === ERA MANAGEMENT ===
export interface EraColorMap {
  [era: string]: string;
}

export interface EventsByEra {
  [era: string]: StarEvent[];
}

export interface ConstellationAnalysis {
  eventCount: number;
  patternSize: number;
  overflow: number;
  density: number;
  azimuthSpread: number;
  elevationSpread: number;
}

export interface ConstellationBounds {
  azimuth: {
    min: number;
    max: number;
    center: number;
  };
  elevation: {
    min: number;
    max: number;
    center: number;
  };
}

export interface ConstellationDebugInfo {
  era: string;
  config: ConstellationConfig;
  pattern: PatternPosition[];
  connections: [number, number][];
  bounds: ConstellationBounds;
  patternName: string;
  patternSize: number;
  connectionCount: number;
}

export interface ConstellationValidation {
  valid: boolean;
  issues: string[];
}

// === INTERACTION INTERFACES ===
export interface InteractionOptions {
  isMobile: boolean;
  floatingCardId?: string;
}

export interface ScreenPosition {
  x: number;
  y: number;
  isInFront: boolean;
}

export interface StarSelectionEvent {
  eventData: StarEvent;
  sprite: THREE.Sprite;
}

// === MOBILE INTERFACE ===
export interface MobileCommandOptions {
  movementSpeed: number;
  zoomSpeed: number;
  autoRotateToggleVisualFeedback: boolean;
}

export interface MobileCommand {
  action: MobileCommandAction;
  params?: Record<string, any>;
}

export type MobileCommandAction = 
  | 'moveUp' 
  | 'moveDown' 
  | 'moveLeft' 
  | 'moveRight'
  | 'zoomIn' 
  | 'zoomOut' 
  | 'toggleAutoRotate' 
  | 'resetView' 
  | 'centerView'
  | 'clearSelection'
  | 'wait';

export interface CommandResult {
  action: MobileCommandAction;
  params: Record<string, any>;
  success: boolean;
}

export interface StarmapInfo {
  ready: boolean;
  error?: string;
  isMobile?: boolean;
  isMobilePortrait?: boolean;
  currentFOV?: number;
  zoomLevel?: number;
  isAutoRotating?: boolean;
  currentSelection?: StarEvent | null;
  constellations?: ConstellationInfo;
}

export interface ConstellationInfo {
  constellations: {
    era: string;
    events: number;
    config: ConstellationConfig;
    color: string;
  }[];
}

// === CORE SYSTEM INTERFACES ===
export interface StarMapCoreOptions {
  skyboxImageUrl?: string;
  isMobile?: boolean;
}

export interface StarManagerOptions {
  useEraColors?: boolean;
}

export interface TextureFactoryOptions {
  cacheSize?: number;
  canvasPoolSize?: number;
}

// === TEXTURE INTERFACES ===
export interface GlowLayer {
  radius: number;
  opacity: number;
  blur: number;
}

export interface OrbitalRingDefinition {
  radius: number;
  opacity: number;
  speed: number;
  width: number;
}

// === CUSTOM EVENT INTERFACES ===
export interface StarmapCustomEvent extends CustomEvent {
  detail: {
    eventData?: StarEvent;
    sprite?: any; // THREE.Sprite
    camera?: any; // THREE.Camera
    scene?: any; // THREE.Scene
    renderer?: any; // THREE.WebGLRenderer
    timestamp?: number;
    [key: string]: any;
  };
}

// === API INTERFACES ===
export interface StarmapAPI {
  isInitialized(): boolean;
  isMobile?(): boolean;
  isMobilePortrait?(): boolean;
  panUp(amount: number): void;
  panDown(amount: number): void;
  panLeft(amount: number): void;
  panRight(amount: number): void;
  zoomIn(amount: number): void;
  zoomOut(amount: number): void;
  toggleAutoRotate(): boolean;
  resetView(): void;
  centerView(): void;
  getCurrentSelection?(): StarEvent | null;
  clearSelection?(): void;
  updateEvents?(events: StarEvent[]): void;
  getConstellationInfo?(): ConstellationInfo;
}

// === EXTENDED THREE.JS TYPES ===
export interface THREE_Extended extends typeof THREE {
  OrbitControls: new (camera: THREE.Camera, domElement: HTMLElement) => OrbitControlsType;
}

export interface OrbitControlsType {
  enableDamping: boolean;
  dampingFactor: number;
  rotateSpeed: number;
  enablePan: boolean;
  enableZoom: boolean;
  enableRotate: boolean;
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  target: THREE.Vector3;
  update(): void;
  reset(): void;
}

// === UTILITY TYPES ===
export type StarmapEventType = 
  | 'starmap:frame'
  | 'starmap:star-selected' 
  | 'starmap:star-deselected'
  | 'starmap-mobile:move-up'
  | 'starmap-mobile:move-down'
  | 'starmap-mobile:move-left'
  | 'starmap-mobile:move-right'
  | 'starmap-mobile:zoom-in'
  | 'starmap-mobile:zoom-out'
  | 'starmap-mobile:toggle-auto-rotate'
  | 'starmap-mobile:reset-view'
  | 'starmap-mobile:center-view'
  | 'starmap-mobile:clear-selection'
  | 'starmap-mobile:sequence-executed';

// === GLOBAL WINDOW INTERFACE ===
declare global {
  interface Window {
    THREE: typeof THREE;
    [key: `starmap_${string}`]: StarmapAPI;
  }
}