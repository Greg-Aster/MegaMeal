import * as THREE from 'three';
import { GameObject } from '../../engine/core/GameObject';
import { AssetLoader } from '../../engine/resources/AssetLoader';
import { PhysicsWorld } from '../../engine/physics/PhysicsWorld';
import { Engine } from '../../engine/core/Engine';
import { InteractionSystem } from '../../engine/systems/InteractionSystem';
import { ErrorHandler } from '../../engine/utils/ErrorHandler';
import { MovementComponent } from '../../engine/components/MovementComponent';
import type { LevelMovementConfig } from '../../engine/components/MovementTypes';
import { PhysicsComponent } from '../../engine/components/PhysicsComponent';
import { ResourceManager } from '../../engine/utils/ResourceManager';
import { DisposableManager } from '../../engine/interfaces/IDisposable';

/**
 * Abstract base class for all game levels
 * Provides common level functionality and enforces consistent patterns
 */
export abstract class BaseLevel extends GameObject {
  protected scene: THREE.Scene;
  protected physicsWorld: PhysicsWorld | null;
  protected camera: THREE.PerspectiveCamera;
  protected gameContainer: HTMLElement;
  protected assetLoader: AssetLoader;
  protected engine: Engine;
  protected interactionSystem: InteractionSystem;
  
  // Level-specific container for all level objects
  protected levelGroup: THREE.Group;
  
  // Common level properties
  protected levelId: string;
  protected levelName: string;
  protected levelDescription: string;
  
  // New unified component system
  protected movementComponent: MovementComponent | null = null;
  protected physicsComponent: PhysicsComponent | null = null;
  
  // Centralized disposal management
  protected disposableManager: DisposableManager = new DisposableManager();
  
  
  constructor(
    engine: Engine,
    interactionSystem: InteractionSystem,
    levelId: string,
    levelName: string,
    levelDescription: string = ''
  ) {
    super();
    
    this.engine = engine;
    this.scene = engine.getScene();
    this.physicsWorld = engine.getPhysicsWorld();
    this.camera = engine.getCamera();
    this.gameContainer = engine.getContainer();
    this.assetLoader = engine.getAssetLoader();
    this.interactionSystem = interactionSystem;
    
    this.levelId = levelId;
    this.levelName = levelName;
    this.levelDescription = levelDescription;
    
    // Create level group for organization
    this.levelGroup = new THREE.Group();
    this.levelGroup.name = `Level_${levelId}`;
  }
  
  /**
   * Initialize the level
   * Template method that calls abstract methods in correct order
   */
  public async initialize(): Promise<void> {
    const safeInitialize = ErrorHandler.wrapAsync(async () => {
      this.validateNotDisposed();
      
      if (this.isInitialized) {
        console.warn(`Level ${this.levelId} is already initialized`);
        return;
      }
      
      console.log(`🎮 Initializing level: ${this.levelName}`);
      
      // Add level group to scene
      this.scene.add(this.levelGroup);
      
      // Initialize level in proper order
      await this.createEnvironment();
      await this.createLighting();
      await this.createInteractions();
      await this.setupPhysics();
      
      // Initialize new component system
      await this.initializeComponents();
      
      await this.onLevelReady();
      
      this.markInitialized();
      console.log(`✅ Level ${this.levelName} initialized successfully`);
      
    }, { component: 'Level', operation: 'initialize', details: { levelId: this.levelId } });
    
    try {
      await safeInitialize();
    } catch (error) {
      console.error(`❌ Failed to initialize level ${this.levelName}:`, error);
      // Clean up on failure
      this.dispose();
      throw error;
    }
  }
  
  /**
   * Update the level each frame
   */
  public update(deltaTime: number): void {
    if (!this.isInitialized || !this.isActive) return;
    
    const safeUpdate = ErrorHandler.wrapSync(
      () => {
        // Update unified movement component
        if (this.movementComponent) {
          this.movementComponent.update(deltaTime, this.levelGroup);
        }
        
        // Update level-specific logic
        this.updateLevel(deltaTime);
      },
      { component: 'Level', operation: 'update', details: { levelId: this.levelId } }
    );
    
    safeUpdate();
  }
  
  /**
   * Dispose of the level and clean up all resources
   */
  public dispose(): void {
    if (this.isDisposed) return;
    
    console.log(`🧹 Disposing level: ${this.levelName}`);
    
    try {
      // Dispose components first
      this.disposeComponents();
      
      // Call level-specific cleanup
      this.onDispose();
      
      // Clean up level group and all its children using ResourceManager
      if (this.levelGroup) {
        console.log(`🧹 Disposing level group for: ${this.levelName}`);
        ResourceManager.disposeGroup(this.levelGroup);
        this.scene.remove(this.levelGroup);
      }
      
      // Dispose of all registered disposables
      this.disposableManager.dispose();
      
      this.markDisposed();
      console.log(`✅ Level ${this.levelName} disposed successfully`);
      
    } catch (error) {
      console.error(`❌ Error disposing level ${this.levelName}:`, error);
      // Still mark as disposed to prevent further use
      this.markDisposed();
    }
  }
  
  /**
   * Register a disposable object for automatic cleanup
   */
  public registerDisposable(disposable: any): void {
    this.disposableManager.registerDisposable(disposable);
  }
  
  /**
   * Unregister a disposable object
   */
  public unregisterDisposable(disposable: any): void {
    this.disposableManager.unregisterDisposable(disposable);
  }
  
  // Abstract methods that must be implemented by subclasses
  
  /**
   * Create the level environment (terrain, skybox, etc.)
   * Must be implemented by subclasses
   */
  protected abstract createEnvironment(): Promise<void>;
  
  /**
   * Set up lighting for the level
   * Must be implemented by subclasses
   */
  protected abstract createLighting(): Promise<void>;
  
  /**
   * Set up interactions for the level
   * Must be implemented by subclasses
   */
  protected abstract createInteractions(): Promise<void>;
  
  /**
   * Update level-specific logic each frame
   * Must be implemented by subclasses
   */
  protected abstract updateLevel(deltaTime: number): void;
  
  // Optional methods that can be overridden
  
  /**
   * Set up physics for the level
   * Can be overridden by subclasses if needed
   */
  protected async setupPhysics(): Promise<void> {
    // Default implementation - can be overridden
  }
  
  /**
   * Initialize the new component system
   */
  private async initializeComponents(): Promise<void> {
    console.log(`🔧 Initializing components for level: ${this.levelId}`);
    
    // Initialize physics component
    this.physicsComponent = new PhysicsComponent(this.physicsWorld, this.levelId);
    
    // Always use auto-physics generation
    //await this.physicsComponent.autoGeneratePhysics(this.levelGroup);
    
    // Initialize movement component
    this.movementComponent = new MovementComponent(
      this.camera,
      this.engine.getEventBus(),
      this.engine.getInputManager(),
      this.physicsWorld
    );
    
    await this.movementComponent.initialize();
    
    // Components will be registered as disposables once they implement IDisposable
    // TODO: Update components to implement IDisposable interface
    
    // Get level-specific movement config and pass it to the component
    const movementConfig = this.getMovementConfiguration();
    this.movementComponent.setCurrentLevel(this.levelId, this.levelGroup, movementConfig);
    
    console.log(`✅ Components initialized for level: ${this.levelId}`);
  }
  
  
  /**
   * Dispose of components
   */
  private disposeComponents(): void {
    console.log(`🧹 Disposing components for level: ${this.levelId}`);
    
    // Manual disposal for components that don't yet implement IDisposable
    if (this.movementComponent) {
      this.movementComponent.dispose();
      this.movementComponent = null;
    }
    
    if (this.physicsComponent) {
      this.physicsComponent.dispose();
      this.physicsComponent = null;
    }
    
    console.log(`✅ Components disposed for level: ${this.levelId}`);
  }
  
  /**
   * Called when level is ready (after all initialization)
   * Can be overridden by subclasses for final setup
   */
  protected async onLevelReady(): Promise<void> {
    // Default implementation - can be overridden
  }
  
  /**
   * Automatic cleanup system - called when leaving a level
   * Clears UI state, selected objects, etc.
   */
  public performLevelCleanup(): void {
    console.log(`🧹 Performing automatic cleanup for level: ${this.levelName}`);
    
    // CRITICAL: Global scene cleanup - prevents cross-level contamination
    this.clearGlobalSceneState();
    
    // Get EventBus from engine
    const eventBus = this.engine.getEventBus();
    
    // Clear any UI state through EventBus
    eventBus.emit('level.cleanup', { 
      levelId: this.levelId,
      levelName: this.levelName 
    });
    
    // Clear any selected objects/stars
    eventBus.emit('ui.clearAll');
    
    // Reset interaction system
    if (this.interactionSystem && typeof (this.interactionSystem as any).clearHover === 'function') {
      (this.interactionSystem as any).clearHover();
    }
    
    // Allow subclasses to add their own cleanup
    this.onLevelExit();
    
    console.log(`✅ Level cleanup completed for: ${this.levelName}`);
  }
  
  /**
   * Clear global scene state that can contaminate other levels
   * This ensures clean transitions between levels
   */
  private clearGlobalSceneState(): void {
    console.log(`🌍 Clearing global scene state for clean level transition`);
    
    // Clear environment mapping that can persist between levels
    this.scene.environment = null;
    
    // Clear fog effects that can persist between levels  
    this.scene.fog = null;
    
    // Clear scene background that can persist between levels
    this.scene.background = null;
    
    // Clear any scene-level overrides that can persist
    this.scene.overrideMaterial = null;
    
    console.log(`✅ Global scene state cleared - levels will not contaminate each other`);
  }

  /**
   * Called when exiting a level - for level-specific cleanup
   * Can be overridden by subclasses
   */
  protected onLevelExit(): void {
    // Default implementation - can be overridden by subclasses
  }

  /**
   * Provides the movement configuration for this specific level.
   * Must be implemented by subclasses.
   */
  protected abstract getMovementConfiguration(): LevelMovementConfig;
  
  /**
   * Called during disposal for level-specific cleanup
   * Can be overridden by subclasses for custom cleanup
   */
  protected onDispose(): void {
    // Default implementation - can be overridden
  }
  
  // Public getters
  
  public getLevelId(): string {
    return this.levelId;
  }
  
  public getLevelName(): string {
    return this.levelName;
  }
  
  public getLevelDescription(): string {
    return this.levelDescription;
  }
  
  public getLevelGroup(): THREE.Group {
    return this.levelGroup;
  }
  
  /**
   * Get level information for debugging/UI
   */
  public getLevelInfo(): LevelInfo {
    return {
      id: this.levelId,
      name: this.levelName,
      description: this.levelDescription,
      isInitialized: this.isInitialized,
      isActive: this.isActive,
      isDisposed: this.isDisposed,
      objectCount: this.levelGroup ? this.levelGroup.children.length : 0
    };
  }
  
  // Public API for new component system
  
  /**
   * Get the movement component
   */
  public getMovementComponent(): MovementComponent | null {
    return this.movementComponent;
  }
  
  /**
   * Get the physics component
   */
  public getPhysicsComponent(): PhysicsComponent | null {
    return this.physicsComponent;
  }
  
  /**
   * Add physics to a specific mesh (delegates to PhysicsComponent)
   */
  public addPhysicsToMesh(
    mesh: THREE.Object3D,
    bodyType: 'dynamic' | 'kinematic' | 'static' = 'static',
    colliderType: 'ball' | 'cuboid' | 'capsule' | 'cylinder' | 'cone' | 'trimesh' | 'heightfield' = 'cuboid',
    options: {
      restitution?: number;
      friction?: number;
      density?: number;
      isSensor?: boolean;
    } = {}
  ): string | null {
    if (!this.physicsComponent) {
      console.warn('PhysicsComponent not available');
      return null;
    }
    
    return this.physicsComponent.addPhysicsToMesh(mesh, bodyType, colliderType, options);
  }
  
  /**
   * Set movement configuration (delegates to MovementComponent)
   */
  public setMovementConfig(config: any): void {
    if (this.movementComponent) {
      this.movementComponent.setConfig(config);
    }
  }
  
  /**
   * Set camera/player position (delegates to MovementComponent)
   */
  public setPlayerPosition(position: THREE.Vector3): void {
    if (this.movementComponent) {
      this.movementComponent.setPosition(position);
    } else {
      // Fallback to direct camera positioning
      this.camera.position.copy(position);
    }
  }
  
}

/**
 * Level information interface
 */
export interface LevelInfo {
  id: string;
  name: string;
  description: string;
  isInitialized: boolean;
  isActive: boolean;
  isDisposed: boolean;
  objectCount: number;
}