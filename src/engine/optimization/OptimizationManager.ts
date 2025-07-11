import * as THREE from 'three';
import { Performance } from '../utils/Performance';
import { ResourceManager } from '../utils/ResourceManager';

/**
 * Global optimization manager that handles frustum culling, distance-based LOD,
 * and asset streaming for the entire game engine.
 * 
 * Integrates with existing Performance, ResourceManager, and AssetLoader systems.
 */
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
  
  // Configuration
  private readonly config = {
    maxRenderDistance: 200,
    unloadDistance: 250,
    preloadDistance: 150,
    lodDistances: [50, 100, 150], // Close, Medium, Far
    checkInterval: 100, // ms between optimization checks
    maxObjectsPerFrame: 50, // Limit processing per frame
    fadeDistance: 30, // Distance over which objects fade in/out
    fadeSpeed: 2.0 // Speed of fade animation (multiplier)
  };
  
  private lastOptimizationCheck = 0;
  private optimizationStats = {
    objectsManaged: 0,
    objectsCulled: 0,
    objectsLoaded: 0,
    objectsUnloaded: 0,
    memoryFreed: 0
  };
  
  private constructor() {}
  
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
    
    console.log('🚀 OptimizationManager initialized');
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
      
      // Skip system objects (cameras, lights, etc.)
      if (object.type === 'Camera' || object.type === 'Light') return;
      
      // Skip level groups and high-level containers
      if (object.name.includes('Level_') || object.name.includes('Group')) return;
      
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
    // Objects with many children (like grass/vegetation instances)
    if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
      return true;
    }
    
    // Groups with vegetation/decoration naming patterns
    if (object.name.match(/(grass|flower|tree|bush|vegetation|decoration)/i)) {
      return true;
    }
    
    // Objects beyond a certain distance from origin (scattered decorations)
    const distance = object.position.length();
    if (distance > 20 && object instanceof THREE.Mesh) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Automatically register an object (used by scene scanning)
   */
  private autoRegisterObject(object: THREE.Object3D): void {
    const id = this.generateObjectId(object);
    const type = this.inferObjectType(object);
    const priority = this.inferObjectPriority(object);
    
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
    
    // Check if object is within frustum
    const isInFrustum = this.frustum.intersectsObject(object);
    
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
    if (managedObject.isLoaded && !shouldBeLoaded && managedObject.currentOpacity <= 0.01) {
      this.unloadObject(managedObject);
    } else if (!managedObject.isLoaded && shouldBeLoaded && distance <= this.config.preloadDistance) {
      this.loadObject(managedObject);
    }
    
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
    // Only log detailed stats occasionally to avoid console spam
    if (Date.now() % 10000 < this.config.checkInterval) {
      const stats = {
        ...this.optimizationStats,
        managedObjectsCount: this.managedObjects.size,
        visibleObjectsCount: Array.from(this.managedObjects.values())
          .filter(mo => mo.isVisible).length,
        loadedObjectsCount: Array.from(this.managedObjects.values())
          .filter(mo => mo.isLoaded).length
      };
      
      console.log('📊 OptimizationManager Stats:', stats);
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