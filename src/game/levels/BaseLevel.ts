import * as THREE from 'three';
import { GameObject } from '../../engine/core/GameObject';
import { AssetLoader } from '../../engine/resources/AssetLoader';
import { PhysicsWorld } from '../../engine/physics/PhysicsWorld';
import { Engine } from '../../engine/core/Engine';
import { InteractionSystem } from '../../engine/systems/InteractionSystem';
import { ErrorHandler } from '../../engine/utils/ErrorHandler';

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
      () => this.updateLevel(deltaTime),
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
      // Call level-specific cleanup
      this.onDispose();
      
      // Clean up level group and all its children
      if (this.levelGroup) {
        this.disposeGroup(this.levelGroup);
        this.scene.remove(this.levelGroup);
      }
      
      this.markDisposed();
      console.log(`✅ Level ${this.levelName} disposed successfully`);
      
    } catch (error) {
      console.error(`❌ Error disposing level ${this.levelName}:`, error);
      // Still mark as disposed to prevent further use
      this.markDisposed();
    }
  }
  
  /**
   * Recursively dispose of a Three.js group and all its children
   */
  private disposeGroup(group: THREE.Group): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Dispose geometry
        if (child.geometry) {
          child.geometry.dispose();
        }
        
        // Dispose material(s)
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => {
              this.disposeMaterial(material);
            });
          } else {
            this.disposeMaterial(child.material);
          }
        }
      }
    });
    
    // Clear the group
    group.clear();
  }
  
  /**
   * Dispose of a Three.js material and its textures
   */
  private disposeMaterial(material: THREE.Material): void {
    // Dispose textures
    const materialWithTextures = material as any;
    Object.keys(materialWithTextures).forEach(key => {
      const value = materialWithTextures[key];
      if (value && value.isTexture) {
        value.dispose();
      }
    });
    
    // Dispose material
    material.dispose();
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
   * Called when level is ready (after all initialization)
   * Can be overridden by subclasses for final setup
   */
  protected async onLevelReady(): Promise<void> {
    // Default implementation - can be overridden
  }
  
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