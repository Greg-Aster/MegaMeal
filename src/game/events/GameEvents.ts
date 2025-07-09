/**
 * Centralized game events system
 * Defines all game events in one place for consistency and type safety
 */

export const GameEvents = {
  // Level Events
  LEVEL_TRANSITION_REQUEST: 'level.transition.request',
  LEVEL_TRANSITION_START: 'level.transition.start',
  LEVEL_TRANSITION_PROGRESS: 'level.transition.progress',
  LEVEL_TRANSITION_COMPLETE: 'level.transition.complete',
  LEVEL_TRANSITION_FAILED: 'level.transition.failed',
  LEVEL_LOADED: 'level.loaded',
  LEVEL_UNLOADED: 'level.unloaded',
  LEVEL_READY: 'level.ready',
  LEVEL_COMPLETED: 'level.completed',
  LEVEL_FAILED: 'level.failed',
  
  // Star Events
  STAR_HOVERED: 'star.hovered',
  STAR_UNHOVERED: 'star.unhovered',
  STAR_SELECTED: 'star.selected',
  STAR_DESELECTED: 'star.deselected',
  STAR_CLICKED: 'star.clicked',
  STAR_DISCOVERED: 'star.discovered',
  STAR_NAVIGATION_START: 'star.navigation.start',
  STAR_NAVIGATION_COMPLETE: 'star.navigation.complete',
  
  // Player Events
  PLAYER_MOVED: 'player.moved',
  PLAYER_JUMPED: 'player.jumped',
  PLAYER_LANDED: 'player.landed',
  PLAYER_COLLISION: 'player.collision',
  PLAYER_INTERACTION: 'player.interaction',
  PLAYER_INVENTORY_CHANGED: 'player.inventory.changed',
  
  // Game State Events
  GAME_INITIALIZED: 'game.initialized',
  GAME_STARTED: 'game.started',
  GAME_PAUSED: 'game.paused',
  GAME_RESUMED: 'game.resumed',
  GAME_RESET: 'game.reset',
  GAME_OVER: 'game.over',
  GAME_WIN: 'game.win',
  GAME_STATE_CHANGED: 'game.state.changed',
  
  // Stats Events
  STATS_UPDATED: 'stats.updated',
  STATS_MILESTONE_REACHED: 'stats.milestone.reached',
  ACHIEVEMENT_UNLOCKED: 'achievement.unlocked',
  
  // Settings Events
  SETTINGS_CHANGED: 'settings.changed',
  GRAPHICS_QUALITY_CHANGED: 'settings.graphics.quality.changed',
  AUDIO_SETTINGS_CHANGED: 'settings.audio.changed',
  CONTROLS_CHANGED: 'settings.controls.changed',
  
  // UI Events
  UI_SHOW: 'ui.show',
  UI_HIDE: 'ui.hide',
  UI_TOGGLE: 'ui.toggle',
  UI_INTERACTION: 'ui.interaction',
  MENU_OPENED: 'menu.opened',
  MENU_CLOSED: 'menu.closed',
  MODAL_OPENED: 'modal.opened',
  MODAL_CLOSED: 'modal.closed',
  
  // Input Events
  INPUT_DEVICE_CHANGED: 'input.device.changed',
  KEYBOARD_INPUT: 'input.keyboard',
  MOUSE_INPUT: 'input.mouse',
  TOUCH_INPUT: 'input.touch',
  GAMEPAD_INPUT: 'input.gamepad',
  
  // Mobile Events
  MOBILE_MOVEMENT: 'mobile.movement',
  MOBILE_ACTION: 'mobile.action',
  MOBILE_ORIENTATION_CHANGED: 'mobile.orientation.changed',
  
  // Interaction Events
  INTERACTION_STARTED: 'interaction.started',
  INTERACTION_COMPLETED: 'interaction.completed',
  INTERACTION_CANCELLED: 'interaction.cancelled',
  INTERACTION_FAILED: 'interaction.failed',
  OBJECT_INTERACTED: 'object.interacted',
  
  // Collection Events
  ITEM_COLLECTED: 'item.collected',
  ITEM_USED: 'item.used',
  ITEM_DROPPED: 'item.dropped',
  CONTENT_UNLOCKED: 'content.unlocked',
  SECRET_FOUND: 'secret.found',
  
  // Save/Load Events
  SAVE_GAME_REQUEST: 'save.game.request',
  SAVE_GAME_START: 'save.game.start',
  SAVE_GAME_SUCCESS: 'save.game.success',
  SAVE_GAME_FAILED: 'save.game.failed',
  LOAD_GAME_REQUEST: 'load.game.request',
  LOAD_GAME_START: 'load.game.start',
  LOAD_GAME_SUCCESS: 'load.game.success',
  LOAD_GAME_FAILED: 'load.game.failed',
  AUTO_SAVE_TRIGGERED: 'auto.save.triggered',
  
  // Engine Events
  ENGINE_INITIALIZED: 'engine.initialized',
  ENGINE_STARTED: 'engine.started',
  ENGINE_STOPPED: 'engine.stopped',
  ENGINE_UPDATE: 'engine.update',
  ENGINE_RENDER: 'engine.render',
  ENGINE_RESIZE: 'engine.resize',
  ENGINE_ERROR: 'engine.error',
  
  // Performance Events
  PERFORMANCE_WARNING: 'performance.warning',
  PERFORMANCE_CRITICAL: 'performance.critical',
  FRAME_RATE_CHANGED: 'performance.framerate.changed',
  MEMORY_WARNING: 'performance.memory.warning',
  
  // Asset Events
  ASSET_LOAD_START: 'asset.load.start',
  ASSET_LOAD_PROGRESS: 'asset.load.progress',
  ASSET_LOAD_COMPLETE: 'asset.load.complete',
  ASSET_LOAD_FAILED: 'asset.load.failed',
  ASSET_UNLOADED: 'asset.unloaded',
  
  // Audio Events
  AUDIO_STARTED: 'audio.started',
  AUDIO_STOPPED: 'audio.stopped',
  AUDIO_VOLUME_CHANGED: 'audio.volume.changed',
  AUDIO_MUTED: 'audio.muted',
  AUDIO_UNMUTED: 'audio.unmuted',
  
  // Network Events
  NETWORK_CONNECTED: 'network.connected',
  NETWORK_DISCONNECTED: 'network.disconnected',
  NETWORK_ERROR: 'network.error',
  
  // Error Events
  ERROR_OCCURRED: 'error.occurred',
  ERROR_RECOVERED: 'error.recovered',
  ERROR_CRITICAL: 'error.critical',
  
  // Debug Events
  DEBUG_INFO_TOGGLED: 'debug.info.toggled',
  DEBUG_COMMAND_EXECUTED: 'debug.command.executed',
  DEBUG_STATE_SNAPSHOT: 'debug.state.snapshot',
  
  // Story Events
  STORY_DIALOGUE_STARTED: 'story.dialogue.started',
  STORY_DIALOGUE_ENDED: 'story.dialogue.ended',
  STORY_CUTSCENE_STARTED: 'story.cutscene.started',
  STORY_CUTSCENE_ENDED: 'story.cutscene.ended',
  STORY_PROGRESS_UPDATED: 'story.progress.updated',
  
  // Physics Events
  PHYSICS_COLLISION: 'physics.collision',
  PHYSICS_TRIGGER_ENTERED: 'physics.trigger.entered',
  PHYSICS_TRIGGER_EXITED: 'physics.trigger.exited',
  
  // Camera Events
  CAMERA_MOVED: 'camera.moved',
  CAMERA_ROTATED: 'camera.rotated',
  CAMERA_ZOOM_CHANGED: 'camera.zoom.changed',
  CAMERA_MODE_CHANGED: 'camera.mode.changed',
  
  // Atmospheric Events
  WEATHER_CHANGED: 'weather.changed',
  TIME_OF_DAY_CHANGED: 'time.of.day.changed',
  AMBIENT_CHANGED: 'ambient.changed',
  
  // Custom Level Events
  OBSERVATORY_READY: 'level.observatory.ready',
  OBSERVATORY_STAR_FIELD_LOADED: 'level.observatory.star.field.loaded',
  MIRANDA_READY: 'level.miranda.ready',
  MIRANDA_NOTE_FOUND: 'level.miranda.note.found',
  MIRANDA_SAFE_OPENED: 'level.miranda.safe.opened',
  RESTAURANT_READY: 'level.restaurant.ready',
  RESTAURANT_DIALOGUE_STARTED: 'level.restaurant.dialogue.started',
  RESTAURANT_CLUE_FOUND: 'level.restaurant.clue.found'
} as const;

/**
 * Event data interfaces for type safety
 */
export interface GameEventData {
  // Level Events
  'level.transition.request': {
    levelId: string;
    transitionData?: any;
  };
  
  'level.transition.start': {
    from: string;
    to: string;
    transitionData?: any;
  };
  
  'level.transition.progress': {
    from: string;
    to: string;
    progress: number; // 0-1
    stage: string;
  };
  
  'level.transition.complete': {
    from: string;
    to: string;
    transitionTime: number;
  };
  
  'level.transition.failed': {
    from: string;
    to: string;
    error: Error;
  };
  
  // Star Events
  'star.selected': {
    star: any; // StarData
    selectionMethod: 'click' | 'touch' | 'keyboard';
    position?: { x: number; y: number };
  };
  
  'star.deselected': {
    previousStar: any; // StarData
  };
  
  'star.discovered': {
    star: any; // StarData
    discoveryMethod: 'exploration' | 'timeline' | 'interaction';
  };
  
  // Player Events
  'player.moved': {
    position: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
    deltaTime: number;
  };
  
  'player.interaction': {
    interactionType: string;
    objectId?: string;
    position: { x: number; y: number; z: number };
    data?: any;
  };
  
  // Game State Events
  'game.initialized': {
    version: string;
    initTime: number;
    config: any;
  };
  
  'game.state.changed': {
    previousState: any;
    newState: any;
    action: any;
  };
  
  // Stats Events
  'stats.updated': {
    previousStats: any;
    newStats: any;
    changes: any;
  };
  
  'achievement.unlocked': {
    achievementId: string;
    title: string;
    description: string;
  };
  
  // Settings Events
  'settings.changed': {
    previousSettings: any;
    newSettings: any;
    changes: any;
  };
  
  // UI Events
  'ui.show': {
    componentId: string;
    data?: any;
  };
  
  'ui.hide': {
    componentId: string;
    reason?: string;
  };
  
  // Input Events
  'input.device.changed': {
    previousDevice: string;
    newDevice: string;
    capabilities: any;
  };
  
  // Mobile Events
  'mobile.movement': {
    x: number;
    z: number;
    deltaTime: number;
  };
  
  'mobile.action': {
    action: string;
    data?: any;
  };
  
  // Save/Load Events
  'save.game.success': {
    saveTime: number;
    saveType: 'manual' | 'auto' | 'checkpoint';
    saveSize?: number;
  };
  
  'save.game.failed': {
    error: Error;
    saveType: 'manual' | 'auto' | 'checkpoint';
  };
  
  'load.game.success': {
    loadTime: number;
    saveVersion: string;
    migrationRequired?: boolean;
  };
  
  // Engine Events
  'engine.update': {
    deltaTime: number;
    totalTime: number;
    frameCount: number;
  };
  
  'engine.resize': {
    width: number;
    height: number;
    pixelRatio: number;
  };
  
  'engine.error': {
    error: Error;
    context: any;
    fatal: boolean;
  };
  
  // Performance Events
  'performance.warning': {
    type: string;
    value: number;
    threshold: number;
    message: string;
  };
  
  'performance.framerate.changed': {
    previousFPS: number;
    currentFPS: number;
    trend: 'improving' | 'degrading' | 'stable';
  };
  
  // Asset Events
  'asset.load.progress': {
    loaded: number;
    total: number;
    progress: number; // 0-1
    currentAsset: string;
  };
  
  'asset.load.complete': {
    assetId: string;
    assetType: string;
    loadTime: number;
    size: number;
  };
  
  'asset.load.failed': {
    assetId: string;
    error: Error;
    retryCount: number;
  };
  
  // Error Events
  'error.occurred': {
    error: Error;
    context: any;
    recoverable: boolean;
    timestamp: number;
  };
  
  'error.recovered': {
    originalError: Error;
    recoveryMethod: string;
    success: boolean;
  };
}

/**
 * Type-safe event emitter helper
 */
export type GameEventType = keyof typeof GameEvents;
export type GameEventListener<T extends GameEventType> = (data: GameEventData[T]) => void;

/**
 * Event priorities for processing order
 */
export const EventPriorities = {
  CRITICAL: 1000,
  HIGH: 800,
  NORMAL: 500,
  LOW: 200,
  BACKGROUND: 100
} as const;

/**
 * Event categories for filtering and debugging
 */
export const EventCategories = {
  SYSTEM: 'system',
  GAMEPLAY: 'gameplay',
  UI: 'ui',
  INPUT: 'input',
  AUDIO: 'audio',
  GRAPHICS: 'graphics',
  NETWORK: 'network',
  DEBUG: 'debug'
} as const;

/**
 * Utility functions for event handling
 */
export const EventUtils = {
  /**
   * Check if an event is a system event
   */
  isSystemEvent(eventType: string): boolean {
    return eventType.startsWith('engine.') || 
           eventType.startsWith('error.') || 
           eventType.startsWith('performance.');
  },
  
  /**
   * Check if an event is a gameplay event
   */
  isGameplayEvent(eventType: string): boolean {
    return eventType.startsWith('level.') || 
           eventType.startsWith('star.') || 
           eventType.startsWith('player.') ||
           eventType.startsWith('interaction.');
  },
  
  /**
   * Check if an event is a UI event
   */
  isUIEvent(eventType: string): boolean {
    return eventType.startsWith('ui.') || 
           eventType.startsWith('menu.') || 
           eventType.startsWith('modal.');
  },
  
  /**
   * Get event category
   */
  getEventCategory(eventType: string): string {
    if (EventUtils.isSystemEvent(eventType)) return EventCategories.SYSTEM;
    if (EventUtils.isGameplayEvent(eventType)) return EventCategories.GAMEPLAY;
    if (EventUtils.isUIEvent(eventType)) return EventCategories.UI;
    if (eventType.startsWith('input.')) return EventCategories.INPUT;
    if (eventType.startsWith('audio.')) return EventCategories.AUDIO;
    if (eventType.startsWith('asset.')) return EventCategories.GRAPHICS;
    if (eventType.startsWith('network.')) return EventCategories.NETWORK;
    if (eventType.startsWith('debug.')) return EventCategories.DEBUG;
    
    return EventCategories.GAMEPLAY; // Default
  },
  
  /**
   * Get event priority
   */
  getEventPriority(eventType: string): number {
    if (eventType.includes('error') || eventType.includes('critical')) {
      return EventPriorities.CRITICAL;
    }
    if (eventType.includes('warning') || eventType.includes('failed')) {
      return EventPriorities.HIGH;
    }
    if (EventUtils.isSystemEvent(eventType)) {
      return EventPriorities.HIGH;
    }
    if (EventUtils.isGameplayEvent(eventType)) {
      return EventPriorities.NORMAL;
    }
    if (EventUtils.isUIEvent(eventType)) {
      return EventPriorities.LOW;
    }
    
    return EventPriorities.NORMAL; // Default
  }
};