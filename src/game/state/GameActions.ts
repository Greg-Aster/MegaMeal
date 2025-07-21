import type { ErrorContext } from '../../engine/utils/ErrorHandler'
import { GameState } from './GameState'
import type { GameSettings, GameStats, StarData } from './GameState'

/**
 * Redux-like action system for game state management
 * Provides type-safe actions with clear intent and data flow
 */

// Action types
export const GameActionTypes = {
  // Level actions
  LEVEL_TRANSITION_START: 'LEVEL_TRANSITION_START',
  LEVEL_TRANSITION_SUCCESS: 'LEVEL_TRANSITION_SUCCESS',
  LEVEL_TRANSITION_FAILURE: 'LEVEL_TRANSITION_FAILURE',
  LEVEL_COMPLETED: 'LEVEL_COMPLETED',

  // Star actions
  STAR_SELECTED: 'STAR_SELECTED',
  STAR_DESELECTED: 'STAR_DESELECTED',
  STAR_DISCOVERED: 'STAR_DISCOVERED',

  // Game stats actions
  STATS_UPDATE: 'STATS_UPDATE',
  STATS_INCREMENT: 'STATS_INCREMENT',
  STATS_RESET: 'STATS_RESET',

  // Settings actions
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',
  SETTINGS_RESET: 'SETTINGS_RESET',

  // Progress actions
  CONTENT_UNLOCKED: 'CONTENT_UNLOCKED',
  ITEM_COLLECTED: 'ITEM_COLLECTED',
  INTERACTION_RECORDED: 'INTERACTION_RECORDED',

  // Session actions
  SESSION_START: 'SESSION_START',
  SESSION_UPDATE: 'SESSION_UPDATE',
  TIME_UPDATE: 'TIME_UPDATE',
  TIMELINE_EVENTS_SET: 'TIMELINE_EVENTS_SET',

  // Save/Load actions
  SAVE_GAME_START: 'SAVE_GAME_START',
  SAVE_GAME_SUCCESS: 'SAVE_GAME_SUCCESS',
  SAVE_GAME_FAILURE: 'SAVE_GAME_FAILURE',
  LOAD_GAME_START: 'LOAD_GAME_START',
  LOAD_GAME_SUCCESS: 'LOAD_GAME_SUCCESS',
  LOAD_GAME_FAILURE: 'LOAD_GAME_FAILURE',

  // Error actions
  ERROR_OCCURRED: 'ERROR_OCCURRED',
  ERROR_RECOVERED: 'ERROR_RECOVERED',

  // Game lifecycle
  GAME_INITIALIZED: 'GAME_INITIALIZED',
  GAME_PAUSED: 'GAME_PAUSED',
  GAME_RESUMED: 'GAME_RESUMED',
  GAME_RESET: 'GAME_RESET',
} as const

// Action interfaces
export interface GameAction {
  type: string
  payload?: any
  meta?: {
    timestamp: number
    source?: string
    context?: any
  }
}

// Level Actions
export interface LevelTransitionStartAction extends GameAction {
  type: typeof GameActionTypes.LEVEL_TRANSITION_START
  payload: {
    from: string
    to: string
    transitionData?: any
  }
}

export interface LevelTransitionSuccessAction extends GameAction {
  type: typeof GameActionTypes.LEVEL_TRANSITION_SUCCESS
  payload: {
    from: string
    to: string
    transitionTime: number
  }
}

export interface LevelTransitionFailureAction extends GameAction {
  type: typeof GameActionTypes.LEVEL_TRANSITION_FAILURE
  payload: {
    from: string
    to: string
    error: Error
  }
}

export interface LevelCompletedAction extends GameAction {
  type: typeof GameActionTypes.LEVEL_COMPLETED
  payload: {
    levelId: string
    completionTime: number
    stats: any
  }
}

// Star Actions
export interface StarSelectedAction extends GameAction {
  type: typeof GameActionTypes.STAR_SELECTED
  payload: {
    star: StarData
    selectionMethod: 'click' | 'touch' | 'keyboard'
  }
}

export interface StarDeselectedAction extends GameAction {
  type: typeof GameActionTypes.STAR_DESELECTED
  payload: {
    previousStar: StarData
  }
}

export interface StarDiscoveredAction extends GameAction {
  type: typeof GameActionTypes.STAR_DISCOVERED
  payload: {
    star: StarData
    discoveryMethod: 'exploration' | 'timeline' | 'interaction'
  }
}

// Stats Actions
export interface StatsUpdateAction extends GameAction {
  type: typeof GameActionTypes.STATS_UPDATE
  payload: {
    updates: Partial<GameStats>
  }
}

export interface StatsIncrementAction extends GameAction {
  type: typeof GameActionTypes.STATS_INCREMENT
  payload: {
    field: keyof GameStats
    amount?: number
  }
}

// Settings Actions
export interface SettingsUpdateAction extends GameAction {
  type: typeof GameActionTypes.SETTINGS_UPDATE
  payload: {
    updates: Partial<GameSettings>
  }
}

// Progress Actions
export interface ContentUnlockedAction extends GameAction {
  type: typeof GameActionTypes.CONTENT_UNLOCKED
  payload: {
    contentId: string
    unlockReason: string
  }
}

export interface ItemCollectedAction extends GameAction {
  type: typeof GameActionTypes.ITEM_COLLECTED
  payload: {
    itemId: string
    itemType: string
    collectionMethod: string
  }
}

export interface InteractionRecordedAction extends GameAction {
  type: typeof GameActionTypes.INTERACTION_RECORDED
  payload: {
    interactionType: string
    objectId?: string
    position?: { x: number; y: number; z: number }
    data?: any
  }
}

// Session Actions
export interface SessionStartAction extends GameAction {
  type: typeof GameActionTypes.SESSION_START
  payload: {
    sessionId: string
    startTime: number
    previousSession?: any
  }
}

export interface TimeUpdateAction extends GameAction {
  type: typeof GameActionTypes.TIME_UPDATE
  payload: {
    deltaTime: number
    totalTime: number
    sessionTime: number
  }
}

export interface TimelineEventsSetAction extends GameAction {
  type: typeof GameActionTypes.TIMELINE_EVENTS_SET
  payload: {
    events: any[]
  }
}

// Save/Load Actions
export interface SaveGameStartAction extends GameAction {
  type: typeof GameActionTypes.SAVE_GAME_START
  payload: {
    saveType: 'manual' | 'auto' | 'checkpoint'
  }
}

export interface SaveGameSuccessAction extends GameAction {
  type: typeof GameActionTypes.SAVE_GAME_SUCCESS
  payload: {
    saveTime: number
    saveType: 'manual' | 'auto' | 'checkpoint'
    saveSize?: number
  }
}

export interface SaveGameFailureAction extends GameAction {
  type: typeof GameActionTypes.SAVE_GAME_FAILURE
  payload: {
    error: Error
    saveType: 'manual' | 'auto' | 'checkpoint'
  }
}

export interface LoadGameStartAction extends GameAction {
  type: typeof GameActionTypes.LOAD_GAME_START
  payload: {}
}

export interface LoadGameSuccessAction extends GameAction {
  type: typeof GameActionTypes.LOAD_GAME_SUCCESS
  payload: {
    loadTime: number
    saveVersion: string
    migrationRequired?: boolean
  }
}

export interface LoadGameFailureAction extends GameAction {
  type: typeof GameActionTypes.LOAD_GAME_FAILURE
  payload: {
    error: Error
  }
}

// Error Actions
export interface ErrorOccurredAction extends GameAction {
  type: typeof GameActionTypes.ERROR_OCCURRED
  payload: {
    error: Error
    context: ErrorContext
    recoverable: boolean
  }
}

export interface ErrorRecoveredAction extends GameAction {
  type: typeof GameActionTypes.ERROR_RECOVERED
  payload: {
    originalError: Error
    recoveryMethod: string
    success: boolean
  }
}

// Game Lifecycle Actions
export interface GameInitializedAction extends GameAction {
  type: typeof GameActionTypes.GAME_INITIALIZED
  payload: {
    version: string
    initTime: number
    config: any
  }
}

export interface GamePausedAction extends GameAction {
  type: typeof GameActionTypes.GAME_PAUSED
  payload: {
    pauseReason: 'user' | 'system' | 'error'
    pauseTime: number
  }
}

export interface GameResumedAction extends GameAction {
  type: typeof GameActionTypes.GAME_RESUMED
  payload: {
    pauseDuration: number
    resumeTime: number
  }
}

export interface GameResetAction extends GameAction {
  type: typeof GameActionTypes.GAME_RESET
  payload: {
    resetReason: 'user' | 'error' | 'system'
    preserveSettings?: boolean
  }
}

// Union type for all actions
export type GameActionUnion =
  | LevelTransitionStartAction
  | LevelTransitionSuccessAction
  | LevelTransitionFailureAction
  | LevelCompletedAction
  | StarSelectedAction
  | StarDeselectedAction
  | StarDiscoveredAction
  | StatsUpdateAction
  | StatsIncrementAction
  | SettingsUpdateAction
  | ContentUnlockedAction
  | ItemCollectedAction
  | InteractionRecordedAction
  | SessionStartAction
  | TimeUpdateAction
  | TimelineEventsSetAction
  | SaveGameStartAction
  | SaveGameSuccessAction
  | SaveGameFailureAction
  | LoadGameStartAction
  | LoadGameSuccessAction
  | LoadGameFailureAction
  | ErrorOccurredAction
  | ErrorRecoveredAction
  | GameInitializedAction
  | GamePausedAction
  | GameResumedAction
  | GameResetAction

/**
 * Action creators for type-safe action creation
 */
export const GameActions = {
  // Level actions
  levelTransitionStart: (
    from: string,
    to: string,
    transitionData?: any,
  ): LevelTransitionStartAction => ({
    type: GameActionTypes.LEVEL_TRANSITION_START,
    payload: { from, to, transitionData },
    meta: { timestamp: Date.now(), source: 'LevelManager' },
  }),

  levelTransitionSuccess: (
    from: string,
    to: string,
    transitionTime: number,
  ): LevelTransitionSuccessAction => ({
    type: GameActionTypes.LEVEL_TRANSITION_SUCCESS,
    payload: { from, to, transitionTime },
    meta: { timestamp: Date.now(), source: 'LevelManager' },
  }),

  levelTransitionFailure: (
    from: string,
    to: string,
    error: Error,
  ): LevelTransitionFailureAction => ({
    type: GameActionTypes.LEVEL_TRANSITION_FAILURE,
    payload: { from, to, error },
    meta: { timestamp: Date.now(), source: 'LevelManager' },
  }),

  levelCompleted: (
    levelId: string,
    completionTime: number,
    stats: any,
  ): LevelCompletedAction => ({
    type: GameActionTypes.LEVEL_COMPLETED,
    payload: { levelId, completionTime, stats },
    meta: { timestamp: Date.now(), source: 'Level' },
  }),

  // Star actions
  starSelected: (
    star: StarData,
    selectionMethod: 'click' | 'touch' | 'keyboard' = 'click',
  ): StarSelectedAction => ({
    type: GameActionTypes.STAR_SELECTED,
    payload: { star, selectionMethod },
    meta: { timestamp: Date.now(), source: 'StarNavigationSystem' },
  }),

  starDeselected: (previousStar: StarData): StarDeselectedAction => ({
    type: GameActionTypes.STAR_DESELECTED,
    payload: { previousStar },
    meta: { timestamp: Date.now(), source: 'StarNavigationSystem' },
  }),

  starDiscovered: (
    star: StarData,
    discoveryMethod: 'exploration' | 'timeline' | 'interaction' = 'exploration',
  ): StarDiscoveredAction => ({
    type: GameActionTypes.STAR_DISCOVERED,
    payload: { star, discoveryMethod },
    meta: { timestamp: Date.now(), source: 'StarNavigationSystem' },
  }),

  // Stats actions
  statsUpdate: (updates: Partial<GameStats>): StatsUpdateAction => ({
    type: GameActionTypes.STATS_UPDATE,
    payload: { updates },
    meta: { timestamp: Date.now(), source: 'GameStateManager' },
  }),

  statsIncrement: (
    field: keyof GameStats,
    amount = 1,
  ): StatsIncrementAction => ({
    type: GameActionTypes.STATS_INCREMENT,
    payload: { field, amount },
    meta: { timestamp: Date.now(), source: 'GameStateManager' },
  }),

  // Settings actions
  settingsUpdate: (updates: Partial<GameSettings>): SettingsUpdateAction => ({
    type: GameActionTypes.SETTINGS_UPDATE,
    payload: { updates },
    meta: { timestamp: Date.now(), source: 'SettingsManager' },
  }),

  // Progress actions
  contentUnlocked: (
    contentId: string,
    unlockReason: string,
  ): ContentUnlockedAction => ({
    type: GameActionTypes.CONTENT_UNLOCKED,
    payload: { contentId, unlockReason },
    meta: { timestamp: Date.now(), source: 'GameStateManager' },
  }),

  itemCollected: (
    itemId: string,
    itemType: string,
    collectionMethod: string,
  ): ItemCollectedAction => ({
    type: GameActionTypes.ITEM_COLLECTED,
    payload: { itemId, itemType, collectionMethod },
    meta: { timestamp: Date.now(), source: 'InteractionSystem' },
  }),

  interactionRecorded: (
    interactionType: string,
    objectId?: string,
    position?: { x: number; y: number; z: number },
    data?: any,
  ): InteractionRecordedAction => ({
    type: GameActionTypes.INTERACTION_RECORDED,
    payload: { interactionType, objectId, position, data },
    meta: { timestamp: Date.now(), source: 'InteractionSystem' },
  }),

  // Session actions
  sessionStart: (
    sessionId: string,
    startTime: number,
    previousSession?: any,
  ): SessionStartAction => ({
    type: GameActionTypes.SESSION_START,
    payload: { sessionId, startTime, previousSession },
    meta: { timestamp: Date.now(), source: 'GameManager' },
  }),

  timeUpdate: (
    deltaTime: number,
    totalTime: number,
    sessionTime: number,
  ): TimeUpdateAction => ({
    type: GameActionTypes.TIME_UPDATE,
    payload: { deltaTime, totalTime, sessionTime },
    meta: { timestamp: Date.now(), source: 'GameManager' },
  }),

  timelineEventsSet: (events: any[]): TimelineEventsSetAction => ({
    type: GameActionTypes.TIMELINE_EVENTS_SET,
    payload: { events },
    meta: { timestamp: Date.now(), source: 'GameManager' },
  }),

  // Save/Load actions
  saveGameStart: (
    saveType: 'manual' | 'auto' | 'checkpoint' = 'manual',
  ): SaveGameStartAction => ({
    type: GameActionTypes.SAVE_GAME_START,
    payload: { saveType },
    meta: { timestamp: Date.now(), source: 'GameStateManager' },
  }),

  saveGameSuccess: (
    saveTime: number,
    saveType: 'manual' | 'auto' | 'checkpoint',
    saveSize?: number,
  ): SaveGameSuccessAction => ({
    type: GameActionTypes.SAVE_GAME_SUCCESS,
    payload: { saveTime, saveType, saveSize },
    meta: { timestamp: Date.now(), source: 'GameStateManager' },
  }),

  saveGameFailure: (
    error: Error,
    saveType: 'manual' | 'auto' | 'checkpoint',
  ): SaveGameFailureAction => ({
    type: GameActionTypes.SAVE_GAME_FAILURE,
    payload: { error, saveType },
    meta: { timestamp: Date.now(), source: 'GameStateManager' },
  }),

  loadGameStart: (): LoadGameStartAction => ({
    type: GameActionTypes.LOAD_GAME_START,
    payload: {},
    meta: { timestamp: Date.now(), source: 'GameStateManager' },
  }),

  loadGameSuccess: (
    loadTime: number,
    saveVersion: string,
    migrationRequired?: boolean,
  ): LoadGameSuccessAction => ({
    type: GameActionTypes.LOAD_GAME_SUCCESS,
    payload: { loadTime, saveVersion, migrationRequired },
    meta: { timestamp: Date.now(), source: 'GameStateManager' },
  }),

  loadGameFailure: (error: Error): LoadGameFailureAction => ({
    type: GameActionTypes.LOAD_GAME_FAILURE,
    payload: { error },
    meta: { timestamp: Date.now(), source: 'GameStateManager' },
  }),

  // Error actions
  errorOccurred: (
    error: Error,
    context: ErrorContext,
    recoverable: boolean,
  ): ErrorOccurredAction => ({
    type: GameActionTypes.ERROR_OCCURRED,
    payload: { error, context, recoverable },
    meta: { timestamp: Date.now(), source: 'ErrorHandler' },
  }),

  errorRecovered: (
    originalError: Error,
    recoveryMethod: string,
    success: boolean,
  ): ErrorRecoveredAction => ({
    type: GameActionTypes.ERROR_RECOVERED,
    payload: { originalError, recoveryMethod, success },
    meta: { timestamp: Date.now(), source: 'ErrorHandler' },
  }),

  // Game lifecycle actions
  gameInitialized: (
    version: string,
    initTime: number,
    config: any,
  ): GameInitializedAction => ({
    type: GameActionTypes.GAME_INITIALIZED,
    payload: { version, initTime, config },
    meta: { timestamp: Date.now(), source: 'GameManager' },
  }),

  gamePaused: (
    pauseReason: 'user' | 'system' | 'error',
    pauseTime: number,
  ): GamePausedAction => ({
    type: GameActionTypes.GAME_PAUSED,
    payload: { pauseReason, pauseTime },
    meta: { timestamp: Date.now(), source: 'GameManager' },
  }),

  gameResumed: (
    pauseDuration: number,
    resumeTime: number,
  ): GameResumedAction => ({
    type: GameActionTypes.GAME_RESUMED,
    payload: { pauseDuration, resumeTime },
    meta: { timestamp: Date.now(), source: 'GameManager' },
  }),

  gameReset: (
    resetReason: 'user' | 'error' | 'system',
    preserveSettings?: boolean,
  ): GameResetAction => ({
    type: GameActionTypes.GAME_RESET,
    payload: { resetReason, preserveSettings },
    meta: { timestamp: Date.now(), source: 'GameManager' },
  }),
}

/**
 * Utility function to check if an action is of a specific type
 */
export function isActionType<T extends GameAction>(
  action: GameAction,
  type: string,
): action is T {
  return action.type === type
}

/**
 * Utility function to create action with metadata
 */
export function createAction(
  type: string,
  payload?: any,
  source?: string,
  context?: any,
): GameAction {
  return {
    type,
    payload,
    meta: {
      timestamp: Date.now(),
      source,
      context,
    },
  }
}
