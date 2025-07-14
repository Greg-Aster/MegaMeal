import { writable, derived, readable, type Readable, type Writable } from 'svelte/store';
import { GameState } from '../state/GameState';
import type { GameStats, GameSettings, StarData } from '../state/GameState';
import { GameStateManager } from '../state/GameStateManager_Enhanced';
import { GameAction } from '../state/GameActions';
import { GameEvents } from '../events/GameEvents';
import { EventBus } from '../../engine/core/EventBus';

/**
 * Reactive Svelte stores for game state management
 * Provides reactive UI updates when game state changes
 */

// Core state stores
export const gameState: Writable<GameState> = writable(new GameState());
export const isLoading: Writable<boolean> = writable(true);
export const error: Writable<string | null> = writable(null);
export const isInitialized: Writable<boolean> = writable(false);

// Game manager reference
let gameStateManager: GameStateManager | null = null;
let eventBus: EventBus | null = null;

/**
 * Initialize the reactive store system
 */
export function initializeGameStore(manager: GameStateManager, bus: EventBus): void {
  gameStateManager = manager;
  eventBus = bus;
  
  // Subscribe to state changes
  gameStateManager.subscribe((action: GameAction, previousState: GameState, newState: GameState) => {
    gameState.set(newState);
    
    // Handle loading state
    if (action.type === 'GAME_INITIALIZED') {
      isInitialized.set(true);
      isLoading.set(false);
    }
    
    // Handle errors
    if (action.type === 'ERROR_OCCURRED') {
      error.set(action.payload.error.message);
    }
    
    if (action.type === 'ERROR_RECOVERED') {
      error.set(null);
    }
  });
  
  // Set initial state
  gameState.set(gameStateManager.getState());
}

// Derived stores for specific parts of the state
export const currentLevel: Readable<string> = derived(
  gameState,
  ($gameState) => $gameState.currentLevel
);

export const previousLevel: Readable<string | null> = derived(
  gameState,
  ($gameState) => $gameState.previousLevel
);

export const selectedStar: Readable<StarData | null> = derived(
  gameState,
  ($gameState) => $gameState.selectedStar
);

export const discoveredStars: Readable<Set<string>> = derived(
  gameState,
  ($gameState) => $gameState.discoveredStars
);

export const gameStats: Readable<GameStats> = derived(
  gameState,
  ($gameState) => $gameState.gameStats
);

export const gameSettings: Readable<GameSettings> = derived(
  gameState,
  ($gameState) => $gameState.settings
);

export const completedLevels: Readable<Set<string>> = derived(
  gameState,
  ($gameState) => $gameState.completedLevels
);

export const unlockedContent: Readable<Set<string>> = derived(
  gameState,
  ($gameState) => $gameState.unlockedContent
);

export const collectedItems: Readable<Set<string>> = derived(
  gameState,
  ($gameState) => $gameState.collectedItems
);

// Computed stores for UI convenience
export const starsDiscoveredCount: Readable<number> = derived(
  gameStats,
  ($gameStats) => $gameStats.starsDiscovered
);

export const timeExploredFormatted: Readable<string> = derived(
  gameStats,
  ($gameStats) => {
    const minutes = Math.floor($gameStats.timeExplored / 60);
    const seconds = Math.floor($gameStats.timeExplored % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
);

export const levelsCompletedCount: Readable<number> = derived(
  completedLevels,
  ($completedLevels) => $completedLevels.size
);

export const progressPercentage: Readable<number> = derived(
  [completedLevels, unlockedContent],
  ([$completedLevels, $unlockedContent]) => {
    const totalLevels = 3; // observatory, miranda, restaurant
    const totalContent = 10; // estimated total unlockable content
    
    const progress = ($completedLevels.size / totalLevels) * 0.7 + 
                    ($unlockedContent.size / totalContent) * 0.3;
    
    return Math.min(progress * 100, 100);
  }
);

// Level-specific stores
export const isInObservatory: Readable<boolean> = derived(
  currentLevel,
  ($currentLevel) => $currentLevel === 'observatory'
);

export const isInMirandaShip: Readable<boolean> = derived(
  currentLevel,
  ($currentLevel) => $currentLevel === 'miranda'
);

export const isInRestaurant: Readable<boolean> = derived(
  currentLevel,
  ($currentLevel) => $currentLevel === 'restaurant'
);

// UI state stores
export const showStarCard: Readable<boolean> = derived(
  selectedStar,
  ($selectedStar) => $selectedStar !== null
);

export const showMobileControls: Readable<boolean> = derived(
  gameSettings,
  ($gameSettings) => $gameSettings.enableMobileControls
);

export const showDebugInfo: Readable<boolean> = derived(
  gameSettings,
  ($gameSettings) => $gameSettings.showDebugInfo
);

// Performance stores - event-driven
export const performanceMetrics: Readable<any> = readable(null, (set) => {
  if (!gameStateManager || !eventBus) return;
  
  // Listen for performance update events instead of polling
  const callback = (metrics: any) => {
    set(metrics);
  };
  
  eventBus.on('performance.metrics.updated', callback);
  
  // Initial value
  set(gameStateManager.getPerformanceMetrics());
  
  return () => {
    if (eventBus) {
      eventBus.off('performance.metrics.updated', callback);
    }
  };
});

// Save/Load stores
export const saveInfo: Readable<any> = derived(
  gameState,
  ($gameState) => {
    const saveData = localStorage.getItem('megameal_save_meta');
    if (!saveData) return null;
    
    try {
      return JSON.parse(saveData);
    } catch {
      return null;
    }
  }
);

export const hasSaveData: Readable<boolean> = derived(
  saveInfo,
  ($saveInfo) => $saveInfo !== null
);

// Action dispatchers for UI components
export const gameActions = {
  /**
   * Dispatch a level transition
   */
  transitionToLevel: (levelId: string) => {
    if (!eventBus) return;
    eventBus.emit(GameEvents.LEVEL_TRANSITION_REQUEST, { levelId });
  },
  
  /**
   * Select a star
   */
  selectStar: (star: StarData, method: 'click' | 'touch' | 'keyboard' = 'click') => {
    if (!eventBus) return;
    eventBus.emit(GameEvents.STAR_SELECTED, { star, selectionMethod: method });
  },
  
  /**
   * Deselect current star
   */
  deselectStar: () => {
    if (!eventBus) return;
    eventBus.emit(GameEvents.STAR_DESELECTED, { previousStar: null });
  },
  
  /**
   * Update game settings
   */
  updateSettings: (updates: Partial<GameSettings>) => {
    if (!gameStateManager) return;
    gameStateManager.dispatch({
      type: 'SETTINGS_UPDATE',
      payload: { updates },
      meta: { timestamp: Date.now(), source: 'UI' }
    });
  },
  
  /**
   * Save game manually
   */
  saveGame: () => {
    if (!gameStateManager) return;
    gameStateManager.saveGame('manual');
  },
  
  /**
   * Load game
   */
  loadGame: () => {
    if (!gameStateManager) return;
    gameStateManager.loadGame();
  },
  
  /**
   * Reset game
   */
  resetGame: (preserveSettings = false) => {
    if (!gameStateManager) return;
    gameStateManager.resetGame(preserveSettings);
  },
  
  /**
   * Record player interaction
   */
  recordInteraction: (interactionType: string, data?: any) => {
    if (!gameStateManager) return;
    gameStateManager.dispatch({
      type: 'INTERACTION_RECORDED',
      payload: { interactionType, data },
      meta: { timestamp: Date.now(), source: 'UI' }
    });
  }
};

// Utility functions for UI
export const storeUtils = {
  /**
   * Get current state snapshot
   */
  getStateSnapshot: (): GameState => {
    if (!gameStateManager) return new GameState();
    return gameStateManager.getState();
  },
  
  /**
   * Check if level is completed
   */
  isLevelCompleted: (levelId: string): boolean => {
    const state = storeUtils.getStateSnapshot();
    return state.completedLevels.has(levelId);
  },
  
  /**
   * Check if content is unlocked
   */
  isContentUnlocked: (contentId: string): boolean => {
    const state = storeUtils.getStateSnapshot();
    return state.unlockedContent.has(contentId);
  },
  
  /**
   * Check if item is collected
   */
  isItemCollected: (itemId: string): boolean => {
    const state = storeUtils.getStateSnapshot();
    return state.collectedItems.has(itemId);
  },
  
  /**
   * Get star discovery status
   */
  isStarDiscovered: (starId: string): boolean => {
    const state = storeUtils.getStateSnapshot();
    return state.discoveredStars.has(starId);
  },
  
  /**
   * Format time duration
   */
  formatTime: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  },
  
  /**
   * Get level display name
   */
  getLevelDisplayName: (levelId: string): string => {
    const levelNames: Record<string, string> = {
      'observatory': 'Star Observatory Alpha',
      'miranda': 'Miranda Ship Debris Field',
      'restaurant': 'Restaurant Backroom'
    };
    
    return levelNames[levelId] || levelId;
  }
};

// Debug store for development - event-driven
export const debugStore = {
  actionHistory: readable([] as GameAction[], (set) => {
    if (!gameStateManager || !eventBus) return;
    
    // Listen for action dispatch events instead of polling
    const callback = () => {
      set(gameStateManager!.getActionHistory());
    };
    
    eventBus.on('debug.action.dispatched', callback);
    
    // Initial value
    set(gameStateManager.getActionHistory());
    
    return () => {
      if (eventBus) {
        eventBus.off('debug.action.dispatched', callback);
      }
    };
  }),
  
  performanceMetrics: readable(null as any, (set) => {
    if (!gameStateManager || !eventBus) return;
    
    // Listen for performance update events instead of polling
    const callback = (metrics: any) => {
      set(metrics);
    };
    
    eventBus.on('debug.performance.updated', callback);
    
    // Initial value
    set(gameStateManager.getPerformanceMetrics());
    
    return () => {
      if (eventBus) {
        eventBus.off('debug.performance.updated', callback);
      }
    };
  })
};

// Event listeners for automatic store updates
if (typeof window !== 'undefined') {
  // Listen for browser events that might affect the game state
  window.addEventListener('beforeunload', () => {
    if (gameStateManager) {
      gameStateManager.saveGame('auto');
    }
  });
  
  window.addEventListener('visibilitychange', () => {
    if (!gameStateManager || !eventBus) return;
    
    if (document.hidden) {
      eventBus.emit(GameEvents.GAME_PAUSED, { 
        pauseReason: 'system', 
        pauseTime: Date.now() 
      });
    } else {
      eventBus.emit(GameEvents.GAME_RESUMED, { 
        pauseDuration: 0, 
        resumeTime: Date.now() 
      });
    }
  });
}

// Export types for TypeScript support
export type { GameState, GameStats, GameSettings, StarData };
export type { GameAction } from '../state/GameActions';