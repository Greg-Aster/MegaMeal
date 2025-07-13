import * as THREE from 'three';
import { GameObject } from '../core/GameObject';

export interface FireflyMovementConfig {
  speed: number;
  wanderSpeed: number;
  wanderRadius: number;
  floatAmplitude: { x: number; y: number; z: number };
  lerpFactor: number;
}

export interface FireflyConfig {
  count: number;
  maxLights: number;
  colors: number[];
  emissiveIntensity: number;
  lightIntensity: number;
  lightRange: number;
  cycleDuration: number; // How long lights stay on/off
  fadeSpeed: number; // How fast lights fade in/out
  heightRange: { min: number; max: number };
  radius: number; // How far fireflies spread from center
  size: number; // Firefly sphere size
  movement: FireflyMovementConfig;
}

export interface FireflyData {
  mesh: THREE.Mesh;
  light: THREE.PointLight | null;
  targetPosition: THREE.Vector3;
  basePosition: THREE.Vector3;
  animationOffset: number;
  lightCycleTime: number;
  isLightActive: boolean;
  lightFadeProgress: number; // 0-1 for fade in/out
}

/**
 * Professional FireflySystem for creating atmospheric lighting effects
 * Features:
 * - Mobile-optimized light cycling (limited number of active lights)
 * - Dynamic light assignment and fading
 * - Proper bloom effect setup
 * - Reusable across multiple levels
 * - Performance-adaptive quality scaling
 */
export class FireflySystem extends GameObject {
  private THREE: any;
  private scene: THREE.Scene;
  private config: FireflyConfig;
  private fireflies: FireflyData[] = [];
  private fireflyGroup: THREE.Group;
  private activeLights: THREE.PointLight[] = [];
  private getHeightAt?: (x: number, z: number) => number;
  
  // Animation state
  private animationTime = 0;
  private lightCycleTimer = 0;
  private nextLightIndex = 0;
  
  // Default configuration
  private static readonly DEFAULT_CONFIG: FireflyConfig = {
    count: 20, // Fewer geometric light shapes for minimal atmosphere
    maxLights: 0, // No actual lights - use geometric shapes instead
    colors: [0xf4a261, 0xe9c46a, 0xe76f51, 0x2a9d8f, 0x264653], // Keep your existing palette
    emissiveIntensity: 20.0, // Very subtle glow
    lightIntensity: 2.0, // Much lower intensity for calm mood
    lightRange: 40, // Smaller, more intimate light areas
    cycleDuration: 8.0, // Much slower cycling for peaceful feel
    fadeSpeed: 1.0, // Very slow, gentle transitions
    heightRange: { min: 0.8, max: 1.8 }, // Tighter height range
    radius: 100, // Closer to center for intimate feel
    size: 0.01, // Tiny for minimal presence
    movement: {
      speed: 0.3, // Very slow, meditative movement
      wanderSpeed: 0.005, // Minimal wandering
      wanderRadius: 3, // Small movement range
      floatAmplitude: { x: 1.0, y: 0.3, z: 1.0 }, // Gentle floating
      lerpFactor: 0.8 // Smooth, slow movements
    }
  };
  
  constructor(
    THREE: any, 
    scene: THREE.Scene, 
    config: Partial<FireflyConfig> = {},
    heightCallback?: (x: number, z: number) => number
  ) {
    super();
    this.THREE = THREE;
    this.scene = scene;
    this.config = { ...FireflySystem.DEFAULT_CONFIG, ...config };
    this.getHeightAt = heightCallback;
    
    this.fireflyGroup = new this.THREE.Group();
    this.fireflyGroup.name = 'firefly_system';
    
    // Auto-detect mobile for better defaults
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && !config.maxLights) {
      this.config.maxLights = 4; // Very conservative on mobile for Monument Valley style
    }
    
    console.log(`✨ FireflySystem created: ${this.config.count} fireflies, ${this.config.maxLights} max lights`);
  }
  
  public async initialize(): Promise<void> {
    this.validateNotDisposed();
    
    if (this.isInitialized) {
      console.warn('FireflySystem already initialized');
      return;
    }
    
    console.log('✨ Initializing FireflySystem...');
    
    this.createFireflies();
    this.scene.add(this.fireflyGroup);
    this.initializeLightCycling();
    
    this.isInitialized = true;
    console.log('✅ FireflySystem initialized');
  }
  
  private createFireflies(): void {
    for (let i = 0; i < this.config.count; i++) {
      const fireflyData = this.createSingleFirefly(i);
      this.fireflies.push(fireflyData);
      this.fireflyGroup.add(fireflyData.mesh);
      
      // Add light to scene if it exists
      if (fireflyData.light) {
        this.scene.add(fireflyData.light);
      }
    }
  }
  
  private createSingleFirefly(index: number): FireflyData {
    // Generate position
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * this.config.radius;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Calculate height
    const groundHeight = this.getHeightAt ? this.getHeightAt(x, z) : 0;
    const y = groundHeight + this.config.heightRange.min + 
              Math.random() * (this.config.heightRange.max - this.config.heightRange.min);
    
    const position = new this.THREE.Vector3(x, y, z);
    const color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];
    
    // Debug color assignment
    if (index < 5) {
      console.log(`Firefly ${index} assigned color: 0x${color.toString(16)}`);
    }
    
    // Check if we're in vector mode for stylized fireflies
    const isVectorMode = (window as any).MEGAMEAL_VECTOR_MODE === true;
    
    let fireflyGeometry, fireflyMaterial;
    
    if (isVectorMode) {
      // Monument Valley style - geometric shapes with gradient effect
      fireflyGeometry = new this.THREE.PlaneGeometry(this.config.size * 8, this.config.size * 8, 1, 1);
      
      // Create a radial gradient texture for the geometric light effect
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      
      // Create radial gradient from bright center to transparent edge
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      const colorObj = new this.THREE.Color(color);
      gradient.addColorStop(0, `rgba(${Math.floor(colorObj.r * 255)}, ${Math.floor(colorObj.g * 255)}, ${Math.floor(colorObj.b * 255)}, 0.8)`);
      gradient.addColorStop(0.3, `rgba(${Math.floor(colorObj.r * 255)}, ${Math.floor(colorObj.g * 255)}, ${Math.floor(colorObj.b * 255)}, 0.4)`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      
      const gradientTexture = new this.THREE.CanvasTexture(canvas);
      gradientTexture.needsUpdate = true;
      
      fireflyMaterial = new this.THREE.MeshBasicMaterial({
        map: gradientTexture,
        transparent: true,
        opacity: 0.6,
        toneMapped: false,
        fog: false,
        depthWrite: false,
        blending: this.THREE.AdditiveBlending
      });
    } else {
      // Realistic style - keep original smooth approach
      fireflyGeometry = new this.THREE.SphereGeometry(this.config.size, 8, 6);
      fireflyMaterial = new this.THREE.MeshStandardMaterial({
        color: new this.THREE.Color(color).multiplyScalar(0.1),
        emissive: color,
        emissiveIntensity: this.config.emissiveIntensity,
        transparent: true,
        opacity: 0.8,
        toneMapped: false,
        fog: false,
        metalness: 0.0,
        roughness: 1.0,
        alphaTest: 0.01,
        side: this.THREE.DoubleSide
      });
    }
    
    const mesh = new this.THREE.Mesh(fireflyGeometry, fireflyMaterial);
    mesh.position.copy(position);
    mesh.name = `firefly_${index}`;
    
    // In vector mode, make planes face the camera (billboard effect)
    if (isVectorMode) {
      mesh.lookAt(new this.THREE.Vector3(0, position.y, 0));
    }
    
    // No actual lights in vector mode - use geometric light pools instead
    let light: THREE.PointLight | null = null;
    if (!isVectorMode && this.config.maxLights > 0 && index < this.config.maxLights) {
      // Only create real lights in non-vector mode
      light = new this.THREE.PointLight(color, 0, this.config.lightRange);
      light.position.copy(position);
      light.name = `firefly_light_${index}`;
      this.activeLights.push(light);
    }
    
    // Create geometric light pool on ground in vector mode
    let lightPool: THREE.Mesh | null = null;
    if (isVectorMode) {
      const groundY = this.getHeightAt ? this.getHeightAt(x, z) : 0;
      
      // Create larger circular geometry for ground light pool
      const poolGeometry = new this.THREE.PlaneGeometry(this.config.lightRange * 0.4, this.config.lightRange * 0.4, 1, 1);
      
      // Create even more subtle radial gradient for ground pool
      const poolCanvas = document.createElement('canvas');
      poolCanvas.width = 128;
      poolCanvas.height = 128;
      const poolCtx = poolCanvas.getContext('2d')!;
      
      const poolGradient = poolCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      const poolColor = new this.THREE.Color(color);
      poolGradient.addColorStop(0, `rgba(${Math.floor(poolColor.r * 255)}, ${Math.floor(poolColor.g * 255)}, ${Math.floor(poolColor.b * 255)}, 0.3)`);
      poolGradient.addColorStop(0.6, `rgba(${Math.floor(poolColor.r * 255)}, ${Math.floor(poolColor.g * 255)}, ${Math.floor(poolColor.b * 255)}, 0.1)`);
      poolGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      poolCtx.fillStyle = poolGradient;
      poolCtx.fillRect(0, 0, 128, 128);
      
      const poolTexture = new this.THREE.CanvasTexture(poolCanvas);
      poolTexture.needsUpdate = true;
      
      const poolMaterial = new this.THREE.MeshBasicMaterial({
        map: poolTexture,
        transparent: true,
        opacity: 0.4,
        toneMapped: false,
        fog: false,
        depthWrite: false,
        blending: this.THREE.AdditiveBlending
      });
      
      lightPool = new this.THREE.Mesh(poolGeometry, poolMaterial);
      lightPool.position.set(x, groundY + 0.01, z); // Slightly above ground
      lightPool.rotation.x = -Math.PI / 2; // Lay flat on ground
      lightPool.name = `firefly_pool_${index}`;
      
      // Add pool to firefly group
      this.fireflyGroup.add(lightPool);
    }

    return {
      mesh,
      light,
      lightPool, // Add the light pool reference
      targetPosition: position.clone(),
      basePosition: position.clone(),
      animationOffset: Math.random() * Math.PI * 2,
      lightCycleTime: Math.random() * this.config.cycleDuration,
      isLightActive: false,
      lightFadeProgress: 0
    };
  }
  
  private initializeLightCycling(): void {
    // Start with lights spread around the scene for dramatic lighting
    const initialActiveCount = Math.min(this.config.maxLights, this.activeLights.length);
    
    // Activate lights in different areas to spread illumination
    for (let i = 0; i < initialActiveCount; i++) {
      // Distribute lights by selecting fireflies from different regions
      const targetIndex = Math.floor((i / initialActiveCount) * this.fireflies.length);
      const firefly = this.fireflies[targetIndex];
      
      if (firefly && firefly.light) {
        firefly.isLightActive = true;
        firefly.lightFadeProgress = 1.0;
        firefly.light.intensity = this.config.lightIntensity;
        // Stagger the cycle times dramatically for wave-like lighting changes
        firefly.lightCycleTime = (i / initialActiveCount) * this.config.cycleDuration * 0.8;
      }
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    this.animationTime += deltaTime;
    this.lightCycleTimer += deltaTime;
    
    this.updateFireflyPositions(deltaTime);
    this.updateLightCycling(deltaTime);
  }
  
  private updateFireflyPositions(deltaTime: number): void {
    const { speed, wanderSpeed, wanderRadius, floatAmplitude, lerpFactor } = this.config.movement;
    
    this.fireflies.forEach((firefly, index) => {
      // More dynamic floating animation with larger movement range
      const offset = firefly.animationOffset + this.animationTime * speed;
      const floatY = Math.sin(offset) * floatAmplitude.y;
      const floatX = Math.cos(offset * 0.7) * floatAmplitude.x;
      const floatZ = Math.sin(offset * 0.5) * floatAmplitude.z;
      
      // Add slow wandering behavior
      const wanderX = Math.sin(this.animationTime * wanderSpeed + index) * wanderRadius;
      const wanderZ = Math.cos(this.animationTime * wanderSpeed + index * 1.3) * wanderRadius;
      
      firefly.targetPosition.copy(firefly.basePosition);
      firefly.targetPosition.x += floatX + wanderX;
      firefly.targetPosition.y += floatY;
      firefly.targetPosition.z += floatZ + wanderZ;
      
      // Smoothly move towards target position
      firefly.mesh.position.lerp(firefly.targetPosition, deltaTime * lerpFactor);
      
      // Update light position if it exists
      if (firefly.light) {
        firefly.light.position.copy(firefly.mesh.position);
      }
    });
  }
  
  private updateLightCycling(deltaTime: number): void {
    // Update each light's fade state with dramatic effects
    this.fireflies.forEach(firefly => {
      if (!firefly.light) return;
      
      firefly.lightCycleTime += deltaTime;
      
      // Enhanced fade in/out with easing for more dramatic effect
      if (firefly.isLightActive) {
        // Smooth ease-in curve for fade in
        firefly.lightFadeProgress = Math.min(1.0, firefly.lightFadeProgress + deltaTime * this.config.fadeSpeed);
        const easedProgress = 1 - Math.pow(1 - firefly.lightFadeProgress, 3); // Cubic ease-in
        firefly.light.intensity = this.config.lightIntensity * easedProgress;
      } else {
        // Sharp fade out for dramatic effect
        firefly.lightFadeProgress = Math.max(0.0, firefly.lightFadeProgress - deltaTime * this.config.fadeSpeed * 1.5);
        const easedProgress = Math.pow(firefly.lightFadeProgress, 2); // Quadratic ease-out
        firefly.light.intensity = this.config.lightIntensity * easedProgress;
      }
    });
    
    // More frequent light cycling for dynamic movement
    if (this.lightCycleTimer >= this.config.cycleDuration / 2) {
      this.cycleMultipleLights(); // Cycle multiple lights at once
      this.lightCycleTimer = 0;
    }
  }
  
  private cycleNextLight(): void {
    // Find current active lights
    const activeLightCount = this.fireflies.filter(f => f.isLightActive).length;
    
    // If we have room for more lights, add one
    if (activeLightCount < this.config.maxLights) {
      this.activateNextLight();
    } else {
      // Replace an existing light
      this.replaceOldestLight();
    }
  }
  
  private cycleMultipleLights(): void {
    // Cycle 2-3 lights at once for more dramatic movement
    const cyclesToPerform = Math.min(3, Math.floor(this.config.maxLights / 4));
    
    for (let i = 0; i < cyclesToPerform; i++) {
      // Find lights that have been active for a while
      const candidatesForDeactivation = this.fireflies.filter(f => 
        f.light && f.isLightActive && f.lightCycleTime > this.config.cycleDuration * 0.3
      );
      
      if (candidatesForDeactivation.length > 0) {
        // Deactivate a random active light
        const randomActive = candidatesForDeactivation[Math.floor(Math.random() * candidatesForDeactivation.length)];
        randomActive.isLightActive = false;
        
        // Activate a light in a different area for spatial distribution
        this.activateLightInDifferentRegion(randomActive);
      }
    }
  }
  
  private activateNextLight(): void {
    // Find next inactive light
    for (let i = 0; i < this.fireflies.length; i++) {
      const firefly = this.fireflies[i];
      if (firefly.light && !firefly.isLightActive) {
        firefly.isLightActive = true;
        firefly.lightCycleTime = 0;
        console.log(`✨ Activating firefly light ${i}`);
        break;
      }
    }
  }
  
  private replaceOldestLight(): void {
    // Find the light that's been active the longest
    let oldestFirefly: FireflyData | null = null;
    let maxCycleTime = 0;
    
    this.fireflies.forEach(firefly => {
      if (firefly.light && firefly.isLightActive && firefly.lightCycleTime > maxCycleTime) {
        maxCycleTime = firefly.lightCycleTime;
        oldestFirefly = firefly;
      }
    });
    
    if (oldestFirefly) {
      // Deactivate oldest light
      oldestFirefly.isLightActive = false;
      
      // Activate a light in a different region for better distribution
      this.activateLightInDifferentRegion(oldestFirefly);
    }
  }
  
  private activateLightInDifferentRegion(deactivatedFirefly: FireflyData): void {
    const inactiveLights = this.fireflies.filter(f => f.light && !f.isLightActive);
    if (inactiveLights.length === 0) return;
    
    // Try to find a firefly that's spatially distant from the deactivated one
    const deactivatedPos = deactivatedFirefly.mesh.position;
    let bestCandidate = inactiveLights[0];
    let maxDistance = 0;
    
    inactiveLights.forEach(firefly => {
      const distance = deactivatedPos.distanceTo(firefly.mesh.position);
      if (distance > maxDistance) {
        maxDistance = distance;
        bestCandidate = firefly;
      }
    });
    
    // If we found a distant candidate, use it; otherwise pick randomly
    const targetFirefly = maxDistance > this.config.radius * 0.3 ? bestCandidate : 
                         inactiveLights[Math.floor(Math.random() * inactiveLights.length)];
    
    targetFirefly.isLightActive = true;
    targetFirefly.lightCycleTime = 0;
    targetFirefly.lightFadeProgress = 0; // Start from completely faded out
  }
  
  /**
   * Update configuration at runtime
   */
  public updateConfig(newConfig: Partial<FireflyConfig>): void {
    Object.assign(this.config, newConfig);
    console.log('🔧 FireflySystem configuration updated');
  }
  
  /**
   * Get current system stats for debugging
   */
  public getStats() {
    const activeLightCount = this.fireflies.filter(f => f.isLightActive).length;
    const totalLightCount = this.fireflies.filter(f => f.light !== null).length;
    
    return {
      totalFireflies: this.fireflies.length,
      activeLights: activeLightCount,
      maxLights: this.config.maxLights,
      totalLights: totalLightCount,
      animationTime: this.animationTime,
      lightCycleTimer: this.lightCycleTimer
    };
  }
  
  /**
   * Set firefly system intensity (for fade in/out effects)
   */
  public setIntensity(intensity: number): void {
    const clampedIntensity = Math.max(0, Math.min(1, intensity));
    
    this.fireflies.forEach(firefly => {
      // Update mesh opacity
      if (firefly.mesh.material instanceof THREE.Material) {
        firefly.mesh.material.opacity = 0.9 * clampedIntensity;
      }
      
      // Update light intensity
      if (firefly.light && firefly.isLightActive) {
        firefly.light.intensity = this.config.lightIntensity * firefly.lightFadeProgress * clampedIntensity;
      }
    });
  }
  
  public dispose(): void {
    console.log('🧹 Disposing FireflySystem...');
    
    // Dispose firefly meshes and materials
    this.fireflies.forEach(firefly => {
      if (firefly.mesh) {
        firefly.mesh.geometry?.dispose();
        if (firefly.mesh.material instanceof THREE.Material) {
          firefly.mesh.material.dispose();
        }
      }
      
      // Remove lights from scene
      if (firefly.light) {
        this.scene.remove(firefly.light);
      }
    });
    
    // Remove group from scene
    this.scene.remove(this.fireflyGroup);
    
    // Clear arrays
    this.fireflies = [];
    this.activeLights = [];
    
    this.isInitialized = false;
    console.log('✅ FireflySystem disposed');
  }
}