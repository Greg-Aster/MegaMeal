import * as THREE from 'three';
import { BaseLevel } from './BaseLevel';
import { Engine } from '../../engine/core/Engine';
import { InteractionSystem } from '../../engine/systems/InteractionSystem';
import { ObservatoryEnvironment } from '../systems/ObservatoryEnvironment';
import { StarNavigationSystem } from '../systems/StarNavigationSystem';
import { AtmosphericEffects } from '../systems/AtmosphericEffects';
import type { StarData } from '../state/GameState';

/**
 * Star Observatory Level - Refactored version using BaseLevel pattern
 * Hub level with star navigation and atmospheric effects
 */
export class StarObservatory extends BaseLevel {
  private environment: ObservatoryEnvironment;
  private starSystem: StarNavigationSystem;
  private effects: AtmosphericEffects;
  private THREE: any;
  
  // Callbacks
  private onStarSelectedCallback?: (star: StarData | null) => void;
  
  constructor(engine: Engine, interactionSystem: InteractionSystem, levelId: string) {
    super(
      engine,
      interactionSystem,
      levelId,
      'Star Observatory Alpha',
      'A celestial navigation facility for exploring the timeline of cosmic events'
    );
    
    // Store THREE reference
    this.THREE = THREE;
  }
  
  /**
   * Create the environment (terrain, skybox, water)
   */
  protected async createEnvironment(): Promise<void> {
    console.log('🏗️ Creating Observatory environment...');
    
    try {
      this.environment = new ObservatoryEnvironment(
        this.THREE,
        this.scene,
        this.levelGroup,
        this.assetLoader
      );
      
      await this.environment.initialize();
      console.log('✅ Observatory environment created');
      
    } catch (error) {
      console.error('❌ Failed to create Observatory environment:', error);
      throw error;
    }
  }
  
  /**
   * Set up atmospheric lighting
   */
  protected async createLighting(): Promise<void> {
    console.log('💡 Creating Observatory lighting...');
    
    try {
      this.effects = new AtmosphericEffects(
        this.THREE,
        this.scene,
        this.levelGroup
      );
      
      await this.effects.initialize();
      console.log('✅ Observatory lighting created');
      
    } catch (error) {
      console.error('❌ Failed to create Observatory lighting:', error);
      throw error;
    }
  }
  
  /**
   * Set up star navigation interactions
   */
  protected async createInteractions(): Promise<void> {
    console.log('🎯 Creating Observatory interactions...');
    
    try {
      this.starSystem = new StarNavigationSystem(
        this.THREE,
        this.scene,
        this.levelGroup,
        this.interactionSystem,
        this.engine.getEventBus(),
        this.camera,
        this.gameContainer
      );
      
      await this.starSystem.initialize();
      
      // Set up star selection callback
      this.starSystem.onStarSelected((star) => {
        if (this.onStarSelectedCallback) {
          this.onStarSelectedCallback(star);
        }
      });
      
      console.log('✅ Observatory interactions created');
      
    } catch (error) {
      console.error('❌ Failed to create Observatory interactions:', error);
      throw error;
    }
  }
  
  /**
   * Set up physics (minimal for observatory)
   */
  protected async setupPhysics(): Promise<void> {
    if (!this.physicsWorld) return;
    
    console.log('⚡ Setting up Observatory physics...');
    
    try {
      // Create simple ground plane for physics
      this.physicsWorld.createRigidBody('ground', {
        bodyType: 'static',
        colliderType: 'cuboid',
        position: new this.THREE.Vector3(0, -6, 0),
        rotation: new this.THREE.Quaternion(0, 0, 0, 1),
        scale: new this.THREE.Vector3(250, 1, 250),
        friction: 0.7,
        restitution: 0.0
      });
      
      console.log('✅ Observatory physics set up');
      
    } catch (error) {
      console.error('❌ Failed to set up Observatory physics:', error);
      // Don't throw - physics is optional
    }
  }
  
  /**
   * Called when level is fully ready
   */
  protected async onLevelReady(): Promise<void> {
    console.log('🎉 Observatory level ready!');
    
    // Set initial camera position
    this.camera.position.set(0, -3.4, 50);
    const lookUpAngle = this.THREE.MathUtils.degToRad(15);
    this.camera.rotation.x = -lookUpAngle;
    
    // Emit ready event
    this.engine.getEventBus().emit('level.observatory.ready', {
      levelId: this.levelId,
      levelName: this.levelName
    });
  }
  
  /**
   * Update level-specific logic
   */
  protected updateLevel(deltaTime: number): void {
    // Update all systems
    if (this.environment) {
      this.environment.update(deltaTime);
    }
    
    if (this.starSystem) {
      this.starSystem.update(deltaTime);
    }
    
    if (this.effects) {
      this.effects.update(deltaTime);
    }
  }
  
  /**
   * Custom cleanup for Observatory
   */
  protected onDispose(): void {
    console.log('🧹 Disposing Observatory systems...');
    
    // Dispose systems in reverse order
    if (this.starSystem) {
      this.starSystem.dispose();
    }
    
    if (this.effects) {
      this.effects.dispose();
    }
    
    if (this.environment) {
      this.environment.dispose();
    }
    
    // Clear callbacks
    this.onStarSelectedCallback = undefined;
    
    console.log('✅ Observatory systems disposed');
  }
  
  // Public API for external interaction
  
  /**
   * Set timeline events for star generation
   */
  public setTimelineEvents(events: any[]): void {
    // console.log('🏗️ StarObservatory.setTimelineEvents called with:', events);
    if (this.starSystem) {
      // console.log('🏗️ Passing events to StarNavigationSystem');
      this.starSystem.setTimelineEvents(events);
    } else {
      // console.log('🏗️ StarNavigationSystem not initialized yet');
    }
  }
  
  /**
   * Set star selection callback
   */
  public onStarSelected(callback: (star: StarData | null) => void): void {
    this.onStarSelectedCallback = callback;
    
    if (this.starSystem) {
      this.starSystem.onStarSelected(callback);
    }
  }
  
  /**
   * Get currently selected star
   */
  public getSelectedStar(): StarData | null {
    return this.starSystem ? this.starSystem.getSelectedStar() : null;
  }
  
  /**
   * Control atmospheric effects
   */
  public setGridVisibility(visible: boolean): void {
    if (this.effects) {
      this.effects.setGridVisibility(visible);
    }
  }
  
  public setGridOpacity(opacity: number): void {
    if (this.effects) {
      this.effects.setGridOpacity(opacity);
    }
  }
  
  public setFireflyIntensity(intensity: number): void {
    if (this.effects) {
      this.effects.setFireflyIntensity(intensity);
    }
  }
  
  /**
   * Create environmental effects
   */
  public createNebulaEffect(position: THREE.Vector3, color?: number): THREE.Points | null {
    if (this.effects) {
      return this.effects.createNebulaEffect(position, color);
    }
    return null;
  }
  
  /**
   * Get system references (for debugging/advanced usage)
   */
  public getEnvironment(): ObservatoryEnvironment {
    return this.environment;
  }
  
  public getStarSystem(): StarNavigationSystem {
    return this.starSystem;
  }
  
  public getEffects(): AtmosphericEffects {
    return this.effects;
  }
  
  /**
   * Get observatory-specific information
   */
  public getObservatoryInfo(): any {
    return {
      ...this.getLevelInfo(),
      viewingRadius: 940,
      skyboxLoaded: this.environment ? !!this.environment.getSkybox() : false,
      starCount: this.starSystem ? this.starSystem.getStarSprites().size : 0,
      fireflyCount: 80,
      effects: {
        fireflies: !!this.effects?.getFireflies(),
        grid: !!this.effects?.getGrid(),
        cosmicDust: !!this.effects?.getCosmicDust()
      }
    };
  }
}