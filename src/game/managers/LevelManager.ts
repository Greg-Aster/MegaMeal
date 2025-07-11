import { BaseLevel } from '../levels/BaseLevel';
import { Engine } from '../../engine/core/Engine';
import { EventBus } from '../../engine/core/EventBus';
import { InteractionSystem } from '../../engine/systems/InteractionSystem';
import { ErrorHandler } from '../../engine/utils/ErrorHandler';

/**
 * Centralized level management system
 * Handles level transitions, loading, and cleanup
 */
export class LevelManager {
  private engine: Engine;
  private eventBus: EventBus;
  private interactionSystem: InteractionSystem;
  private currentLevel: BaseLevel | null = null;
  private levelRegistry: Map<string, LevelProvider> = new Map();
  private levelHistory: string[] = [];
  private isTransitioning = false;
  
  // Transition settings
  private transitionDuration = 1000; // ms
  private fadeElement: HTMLElement | null = null;
  
  constructor(engine: Engine, interactionSystem: InteractionSystem) {
    this.engine = engine;
    this.interactionSystem = interactionSystem;
    this.eventBus = engine.getEventBus();
    this.setupEventListeners();
    this.createFadeElement();
  }
  
  /**
   * Register a level class or factory with the manager
   */
  public registerLevel(levelId: string, levelProvider: LevelProvider): void {
    this.levelRegistry.set(levelId, levelProvider);
    const type = typeof levelProvider === 'function' && levelProvider.prototype ? 'constructor' : 'factory';
    console.log(`📝 Registered level: ${levelId} (${type})`);
  }
  
  /**
   * Get the current level
   */
  public getCurrentLevel(): BaseLevel | null {
    return this.currentLevel;
  }
  
  /**
   * Get current level ID
   */
  public getCurrentLevelId(): string | null {
    return this.currentLevel?.getLevelId() || null;
  }
  
  /**
   * Check if a level is registered
   */
  public isLevelRegistered(levelId: string): boolean {
    return this.levelRegistry.has(levelId);
  }
  
  /**
   * Get all registered level IDs
   */
  public getRegisteredLevels(): string[] {
    return Array.from(this.levelRegistry.keys());
  }
  
  /**
   * Transition to a new level
   */
  public async transitionToLevel(levelId: string, transitionData?: any): Promise<boolean> {
    if (this.isTransitioning) {
      console.warn('Level transition already in progress');
      return false;
    }
    
    if (!this.levelRegistry.has(levelId)) {
      console.error(`Level ${levelId} is not registered`);
      return false;
    }
    
    if (this.currentLevel?.getLevelId() === levelId) {
      console.warn(`Already in level ${levelId}`);
      return false;
    }
    
    this.isTransitioning = true;
    
    try {
      console.log(`🌟 Starting transition to level: ${levelId}`);
      
      // Emit transition start event
      this.eventBus.emit('level.transition.start', {
        from: this.currentLevel?.getLevelId() || null,
        to: levelId,
        transitionData
      });
      
      // Show fade transition
      await this.showFadeTransition();
      
      // Dispose current level
      if (this.currentLevel) {
        console.log(`🧹 Performing cleanup for current level: ${this.currentLevel.getLevelId()}`);
        
        // Call automatic cleanup system before disposing
        this.currentLevel.performLevelCleanup();
        
        console.log(`🧹 Disposing current level: ${this.currentLevel.getLevelId()}`);
        await this.currentLevel.dispose();
        this.currentLevel = null;
      }
      
      // Create and initialize new level
      const levelProvider = this.levelRegistry.get(levelId)!;
      console.log(`🏗️ Creating new level: ${levelId}`);
      
      // Determine if it's a constructor or factory function
      if (typeof levelProvider === 'function' && levelProvider.prototype) {
        // Traditional constructor pattern (old architecture)
        const LevelClass = levelProvider as LevelConstructor;
        this.currentLevel = new LevelClass(this.engine, this.interactionSystem, levelId);
        await this.currentLevel.initialize();
      } else {
        // Factory function pattern (new data-driven architecture)
        const levelFactory = levelProvider as LevelFactory;
        this.currentLevel = await levelFactory(levelId);
        // Factory functions should return already initialized levels
      }
      
      // Update level history
      this.levelHistory.push(levelId);
      if (this.levelHistory.length > 10) {
        this.levelHistory.shift(); // Keep only last 10 levels
      }
      
      // Hide fade transition
      await this.hideFadeTransition();
      
      // Emit transition complete event
      this.eventBus.emit('level.transition.complete', {
        from: this.levelHistory[this.levelHistory.length - 2] || null,
        to: levelId,
        level: this.currentLevel,
        transitionData
      });
      
      console.log(`✅ Successfully transitioned to level: ${levelId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to transition to level ${levelId}:`, error);
      
      // Emit transition error event
      this.eventBus.emit('level.transition.error', {
        from: this.currentLevel?.getLevelId() || null,
        to: levelId,
        error,
        transitionData
      });
      
      // Hide fade transition even on error
      await this.hideFadeTransition();
      
      return false;
      
    } finally {
      this.isTransitioning = false;
    }
  }
  
  /**
   * Return to the previous level
   */
  public async returnToPreviousLevel(): Promise<boolean> {
    if (this.levelHistory.length < 2) {
      console.warn('No previous level to return to');
      return false;
    }
    
    // Get the previous level (second to last in history)
    const previousLevelId = this.levelHistory[this.levelHistory.length - 2];
    
    // Remove current level from history so we don't get stuck in a loop
    this.levelHistory.pop();
    
    return await this.transitionToLevel(previousLevelId);
  }
  
  /**
   * Reload the current level
   */
  public async reloadCurrentLevel(): Promise<boolean> {
    if (!this.currentLevel) {
      console.warn('No current level to reload');
      return false;
    }
    
    const currentLevelId = this.currentLevel.getLevelId();
    return await this.transitionToLevel(currentLevelId);
  }
  
  /**
   * Update the current level
   */
  public update(deltaTime: number): void {
    if (this.currentLevel && !this.isTransitioning) {
      this.currentLevel.update(deltaTime);
    }
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for level transition requests
    this.eventBus.on('level.transition.request', (data: any) => {
      this.transitionToLevel(data.levelId, data.transitionData);
    });
    
    // Listen for return to previous level requests
    this.eventBus.on('level.return.request', () => {
      this.returnToPreviousLevel();
    });
    
    // Listen for level reload requests
    this.eventBus.on('level.reload.request', () => {
      this.reloadCurrentLevel();
    });
  }
  
  /**
   * Create fade transition element
   */
  private createFadeElement(): void {
    this.fadeElement = document.createElement('div');
    this.fadeElement.id = 'level-transition-fade';
    this.fadeElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: black;
      opacity: 0;
      visibility: hidden;
      z-index: 9999;
      transition: opacity ${this.transitionDuration / 2}ms ease-in-out;
      pointer-events: none;
    `;
    
    document.body.appendChild(this.fadeElement);
  }
  
  /**
   * Show fade transition
   */
  private async showFadeTransition(): Promise<void> {
    if (!this.fadeElement) return;
    
    return new Promise<void>((resolve) => {
      this.fadeElement!.style.visibility = 'visible';
      this.fadeElement!.style.opacity = '1';
      
      setTimeout(() => {
        resolve();
      }, this.transitionDuration / 2);
    });
  }
  
  /**
   * Hide fade transition
   */
  private async hideFadeTransition(): Promise<void> {
    if (!this.fadeElement) return;
    
    return new Promise<void>((resolve) => {
      this.fadeElement!.style.opacity = '0';
      
      setTimeout(() => {
        this.fadeElement!.style.visibility = 'hidden';
        resolve();
      }, this.transitionDuration / 2);
    });
  }
  
  /**
   * Get level manager statistics
   */
  public getStats(): LevelManagerStats {
    return {
      currentLevelId: this.currentLevel?.getLevelId() || null,
      registeredLevels: this.getRegisteredLevels(),
      levelHistory: [...this.levelHistory],
      isTransitioning: this.isTransitioning,
      currentLevelInfo: this.currentLevel?.getLevelInfo() || null
    };
  }
  
  /**
   * Dispose of the level manager
   */
  public dispose(): void {
    console.log('🧹 Disposing LevelManager...');
    
    // Dispose current level
    if (this.currentLevel) {
      this.currentLevel.dispose();
      this.currentLevel = null;
    }
    
    // Remove fade element
    if (this.fadeElement && this.fadeElement.parentNode) {
      this.fadeElement.parentNode.removeChild(this.fadeElement);
      this.fadeElement = null;
    }
    
    // Clear registrations
    this.levelRegistry.clear();
    this.levelHistory = [];
    
    console.log('✅ LevelManager disposed');
  }
}

/**
 * Level constructor type
 */
export type LevelConstructor = new (engine: Engine, interactionSystem: InteractionSystem, levelId: string) => BaseLevel;
export type LevelFactory = (levelId: string) => Promise<BaseLevel>;
export type LevelProvider = LevelConstructor | LevelFactory;

/**
 * Level manager statistics
 */
export interface LevelManagerStats {
  currentLevelId: string | null;
  registeredLevels: string[];
  levelHistory: string[];
  isTransitioning: boolean;
  currentLevelInfo: any;
}

/**
 * Level transition data
 */
export interface LevelTransitionData {
  from: string | null;
  to: string;
  transitionData?: any;
  level?: BaseLevel;
  error?: Error;
}