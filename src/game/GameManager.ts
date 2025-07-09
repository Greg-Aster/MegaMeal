import { Engine } from '../engine/core/Engine';
import { LevelManager } from './managers/LevelManager';
import { GameStateManager } from './state/GameStateManager';
import { InteractionSystem } from '../engine/systems/InteractionSystem';
import { UniversalInputManager } from '../engine/input/UniversalInputManager';
import { HybridControls } from '../engine/input/HybridControls';
import { ErrorHandler } from '../engine/utils/ErrorHandler';
import type { ErrorContext } from '../engine/utils/ErrorHandler';

// Import the new migrated levels
import { StarObservatory } from './levels/StarObservatory';
import { MirandaShip } from './levels/MirandaShip';
import { RestaurantBackroom } from './levels/RestaurantBackroom';

/**
 * Updated GameManager using the new BaseLevel architecture
 * Much cleaner and more maintainable than the original
 */
export class GameManager {
  private engine: Engine;
  private levelManager: LevelManager;
  private gameStateManager: GameStateManager;
  private interactionSystem: InteractionSystem;
  private hybridControls: HybridControls;
  private universalInputManager: UniversalInputManager;
  
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

      // Initialize hybrid controls
      await this.initializeControls();
      
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
   * Register the new migrated levels
   */
  private registerMigratedLevels(): void {
    // Register levels using the new BaseLevel pattern
    this.levelManager.registerLevel('observatory', StarObservatory);
    this.levelManager.registerLevel('miranda', MirandaShip);
    this.levelManager.registerLevel('restaurant', RestaurantBackroom);
  }
  
  /**
   * Initialize controls with improved settings
   */
  private async initializeControls(): Promise<void> {
    const THREE = await import('three');
    
    this.hybridControls = new HybridControls(
      THREE,
      this.engine.getCamera(),
      this.engine.getRenderer().getDomElement(),
      this.engine.getEventBus(),
      this.engine.getInputManager(),
      this.engine.getPhysicsWorld(),
      {
        moveSpeed: 50,
        orbitControls: {
          enableDamping: true,
          dampingFactor: 0.2,
          rotateSpeed: 0.1,
          zoomSpeed: 1.0,
          enablePan: false,
          minDistance: 50,
          maxDistance: 300,
          autoRotate: false,
          enableTouch: true,
          touchRotateSpeed: 0.3,
          touchZoomSpeed: 1.5
        }
      }
    );
    
    await this.hybridControls.initialize();
    
    // Set initial camera position
    const camera = this.engine.getCamera();
    camera.position.set(0, -3.4, 50);
    
    const lookUpAngle = THREE.MathUtils.degToRad(15);
    camera.rotation.x = -lookUpAngle;
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
      
      // Pass to current level if it's the observatory
      const currentLevel = this.levelManager.getCurrentLevel();
      if (currentLevel && currentLevel.getLevelId() === 'observatory') {
        (currentLevel as StarObservatory).setTimelineEvents(events);
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
        // Update camera controls based on level
        this.updateControlsForLevel(levelId);
        
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
        const observatory = currentLevel as StarObservatory;
        
        const events = this.gameStateManager.getState().timelineEvents;
        if (events && events.length > 0) {
          observatory.setTimelineEvents(events);
        }
        
        // Set up star selection callback
        observatory.onStarSelected((star) => {
          this.gameStateManager.setSelectedStar(star);
        });
        
        break;
        
      case 'miranda':
        const miranda = currentLevel as MirandaShip;
        
        // Set up story callbacks
        miranda.onNoteFound((noteId, content) => {
          console.log(`📝 Found captain's log ${noteId}: ${content}`);
          this.engine.getEventBus().emit('story.note_found', { noteId, content });
        });
        
        miranda.onSafeOpened((recipe) => {
          console.log('🔓 Safe opened! Found the Perfect Mary recipe:', recipe);
          this.engine.getEventBus().emit('story.safe_opened', { recipe });
        });
        
        break;
        
      case 'restaurant':
        const restaurant = currentLevel as RestaurantBackroom;
        
        break;
    }
  }
  
  /**
   * Update controls for specific level
   */
  private updateControlsForLevel(levelId: string): void {
    const camera = this.engine.getCamera();
    
    switch (levelId) {
      case 'observatory':
        camera.position.set(0, -3.4, 50);
        this.hybridControls.setMoveSpeed(50);
        break;
        
      case 'miranda':
        camera.position.set(40, 8, 15);
        camera.lookAt(0, 0, 0);
        this.hybridControls.setMoveSpeed(25);
        break;
        
      case 'restaurant':
        camera.position.set(0, 2.5, 8);
        camera.lookAt(0, 1.5, 0);
        this.hybridControls.setMoveSpeed(20);
        break;
    }
  }
  
  /**
   * Handle mobile movement
   */
  private handleMobileMovement(data: { x: number, z: number }): void {
    if (this.engine && this.engine.getInputManager()) {
      this.engine.getInputManager().setVirtualMovement(data.x, 0, data.z);
    }
  }
  
  /**
   * Handle mobile actions
   */
  private handleMobileAction(action: string): void {
    if (action === 'jump') {
      if (this.engine && this.engine.getInputManager()) {
        this.engine.getInputManager().setVirtualAction('jump', true);
        setTimeout(() => {
          if (this.engine && this.engine.getInputManager()) {
            this.engine.getInputManager().setVirtualAction('jump', false);
          }
        }, 100);
      }
    }
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
   * Reset view/camera
   */
  public resetView(): void {
    const currentLevel = this.gameStateManager.getCurrentLevel();
    this.updateControlsForLevel(currentLevel);
    
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
    this.hybridControls?.dispose();
    this.engine?.dispose();
    
    console.log('✅ GameManager disposed');
  }
}