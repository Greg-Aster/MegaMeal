import * as THREE from 'three';
import { BaseLevel } from './BaseLevel';
import { Engine } from '../../engine/core/Engine';
import { InteractionSystem } from '../../engine/systems/InteractionSystem';
import type { LevelConfig } from '../systems/LevelSystem';
import type { LevelMovementConfig } from '../../engine/components/MovementTypes';

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
  protected updateLevel(deltaTime: number): void {
    // Update all loaded components
    this.loadedComponents.forEach((component, type) => {
      if (component && typeof component.update === 'function') {
        component.update(deltaTime);
      }
    });
  }
  
  /**
   * Cleanup
   */
  protected onDispose(): void {
    console.log('🧹 Disposing GenericLevel');
  }
  
  // PRIVATE HELPER METHODS - Component Management Only
  
  

  /**
   * Create system from configuration - truly generic approach
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
      
      // Create component instance with appropriate constructor pattern
      let component;
      if (systemConfig.type === 'ObservatoryEnvironment') {
        // ObservatoryEnvironment expects the full engine instance
        component = new componentClass(
          this.THREE,
          this.engine,
          this.levelGroup,
          this.assetLoader
        );
      } else if (systemConfig.type === 'RoomFactory') {
        // RoomFactory has its own specific constructor signature
        component = new componentClass(
          this.THREE,
          this.assetLoader,
          this.engine.getMaterials() // It needs the Materials factory from the engine
        );
      } else if (systemConfig.type === 'StarNavigationSystem') {
        // StarNavigationSystem has a specific constructor signature with the full engine
        component = new componentClass(
          this.THREE,
          this.engine,
          this.scene,
          this.levelGroup,
          this.interactionSystem,
          this.engine.getEventBus(),
          this.camera,
          this.gameContainer
        );
      } else if (systemConfig.type === 'OutlineRenderer') {
        // OutlineRenderer has a simple constructor signature
        component = new componentClass(
          this.THREE,
          this.scene
        );
      } else {
        // Standard component constructor pattern
        component = new componentClass(
          this.THREE,
          this.scene,
          this.levelGroup,
          this.interactionSystem,
          this.engine.getEventBus(),
          this.camera,
          this.gameContainer
        );
      }
      
      // Initialize component with its config
      if (typeof component.initialize === 'function') {
        await component.initialize(systemConfig.config);
      }
      
      // Store component for lifecycle management
      if (isTerrainGenerator) {
        this.loadedComponents.set('terrain', component);
      }
      // Always store by type for direct access
      this.storeComponent(systemConfig.type, component);
      
      // System created successfully (reduced logging)
      
    } catch (error) {
      console.error(`Failed to create system ${systemConfig.type}:`, error);
    }
  }

  /**
   * Load component class dynamically - no hardcoded dependencies
   */
  private async loadComponentClass(componentType: string): Promise<any> {
    // Level-specific components (like ObservatoryEnvironment) should be in /levels/
    const levelSpecificComponents = ['ObservatoryEnvironment'];
    
    // System-specific components should be in /systems/
    const systemSpecificComponents = ['MirandaShipSystem'];
    
    if (levelSpecificComponents.includes(componentType)) {
      try {
        // Try loading from levels directory for level-specific components
        const levelModule = await import(`../levels/${componentType}.ts`);
        return levelModule[componentType];
      } catch (error) {
        console.warn(`Could not load level-specific component ${componentType}:`, error);
        return null;
      }
    }
    
    if (systemSpecificComponents.includes(componentType)) {
      try {
        // Try loading from systems directory for system-specific components
        const systemModule = await import(`../systems/${componentType}.ts`);
        return systemModule[componentType];
      } catch (error) {
        console.warn(`Could not load system-specific component ${componentType}:`, error);
        return null;
      }
    }
    
    // General-purpose components should be in /systems/ or /components/
    try {
      // Try loading from systems directory first
      const systemModule = await import(`../systems/${componentType}.ts`);
      return systemModule[componentType];
    } catch {
      try {
        // Try loading from components directory
        const componentModule = await import(`../components/${componentType}.ts`);
        return componentModule[componentType];
      } catch {
        try {
          // Fallback: try loading from levels directory
          const levelModule = await import(`../levels/${componentType}.ts`);
          return levelModule[componentType];
        } catch (error) {
          console.warn(`Could not load component ${componentType}:`, error);
          return null;
        }
      }
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
   */
  public callComponentMethod(componentType: string, methodName: string, ...args: any[]): any {
    const component = this.getComponent(componentType);
    if (component && typeof component[methodName] === 'function') {
      return component[methodName](...args);
    } else {
      console.warn(`⚠️ Component '${componentType}' not found or method '${methodName}' not available`);
      return null;
    }
  }

}