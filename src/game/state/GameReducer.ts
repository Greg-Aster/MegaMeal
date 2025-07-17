import { GameState } from './GameState';
import type { GameStats, GameSettings } from './GameState';
import { GameActionTypes } from './GameActions';
import type { GameAction, GameActionUnion } from './GameActions';

/**
 * Redux-like reducer for game state management
 * Handles all state transitions in a predictable, pure way
 */
export class GameReducer {
  /**
   * Main reducer function that processes all actions
   */
  public static reduce(state: GameState, action: GameAction): GameState {
    // Create a new state object for immutability
    const newState = state.clone();
    
    switch (action.type) {
      // Level actions
      case GameActionTypes.LEVEL_TRANSITION_START:
        return GameReducer.handleLevelTransitionStart(newState, action);
      
      case GameActionTypes.LEVEL_TRANSITION_SUCCESS:
        return GameReducer.handleLevelTransitionSuccess(newState, action);
      
      case GameActionTypes.LEVEL_TRANSITION_FAILURE:
        return GameReducer.handleLevelTransitionFailure(newState, action);
      
      case GameActionTypes.LEVEL_COMPLETED:
        return GameReducer.handleLevelCompleted(newState, action);
      
      // Star actions
      case GameActionTypes.STAR_SELECTED:
        return GameReducer.handleStarSelected(newState, action);
      
      case GameActionTypes.STAR_DESELECTED:
        return GameReducer.handleStarDeselected(newState, action);
      
      case GameActionTypes.STAR_DISCOVERED:
        return GameReducer.handleStarDiscovered(newState, action);
      
      // Stats actions
      case GameActionTypes.STATS_UPDATE:
        return GameReducer.handleStatsUpdate(newState, action);
      
      case GameActionTypes.STATS_INCREMENT:
        return GameReducer.handleStatsIncrement(newState, action);
      
      case GameActionTypes.STATS_RESET:
        return GameReducer.handleStatsReset(newState, action);
      
      // Settings actions
      case GameActionTypes.SETTINGS_UPDATE:
        return GameReducer.handleSettingsUpdate(newState, action);
      
      case GameActionTypes.SETTINGS_RESET:
        return GameReducer.handleSettingsReset(newState, action);
      
      // Progress actions
      case GameActionTypes.CONTENT_UNLOCKED:
        return GameReducer.handleContentUnlocked(newState, action);
      
      case GameActionTypes.ITEM_COLLECTED:
        return GameReducer.handleItemCollected(newState, action);
      
      case GameActionTypes.INTERACTION_RECORDED:
        return GameReducer.handleInteractionRecorded(newState, action);
      
      // Session actions
      case GameActionTypes.SESSION_START:
        return GameReducer.handleSessionStart(newState, action);
      
      case GameActionTypes.TIME_UPDATE:
        return GameReducer.handleTimeUpdate(newState, action);
      
      case GameActionTypes.TIMELINE_EVENTS_SET:
        return GameReducer.handleTimelineEventsSet(newState, action);
      
      // Save/Load actions
      case GameActionTypes.SAVE_GAME_START:
        return GameReducer.handleSaveGameStart(newState, action);
      
      case GameActionTypes.SAVE_GAME_SUCCESS:
        return GameReducer.handleSaveGameSuccess(newState, action);
      
      case GameActionTypes.SAVE_GAME_FAILURE:
        return GameReducer.handleSaveGameFailure(newState, action);
      
      case GameActionTypes.LOAD_GAME_START:
        return GameReducer.handleLoadGameStart(newState, action);
      
      case GameActionTypes.LOAD_GAME_SUCCESS:
        return GameReducer.handleLoadGameSuccess(newState, action);
      
      case GameActionTypes.LOAD_GAME_FAILURE:
        return GameReducer.handleLoadGameFailure(newState, action);
      
      // Game lifecycle actions
      case GameActionTypes.GAME_INITIALIZED:
        return GameReducer.handleGameInitialized(newState, action);
      
      case GameActionTypes.GAME_PAUSED:
        return GameReducer.handleGamePaused(newState, action);
      
      case GameActionTypes.GAME_RESUMED:
        return GameReducer.handleGameResumed(newState, action);
      
      case GameActionTypes.GAME_RESET:
        return GameReducer.handleGameReset(newState, action);
      
      default:
        console.warn(`Unknown action type: ${action.type}`);
        return newState;
    }
  }
  
  // Level action handlers
  private static handleLevelTransitionStart(state: GameState, action: GameAction): GameState {
    const { from, to } = action.payload;
    
    state.previousLevel = from;
    state.currentLevel = to;
    state.gameStats.currentLocation = `Transitioning to ${to}`;
    
    return state;
  }
  
  private static handleLevelTransitionSuccess(state: GameState, action: GameAction): GameState {
    const { to, transitionTime } = action.payload;
    
    state.currentLevel = to;
    state.gameStats.currentLocation = GameReducer.getLevelDisplayName(to);
    
    // Update level visit count
    if (!state.completedLevels.has(to)) {
      state.gameStats.levelsVisited++;
    }
    
    // Record transition time in session data
    state.sessionData.lastTransitionTime = transitionTime;
    
    return state;
  }
  
  private static handleLevelTransitionFailure(state: GameState, action: GameAction): GameState {
    const { from, error } = action.payload;
    
    // Revert to previous level on failure
    state.currentLevel = from;
    state.gameStats.currentLocation = GameReducer.getLevelDisplayName(from);
    
    // Could track transition failures in session data
    if (!state.sessionData.transitionFailures) {
      state.sessionData.transitionFailures = 0;
    }
    state.sessionData.transitionFailures++;
    
    return state;
  }
  
  private static handleLevelCompleted(state: GameState, action: GameAction): GameState {
    const { levelId, completionTime, stats } = action.payload;
    
    state.completedLevels.add(levelId);
    
    // Update completion stats
    if (stats) {
      Object.assign(state.gameStats, stats);
    }
    
    // Record completion time
    if (!state.sessionData.levelCompletionTimes) {
      state.sessionData.levelCompletionTimes = {};
    }
    state.sessionData.levelCompletionTimes[levelId] = completionTime;
    
    return state;
  }
  
  // Star action handlers
  private static handleStarSelected(state: GameState, action: GameAction): GameState {
    const { star, selectionMethod } = action.payload;
    
    // Defensive programming: Handle null/invalid star data
    if (!star || !star.uniqueId) {
      console.warn('⚠️ Reducer: Attempted to select invalid star data. This may indicate an issue with an event listener. Star deselection should use STAR_DESELECTED action.', star);
      return state; // Return state unchanged
    }
    
    state.selectedStar = star;
    
    // Track star discovery
    if (!state.discoveredStars.has(star.uniqueId)) {
      state.discoveredStars.add(star.uniqueId);
      state.gameStats.starsDiscovered++;
    }
    
    // Track selection method stats
    if (!state.sessionData.selectionMethods) {
      state.sessionData.selectionMethods = { click: 0, touch: 0, keyboard: 0 };
    }
    if (selectionMethod && selectionMethod in state.sessionData.selectionMethods) {
      state.sessionData.selectionMethods[selectionMethod as keyof typeof state.sessionData.selectionMethods]++;
    }
    
    return state;
  }
  
  private static handleStarDeselected(state: GameState, action: GameAction): GameState {
    state.selectedStar = null;
    return state;
  }
  
  private static handleStarDiscovered(state: GameState, action: GameAction): GameState {
    const { star, discoveryMethod } = action.payload;
    
    if (!state.discoveredStars.has(star.uniqueId)) {
      state.discoveredStars.add(star.uniqueId);
      state.gameStats.starsDiscovered++;
      
      // Track discovery method
      if (!state.sessionData.discoveryMethods) {
        state.sessionData.discoveryMethods = { exploration: 0, timeline: 0, interaction: 0 };
      }
      state.sessionData.discoveryMethods[discoveryMethod]++;
    }
    
    return state;
  }
  
  // Stats action handlers
  private static handleStatsUpdate(state: GameState, action: GameAction): GameState {
    const { updates } = action.payload;
    
    Object.assign(state.gameStats, updates);
    
    return state;
  }
  
  private static handleStatsIncrement(state: GameState, action: GameAction): GameState {
    const { field, amount } = action.payload;
    
    if (typeof state.gameStats[field] === 'number') {
      (state.gameStats[field] as number) += amount || 1;
    }
    
    return state;
  }
  
  private static handleStatsReset(state: GameState, action: GameAction): GameState {
    state.gameStats = {
      starsDiscovered: 0,
      timeExplored: 0,
      currentLocation: 'Star Observatory Alpha',
      levelsVisited: 0,
      interactionsPerformed: 0,
      secretsFound: 0
    };
    
    return state;
  }
  
  // Settings action handlers
  private static handleSettingsUpdate(state: GameState, action: GameAction): GameState {
    const { updates } = action.payload;
    
    Object.assign(state.settings, updates);
    
    return state;
  }
  
  private static handleSettingsReset(state: GameState, action: GameAction): GameState {
    state.settings = {
      graphicsQuality: 'high',
      audioEnabled: true,
      audioVolume: 0.8,
      showDebugInfo: false,
      enableMobileControls: false,
      mouseSensitivity: 1.0,
      touchSensitivity: 1.0
    };
    
    return state;
  }
  
  // Progress action handlers
  private static handleContentUnlocked(state: GameState, action: GameAction): GameState {
    const { contentId, unlockReason } = action.payload;
    
    state.unlockedContent.add(contentId);
    
    // Track unlock reasons
    if (!state.sessionData.unlockReasons) {
      state.sessionData.unlockReasons = {};
    }
    state.sessionData.unlockReasons[contentId] = unlockReason;
    
    return state;
  }
  
  private static handleItemCollected(state: GameState, action: GameAction): GameState {
    const { itemId, itemType, collectionMethod } = action.payload;
    
    state.collectedItems.add(itemId);
    
    // Track collection stats
    if (!state.sessionData.collectionStats) {
      state.sessionData.collectionStats = {};
    }
    if (!state.sessionData.collectionStats[itemType]) {
      state.sessionData.collectionStats[itemType] = 0;
    }
    state.sessionData.collectionStats[itemType]++;
    
    return state;
  }
  
  private static handleInteractionRecorded(state: GameState, action: GameAction): GameState {
    const { interactionType, objectId, position, data } = action.payload;
    
    state.gameStats.interactionsPerformed++;
    
    // Track interaction types
    if (!state.sessionData.interactionTypes) {
      state.sessionData.interactionTypes = {};
    }
    if (!state.sessionData.interactionTypes[interactionType]) {
      state.sessionData.interactionTypes[interactionType] = 0;
    }
    state.sessionData.interactionTypes[interactionType]++;
    
    return state;
  }
  
  // Session action handlers
  private static handleSessionStart(state: GameState, action: GameAction): GameState {
    const { sessionId, startTime, previousSession } = action.payload;
    
    state.sessionData.sessionId = sessionId;
    state.sessionData.sessionStartTime = startTime;
    state.sessionData.previousSession = previousSession;
    
    return state;
  }
  
  private static handleTimeUpdate(state: GameState, action: GameAction): GameState {
    const { deltaTime, totalTime, sessionTime } = action.payload;
    
    state.gameStats.timeExplored = totalTime;
    state.sessionData.totalPlayTime = sessionTime;
    
    return state;
  }
  
  // Save/Load action handlers
  private static handleSaveGameStart(state: GameState, action: GameAction): GameState {
    const { saveType } = action.payload;
    
    state.sessionData.lastSaveType = saveType;
    state.sessionData.saveInProgress = true;
    
    return state;
  }
  
  private static handleSaveGameSuccess(state: GameState, action: GameAction): GameState {
    const { saveTime, saveType, saveSize } = action.payload;
    
    state.sessionData.lastSaveTime = saveTime;
    state.sessionData.lastSaveType = saveType;
    state.sessionData.saveInProgress = false;
    
    if (saveSize) {
      state.sessionData.lastSaveSize = saveSize;
    }
    
    // Track save frequency
    if (!state.sessionData.saveCount) {
      state.sessionData.saveCount = 0;
    }
    state.sessionData.saveCount++;
    
    return state;
  }
  
  private static handleSaveGameFailure(state: GameState, action: GameAction): GameState {
    const { error, saveType } = action.payload;
    
    state.sessionData.saveInProgress = false;
    state.sessionData.lastSaveError = error.message;
    
    // Track save failures
    if (!state.sessionData.saveFailures) {
      state.sessionData.saveFailures = 0;
    }
    state.sessionData.saveFailures++;
    
    return state;
  }
  
  private static handleLoadGameStart(state: GameState, action: GameAction): GameState {
    // Mark that loading is in progress
    return state;
  }
  
  private static handleLoadGameSuccess(state: GameState, action: GameAction): GameState {
    const { loadTime, saveVersion, migrationRequired } = action.payload;
    
    state.sessionData.lastLoadTime = loadTime;
    state.sessionData.loadedSaveVersion = saveVersion;
    
    if (migrationRequired) {
      state.sessionData.migrationPerformed = true;
    }
    
    return state;
  }
  
  private static handleLoadGameFailure(state: GameState, action: GameAction): GameState {
    const { error } = action.payload;
    
    // Log the load failure but don't modify state significantly
    console.warn('Load game failed:', error);
    
    return state;
  }
  
  // Game lifecycle action handlers
  private static handleGameInitialized(state: GameState, action: GameAction): GameState {
    const { version, initTime, config } = action.payload;
    
    state.sessionData.gameVersion = version;
    state.sessionData.initTime = initTime;
    state.sessionData.initConfig = config;
    
    return state;
  }
  
  private static handleGamePaused(state: GameState, action: GameAction): GameState {
    const { pauseReason, pauseTime } = action.payload;
    
    state.sessionData.isPaused = true;
    state.sessionData.pauseReason = pauseReason;
    state.sessionData.pauseTime = pauseTime;
    
    return state;
  }
  
  private static handleGameResumed(state: GameState, action: GameAction): GameState {
    const { pauseDuration, resumeTime } = action.payload;
    
    state.sessionData.isPaused = false;
    state.sessionData.pauseReason = undefined;
    state.sessionData.totalPauseTime = (state.sessionData.totalPauseTime || 0) + pauseDuration;
    state.sessionData.resumeTime = resumeTime;
    
    return state;
  }
  
  private static handleGameReset(state: GameState, action: GameAction): GameState {
    const { resetReason, preserveSettings } = action.payload;
    
    const settingsToPreserve = preserveSettings ? { ...state.settings } : undefined;
    
    state.reset();
    
    if (settingsToPreserve) {
      state.settings = settingsToPreserve;
    }
    
    // Record reset info
    state.sessionData.resetReason = resetReason;
    state.sessionData.resetTime = Date.now();
    
    return state;
  }
  
  private static handleTimelineEventsSet(state: GameState, action: GameAction): GameState {
    const { events } = action.payload;
    
    state.timelineEvents = events;
    
    return state;
  }
  
  // Utility functions
  private static getLevelDisplayName(levelId: string): string {
    const levelNames: Record<string, string> = {
      'observatory': 'Star Observatory Alpha',
      'miranda': 'Miranda Ship Debris Field',
      'restaurant': 'Restaurant Backroom'
    };
    
    return levelNames[levelId] || levelId;
  }
}