import * as THREE from 'three';
import { Engine } from '../engine/core/Engine';
import { LevelManager, type LevelFactory } from './managers/LevelManager';
import { GameStateManager } from './state/GameStateManager';
import { GameActions } from './state/GameActions';
import { InteractionSystem } from '../engine/systems/InteractionSystem';
import { UniversalInputManager } from '../engine/input/UniversalInputManager';
import { ErrorHandler } from '../engine/utils/ErrorHandler';
import type { ErrorContext } from '../engine/utils/ErrorHandler';

// Import data-driven architecture components
import { LevelSystem } from './systems/LevelSystem';
import type { LevelConfig } from './systems/LevelSystem';
import { PlayerLightComponent } from '../engine/components/PlayerLightComponent';
import { TimeTracker } from './systems/TimeTracker';
import { EnvironmentalEffectsSystem } from '../engine/systems/EnvironmentalEffectsSystem';

/**
 * Updated GameManager using the new BaseLevel architecture
 * Much cleaner and more maintainable than the original
 */
export class GameManager {
  private engine: Engine;
  private levelManager: LevelManager;
  private gameStateManager: GameStateManager;
  private interactionSystem: InteractionSystem;
  // Movement handled by MovementComponent in BaseLevel
  private universalInputManager: UniversalInputManager;
  
  // Data-driven architecture
  private levelSystem: LevelSystem;
  
  // Player lighting system
  private playerLight: PlayerLightComponent | null = null;
  
  // High-performance time tracking
  private timeTracker: TimeTracker;
  
  // Environmental effects system
  private environmentalEffects: EnvironmentalEffectsSystem | null = null;
  
  private isInitialized = false;
  private isRunning = false;
  private isMobile = false;
  
  constructor(container: HTMLElement) {
    // Initialize engine
    this.engine = Engine.getInstance({
      container,
      enablePhysics: true,
      enableAudio: false, // Disabled for performance
      enableDebug: false,
      enablePerformanceMonitoring: true
    });
    
    // Initialize managers
    this.gameStateManager = new GameStateManager(this.engine.getEventBus());
    this.timeTracker = new TimeTracker(this.engine.getEventBus());
    // Note: LevelManager initialization moved to initialize() method after InteractionSystem is created
    
    // Detect mobile
    this.isMobile = this.detectMobile();
    
    this.setupEventListeners();
  }
  
  /**
   * Initialize the game manager with new architecture
   */
  public async initialize(timelineEvents: string = '[]'): Promise<void> {
    if (this.isInitialized) {
      console.warn('GameManager already initialized');
      return;
    }
    
    try {
      console.log('🚀 Initializing GameManager with new architecture...');
      
      // Initialize engine
      await this.engine.initialize();
      
      // Get optimization manager and ensure device detection is complete
      const optimizationManager = this.engine.getOptimizationManager();
      console.log('📱 Device capabilities:', optimizationManager.getDeviceCapabilities());
      console.log('🎛️ Optimization level:', optimizationManager.getOptimizationLevel());
      
      // Initialize interaction system
      this.interactionSystem = new InteractionSystem(
        this.engine.getCamera(),
        this.engine.getContainer(),
        this.engine.getEventBus()
      );
      
      // Initialize level manager (after InteractionSystem is created)
      this.levelManager = new LevelManager(this.engine, this.interactionSystem);
      
      // Initialize the single, universal input manager
      this.universalInputManager = new UniversalInputManager(this.engine.getContainer(), this.engine.getEventBus());
      this.universalInputManager.initialize();
      
      // Initialize data-driven level system
      this.levelSystem = new LevelSystem();
      
      // Wait for component registration to complete
      await this.levelSystem.waitForInitialization();
      
      // Initialize environmental effects system
      this.environmentalEffects = EnvironmentalEffectsSystem.getInstance(this.engine.getEventBus());
      this.environmentalEffects.initialize(this.engine.getCamera(), this.engine.getScene());
      
      // Movement now handled by MovementComponent in BaseLevel
      
      // Register migrated levels
      await this.registerMigratedLevels();
      
      // Parse and dispatch timeline events from Astro to GameStateManager
      await this.processTimelineEvents(timelineEvents);
      
      // Try to load saved game
      await this.gameStateManager.loadGame();
      
      // Sync time tracker with loaded game state
      const gameState = this.gameStateManager.getState();
      this.timeTracker.setTime(
        gameState.sessionData.totalPlayTime,
        gameState.gameStats.timeExplored
      );
      
      // Start with the current level from game state
      const currentLevel = this.gameStateManager.getState().currentLevel;
      await this.transitionToLevel(currentLevel);
      
      // Start engine
      this.engine.start();
      
      // Set up update loop
      this.setupUpdateLoop();
      
      this.isInitialized = true;
      this.isRunning = true;
      
      console.log('✅ GameManager initialized successfully with new architecture');
      
    } catch (error) {
      console.error('❌ Failed to initialize GameManager:', error);
      throw error;
    }
  }
  
  /**
   * Register levels from manifest - fully data-driven architecture
   */
  private async registerMigratedLevels(): Promise<void> {
    try {
      // Load level manifest
      const manifestModule = await import('./levels/level-manifest.json');
      const manifest = manifestModule.default || manifestModule;
      
      // Register all levels from manifest
      const levelIds = Object.keys(manifest.levels);
      for (const levelId of levelIds) {
        this.levelManager.registerLevel(levelId, this.createDataDrivenLevel);
      }
      
      console.log(`📦 Levels registered from manifest: ${levelIds.join(', ')}`);
    } catch (error) {
      console.error('Failed to load level manifest:', error);
      // Fallback to manual registration if manifest fails
      this.levelManager.registerLevel('observatory', this.createDataDrivenLevel);
      this.levelManager.registerLevel('miranda', this.createDataDrivenLevel);
      this.levelManager.registerLevel('restaurant', this.createDataDrivenLevel);
      this.levelManager.registerLevel('infinite_library', this.createDataDrivenLevel);
    }
  }
  
  /**
   * Factory function for creating data-driven levels
   */
  private createDataDrivenLevel: LevelFactory = async (levelId: string) => {
    console.log(`🎮 Creating data-driven level: ${levelId}`);
    
    try {
      // Load configuration for the level
      const config = await this.loadLevelConfig(levelId);
      
      // Create and initialize GenericLevel with configuration
      const { GenericLevel } = await import('./levels/GenericLevel');
      const level = new GenericLevel(this.engine, this.interactionSystem, config);
      await level.initialize();
      
      console.log(`✅ Data-driven level created and initialized: ${config.name}`);
      return level;
      
    } catch (error) {
      console.error(`❌ Failed to create data-driven level '${levelId}':`, error);
      throw error;
    }
  }
  
  /**
   * Load level configuration from JSON
   */
  private async loadLevelConfig(levelId: string): Promise<LevelConfig> {
    try {
      // For now, load from static import - in future this could be dynamic
      const configModule = await import(`./levels/${levelId}.json`);
      const config: LevelConfig = configModule.default || configModule;
      
      // Validate configuration
      await this.levelSystem.loadLevel(config);
      
      return config;
      
    } catch (error) {
      console.error(`❌ Failed to load config for level '${levelId}':`, error);
      throw new Error(`Level configuration not found: ${levelId}`);
    }
  }
  
  /**
   * Set initial camera position for level
   */
  private setupInitialCamera(): void {
    const camera = this.engine.getCamera();
    camera.position.set(0, -3.4, 50);
    
    // Look up slightly for better star observatory view
    const lookUpAngle = -Math.PI / 12; // 15 degrees
    camera.rotation.x = lookUpAngle;
  }
  
  /**
   * Process timeline events from Astro and dispatch to GameStateManager
   */
  private async processTimelineEvents(timelineEventsJson: string): Promise<void> {
    try {
      console.log('📚 Processing timeline events from Astro...');
      
      // Parse timeline events from Astro (already processed by TimelineService)
      const timelineEvents = JSON.parse(timelineEventsJson || '[]');
      
      console.log(`✅ Processed ${timelineEvents.length} timeline events from Astro`);
      
      // Dispatch to GameStateManager for centralized state management
      this.gameStateManager.dispatch(GameActions.timelineEventsSet(timelineEvents));
      
    } catch (error) {
      console.error('❌ Failed to process timeline events:', error);
      // Dispatch empty array as fallback
      this.gameStateManager.dispatch(GameActions.timelineEventsSet([]));
    }
  }
  
  /**
   * Set up update loop with improved error handling
   */
  private setupUpdateLoop(): void {
    this.engine.getEventBus().on('engine.update', (data) => {
      if (!this.isRunning) return;
      
      try {
        // Update engine systems first
        const optimizationManager = this.engine.getOptimizationManager();
        if (optimizationManager) {
          optimizationManager.update(data.deltaTime);
        }

        // Update managers
        this.levelManager.update(data.deltaTime);
        this.interactionSystem.update(data.deltaTime, this.engine.getCamera().position);
        
        // Update player light
        if (this.playerLight) {
          this.playerLight.update(data.deltaTime);
        }
        
        // Update time tracking (high-frequency, optimized)
        this.timeTracker.update(data.deltaTime);
        
        // Update environmental effects system
        if (this.environmentalEffects) {
          this.environmentalEffects.update(data.deltaTime);
        }
        
      } catch (error) {
        console.error('Error in game update loop:', error);
        
        // Emit error event for UI handling
        this.engine.getEventBus().emit('game.error', {
          error,
          context: 'update_loop',
          timestamp: Date.now()
        });
      }
    });
  }
  
  /**
   * Set up event listeners with improved error handling
   */
  private setupEventListeners(): void {
    const eventBus = this.engine.getEventBus();
    
    // Level transition events
    eventBus.on('level.transition.request', (data) => {
      this.transitionToLevel(data.levelId).catch(error => {
        console.error('Failed to transition to level:', error);
        eventBus.emit('game.error', { error, context: 'level_transition' });
      });
    });
    
    eventBus.on('level.transition', (data) => {
      this.transitionToLevel(data.targetLevel).catch(error => {
        console.error('Failed to transition to level:', error);
        eventBus.emit('game.error', { error, context: 'level_transition' });
      });
    });
    
    // Interaction events
    eventBus.on('interaction.performed', (data) => {
      this.gameStateManager.dispatch(GameActions.interactionRecorded(data.interactionType, data.objectId, data.position, data));
    });
    
    // Mobile control events
    eventBus.on('mobile.movement', (data) => {
      this.handleMobileMovement(data);
    });
    
    eventBus.on('mobile.action', (data) => {
      this.handleMobileAction(data);
    });
    
    // Star selection events
    eventBus.on('starmap.star.selected', (data) => {
      console.log('🌟 GameManager: Star selected:', data.eventData.title);
      // Include screenPosition in the star data
      const starWithPosition = {
        ...data.eventData,
        screenPosition: data.screenPosition
      };
      this.gameStateManager.dispatch(GameActions.starSelected(starWithPosition));
    });

    eventBus.on('starmap.star.deselected', (data) => {
      console.log('🌟 GameManager: Star deselected:', data.eventData.title);
      this.gameStateManager.dispatch(GameActions.starDeselected(data.eventData));
    });
    
    // Error handling
    eventBus.on('game.error', (data) => {
      this.handleGameError(data);
    });
  }
  
  /**
   * Transition to a level with improved error handling
   */
  public async transitionToLevel(levelId: string): Promise<void> {
    try {
      console.log(`🔄 Transitioning to level: ${levelId}`);
      
      // Clear selected star when leaving StarObservatory to prevent stuck timeline card
      if (this.gameStateManager.getState().currentLevel === 'observatory' && levelId !== 'observatory') {
        const currentStar = this.gameStateManager.getState().selectedStar;
        if (currentStar) {
          this.gameStateManager.dispatch(GameActions.starDeselected(currentStar));
        }
      }
      
      // Clean up current level's water systems before transition
      const currentLevel = this.gameStateManager.getState().currentLevel;
      if (this.environmentalEffects) {
        this.environmentalEffects.cleanupLevel(currentLevel);
      }

      const success = await this.levelManager.transitionToLevel(levelId);
      if (success) {
        // Set camera position for level
        await this.updateCameraForLevel(levelId);
        
        // Setup water systems for new level
        await this.setupLevelWaterSystems(levelId);
        
        // Update game state
        this.gameStateManager.dispatch(GameActions.levelTransitionSuccess(
          this.gameStateManager.getState().currentLevel,
          levelId,
          performance.now()
        ));
        
        // Setup player light for new level
        // await this.setupPlayerLight(); // Disabled - conflicts with level-specific lighting
        
        // Level-specific setup is now handled by self-sufficient components
        
        console.log(`✅ Successfully transitioned to level: ${levelId}`);
      } else {
        throw new Error(`Failed to transition to level: ${levelId}`);
      }
      
    } catch (error) {
      console.error('Failed to transition to level:', error);
      
      // Emit error event
      this.engine.getEventBus().emit('game.error', {
        error,
        context: 'level_transition',
        levelId
      });
      
      throw error;
    }
  }
  
  
  /**
   * Setup water systems for the specified level
   */
  private async setupLevelWaterSystems(levelId: string): Promise<void> {
    if (!this.environmentalEffects) {
      console.warn('⚠️ EnvironmentalEffectsSystem not available for water setup');
      return;
    }

    try {
      // Load the level configuration
      const levelConfig = await this.loadLevelConfig(levelId);
      
      // Get the current level's group for adding water systems
      const currentLevel = this.levelManager.getCurrentLevel();
      if (currentLevel && typeof currentLevel.getLevelGroup === 'function') {
        const levelGroup = currentLevel.getLevelGroup();
        if (levelGroup) {
          // Process water configuration if present
          this.environmentalEffects.processLevelConfiguration(levelConfig, levelGroup);
        }
      }
      
      console.log(`🌊 Water systems setup complete for level: ${levelId}`);
    } catch (error) {
      console.error(`❌ Failed to setup water systems for level ${levelId}:`, error);
    }
  }

  /**
   * Set camera position for specific level using manifest data
   * Enforces manifest as single source of truth - no fallbacks
   */
  private async updateCameraForLevel(levelId: string): Promise<void> {
    const camera = this.engine.getCamera();
    
    try {
      const manifestModule = await import('./levels/level-manifest.json');
      const manifest = manifestModule.default || manifestModule;
      
      const levelData = manifest.levels[levelId];
      if (!levelData) {
        throw new Error(`Level '${levelId}' not found in manifest`);
      }
      
      if (!levelData.camera) {
        throw new Error(`Camera configuration missing for level '${levelId}' in manifest`);
      }
      
      const { initialPosition, initialRotation, lookAt } = levelData.camera;
      
      // Set position
      if (initialPosition) {
        camera.position.set(initialPosition[0], initialPosition[1], initialPosition[2]);
      }
      
      // Set rotation or lookAt
      if (initialRotation) {
        camera.rotation.set(initialRotation[0], initialRotation[1], initialRotation[2]);
      } else if (lookAt) {
        camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
      }
      
      console.log(`📷 Camera positioned for ${levelId} from manifest`);
      
    } catch (error) {
      console.error(`❌ Failed to load camera settings for ${levelId}:`, error);
      throw new Error(`Invalid level configuration: ${levelId}. All levels must have complete camera settings in manifest.`);
    }
  }
  
  /**
   * Setup player light for the current level
   */
  private async setupPlayerLight(): Promise<void> {
    try {
      // Dispose existing player light if any
      if (this.playerLight) {
        this.playerLight.dispose();
        this.playerLight = null;
      }
      
      // Get current level to find player object
      const currentLevel = this.levelManager.getCurrentLevel();
      if (!currentLevel) {
        console.warn('No current level - cannot setup player light');
        return;
      }
      
      // Try to get player object from level
      let playerObject: THREE.Object3D | null = null;
      
      // For data-driven levels, try to get the player from MovementComponent
      if (typeof (currentLevel as any).getComponent === 'function') {
        const movementComponent = (currentLevel as any).getComponent('MovementComponent');
        if (movementComponent && typeof movementComponent.getPlayerObject === 'function') {
          playerObject = movementComponent.getPlayerObject();
        }
      }
      
      // If no player object found, attach to camera (fallback)
      if (!playerObject) {
        playerObject = this.engine.getCamera();
        console.log('💡 No player object found - attaching light to camera');
      }
      
      // Create new player light
      this.playerLight = new PlayerLightComponent(
        THREE,
        this.engine.getScene(),
        playerObject,
        {
          // Customize based on level if needed
          intensity: 6.0,
          range: 25,
          color: 0xffa366 // Warm firefly color
        }
      );
      
      await this.playerLight.initialize();
      console.log('💡 Player light setup complete');
      
    } catch (error) {
      console.error('Failed to setup player light:', error);
      // Don't throw - player light is nice to have but not critical
    }
  }
  
  /**
   * Handle mobile movement - now handled directly through EventBus
   */
  private handleMobileMovement(data: { x: number, z: number }): void {
    // Mobile movement is now handled directly in MovementComponent via EventBus
    // This event is already being emitted by MobileControls.svelte
  }
  
  /**
   * Handle mobile actions - now handled directly through EventBus
   */
  private handleMobileAction(action: string): void {
    // Mobile actions are now handled directly in MovementComponent via EventBus
    // This event is already being emitted by MobileControls.svelte
  }
  
  /**
   * Handle game errors using the new ErrorHandler system
   */
  private handleGameError(errorData: any): void {
    // Create proper error context
    const errorContext: ErrorContext = {
      component: 'GameManager',
      operation: errorData.context || 'unknown',
      details: errorData,
      severity: 'medium'
    };
    
    // Use ErrorHandler for comprehensive error handling
    ErrorHandler.handleError(errorData.error || new Error('Unknown game error'), errorContext);
    
    // Emit to UI for user notification
    this.engine.getEventBus().emit('ui.error', {
      message: 'A game error occurred. Please try again.',
      details: errorData,
      timestamp: Date.now()
    });
  }
  
  /**
   * Graphics mode is now controlled per-level via configuration - no global flag needed
   */
  /**
   * Reset view/camera
   */
  public resetView(): void {
    const currentLevel = this.gameStateManager.getState().currentLevel;
    this.updateCameraForLevel(currentLevel).catch(error => {
      console.error('Failed to reset camera view:', error);
    });
    
    // Clear selected star
    const currentStar = this.gameStateManager.getState().selectedStar;
    if (currentStar) {
      this.gameStateManager.dispatch(GameActions.starDeselected(currentStar));
    }
  }
  
  /**
   * Detect mobile device
   */
  private detectMobile(): boolean {
    const userAgent = navigator.userAgent;
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isSmallScreen = window.screen.width <= 768 || window.innerWidth <= 768;
    
    return isMobileUserAgent || isSmallScreen;
  }
  
  /**
   * Get current state for UI
   */
  public getGameState() {
    return this.gameStateManager.getState();
  }
  
  /**
   * Get current level info
   */
  public getCurrentLevel() {
    return this.levelManager.getCurrentLevel();
  }
  
  /**
   * Get engine reference
   */
  public getEngine(): Engine {
    return this.engine;
  }
  
  /**
   * Get level manager
   */
  public getLevelManager(): LevelManager {
    return this.levelManager;
  }
  
  /**
   * Get game state manager
   */
  public getGameStateManager(): GameStateManager {
    return this.gameStateManager;
  }
  
  /**
   * Get interaction system
   */
  public getInteractionSystem(): InteractionSystem {
    return this.interactionSystem;
  }
  
  /**
   * Get level system
   */
  public getLevelSystem(): LevelSystem {
    return this.levelSystem;
  }
  
  /**
   * Get time tracker
   */
  public getTimeTracker(): TimeTracker {
    return this.timeTracker;
  }
  
  /**
   * Check if mobile
   */
  public isMobileDevice(): boolean {
    return this.isMobile;
  }
  
  /**
   * Check if initialized
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Check if running
   */
  public getIsRunning(): boolean {
    return this.isRunning;
  }
  
  /**
   * Pause the game
   */
  public pause(): void {
    this.isRunning = false;
    this.engine.pause();
  }
  
  /**
   * Resume the game
   */
  public resume(): void {
    this.isRunning = true;
    this.engine.resume();
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      isMobile: this.isMobile,
      currentLevel: this.levelManager.getCurrentLevel()?.getLevelId() || null,
      gameState: this.gameStateManager.getState(),
      levelManagerStats: this.levelManager.getStats(),
      interactionSystemStats: this.interactionSystem.getStats(),
      engineStats: {
        isRunning: this.engine.isEngineRunning(),
        performance: this.engine.getTime()
      }
    };
  }
  
  /**
   * Dispose of the game manager
   */
  public dispose(): void {
    console.log('🧹 Disposing GameManager...');
    
    this.isRunning = false;
    
    // Dispose systems in reverse order
    this.playerLight?.dispose();
    this.levelManager?.dispose();
    this.gameStateManager?.dispose();
    this.interactionSystem?.dispose();
    this.universalInputManager?.dispose();
    // Movement handled by MovementComponent in BaseLevel
    this.engine?.dispose();
    
    console.log('✅ GameManager disposed');
  }
}