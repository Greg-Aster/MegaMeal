import * as THREE from 'three';
import { GameObject } from '../core/GameObject';

export interface WaveConfig {
  amplitude: number;
  frequency: number;
  speed: number;
  direction: THREE.Vector2;
}

export interface OceanConfig {
  size: { width: number; height: number };
  segments: { width: number; height: number };
  position: THREE.Vector3;
  waterLevel: number;
  
  // Visual properties
  color: number;
  opacity: number;
  metalness: number;
  roughness: number;
  
  // Wave system
  waves: WaveConfig[];
  enableReflection: boolean;
  enableRefraction: boolean;
  
  // Animation
  enableAnimation: boolean;
  animationSpeed: number;
  
  // Environmental effects
  enableFog: boolean;
  fogColor: number;
  fogDensity: number;
  
  // Performance
  enableLOD: boolean;
  maxDetailDistance: number;
}

export interface OceanData {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  geometry: THREE.PlaneGeometry;
  waveTime: number;
  originalVertices: Float32Array;
  // Procedural textures like original system
  map: THREE.DataTexture;
  normalMap: THREE.DataTexture;
  displacementMap: THREE.DataTexture;
}

/**
 * Professional OceanSystem for creating realistic water and wave effects
 * Features:
 * - Multi-wave simulation with configurable parameters
 * - Dynamic vertex displacement for realistic wave motion
 * - Reflection and refraction effects
 * - Performance-optimized with LOD support
 * - Reusable across multiple levels
 * - Mobile-friendly optimization
 */
export class OceanSystem extends GameObject {
  private THREE: any;
  private scene: THREE.Scene;
  private config: OceanConfig;
  private oceanData: OceanData | null = null;
  private oceanGroup: THREE.Group;
  private materialFactory: any; // Engine's material factory
  
  // Animation state - OceanSystem manages its own time
  private internalTime = 0;
  private isAnimating = true;
  
  // Performance optimization
  private lastUpdateTime = 0;
  private updateInterval = 1000 / 60; // 60 FPS target
  
  // Wave animation optimization (integrated with OptimizationManager)
  private shouldUpdateWaves = true;
  
  // Default configuration optimized for Monument Valley style and mobile performance
  private static readonly DEFAULT_CONFIG: OceanConfig = {
    size: { width: 8000, height: 8000 }, // Reduced size for better performance
    segments: { width: 64, height: 64 }, // Reduced segments for mobile (4K vertices instead of 16K)
    position: new THREE.Vector3(0, -6, 0),
    waterLevel: -6,
    
    // Visual properties with improved realism
    color: 0x006994, // Deep ocean blue from original
    opacity: 0.4, // Much more transparent for realistic ocean depth
    metalness: 0.02, // Very low metalness for water
    roughness: 0.1, // Very smooth for reflections
    
    // Wave system uses hardcoded original calculations (not configurable array)
    waves: [], // Not used - waves are hardcoded to match original exactly
    
    enableReflection: true,
    enableRefraction: true,
    enableAnimation: true,
    animationSpeed: 1.0,
    
    // Environmental effects
    enableFog: false,
    fogColor: 0x87CEEB,
    fogDensity: 0.01,
    
    // Performance
    enableLOD: true,
    maxDetailDistance: 500
  };
  
  constructor(
    THREE: any,
    scene: THREE.Scene,
    config: Partial<OceanConfig> = {},
    materialFactory?: any
  ) {
    super();
    this.THREE = THREE;
    this.scene = scene;
    this.config = { ...OceanSystem.DEFAULT_CONFIG, ...config };
    this.materialFactory = materialFactory;
    
    this.oceanGroup = new this.THREE.Group();
    this.oceanGroup.name = 'ocean_system';
    
    // Auto-detect mobile for performance optimization
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      // Reduce complexity on mobile
      this.config.segments.width = Math.min(this.config.segments.width, 100);
      this.config.segments.height = Math.min(this.config.segments.height, 100);
      this.config.waves = this.config.waves.slice(0, 2); // Fewer waves
      this.updateInterval = 1000 / 30; // 30 FPS on mobile
    }
    
    console.log(`🌊 OceanSystem created: ${this.config.size.width}x${this.config.size.height}, ${this.config.segments.width}x${this.config.segments.height} segments`);
  }
  
  public async initialize(): Promise<void> {
    this.validateNotDisposed();
    
    if (this.isInitialized) {
      console.warn('OceanSystem already initialized');
      return;
    }
    
    console.log('🌊 Initializing OceanSystem...');
    
    this.createOcean();
    this.setupEnvironmentalEffects();
    this.setupOptimizationListeners();
    this.scene.add(this.oceanGroup);
    
    this.isInitialized = true;
    console.log('✅ OceanSystem initialized');
  }
  
  private createOcean(): void {
    // Mobile optimization for Monument Valley style
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Use even lower segments on mobile for better performance
    const segments = isMobile ? 
      { width: 32, height: 32 } : // 1K vertices for mobile
      this.config.segments; // Use config segments for desktop
    
    const geometry = new this.THREE.PlaneGeometry(
      this.config.size.width,
      this.config.size.height,
      segments.width,
      segments.height
    );
    
    // Store original vertices for wave calculations
    const originalVertices = new Float32Array(geometry.attributes.position.array);
    
    // Generate procedural textures like original system
    const textureData = this.createProceduralTextures();
    
    // Use PBR material factory exactly like original
    let material;
    if (this.materialFactory && this.materialFactory.createPBRMaterial) {
      material = this.materialFactory.createPBRMaterial({
        map: textureData.map, // Use original naming
        normalMap: textureData.normalMap,
        displacementMap: textureData.displacementMap, // Critical for vertex displacement
        metalness: 0.02, // Very low metalness for water
        roughness: 0.1, // Very smooth for reflections
        transparent: true,
        opacity: 0.4, // More transparent for realistic ocean depth
        color: 0x006994, // Deep ocean blue tint
        side: this.THREE.DoubleSide, // Render both sides for underwater visibility
      }) as THREE.MeshStandardMaterial;
    } else {
      // Fallback to direct material creation
      material = new this.THREE.MeshStandardMaterial({
        map: textureData.map,
        normalMap: textureData.normalMap,
        displacementMap: textureData.displacementMap,
        color: this.config.color,
        transparent: true,
        opacity: this.config.opacity,
        metalness: this.config.metalness,
        roughness: this.config.roughness,
        side: this.THREE.DoubleSide,
      });
    }
    
    // Create mesh
    const mesh = new this.THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Make it horizontal
    mesh.position.copy(this.config.position);
    mesh.name = 'ocean_surface';
    
    // Enable shadows
    mesh.receiveShadow = true;
    mesh.castShadow = false; // Water doesn't cast shadows
    
    // Store water data in userData like original
    const waterData = {
      mesh,
      material,
      geometry,
      waveTime: 0,
      originalVertices,
      map: textureData.map,
      normalMap: textureData.normalMap,
      displacementMap: textureData.displacementMap
    };
    
    // Store in mesh userData like original Observatory implementation
    mesh.userData.waterData = waterData;
    
    this.oceanData = waterData;
    
    this.oceanGroup.add(mesh);
    console.log('✅ Ocean surface created with procedural textures');
  }
  
  /**
   * Generate procedural textures exactly matching original Observatory water system
   */
  private createProceduralTextures() {
    const size = 1024;
    
    // Create color map canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Create displacement map canvas
    const displacementCanvas = document.createElement('canvas');
    displacementCanvas.width = size;
    displacementCanvas.height = size;
    const displacementCtx = displacementCanvas.getContext('2d')!;

    // Create normal map canvas for surface detail
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = size;
    normalCanvas.height = size;
    const normalCtx = normalCanvas.getContext('2d')!;

    // Multi-layered noise function exactly matching original
    const waveNoise = (x: number, y: number, time: number = 0) => {
      let value = 0;
      // Large ocean swells
      value += Math.sin((x * 0.02 + y * 0.01) + time * 0.5) * 0.4;
      value += Math.cos((x * 0.015 - y * 0.02) + time * 0.3) * 0.3;
      
      // Medium waves
      value += Math.sin((x * 0.05 + y * 0.08) + time * 1.2) * 0.2;
      value += Math.cos((x * 0.08 - y * 0.05) + time * 0.8) * 0.15;
      
      // Small ripples
      value += Math.sin((x * 0.15 + y * 0.12) + time * 2.0) * 0.08;
      value += Math.cos((x * 0.18 - y * 0.15) + time * 1.5) * 0.06;
      
      // Fine surface detail
      value += Math.sin((x * 0.3 + y * 0.25) + time * 3.0) * 0.04;
      value += Math.cos((x * 0.35 - y * 0.3) + time * 2.5) * 0.03;
      
      return (value + 1) / 2; // Normalize to 0-1 range
    };

    // Generate textures exactly like original
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const wave = waveNoise(x, y);
        
        // Color map - deep ocean blues with wave-based variation (exact original colors)
        const blueBase = 20;
        const greenBase = 50;
        const blue = Math.floor(blueBase + wave * 120);
        const green = Math.floor(greenBase + wave * 100);
        const red = Math.floor(10 + wave * 30);
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(x, y, 1, 1);

        // Displacement map - grayscale height for wave geometry
        const displacement = Math.floor(wave * 255);
        displacementCtx.fillStyle = `rgb(${displacement}, ${displacement}, ${displacement})`;
        displacementCtx.fillRect(x, y, 1, 1);

        // Normal map - calculate surface normals for lighting
        const waveHeight = wave;
        const waveHeightX = waveNoise(x + 1, y) - waveHeight;
        const waveHeightY = waveNoise(x, y + 1) - waveHeight;
        
        // Convert height gradients to normal map colors
        const normalX = Math.floor((waveHeightX + 1) * 127.5);
        const normalY = Math.floor((waveHeightY + 1) * 127.5);
        const normalZ = 255; // Pointing up
        
        normalCtx.fillStyle = `rgb(${normalX}, ${normalY}, ${normalZ})`;
        normalCtx.fillRect(x, y, 1, 1);
      }
    }

    // Create Three.js textures exactly like original
    const colorMap = new this.THREE.CanvasTexture(canvas);
    colorMap.wrapS = colorMap.wrapT = this.THREE.RepeatWrapping;
    colorMap.repeat.set(15, 15); // More repetitions for finer detail

    const displacementMap = new this.THREE.CanvasTexture(displacementCanvas);
    displacementMap.wrapS = displacementMap.wrapT = this.THREE.RepeatWrapping;
    displacementMap.repeat.set(15, 15);

    const normalMap = new this.THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = normalMap.wrapT = this.THREE.RepeatWrapping;
    normalMap.repeat.set(15, 15);

    return { map: colorMap, normalMap, displacementMap };
  }
  
  private setupEnvironmentalEffects(): void {
    if (this.config.enableFog) {
      // Add fog effect for distant water
      const fog = new this.THREE.Fog(
        this.config.fogColor,
        this.config.maxDetailDistance * 0.5,
        this.config.maxDetailDistance
      );
      this.scene.fog = fog;
    }
  }

  /**
   * Setup optimization listeners to control wave vertex animation exactly like original
   */
  private setupOptimizationListeners(): void {
    // Listen for optimization level changes from OptimizationManager
    if (typeof window !== 'undefined') {
      window.addEventListener('optimizationLevelChanged', (event: Event) => {
        const { level } = (event as CustomEvent).detail;
        
        // Control wave vertex animation based on optimization level
        if (level.includes('mobile')) {
          this.shouldUpdateWaves = false; // Disable vertex animation on mobile
          console.log('🌊 Ocean vertex animation disabled for mobile performance');
        } else {
          this.shouldUpdateWaves = true; // Enable on desktop
          console.log('🌊 Ocean vertex animation enabled for desktop');
        }
      });
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized || !this.oceanData || !this.config.enableAnimation) return;
    
    // Performance throttling
    const currentTime = Date.now();
    if (currentTime - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = currentTime;
    
    // OceanSystem manages its own time accumulation
    this.internalTime += deltaTime * this.config.animationSpeed;
    this.updateWaves(this.internalTime);
  }
  
  // Legacy method for backwards compatibility - now uses internal time
  public updateWithTime(time: number): void {
    if (!this.isInitialized || !this.oceanData || !this.config.enableAnimation) return;
    // Sync internal time with external time if provided
    this.internalTime = time;
    this.updateWaves(this.internalTime);
  }
  
  private updateWaves(time: number): void {
    if (!this.oceanData) return;
    
    const { material } = this.oceanData;
    
    // Always animate textures for basic water movement (much slower for realism)
    if (material.map) {
      material.map.offset.x = Math.sin(time * 0.02) * 0.01; // 5x slower, smaller amplitude
      material.map.offset.y = time * 0.001; // 5x slower
    }
    
    if (material.normalMap) {
      material.normalMap.offset.x = Math.sin(time * 0.06) * 0.008; // 5x slower, smaller amplitude
      material.normalMap.offset.y = time * 0.002; // 6x slower
    }
    
    // Subtle opacity variation for depth simulation - reduced base opacity for realism
    const baseOpacity = this.config.opacity;
    const opacityVariation = Math.sin(time * 0.08) * 0.02; // 5x slower, smaller variation
    material.opacity = Math.max(0, Math.min(1, baseOpacity + opacityVariation));
    
    // Only update vertex positions if performance allows (controlled by OptimizationManager)
    if (this.shouldUpdateWaves) {
      const { geometry } = this.oceanData;
      const positions = geometry.attributes.position.array as Float32Array;
      
      // Simplified wave function for better performance - exactly matching original
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        
        // Calculate wave displacement relative to base level (z = 0)
        // This creates wave offsets that work with the mesh's Y position
        let waveDisplacement = 0;
        
        // Large ocean swells only (most visible impact) - much slower and gentler
        waveDisplacement += Math.sin(x * 0.001 + y * 0.0005 + time * 0.1) * 0.15; // 5x slower, smaller amplitude
        waveDisplacement += Math.cos(x * 0.0008 - y * 0.001 + time * 0.06) * 0.08; // 5x slower, smaller amplitude
        
        // Medium waves for detail - much slower and subtler
        waveDisplacement += Math.sin(x * 0.004 + y * 0.003 + time * 0.2) * 0.1; // 5x slower, smaller amplitude
        
        // Apply wave displacement as relative offset from base level (z = 0)
        // The mesh's Y position (controlled by setWaterLevel) handles the overall water level
        positions[i + 2] = waveDisplacement;
      }
      
      // Mark geometry for update
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals(); // Recalculate normals for proper lighting
    }
  }
  
  /**
   * Get water height at a specific world position
   */
  public getWaterHeightAt(x: number, z: number): number {
    if (!this.config.enableAnimation) {
      return this.config.waterLevel;
    }
    
    let height = this.config.waterLevel;
    
    // Calculate wave height at position
    this.config.waves.forEach(wave => {
      const waveX = x * wave.direction.x + z * wave.direction.y;
      const wavePhase = waveX * wave.frequency + this.internalTime * wave.speed;
      height += Math.sin(wavePhase) * wave.amplitude;
    });
    
    return height;
  }
  
  /**
   * Check if a position is underwater
   */
  public isUnderwater(position: THREE.Vector3): boolean {
    return position.y < this.getWaterHeightAt(position.x, position.z);
  }
  
  /**
   * Update configuration at runtime
   */
  public updateConfig(newConfig: Partial<OceanConfig>): void {
    Object.assign(this.config, newConfig);
    
    if (this.oceanData) {
      // Update material properties
      this.oceanData.material.color.setHex(this.config.color);
      this.oceanData.material.opacity = this.config.opacity;
      this.oceanData.material.metalness = this.config.metalness;
      this.oceanData.material.roughness = this.config.roughness;
      
      // Update position
      this.oceanData.mesh.position.copy(this.config.position);
    }
    
    console.log('🔧 OceanSystem configuration updated');
  }
  
  /**
   * Set ocean animation state
   */
  public setAnimationEnabled(enabled: boolean): void {
    this.config.enableAnimation = enabled;
    this.isAnimating = enabled;
  }
  
  /**
   * Set water level (useful for rising water effects)
   */
  public setWaterLevel(level: number): void {
    this.config.waterLevel = level;
    this.config.position.y = level;
    
    if (this.oceanData) {
      this.oceanData.mesh.position.y = level;
    }
  }
  
  /**
   * Add a new wave to the system
   */
  public addWave(wave: WaveConfig): void {
    this.config.waves.push(wave);
  }
  
  /**
   * Remove all waves (calm water)
   */
  public clearWaves(): void {
    this.config.waves = [];
  }
  
  /**
   * Get current system stats for debugging
   */
  public getStats() {
    return {
      triangles: this.oceanData ? this.config.segments.width * this.config.segments.height * 2 : 0,
      vertices: this.oceanData ? (this.config.segments.width + 1) * (this.config.segments.height + 1) : 0,
      waves: this.config.waves.length,
      internalTime: this.internalTime,
      isAnimating: this.isAnimating,
      waterLevel: this.config.waterLevel
    };
  }
  
  /**
   * Get the ocean mesh for external access
   */
  public getOceanMesh(): THREE.Mesh | null {
    return this.oceanData?.mesh || null;
  }
  
  /**
   * Set environment map for reflections
   */
  public setEnvironmentMap(envMap: THREE.CubeTexture | THREE.Texture): void {
    if (this.oceanData) {
      this.oceanData.material.envMap = envMap;
      this.oceanData.material.needsUpdate = true;
    }
  }
  
  public dispose(): void {
    console.log('🧹 Disposing OceanSystem...');
    
    // Dispose geometry and material
    if (this.oceanData) {
      this.oceanData.geometry.dispose();
      this.oceanData.material.dispose();
    }
    
    // Remove from scene
    this.scene.remove(this.oceanGroup);
    
    // Clear data
    this.oceanData = null;
    
    this.isInitialized = false;
    console.log('✅ OceanSystem disposed');
  }
}