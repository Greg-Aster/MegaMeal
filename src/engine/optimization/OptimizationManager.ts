import * as THREE from 'three';
import { Performance } from '../utils/Performance';
import { ResourceManager } from '../utils/ResourceManager';

/**
 * Global optimization manager that handles frustum culling, distance-based LOD,
 * device-specific optimizations, and asset streaming for the entire game engine.
 * 
 * Integrates with existing Performance, ResourceManager, and AssetLoader systems.
 * Automatically detects mobile devices and applies appropriate optimization profiles.
 */

// Quality levels for different device types
export enum OptimizationLevel {
  MOBILE_LOW = 'mobile_low',
  MOBILE_MEDIUM = 'mobile_medium', 
  MOBILE_HIGH = 'mobile_high',
  DESKTOP_MEDIUM = 'desktop_medium',
  DESKTOP_HIGH = 'desktop_high'
}

interface OptimizationConfig {
  maxRenderDistance: number;
  unloadDistance: number;
  preloadDistance: number;
  lodDistances: number[];
  checkInterval: number;
  maxObjectsPerFrame: number;
  fadeDistance: number;
  fadeSpeed: number;
}

interface DeviceCapabilities {
  isMobile: boolean;
  isLowEnd: boolean;
  screenSize: { width: number; height: number };
  pixelRatio: number;
  estimatedGPUTier: 'low' | 'medium' | 'high';
  supportsWebGL2: boolean;
}
export class OptimizationManager {
  private static instance: OptimizationManager | null = null;
  
  private camera: THREE.Camera | null = null;
  private scene: THREE.Scene | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  
  // Culling system
  private frustum: THREE.Frustum = new THREE.Frustum();
  private cameraMatrix: THREE.Matrix4 = new THREE.Matrix4();
  
  // Distance-based management
  private managedObjects: Map<string, ManagedObject> = new Map();
  private objectsToCheck: THREE.Object3D[] = [];
  
  // Device capabilities and optimization level
  private deviceCapabilities: DeviceCapabilities | null = null;
  private currentOptimizationLevel: OptimizationLevel = OptimizationLevel.DESKTOP_HIGH;
  
  // Configuration profiles for different optimization levels
  private readonly configProfiles: Record<OptimizationLevel, OptimizationConfig> = {
    [OptimizationLevel.MOBILE_LOW]: {
      maxRenderDistance: 50,
      unloadDistance: 60,
      preloadDistance: 40,
      lodDistances: [15, 25, 35],
      checkInterval: 200,
      maxObjectsPerFrame: 10,
      fadeDistance: 10,
      fadeSpeed: 3.0
    },
    [OptimizationLevel.MOBILE_MEDIUM]: {
      maxRenderDistance: 100,
      unloadDistance: 120,
      preloadDistance: 80,
      lodDistances: [25, 50, 75],
      checkInterval: 150,
      maxObjectsPerFrame: 20,
      fadeDistance: 15,
      fadeSpeed: 2.5
    },
    [OptimizationLevel.MOBILE_HIGH]: {
      maxRenderDistance: 150,
      unloadDistance: 180,
      preloadDistance: 120,
      lodDistances: [40, 80, 120],
      checkInterval: 120,
      maxObjectsPerFrame: 30,
      fadeDistance: 20,
      fadeSpeed: 2.0
    },
    [OptimizationLevel.DESKTOP_MEDIUM]: {
      maxRenderDistance: 200,
      unloadDistance: 250,
      preloadDistance: 150,
      lodDistances: [50, 100, 150],
      checkInterval: 100,
      maxObjectsPerFrame: 40,
      fadeDistance: 25,
      fadeSpeed: 2.0
    },
    [OptimizationLevel.DESKTOP_HIGH]: {
      maxRenderDistance: 300,
      unloadDistance: 350,
      preloadDistance: 250,
      lodDistances: [75, 150, 225],
      checkInterval: 80,
      maxObjectsPerFrame: 50,
      fadeDistance: 30,
      fadeSpeed: 1.5
    }
  };
  
  // Current active configuration
  private config: OptimizationConfig;
  
  private lastOptimizationCheck = 0;
  private optimizationStats = {
    objectsManaged: 0,
    objectsCulled: 0,
    objectsLoaded: 0,
    objectsUnloaded: 0,
    memoryFreed: 0
  };
  
  private constructor() {
    // Initialize with desktop high quality by default
    this.config = this.configProfiles[OptimizationLevel.DESKTOP_HIGH];
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): OptimizationManager {
    if (!OptimizationManager.instance) {
      OptimizationManager.instance = new OptimizationManager();
    }
    return OptimizationManager.instance;
  }
  
  /**
   * Initialize the optimization system with core engine components
   */
  public initialize(camera: THREE.Camera, scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    
    // Detect device capabilities and set appropriate optimization level
    this.detectDeviceCapabilities();
    this.autoSetOptimizationLevel();
    
    console.log('🚀 OptimizationManager initialized with level:', this.currentOptimizationLevel);
  }

  /**
   * Detect device capabilities for optimization decisions
   */
  private detectDeviceCapabilities(): void {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Estimate GPU tier based on device characteristics
    let estimatedGPUTier: 'low' | 'medium' | 'high' = 'medium';
    
    if (isMobile) {
      // Mobile GPU estimation based on screen resolution and pixel ratio
      const totalPixels = screenWidth * screenHeight * pixelRatio;
      if (totalPixels < 2000000) { // Lower resolution mobile devices
        estimatedGPUTier = 'low';
      } else if (totalPixels > 4000000) { // High-end mobile devices
        estimatedGPUTier = 'high';
      }
    } else {
      // Desktop typically has better GPUs
      estimatedGPUTier = 'high';
    }
    
    // Check for WebGL2 support
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    const supportsWebGL2 = !!gl2;
    
    // Detect low-end devices
    const isLowEnd = isMobile && (
      screenWidth < 1080 || 
      pixelRatio < 2 || 
      estimatedGPUTier === 'low' ||
      navigator.hardwareConcurrency < 4
    );
    
    this.deviceCapabilities = {
      isMobile,
      isLowEnd,
      screenSize: { width: screenWidth, height: screenHeight },
      pixelRatio,
      estimatedGPUTier,
      supportsWebGL2
    };
    
    console.log('📱 Device capabilities detected:', this.deviceCapabilities);
  }

  /**
   * Automatically set optimization level based on device capabilities
   */
  private autoSetOptimizationLevel(): void {
    if (!this.deviceCapabilities) return;
    
    const { isMobile, isLowEnd, estimatedGPUTier } = this.deviceCapabilities;
    
    if (isMobile) {
      if (isLowEnd || estimatedGPUTier === 'low') {
        this.setOptimizationLevel(OptimizationLevel.MOBILE_LOW);
      } else if (estimatedGPUTier === 'high') {
        this.setOptimizationLevel(OptimizationLevel.MOBILE_HIGH);
      } else {
        this.setOptimizationLevel(OptimizationLevel.MOBILE_MEDIUM);
      }
    } else {
      // Desktop - could add more sophisticated detection here
      this.setOptimizationLevel(OptimizationLevel.DESKTOP_HIGH);
    }
  }

  /**
   * Set the optimization level and apply corresponding configuration
   */
  public setOptimizationLevel(level: OptimizationLevel): void {
    this.currentOptimizationLevel = level;
    this.config = this.configProfiles[level];
    
    console.log(`🎛️ Optimization level set to: ${level}`, this.config);
    
    // Emit event for other systems to react to quality changes
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('optimizationLevelChanged', { 
        detail: { level, config: this.config, deviceCapabilities: this.deviceCapabilities }
      }));
    }
  }

  /**
   * Get current optimization level
   */
  public getOptimizationLevel(): OptimizationLevel {
    return this.currentOptimizationLevel;
  }

  /**
   * Get device capabilities
   */
  public getDeviceCapabilities(): DeviceCapabilities | null {
    return this.deviceCapabilities;
  }

  /**
   * Get current optimization configuration
   */
  public getOptimizationConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Get optimization statistics for debugging
   */
  public getOptimizationStats() {
    return {
      ...this.optimizationStats,
      managedObjectsCount: this.managedObjects.size,
      objectsToCheckCount: this.objectsToCheck.length,
      currentOptimizationLevel: this.currentOptimizationLevel,
      managedObjectsList: Array.from(this.managedObjects.values()).map(obj => ({
        name: obj.object.name,
        type: obj.type,
        priority: obj.priority,
        isVisible: obj.isVisible,
        currentOpacity: obj.currentOpacity,
        distanceToCamera: obj.distanceToCamera
      }))
    };
  }

  /**
   * Disable optimization system (for debugging)
   */
  public disableOptimization(): void {
    console.log('🚫 Disabling optimization system for debugging');
    
    // Make all managed objects fully visible
    this.managedObjects.forEach(managedObject => {
      managedObject.object.visible = true;
      if (managedObject.object instanceof THREE.Mesh && managedObject.object.material) {
        const material = managedObject.object.material as THREE.Material;
        if ('opacity' in material) {
          material.opacity = 1.0;
          material.transparent = false;
        }
      }
      managedObject.currentOpacity = 1.0;
      managedObject.isVisible = true;
    });
    
    // Clear managed objects
    this.managedObjects.clear();
    this.objectsToCheck = [];
  }

  /**
   * Enable optimization system
   */
  public enableOptimization(): void {
    console.log('✅ Enabling optimization system');
    // Optimization will resume on next update cycle
  }
  
  /**
   * Automatically scan scene for objects that need optimization
   * This is called automatically - no manual registration needed
   */
  private scanSceneForOptimization(): void {
    if (!this.scene) return;
    
    // Find all objects that match optimization criteria
    this.scene.traverse((object) => {
      // Skip if already managed
      if (this.objectsToCheck.includes(object)) return;
      
      // NEVER scan lighting objects - they are essential for scene visibility
      if (object instanceof THREE.Light || 
          object instanceof THREE.DirectionalLight || 
          object instanceof THREE.AmbientLight ||
          object instanceof THREE.PointLight ||
          object instanceof THREE.SpotLight ||
          object.isLight ||
          object.type === 'Light') {
        return;
      }
      
      // Skip system objects (cameras, etc.)
      if (object.type === 'Camera') return;
      
      // Skip level groups and high-level containers
      if (object.name.includes('Level_') || object.name.includes('Group')) return;
      
      // NEVER optimize essential objects - double check here
      if (this.isEssentialObject(object)) {
        return;
      }
      
      // Include vegetation, decorations, and similar objects
      if (this.shouldOptimizeObject(object)) {
        this.autoRegisterObject(object);
      }
    });
  }
  
  /**
   * Determine if an object should be optimized
   */
  private shouldOptimizeObject(object: THREE.Object3D): boolean {
    // NEVER optimize lighting objects - critical for scene visibility
    if (object instanceof THREE.Light || 
        object instanceof THREE.DirectionalLight || 
        object instanceof THREE.AmbientLight ||
        object instanceof THREE.PointLight ||
        object instanceof THREE.SpotLight ||
        object.type === 'Light') {
      return false;
    }
    
    // NEVER optimize essential game objects
    if (this.isEssentialObject(object)) {
      return false;
    }
    
    // OPTIMIZE ALL OTHER OBJECTS - this is the key change
    // Only exclude cameras and other system objects
    if (object instanceof THREE.Camera) {
      return false;
    }
    
    // Optimize all meshes, groups, and other renderable objects
    if (object instanceof THREE.Mesh || 
        object instanceof THREE.Group || 
        object instanceof THREE.Points ||
        object instanceof THREE.Line ||
        object instanceof THREE.Sprite) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if an object is essential and should never be optimized
   */
  private isEssentialObject(object: THREE.Object3D): boolean {
    const name = object.name.toLowerCase();
    
    // NEVER optimize lighting objects - this is critical for scene visibility
    if (object instanceof THREE.Light || 
        object instanceof THREE.DirectionalLight || 
        object instanceof THREE.AmbientLight ||
        object instanceof THREE.PointLight ||
        object instanceof THREE.SpotLight ||
        name.match(/(light|lamp|sun|moon|ambient|directional|point|spot)/i)) {
      return true;
    }
    
    // NEVER optimize Groups that contain lights - this is the core fix
    if (object instanceof THREE.Group) {
      let containsLights = false;
      object.traverse((child) => {
        if (child instanceof THREE.Light || 
            child instanceof THREE.DirectionalLight || 
            child instanceof THREE.AmbientLight ||
            child instanceof THREE.PointLight ||
            child instanceof THREE.SpotLight) {
          containsLights = true;
        }
      });
      if (containsLights) {
        return true;
      }
    }
    
    // NEVER optimize fireflies - they provide essential lighting
    if (name.match(/fireflies/i) || name.match(/firefly/i)) {
      return true;
    }
    
    // Essential terrain and environment objects
    if (name.match(/(ground|terrain|floor|base|platform|skybox|sky|water|pool)/i)) {
      return true;
    }
    
    // Essential structural objects
    if (name.match(/(wall|building|structure|foundation|observatory|main)/i)) {
      return true;
    }
    
    // Level containers and main groups
    if (name.match(/(level|group|container|scene|root)/i)) {
      return true;
    }
    
    // Camera and control objects
    if (object instanceof THREE.Camera || name.match(/(camera|control|helper)/i)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if a mesh is a small decoration that can be optimized
   */
  private isDecorationMesh(object: THREE.Mesh): boolean {
    const name = object.name.toLowerCase();
    
    // NEVER optimize essential objects, even if they're meshes
    if (name.match(/(ground|terrain|floor|water|main|base|primary|skybox|sky)/i)) {
      return false;
    }
    
    // Get bounding box to check object size
    const bbox = new THREE.Box3().setFromObject(object);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    // Don't optimize very large objects (likely terrain/buildings)
    if (maxDimension > 50) {
      return false;
    }
    
    // Include known decoration patterns
    if (name.match(/(prop|decoration|ornament|detail|small|rock|stone|tree|bush|flower|grass)/i)) {
      return true;
    }
    
    // For unnamed or generically named objects, optimize them if they're small-medium size
    if (maxDimension < 30) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Automatically register an object (used by scene scanning)
   */
  private autoRegisterObject(object: THREE.Object3D): void {
    // FINAL SAFETY CHECK - NEVER register lighting objects
    if (object instanceof THREE.Light || 
        object instanceof THREE.DirectionalLight || 
        object instanceof THREE.AmbientLight ||
        object instanceof THREE.PointLight ||
        object instanceof THREE.SpotLight ||
        object.isLight ||
        object.type === 'Light') {
      console.warn(`🚨 Attempted to register lighting object for optimization: "${object.name}" - BLOCKED`);
      return;
    }
    
    const id = this.generateObjectId(object);
    const type = this.inferObjectType(object);
    const priority = this.inferObjectPriority(object);
    
    // Debug logging disabled - system is working properly
    // if (this.deviceCapabilities?.isMobile) {
    //   console.log(`🎛️ Registering object for optimization: "${object.name}" (${object.constructor.name}) - Type: ${type}, Priority: ${priority}`);
    // }
    
    const managedObject: ManagedObject = {
      object,
      id,
      type,
      priority,
      isLoaded: true,
      isVisible: true,
      distanceToCamera: 0,
      currentLOD: 0,
      lastUpdateTime: Date.now()
    };
    
    this.managedObjects.set(id, managedObject);
    this.objectsToCheck.push(object);
    this.optimizationStats.objectsManaged++;
  }
  
  /**
   * Generate a unique ID for an object
   */
  private generateObjectId(object: THREE.Object3D): string {
    const type = this.inferObjectType(object);
    const uuid = object.uuid.slice(0, 8);
    return `${type}_${uuid}`;
  }
  
  /**
   * Infer object type from name/properties
   */
  private inferObjectType(object: THREE.Object3D): 'vegetation' | 'decoration' | 'structure' | 'effect' {
    const name = object.name.toLowerCase();
    
    if (name.match(/(grass|tree|bush|flower|plant)/)) {
      return 'vegetation';
    }
    
    if (name.match(/(decoration|ornament|prop)/)) {
      return 'decoration';
    }
    
    if (name.match(/(building|structure|wall|platform)/)) {
      return 'structure';
    }
    
    if (name.match(/(particle|effect|glow|light)/)) {
      return 'effect';
    }
    
    // Default based on object properties
    if (object instanceof THREE.Points) {
      return 'effect';
    }
    
    return 'decoration';
  }
  
  /**
   * Infer object priority from size/distance
   */
  private inferObjectPriority(object: THREE.Object3D): 'low' | 'medium' | 'high' {
    const distance = object.position.length();
    
    if (distance < 50) {
      return 'high';
    } else if (distance < 100) {
      return 'medium';
    } else {
      return 'low';
    }
  }
  
  /**
   * Unregister an object from optimization management
   */
  public unregisterObject(id: string): void {
    const managedObject = this.managedObjects.get(id);
    if (managedObject) {
      // Remove from check list
      const index = this.objectsToCheck.indexOf(managedObject.object);
      if (index > -1) {
        this.objectsToCheck.splice(index, 1);
      }
      
      // Clean up if needed
      if (managedObject.unloadCallback) {
        managedObject.unloadCallback();
      }
      
      this.managedObjects.delete(id);
      this.optimizationStats.objectsManaged--;
      
      console.log(`🗑️ Unregistered object from optimization: ${id}`);
    }
  }
  
  /**
   * Main optimization update loop - call this every frame
   */
  public update(deltaTime: number): void {
    if (!this.camera || !this.scene) return;
    
    const now = Date.now();
    
    // Only run optimization checks at intervals to avoid performance impact
    if (now - this.lastOptimizationCheck < this.config.checkInterval) {
      return;
    }
    
    this.lastOptimizationCheck = now;
    
    // Periodically scan for new objects to optimize (every 5 seconds)
    if (now % 5000 < this.config.checkInterval) {
      this.scanSceneForOptimization();
    }
    
    // Update frustum for culling
    this.updateFrustum();
    
    // Process objects in batches to avoid frame drops
    const objectsToProcess = Math.min(this.config.maxObjectsPerFrame, this.objectsToCheck.length);
    
    for (let i = 0; i < objectsToProcess; i++) {
      const object = this.objectsToCheck[i];
      this.optimizeObject(object);
    }
    
    // Report performance metrics
    this.reportOptimizationStats();
  }
  
  /**
   * Update camera frustum for culling calculations
   */
  private updateFrustum(): void {
    if (!this.camera || !this.renderer) return;
    
    this.cameraMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);
  }
  
  /**
   * Optimize a single object based on distance and visibility
   */
  private optimizeObject(object: THREE.Object3D): void {
    if (!this.camera) return;
    
    // Find the managed object data
    const managedObject = Array.from(this.managedObjects.values())
      .find(mo => mo.object === object);
    
    if (!managedObject) return;
    
    // Calculate distance to camera
    const distance = this.camera.position.distanceTo(object.position);
    managedObject.distanceToCamera = distance;
    
    // Check if object is within frustum - with safety check for invalid geometry
    let isInFrustum = true; // Default to visible if we can't check
    try {
      // Only check frustum if object has valid geometry/boundingSphere
      if (object.geometry && object.geometry.boundingSphere) {
        isInFrustum = this.frustum.intersectsObject(object);
      } else if (object instanceof THREE.Group && object.children.length > 0) {
        // For groups, check if any children are in frustum
        isInFrustum = this.frustum.intersectsObject(object);
      }
    } catch (error) {
      // If frustum check fails, assume object is visible to be safe
      console.warn('Frustum check failed for object:', object.name || 'unnamed', error);
      isInFrustum = true;
    }
    
    // Make optimization decisions
    this.applyOptimization(managedObject, distance, isInFrustum);
  }
  
  /**
   * Apply optimization decisions to an object with smooth fading
   */
  private applyOptimization(
    managedObject: ManagedObject,
    distance: number,
    isInFrustum: boolean
  ): void {
    const shouldBeVisible = isInFrustum && distance <= this.config.maxRenderDistance;
    const shouldBeLoaded = distance <= this.config.unloadDistance;
    
    // Calculate fade factor based on distance
    const fadeStartDistance = this.config.maxRenderDistance - this.config.fadeDistance;
    const fadeEndDistance = this.config.maxRenderDistance;
    
    let targetOpacity = 1.0;
    
    if (distance > fadeStartDistance && distance <= fadeEndDistance) {
      // Fade out as object gets farther
      const fadeProgress = (distance - fadeStartDistance) / this.config.fadeDistance;
      targetOpacity = Math.max(0, 1.0 - fadeProgress);
    } else if (distance > fadeEndDistance) {
      targetOpacity = 0.0;
    }
    
    // Apply smooth fading instead of abrupt visibility changes
    this.applySmoothFade(managedObject, targetOpacity, shouldBeVisible);
    
    // Handle distance-based unloading (only when fully faded)
    // DISABLED: Don't actually unload objects since they don't have proper reload callbacks
    // This prevents the issue where objects fade away and don't come back
    // if (managedObject.isLoaded && !shouldBeLoaded && managedObject.currentOpacity <= 0.01) {
    //   this.unloadObject(managedObject);
    // } else if (!managedObject.isLoaded && shouldBeLoaded && distance <= this.config.preloadDistance) {
    //   this.loadObject(managedObject);
    // }
    
    // Handle LOD switching
    if (managedObject.lodVariants && managedObject.lodVariants.length > 0) {
      this.updateLOD(managedObject, distance);
    }
  }
  
  /**
   * Apply smooth fade transition to an object
   */
  private applySmoothFade(managedObject: ManagedObject, targetOpacity: number, shouldBeVisible: boolean): void {
    // Initialize opacity if not set
    if (managedObject.currentOpacity === undefined) {
      managedObject.currentOpacity = managedObject.object.visible ? 1.0 : 0.0;
    }
    
    // Debug logging for mobile optimization issues
    if (this.deviceCapabilities?.isMobile && targetOpacity < 0.5) {
      console.log(`🌫️ Fading object: "${managedObject.object.name}" to opacity ${targetOpacity.toFixed(2)}`);
    }
    
    // Smoothly interpolate to target opacity
    const opacityDelta = (targetOpacity - managedObject.currentOpacity) * this.config.fadeSpeed * 0.016; // Assume 60fps
    managedObject.currentOpacity += opacityDelta;
    
    // Clamp opacity
    managedObject.currentOpacity = Math.max(0, Math.min(1, managedObject.currentOpacity));
    
    // Update object visibility and opacity
    const isVisible = managedObject.currentOpacity > 0.01;
    managedObject.object.visible = isVisible;
    managedObject.isVisible = isVisible;
    
    // Apply opacity to all materials in the object
    this.applyOpacityToObject(managedObject.object, managedObject.currentOpacity);
    
    // Update stats
    if (isVisible && !managedObject.wasVisible) {
      this.optimizationStats.objectsLoaded++;
    } else if (!isVisible && managedObject.wasVisible) {
      this.optimizationStats.objectsCulled++;
    }
    
    managedObject.wasVisible = isVisible;
  }
  
  /**
   * Apply opacity to all materials in an object hierarchy
   */
  private applyOpacityToObject(object: THREE.Object3D, opacity: number): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((material) => {
          if (material) {
            // Store original opacity if not stored
            if (material.userData.originalOpacity === undefined) {
              material.userData.originalOpacity = material.opacity || 1.0;
            }
            
            // Apply faded opacity
            material.transparent = opacity < 1.0;
            material.opacity = material.userData.originalOpacity * opacity;
            material.needsUpdate = true;
          }
        });
      }
    });
  }
  
  /**
   * Unload an object to free memory (uses existing ResourceManager)
   */
  private unloadObject(managedObject: ManagedObject): void {
    if (managedObject.unloadCallback) {
      managedObject.unloadCallback();
    }
    
    // Remove from scene
    if (managedObject.object.parent) {
      managedObject.object.parent.remove(managedObject.object);
    }
    
    // Use existing ResourceManager for disposal
    ResourceManager.disposeObject3D(managedObject.object);
    
    managedObject.isLoaded = false;
    this.optimizationStats.objectsUnloaded++;
    this.optimizationStats.memoryFreed++;
    
    console.log(`🗑️ Unloaded object: ${managedObject.id}`);
  }
  
  /**
   * Load an object back into the scene
   */
  private async loadObject(managedObject: ManagedObject): Promise<void> {
    if (managedObject.loadCallback) {
      try {
        await managedObject.loadCallback();
        managedObject.isLoaded = true;
        this.optimizationStats.objectsLoaded++;
        
        console.log(`📦 Loaded object: ${managedObject.id}`);
      } catch (error) {
        console.error(`Failed to load object ${managedObject.id}:`, error);
      }
    }
  }
  
  /**
   * Update LOD based on distance
   */
  private updateLOD(managedObject: ManagedObject, distance: number): void {
    if (!managedObject.lodVariants) return;
    
    let newLOD = 0;
    
    // Determine LOD level based on distance
    for (let i = 0; i < this.config.lodDistances.length; i++) {
      if (distance > this.config.lodDistances[i]) {
        newLOD = i + 1;
      }
    }
    
    // Clamp to available LOD variants
    newLOD = Math.min(newLOD, managedObject.lodVariants.length - 1);
    
    // Switch LOD if needed
    if (managedObject.currentLOD !== newLOD) {
      // Hide current LOD
      if (managedObject.lodVariants[managedObject.currentLOD]) {
        managedObject.lodVariants[managedObject.currentLOD].visible = false;
      }
      
      // Show new LOD
      if (managedObject.lodVariants[newLOD]) {
        managedObject.lodVariants[newLOD].visible = true;
      }
      
      managedObject.currentLOD = newLOD;
      
      console.log(`🔄 LOD switch for ${managedObject.id}: Level ${newLOD}`);
    }
  }
  
  /**
   * Report optimization statistics
   */
  private reportOptimizationStats(): void {
    // Only log detailed stats very rarely to avoid console spam
    if (Date.now() % 30000 < this.config.checkInterval) {
      const stats = {
        ...this.optimizationStats,
        managedObjectsCount: this.managedObjects.size,
        visibleObjectsCount: Array.from(this.managedObjects.values())
          .filter(mo => mo.isVisible).length,
        loadedObjectsCount: Array.from(this.managedObjects.values())
          .filter(mo => mo.isLoaded).length
      };
      
      // Only log if there are significant changes or first time
      if (this.managedObjects.size > 0) {
        console.log('📊 OptimizationManager Stats:', stats);
      }
    }
  }
  
  /**
   * Get current optimization statistics
   */
  public getStats(): any {
    return {
      ...this.optimizationStats,
      managedObjectsCount: this.managedObjects.size,
      config: this.config
    };
  }
  
  /**
   * Update optimization configuration
   */
  public updateConfig(newConfig: Partial<typeof this.config>): void {
    Object.assign(this.config, newConfig);
    console.log('🔧 OptimizationManager configuration updated');
  }
  
  /**
   * Clean up resources (integrates with existing cleanup systems)
   */
  public dispose(): void {
    // Restore original opacities before disposal
    this.managedObjects.forEach((managedObject) => {
      this.restoreOriginalOpacity(managedObject.object);
      
      if (managedObject.object.parent) {
        managedObject.object.parent.remove(managedObject.object);
      }
      ResourceManager.disposeObject3D(managedObject.object);
    });
    
    this.managedObjects.clear();
    this.objectsToCheck = [];
    
    console.log('🧹 OptimizationManager disposed');
  }
  
  /**
   * Restore original opacity to an object's materials
   */
  private restoreOriginalOpacity(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((material) => {
          if (material && material.userData.originalOpacity !== undefined) {
            material.opacity = material.userData.originalOpacity;
            material.transparent = material.userData.originalOpacity < 1.0;
            material.needsUpdate = true;
            delete material.userData.originalOpacity;
          }
        });
      }
    });
  }
}

/**
 * Interface for managed objects
 */
interface ManagedObject {
  object: THREE.Object3D;
  id: string;
  type: 'vegetation' | 'decoration' | 'structure' | 'effect';
  priority: 'low' | 'medium' | 'high';
  lodVariants?: THREE.Object3D[];
  loadCallback?: () => Promise<void>;
  unloadCallback?: () => void;
  isLoaded: boolean;
  isVisible: boolean;
  distanceToCamera: number;
  currentLOD: number;
  lastUpdateTime: number;
  currentOpacity?: number;
  wasVisible?: boolean;
}

/**
 * Global optimization manager instance
 */
export const optimizationManager = OptimizationManager.getInstance();