import * as THREE from 'three';
import { BaseLevel } from './BaseLevel';
import { Engine } from '../../engine/core/Engine';
import { InteractionSystem } from '../../engine/systems/InteractionSystem';
import type { LevelConfig } from '../systems/LevelSystem';
import type { LevelMovementConfig } from '../../engine/components/MovementTypes';
import type { ILevelGenerator, LevelGeneratorDependencies } from '../interfaces/ILevelGenerator';

/**
 * GenericLevel - Data-Driven Level Implementation
 * 
 * This class creates levels entirely from JSON configuration.
 * It only affects levels that use the data-driven system.
 */
export class GenericLevel extends BaseLevel {
  private config: LevelConfig;
  private THREE: any;
  private loadedComponents: Map<string, any> = new Map();
  
  constructor(
    engine: Engine, 
    interactionSystem: InteractionSystem, 
    config: LevelConfig
  ) {
    super(
      engine,
      interactionSystem,
      config.id,
      config.name,
      config.description || ''
    );
    
    this.config = config;
    this.THREE = THREE;
    
    console.log(`🎮 Creating GenericLevel: ${config.name}`);
  }
  
  /**
   * Create environment from config
   */
  protected async createEnvironment(): Promise<void> {
    console.log(`🏗️ GenericLevel: Creating environment from config...`);

    if (this.config.terrain && this.config.terrain.generator) {
      console.log(`   -> Using terrain generator: ${this.config.terrain.generator}`);
      // The 'isTerrainGenerator' flag is a conceptual marker for the main environment provider.
      await this.createSystem({
        type: this.config.terrain.generator,
        config: this.config.terrain.parameters
      }, true);
    } else {
      console.warn('No terrain generator specified in level config.');
    }

    // Water configuration now processed globally by GameManager
    // This ensures proper order and prevents conflicts
  }
  
  /**
   * Create lighting from config
   */
  protected async createLighting(): Promise<void> {
    console.log(`💡 GenericLevel: Lighting creation handled by component systems`);
    
    // GenericLevel creates NO lighting - all handled by component systems
    // This prevents conflicts and maintains separation of concerns
    // Lighting is created by:
    // - AtmosphericEffects component (for atmospheric lighting)
    // - ObservatoryEnvironment component (for observatory-specific lighting)
    // - Other specialized lighting components as needed
  }
  
  /**
   * Setup physics from config
   */
  protected async setupPhysics(): Promise<void> {
    console.log('⚡ Setting up config-driven physics');
    
    if (this.config.physics && this.config.physics.customColliders) {
      const physicsComp = this.getPhysicsComponent();
      if (!physicsComp) {
        console.warn('PhysicsComponent not available, cannot create custom colliders.');
        return;
      }

      for (const collider of this.config.physics.customColliders) {
        // NOTE: This assumes a new method 'createStaticCollider' is added to PhysicsComponent
        // to handle creating physics bodies without a visual mesh.
        physicsComp.addPhysicsToMesh(
          null, // No mesh for this collider
          'static',
          'cuboid',
          {
            id: collider.id,
            position: new this.THREE.Vector3(...collider.position),
            scale: new this.THREE.Vector3(collider.scale[0], 0.1, collider.scale[2]),
            friction: 0.8
          }
        )
      }
    }
  }
  
  /**
   * Create interactions from config systems
   */
  protected async createInteractions(): Promise<void> {
    console.log('🎯 Creating additional config-driven systems...');
    
    // Create systems based on configuration
    for (const systemConfig of this.config.systems) {
      await this.createSystem(systemConfig, false); // These are additional, not the primary terrain
    }
  }
  
  /**
   * Set spawn point from config with terrain following support
   */
  protected async onLevelReady(): Promise<void> {
    console.log('🎉 GenericLevel ready!');
    
    let spawnPoint = this.config.movement.spawnPoint;
    
    // For levels with terrain following, use calculated spawn point from terrain
    if (this.config.movement.terrainFollowing) {
      const terrainProvider = this.getTerrainComponent();
      if (terrainProvider && typeof terrainProvider.getSpawnPoint === 'function') {
        const calculatedSpawn = terrainProvider.getSpawnPoint();
        if (calculatedSpawn) {
          spawnPoint = [calculatedSpawn.x, calculatedSpawn.y, calculatedSpawn.z];
          console.log(`🎯 Using terrain-aware spawn point: [${spawnPoint[0]}, ${spawnPoint[1].toFixed(2)}, ${spawnPoint[2]}]`);
        }
      }
    }
    
    this.setPlayerPosition(new this.THREE.Vector3(spawnPoint[0], spawnPoint[1], spawnPoint[2]));
    
    this.engine.getEventBus().emit('level.generic.ready', {
      levelId: this.levelId,
      levelName: this.levelName
    });
  }
  
  /**
   * Get movement config with terrain provider support
   */
  protected getMovementConfiguration(): LevelMovementConfig {
    return {
      baseConfig: this.config.movement.movementConfig,
      usePhysicsRaycast: !this.config.movement.terrainFollowing,
      fallbackGroundLevel: -5,
      terrainProvider: this.config.movement.terrainFollowing ? this.getTerrainProvider() : undefined
    };
  }
  
  /**
   * Get terrain provider for universal ground collision
   */
  private getTerrainProvider() {
    return (x: number, z: number): number => {
      // Try to get height from ObservatoryEnvironment first
      const terrainProvider = this.getTerrainComponent();
      if (terrainProvider && typeof terrainProvider.getHeightAt === 'function') {
        return terrainProvider.getHeightAt(x, z);
      }
      
      // Fallback to base ground level
      return -5;
    };
  }
  
  /**
   * Update - call update on all loaded components
   */
  protected updateLevel(deltaTime: number, camera: THREE.Camera): void {
    // Update all loaded components, passing camera for systems that need it
    this.loadedComponents.forEach((component, type) => {
      if (component && typeof component.update === 'function') {
        component.update(deltaTime, camera);
      }
    });
  }
  
  /**
   * Cleanup
   */
  protected onDispose(): void {
    console.log('🧹 Disposing GenericLevel');
    
    // Water cleanup now handled globally by GameManager
    // This ensures proper cleanup order during level transitions
  }
  
  // PRIVATE HELPER METHODS - Component Management Only
  
  

  /**
   * Create system from configuration - now fully standardized
   */
  private async createSystem(systemConfig: any, isTerrainGenerator: boolean = false): Promise<void> {
    console.log(`🎯 Creating system: ${systemConfig.type}`);
    
    try {
      // Generic component loading
      const componentClass = await this.loadComponentClass(systemConfig.type);
      if (!componentClass) {
        console.warn(`Unknown system type: ${systemConfig.type}`);
        return;
      }
      
      // Config is passed directly to components - timeline events come from GameStateManager
      let config = { ...systemConfig.config };
      
      // Create standardized dependencies object
      const dependencies: LevelGeneratorDependencies = {
        THREE: this.THREE,
        scene: this.scene,
        levelGroup: this.levelGroup,
        interactionSystem: this.interactionSystem,
        eventBus: this.engine.getEventBus(),
        camera: this.camera,
        gameContainer: this.gameContainer,
        assetLoader: this.assetLoader, // This should be populated from BaseLevel
        engine: this.engine,
        materialsFactory: this.engine.getMaterials?.()
      };
      
      // Debug logging to check dependencies
      console.log('🔧 Dependencies check:', {
        assetLoader: !!dependencies.assetLoader,
        engine: !!dependencies.engine,
        scene: !!dependencies.scene,
        levelGroup: !!dependencies.levelGroup
      });
      
      // All components now use the standardized interface (either directly or through adapters)
      const component: ILevelGenerator = new componentClass(dependencies);
      
      // Initialize component with its config (now including loaded data)
      if (component && typeof component.initialize === 'function') {
        await Promise.resolve(component.initialize(config));
      } else {
        console.warn(`Component ${systemConfig.type} is missing the initialize method.`);
      }
      
      // Store component for lifecycle management
      if (isTerrainGenerator) {
        this.loadedComponents.set('terrain', component);
      }
      // Always store by type for direct access
      this.storeComponent(systemConfig.type, component);
      
    } catch (error) {
      console.error(`Failed to create system ${systemConfig.type}:`, error);
      // Throw the error to make it clear that level generation has failed
      throw new Error(`Critical error creating system: ${systemConfig.type}. Check component name and dependencies.`);
    }
  }


  /**
   * Load component class dynamically - using convention over configuration
   * All components must be in /src/game/systems/ directory
   */
  private async loadComponentClass(componentType: string): Promise<any> {
    try {
      // Convention: All level generator components are in /systems/ directory
      const systemModule = await import(`../systems/${componentType}.ts`);
      return systemModule[componentType];
    } catch (error) {
      console.warn(`Could not load component ${componentType} from systems directory:`, error);
      return null;
    }
  }

  /**
   * Store component for lifecycle management
   */
  private storeComponent(type: string, component: any): void {
    this.loadedComponents.set(type, component);
  }

  /**
   * Get the primary terrain-providing component
   */
  private getTerrainComponent(): any {
    return this.loadedComponents.get('terrain');
  }

  /**
   * Get a loaded component by type - generic API
   */
  public getComponent(componentType: string): any {
    return this.loadedComponents.get(componentType);
  }

  /**
   * Call a method on a component if it exists - generic API
   * Works with both new standardized components and legacy components through adapters
   */
  public callComponentMethod(componentType: string, methodName: string, ...args: any[]): any {
    const component = this.getComponent(componentType);
    if (!component) {
      console.warn(`⚠️ Component '${componentType}' not found`);
      return null;
    }

    // Try calling the method on the component directly first
    if (typeof component[methodName] === 'function') {
      return component[methodName](...args);
    }

    // If not found and component has getLegacyComponent, try the legacy component
    if (typeof component.getLegacyComponent === 'function') {
      const legacyComponent = component.getLegacyComponent();
      if (legacyComponent && typeof legacyComponent[methodName] === 'function') {
        return legacyComponent[methodName](...args);
      }
    }

    console.warn(`⚠️ Method '${methodName}' not available on component '${componentType}'`);
    return null;
  }

}