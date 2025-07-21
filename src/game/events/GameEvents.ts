/**
 * Game event constants for the event bus system
 * Provides type-safe event names for game-wide communication
 */

export const GameEvents = {
  // Core game events
  GAME_STATE_CHANGED: 'game.state.changed',
  GAME_INITIALIZED: 'game.initialized',
  GAME_PAUSED: 'game.paused',
  GAME_RESUMED: 'game.resumed',
  GAME_RESET: 'game.reset',

  // Level events
  LEVEL_TRANSITION_REQUEST: 'level.transition.request',
  LEVEL_TRANSITION_START: 'level.transition.start',
  LEVEL_TRANSITION_COMPLETE: 'level.transition.complete',
  LEVEL_TRANSITION_FAILURE: 'level.transition.failure',
  LEVEL_CLEANUP: 'level.cleanup',

  // Star events
  STAR_SELECTED: 'star.selected',
  STAR_DESELECTED: 'star.deselected',
  STAR_DISCOVERED: 'star.discovered',

  // Player events
  PLAYER_INTERACTION: 'player.interaction',
  PLAYER_MOVEMENT: 'player.movement',

  // Error events
  ERROR_OCCURRED: 'error.occurred',
  ERROR_RECOVERED: 'error.recovered',

  // UI events
  UI_ERROR: 'ui.error',
  UI_NOTIFICATION: 'ui.notification',
  UI_CLEAR_ALL: 'ui.clearAll',

  // Mobile events
  MOBILE_MOVEMENT: 'mobile.movement',
  MOBILE_ACTION: 'mobile.action',

  // Save/Load events
  SAVE_GAME_REQUEST: 'save.game.request',
  LOAD_GAME_REQUEST: 'load.game.request',
  RESET_GAME_REQUEST: 'reset.game.request',

  // Performance events
  PERFORMANCE_METRICS_UPDATED: 'performance.metrics.updated',
  DEBUG_ACTION_DISPATCHED: 'debug.action.dispatched',
  DEBUG_PERFORMANCE_UPDATED: 'debug.performance.updated',
} as const

/**
 * Type for game event data payloads
 */
export interface GameEventData {
  // Level transition data
  levelTransition: {
    from: string
    to: string
    transitionTime?: number
    success?: boolean
    error?: Error
  }

  // Star selection data
  starSelection: {
    star: any
    selectionMethod?: 'click' | 'touch' | 'keyboard'
    previousStar?: any
  }

  // Player interaction data
  playerInteraction: {
    interactionType: string
    objectId?: string
    position?: { x: number; y: number; z: number }
    data?: any
  }

  // Error data
  error: {
    error: Error
    context?: any
    recoverable?: boolean
    timestamp?: number
    originalError?: Error
    recoveryMethod?: string
    success?: boolean
  }

  // Game state data
  gameState: {
    previousState?: any
    newState?: any
    action?: any
  }

  // Performance data
  performance: {
    metrics?: any
    action?: any
  }
}

/**
 * Event bus event names as a union type
 */
export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents]
