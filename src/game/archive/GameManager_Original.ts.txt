import { Engine } from '../engine/core/Engine';
import { LevelManager } from './managers/LevelManager';
import { GameStateManager } from './state/GameStateManager';
import { InteractionSystem } from '../engine/systems/InteractionSystem';
import { HybridControls } from '../engine/input/HybridControls';
import { StarObservatory } from './levels/StarObservatory';
import { MirandaShip } from './levels/MirandaShip';
import { RestaurantBackroom } from './levels/RestaurantBackroom';

/**
 * Main game manager that orchestrates all game systems
 * Replaces the complex logic in Game.svelte
 */
export class GameManager {
  private engine: Engine;
  private levelManager: LevelManager;
  private gameStateManager: GameStateManager;
  private interactionSystem: InteractionSystem;
  private hybridControls: HybridControls;
  
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
    this.levelManager = new LevelManager(this.engine);
    this.gameStateManager = new GameStateManager(this.engine.getEventBus());
    
    // Detect mobile
    this.isMobile = this.detectMobile();
    
    this.setupEventListeners();
  }
  
  /**
   * Initialize the game manager
   */
  public async initialize(timelineEvents: string = '[]'): Promise<void> {
    if (this.isInitialized) {
      console.warn('GameManager already initialized');
      return;
    }
    
    try {
      console.log('🚀 Initializing GameManager...');
      
      // Initialize engine
      await this.engine.initialize();
      
      // Initialize interaction system
      this.interactionSystem = new InteractionSystem(
        this.engine.getCamera(),
        this.engine.getContainer(),
        this.engine.getEventBus()
      );
      
      // Initialize hybrid controls
      await this.initializeControls();
      
      // Register levels
      this.registerLevels();
      
      // Load timeline events
      this.loadTimelineEvents(timelineEvents);
      
      // Try to load saved game
      this.gameStateManager.loadGame();
      
      // Start with the current level from game state
      const currentLevel = this.gameStateManager.getCurrentLevel();
      await this.levelManager.transitionToLevel(currentLevel);
      
      // Start engine
      this.engine.start();
      
      // Set up update loop
      this.setupUpdateLoop();
      
      this.isInitialized = true;
      this.isRunning = true;
      
      console.log('✅ GameManager initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize GameManager:', error);
      throw error;
    }
  }
  
  /**
   * Register all game levels
   */
  private registerLevels(): void {
    // Note: These would need to be adapted to use the new BaseLevel pattern
    // For now, we're creating wrapper classes
    this.levelManager.registerLevel('observatory', StarObservatory as any);
    this.levelManager.registerLevel('miranda', MirandaShip as any);
    this.levelManager.registerLevel('restaurant', RestaurantBackroom as any);
  }
  
  /**
   * Initialize controls
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
   * Load timeline events
   */
  private loadTimelineEvents(timelineEvents: string): void {
    try {
      const events = JSON.parse(timelineEvents);
      
      // Add level events
      const levelEvents = [
        {
          title: "The Miranda Incident",
          description: "Investigate the mysterious debris field and uncover the secrets of the Perfect Mary recipe.",
          slug: "miranda-ship-level",
          uniqueId: "miranda-incident-level",
          timelineYear: 28042,
          timelineEra: "singularity-conflict",
          timelineLocation: "Miranda Star System Debris Field",
          isKeyEvent: true,
          isLevel: true,
          tags: ["Level", "Investigation", "Mystery"],
          category: "GAME_LEVEL"
        },
        {
          title: "The Hamburgler's Kitchen",
          description: "Investigate the cosmic horror backroom of a SciFi restaurant.",
          slug: "restaurant-backroom-level",
          uniqueId: "restaurant-backroom-level",
          timelineYear: 28045,
          timelineEra: "singularity-conflict",
          timelineLocation: "Restaurant Backroom",
          isKeyEvent: true,
          isLevel: true,
          tags: ["Level", "Horror", "Investigation"],
          category: "GAME_LEVEL"
        }
      ];
      
      events.push(...levelEvents);
      
      // Store in game state
      this.gameStateManager.getState().timelineEvents = events;
      
    } catch (error) {
      console.warn('Failed to parse timeline events:', error);
    }
  }
  
  /**
   * Set up update loop
   */
  private setupUpdateLoop(): void {
    this.engine.getEventBus().on('engine.update', (data) => {
      if (!this.isRunning) return;
      
      // Update managers
      this.levelManager.update(data.deltaTime);
      this.interactionSystem.update(data.deltaTime, this.engine.getCamera().position);
      
      // Update game state
      this.gameStateManager.updatePlayTime(data.deltaTime);
    });
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    const eventBus = this.engine.getEventBus();
    
    // Level transition events
    eventBus.on('level.transition.request', (data) => {
      this.transitionToLevel(data.levelId);
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
  }
  
  /**
   * Transition to a level
   */
  public async transitionToLevel(levelId: string): Promise<void> {
    try {
      const success = await this.levelManager.transitionToLevel(levelId);
      if (success) {
        // Update camera controls based on level
        this.updateControlsForLevel(levelId);
        
        // Update game state
        this.gameStateManager.setCurrentLevel(levelId);
      }
    } catch (error) {
      console.error('Failed to transition to level:', error);
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
        camera.position.set(15, 5, 20);
        camera.lookAt(0, 0, 0);
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
   * Dispose of the game manager
   */
  public dispose(): void {
    console.log('🧹 Disposing GameManager...');
    
    this.isRunning = false;
    
    // Dispose systems
    this.levelManager?.dispose();
    this.gameStateManager?.dispose();
    this.interactionSystem?.dispose();
    this.hybridControls?.dispose();
    this.engine?.dispose();
    
    console.log('✅ GameManager disposed');
  }
}