import { GameState } from './GameState';
import type { GameStats, StarData, GameSettings } from './GameState';
import { EventBus } from '../../engine/core/EventBus';

/**
 * Centralized game state management with event-driven updates
 */
export class GameStateManager {
  private gameState: GameState;
  private eventBus: EventBus;
  private autoSaveInterval: number = 30000; // 30 seconds
  private autoSaveTimer: NodeJS.Timeout | null = null;
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.gameState = new GameState();
    this.setupEventListeners();
    this.startAutoSave();
  }
  
  /**
   * Get the current game state
   */
  public getState(): GameState {
    return this.gameState;
  }
  
  /**
   * Get current level
   */
  public getCurrentLevel(): string {
    return this.gameState.currentLevel;
  }
  
  /**
   * Set current level
   */
  public setCurrentLevel(levelId: string): void {
    const previousLevel = this.gameState.currentLevel;
    this.gameState.previousLevel = previousLevel;
    this.gameState.currentLevel = levelId;
    
    // Update stats
    if (!this.gameState.completedLevels.has(levelId)) {
      this.gameState.gameStats.levelsVisited++;
    }
    
    this.emitStateChange('level.changed', {
      from: previousLevel,
      to: levelId,
      gameStats: this.gameState.gameStats
    });
  }
  
  /**
   * Get selected star
   */
  public getSelectedStar(): StarData | null {
    return this.gameState.selectedStar;
  }
  
  /**
   * Set selected star
   */
  public setSelectedStar(starData: StarData | null): void {
    this.gameState.selectedStar = starData;
    
    if (starData) {
      // Track discovered stars
      if (!this.gameState.discoveredStars.has(starData.uniqueId)) {
        this.gameState.discoveredStars.add(starData.uniqueId);
        this.gameState.gameStats.starsDiscovered++;
      }
    }
    
    this.emitStateChange('star.selected', {
      star: starData,
      gameStats: this.gameState.gameStats
    });
  }
  
  /**
   * Get game statistics
   */
  public getGameStats(): GameStats {
    return { ...this.gameState.gameStats };
  }
  
  /**
   * Update game statistics
   */
  public updateGameStats(updates: Partial<GameStats>): void {
    Object.assign(this.gameState.gameStats, updates);
    
    this.emitStateChange('stats.updated', {
      gameStats: this.gameState.gameStats,
      updates
    });
  }
  
  /**
   * Get game settings
   */
  public getSettings(): GameSettings {
    return { ...this.gameState.settings };
  }
  
  /**
   * Update game settings
   */
  public updateSettings(updates: Partial<GameSettings>): void {
    Object.assign(this.gameState.settings, updates);
    
    this.emitStateChange('settings.updated', {
      settings: this.gameState.settings,
      updates
    });
  }
  
  /**
   * Mark level as completed
   */
  public markLevelCompleted(levelId: string): void {
    if (!this.gameState.completedLevels.has(levelId)) {
      this.gameState.completedLevels.add(levelId);
      
      this.emitStateChange('level.completed', {
        levelId,
        completedLevels: Array.from(this.gameState.completedLevels)
      });
    }
  }
  
  /**
   * Unlock content
   */
  public unlockContent(contentId: string): void {
    if (!this.gameState.unlockedContent.has(contentId)) {
      this.gameState.unlockedContent.add(contentId);
      
      this.emitStateChange('content.unlocked', {
        contentId,
        unlockedContent: Array.from(this.gameState.unlockedContent)
      });
    }
  }
  
  /**
   * Collect item
   */
  public collectItem(itemId: string): void {
    if (!this.gameState.collectedItems.has(itemId)) {
      this.gameState.collectedItems.add(itemId);
      
      this.emitStateChange('item.collected', {
        itemId,
        collectedItems: Array.from(this.gameState.collectedItems)
      });
    }
  }
  
  /**
   * Record interaction
   */
  public recordInteraction(interactionType: string, data?: any): void {
    this.gameState.gameStats.interactionsPerformed++;
    
    this.emitStateChange('interaction.recorded', {
      interactionType,
      data,
      totalInteractions: this.gameState.gameStats.interactionsPerformed
    });
  }
  
  /**
   * Update play time from TimeTracker events
   */
  public updatePlayTime(timeData: { totalPlayTime: number; timeExplored: number }): void {
    this.gameState.gameStats.timeExplored = timeData.timeExplored;
    this.gameState.sessionData.totalPlayTime = timeData.totalPlayTime;
    
    this.emitStateChange('time.updated', {
      timeExplored: timeData.timeExplored,
      totalPlayTime: timeData.totalPlayTime
    });
  }
  
  /**
   * Save game state to localStorage
   */
  public saveGame(): boolean {
    try {
      this.gameState.sessionData.lastSaveTime = Date.now();
      const saveData = this.gameState.serialize();
      localStorage.setItem('megameal_save', saveData);
      
      // Game state saved (reduced logging)
      
      this.emitStateChange('game.saved', {
        saveTime: this.gameState.sessionData.lastSaveTime
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to save game state:', error);
      
      this.emitStateChange('game.save_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return false;
    }
  }
  
  /**
   * Load game state from localStorage
   */
  public loadGame(): boolean {
    try {
      const saveData = localStorage.getItem('megameal_save');
      if (!saveData) {
        console.log('📂 No save data found');
        return false;
      }
      
      this.gameState.deserialize(saveData);
      
      console.log('📁 Game state loaded successfully');
      
      this.emitStateChange('game.loaded', {
        gameState: this.gameState.clone()
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to load game state:', error);
      
      this.emitStateChange('game.load_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return false;
    }
  }
  
  /**
   * Reset game state
   */
  public resetGame(): void {
    this.gameState.reset();
    
    // Clear save data
    localStorage.removeItem('megameal_save');
    
    console.log('🔄 Game state reset');
    
    this.emitStateChange('game.reset', {
      gameState: this.gameState.clone()
    });
  }
  
  /**
   * Get save data info
   */
  public getSaveInfo(): SaveInfo | null {
    const saveData = localStorage.getItem('megameal_save');
    if (!saveData) return null;
    
    try {
      const data = JSON.parse(saveData);
      return {
        lastSaveTime: data.sessionData?.lastSaveTime || Date.now(),
        saveVersion: data.sessionData?.saveVersion || '1.0.0',
        currentLevel: data.currentLevel || 'observatory',
        starsDiscovered: data.gameStats?.starsDiscovered || 0,
        timeExplored: data.gameStats?.timeExplored || 0,
        levelsVisited: data.gameStats?.levelsVisited || 0
      };
    } catch (error) {
      console.error('Failed to parse save info:', error);
      return null;
    }
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for level transitions
    this.eventBus.on('level.transition.complete', (data: any) => {
      this.setCurrentLevel(data.to);
    });
    
    // Listen for star selections
    this.eventBus.on('star.selected', (data: any) => {
      this.setSelectedStar(data.star);
    });
    
    // Listen for interactions
    this.eventBus.on('interaction.performed', (data: any) => {
      this.recordInteraction(data.interactionType, data);
    });
    
    // Listen for time updates from TimeTracker
    this.eventBus.on('time.updated', (timeData: any) => {
      this.updatePlayTime(timeData);
    });
    
    // Listen for level cleanup
    this.eventBus.on('level.cleanup', (data: any) => {
      console.log(`🧹 Level cleanup received: ${data.levelId}`);
      // Clear any level-specific state
      this.setSelectedStar(null);
    });
    
    // Listen for UI clear events
    this.eventBus.on('ui.clearAll', () => {
      console.log('🧹 UI clear all received');
      // Clear selected star and other UI state
      this.setSelectedStar(null);
    });
    
    // Listen for save/load requests
    this.eventBus.on('game.save.request', () => {
      this.saveGame();
    });
    
    this.eventBus.on('game.load.request', () => {
      this.loadGame();
    });
    
    this.eventBus.on('game.reset.request', () => {
      this.resetGame();
    });
  }
  
  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      this.saveGame();
    }, this.autoSaveInterval);
  }
  
  /**
   * Stop auto-save timer
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
  
  /**
   * Emit state change event
   */
  private emitStateChange(eventType: string, data: any): void {
    this.eventBus.emit(`gamestate.${eventType}`, data);
  }
  
  /**
   * Dispose of the game state manager
   */
  public dispose(): void {
    this.stopAutoSave();
    
    // Final save on dispose
    this.saveGame();
    
    console.log('🧹 GameStateManager disposed');
  }
}

/**
 * Save information interface
 */
export interface SaveInfo {
  lastSaveTime: number;
  saveVersion: string;
  currentLevel: string;
  starsDiscovered: number;
  timeExplored: number;
  levelsVisited: number;
}