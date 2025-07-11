import { Engine } from '../engine/core/Engine';
import { LevelManager, type LevelFactory } from './managers/LevelManager';
import { GameStateManager } from './state/GameStateManager';
import { InteractionSystem } from '../engine/systems/InteractionSystem';
import { UniversalInputManager } from '../engine/input/UniversalInputManager';
import { ErrorHandler } from '../engine/utils/ErrorHandler';
import type { ErrorContext } from '../engine/utils/ErrorHandler';

// Import data-driven architecture components
import { LevelSystem } from './systems/LevelSystem';
import type { LevelConfig } from './systems/LevelSystem';

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
    // Note: LevelManager initialization moved to initialize() method after InteractionSystem is created
    
    // Detect mobile
    this.isMobile = this.detectMobile();

    // Set a global flag for graphics style. Can be controlled by UI later.
    (window as any).MEGAMEAL_VECTOR_MODE = false;
    
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
      
      // Movement now handled by MovementComponent in BaseLevel
      
      // Register migrated levels
      this.registerMigratedLevels();
      
      // Load timeline events
      this.loadTimelineEvents(timelineEvents);
      
      // Try to load saved game
      this.gameStateManager.loadGame();
      
      // Start with the current level from game state
      const currentLevel = this.gameStateManager.getCurrentLevel();
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
   * Register levels - fully data-driven architecture
   */
  private registerMigratedLevels(): void {
    // 🆕 Data-driven levels (NEW ARCHITECTURE)
    this.levelManager.registerLevel('observatory', this.createDataDrivenLevel);
    this.levelManager.registerLevel('miranda', this.createDataDrivenLevel);
    this.levelManager.registerLevel('restaurant', this.createDataDrivenLevel);
    
    console.log('📦 Levels registered: observatory, miranda, restaurant (all data-driven)');
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
   * Load timeline events and pass them to the appropriate level
   */
  private loadTimelineEvents(timelineEvents: string): void {
    try {
      const events = JSON.parse(timelineEvents);
      const normalizedEvents = events.map((event: any) => ({
        ...event,
        id: event.id || event.uniqueId || event.slug,
        uniqueId: event.uniqueId || event.id || event.slug,
        year: event.year || event.timelineYear || 0,
        timelineYear: event.timelineYear || event.year || 0,
        era: event.era || event.timelineEra || '',
        timelineEra: event.timelineEra || event.era || '',
        location: event.location || event.timelineLocation || '',
        timelineLocation: event.timelineLocation || event.location || '',
        unlocked: event.unlocked !== undefined ? event.unlocked : true
      }));
      
      // Add level events
      const levelEvents = [
        {
          id: "miranda-incident-level",
          title: "The Miranda Incident",
          description: "Investigate the mysterious debris field and uncover the secrets of the Perfect Mary recipe.",
          slug: "miranda-ship-level",
          uniqueId: "miranda-incident-level",
          year: 28042,
          timelineYear: 28042,
          era: "singularity-conflict",
          timelineEra: "singularity-conflict",
          location: "Miranda Star System Debris Field",
          timelineLocation: "Miranda Star System Debris Field",
          isKeyEvent: true,
          isLevel: true,
          tags: ["Level", "Investigation", "Mystery"],
          category: "GAME_LEVEL",
          unlocked: true
        },
        {
          id: "restaurant-backroom-level",
          title: "The Hamburgler's Kitchen",
          description: "Investigate the cosmic horror backroom of a SciFi restaurant.",
          slug: "restaurant-backroom-level",
          uniqueId: "restaurant-backroom-level",
          year: 28045,
          timelineYear: 28045,
          era: "singularity-conflict",
          timelineEra: "singularity-conflict",
          location: "Restaurant Backroom",
          timelineLocation: "Restaurant Backroom",
          isKeyEvent: true,
          isLevel: true,
          tags: ["Level", "Horror", "Investigation"],
          category: "GAME_LEVEL",
          unlocked: true
        }
      ];
      
      events.push(...levelEvents);
      
      // Store in game state
      this.gameStateManager.getState().timelineEvents = events;
      
      // Pass to current level if it's the observatory (generic approach)
      const currentLevel = this.levelManager.getCurrentLevel();
      if (currentLevel && currentLevel.getLevelId() === 'observatory') {
        (currentLevel as any).callComponentMethod?.('StarNavigationSystem', 'setTimelineEvents', events);
      }
      
    } catch (error) {
      console.warn('Failed to parse timeline events:', error);
    }
  }
  
  /**
   * Set up update loop with improved error handling
   */
  private setupUpdateLoop(): void {
    this.engine.getEventBus().on('engine.update', (data) => {
      if (!this.isRunning) return;
      
      try {
        // Update managers
        this.levelManager.update(data.deltaTime);
        this.interactionSystem.update(data.deltaTime, this.engine.getCamera().position);
        
        // Update game state
        this.gameStateManager.updatePlayTime(data.deltaTime);
        
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
    
    // Star selection events
    eventBus.on('star.selected', (data) => {
      this.gameStateManager.setSelectedStar(data.star);
    });
    
    // Interaction events
    eventBus.on('interaction.performed', (data) => {
      this.gameStateManager.recordInteraction(data.interactionType, data);
    });
    
    // Mobile control events
    eventBus.on('mobile.movement', (data) => {
      this.handleMobileMovement(data);
    });
    
    eventBus.on('mobile.action', (data) => {
      this.handleMobileAction(data);
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
      if (this.gameStateManager.getCurrentLevel() === 'observatory' && levelId !== 'observatory') {
        this.gameStateManager.setSelectedStar(null);
      }
      
      const success = await this.levelManager.transitionToLevel(levelId);
      if (success) {
        // Set camera position for level
        this.updateCameraForLevel(levelId);
        
        // Update game state
        this.gameStateManager.setCurrentLevel(levelId);
        
        // Handle level-specific setup
        await this.handleLevelSpecificSetup(levelId);
        
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
   * Handle level-specific setup after transition
   */
  private async handleLevelSpecificSetup(levelId: string): Promise<void> {
    const currentLevel = this.levelManager.getCurrentLevel();
    if (!currentLevel) return;
    
    switch (levelId) {
      case 'observatory':
        // Set up timeline events for StarNavigationSystem (generic approach)
        const events = this.gameStateManager.getState().timelineEvents;
        if (events && events.length > 0) {
          (currentLevel as any).callComponentMethod?.('StarNavigationSystem', 'setTimelineEvents', events);
        }
        
        // Set up star selection callback (generic approach)
        (currentLevel as any).callComponentMethod?.('StarNavigationSystem', 'onStarSelected', (star: any) => {
          this.gameStateManager.setSelectedStar(star);
        });
        
        break;
        
      case 'miranda':
        // Story event listeners are handled by EventBus in data-driven architecture
        console.log('🚀 Miranda level ready - story events handled by components');
        
        break;
        
      case 'restaurant':
        // Dialogue events are handled by EventBus in data-driven architecture
        console.log('🍴 Restaurant level ready - dialogue events handled by components');
        
        break;
    }
  }
  
  /**
   * Set camera position for specific level
   */
  private updateCameraForLevel(levelId: string): void {
    const camera = this.engine.getCamera();
    
    switch (levelId) {
      case 'observatory':
        camera.position.set(0, -3.4, 50);
        camera.rotation.x = -Math.PI / 12;
        break;
        
      case 'miranda':
        camera.position.set(40, 8, 15);
        camera.lookAt(0, 0, 0);
        break;
        
      case 'restaurant':
        camera.position.set(0, 1.7, 8);
        camera.lookAt(0, 1.7, 0);
        break;
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
   * Sets the global graphics style for the game.
   * @param isVector - True for stylized vector graphics, false for realistic.
   */
  public setVectorGraphicsMode(isVector: boolean): void {
    (window as any).MEGAMEAL_VECTOR_MODE = isVector;
    console.log(`🎨 Graphics mode set to: ${isVector ? 'Vector' : 'Realistic'}`);
    // Here you could emit an event to force a level reload or material update.
    // this.engine.getEventBus().emit('graphics.style.changed', { isVector });
  }
  /**
   * Reset view/camera
   */
  public resetView(): void {
    const currentLevel = this.gameStateManager.getCurrentLevel();
    this.updateCameraForLevel(currentLevel);
    
    // Clear selected star
    this.gameStateManager.setSelectedStar(null);
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
    this.levelManager?.dispose();
    this.gameStateManager?.dispose();
    this.interactionSystem?.dispose();
    this.universalInputManager?.dispose();
    // Movement handled by MovementComponent in BaseLevel
    this.engine?.dispose();
    
    console.log('✅ GameManager disposed');
  }
}