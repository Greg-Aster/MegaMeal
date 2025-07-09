import { GameState, GameStats, GameSettings } from './GameState';
import { GameAction, GameActions, GameActionUnion } from './GameActions';
import { GameReducer } from './GameReducer';
import { GameEvents, GameEventData } from '../events/GameEvents';
import { EventBus } from '../../engine/core/EventBus';
import { ErrorHandler, ErrorContext } from '../../engine/utils/ErrorHandler';

/**
 * Enhanced GameStateManager with Redux-like patterns
 * Provides predictable state management with actions, reducers, and middleware
 */
export class GameStateManager {
  private gameState: GameState;
  private eventBus: EventBus;
  private actionHistory: GameAction[] = [];
  private maxHistorySize = 100;
  private stateSubscribers: Set<StateSubscriber> = new Set();
  
  // Auto-save configuration
  private autoSaveInterval = 30000; // 30 seconds
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private autoSaveEnabled = true;
  
  // State validation
  private validationRules: ValidationRule[] = [];
  
  // Middleware stack
  private middleware: Middleware[] = [];
  
  // Performance monitoring
  private actionTimings: Map<string, number[]> = new Map();
  private performanceThreshold = 16; // 16ms threshold for actions
  
  constructor(eventBus: EventBus, initialState?: GameState) {
    this.eventBus = eventBus;
    this.gameState = initialState || new GameState();
    
    this.setupMiddleware();
    this.setupValidationRules();
    this.setupEventListeners();
    this.startAutoSave();
  }
  
  /**
   * Dispatch an action to update the state
   */
  public dispatch(action: GameAction): void {
    const safeDispatch = ErrorHandler.wrapSync(
      () => this.internalDispatch(action),
      { 
        component: 'GameStateManager', 
        operation: 'dispatch', 
        details: { actionType: action.type } 
      }
    );
    
    safeDispatch();
  }
  
  /**
   * Internal dispatch implementation
   */
  private internalDispatch(action: GameAction): void {
    const startTime = performance.now();
    
    try {
      // Add timestamp and context if not present
      if (!action.meta) {
        action.meta = { timestamp: Date.now() };
      }
      
      // Apply middleware (before)
      let processedAction = action;
      for (const middleware of this.middleware) {
        processedAction = middleware.before(processedAction, this.gameState);
      }
      
      // Validate action
      this.validateAction(processedAction);
      
      // Get previous state for comparison
      const previousState = this.gameState.clone();
      
      // Apply reducer
      const newState = GameReducer.reduce(this.gameState, processedAction);
      
      // Validate new state
      this.validateState(newState);
      
      // Update state
      this.gameState = newState;
      
      // Add to history
      this.addToHistory(processedAction);
      
      // Apply middleware (after)
      for (const middleware of this.middleware) {
        middleware.after(processedAction, previousState, this.gameState);
      }
      
      // Notify subscribers
      this.notifySubscribers(processedAction, previousState, this.gameState);
      
      // Emit state change event
      this.eventBus.emit(GameEvents.GAME_STATE_CHANGED, {
        previousState,
        newState: this.gameState,
        action: processedAction
      });
      
      // Track performance
      this.trackActionPerformance(processedAction.type, performance.now() - startTime);
      
    } catch (error) {
      console.error('Action dispatch failed:', error);
      
      // Emit error event
      this.eventBus.emit(GameEvents.ERROR_OCCURRED, {
        error: error as Error,
        context: { action, component: 'GameStateManager' },
        recoverable: true,
        timestamp: Date.now()
      });
      
      // Attempt recovery
      this.attemptStateRecovery(action, error as Error);
    }
  }
  
  /**
   * Get current state (immutable)
   */
  public getState(): GameState {
    return this.gameState.clone();
  }
  
  /**
   * Subscribe to state changes
   */
  public subscribe(subscriber: StateSubscriber): UnsubscribeFunction {
    this.stateSubscribers.add(subscriber);
    
    return () => {
      this.stateSubscribers.delete(subscriber);
    };
  }
  
  /**
   * Get action history
   */
  public getActionHistory(): GameAction[] {
    return [...this.actionHistory];
  }
  
  /**
   * Undo last action (if possible)
   */
  public undo(): boolean {
    if (this.actionHistory.length < 2) return false;
    
    try {
      // Remove the last action
      this.actionHistory.pop();
      
      // Replay all actions from the beginning
      const actions = [...this.actionHistory];
      this.gameState.reset();
      this.actionHistory = [];
      
      actions.forEach(action => this.dispatch(action));
      
      return true;
      
    } catch (error) {
      console.error('Undo failed:', error);
      return false;
    }
  }
  
  /**
   * Save game state
   */
  public async saveGame(saveType: 'manual' | 'auto' | 'checkpoint' = 'manual'): Promise<boolean> {
    this.dispatch(GameActions.saveGameStart(saveType));
    
    try {
      const saveData = this.gameState.serialize();
      const saveSize = new Blob([saveData]).size;
      
      localStorage.setItem('megameal_save', saveData);
      localStorage.setItem('megameal_save_meta', JSON.stringify({
        saveTime: Date.now(),
        saveType,
        saveSize,
        version: this.gameState.sessionData.saveVersion
      }));
      
      this.dispatch(GameActions.saveGameSuccess(Date.now(), saveType, saveSize));
      
      console.log(`💾 Game saved successfully (${saveType}, ${saveSize} bytes)`);
      return true;
      
    } catch (error) {
      this.dispatch(GameActions.saveGameFailure(error as Error, saveType));
      console.error('Save failed:', error);
      return false;
    }
  }
  
  /**
   * Load game state
   */
  public async loadGame(): Promise<boolean> {
    this.dispatch(GameActions.loadGameStart());
    
    try {
      const saveData = localStorage.getItem('megameal_save');
      const saveMeta = localStorage.getItem('megameal_save_meta');
      
      if (!saveData) {
        console.log('📂 No save data found');
        return false;
      }
      
      const meta = saveMeta ? JSON.parse(saveMeta) : {};
      const migrationRequired = meta.version !== this.gameState.sessionData.saveVersion;
      
      this.gameState.deserialize(saveData);
      
      // Perform migration if needed
      if (migrationRequired) {
        this.performSaveMigration(meta.version);
      }
      
      this.dispatch(GameActions.loadGameSuccess(Date.now(), meta.version || '1.0.0', migrationRequired));
      
      console.log('📁 Game loaded successfully');
      return true;
      
    } catch (error) {
      this.dispatch(GameActions.loadGameFailure(error as Error));
      console.error('Load failed:', error);
      return false;
    }
  }
  
  /**
   * Reset game state
   */
  public resetGame(preserveSettings = false): void {
    this.dispatch(GameActions.gameReset('user', preserveSettings));
  }
  
  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      actionCount: this.actionHistory.length,
      averageActionTime: 0,
      slowestActions: [],
      stateSize: new Blob([this.gameState.serialize()]).size,
      subscriberCount: this.stateSubscribers.size
    };
    
    // Calculate average action time
    let totalTime = 0;
    let actionCount = 0;
    
    this.actionTimings.forEach((times, actionType) => {
      times.forEach(time => {
        totalTime += time;
        actionCount++;
      });
    });
    
    metrics.averageActionTime = actionCount > 0 ? totalTime / actionCount : 0;
    
    // Find slowest actions
    const slowActions: { type: string; averageTime: number }[] = [];
    this.actionTimings.forEach((times, actionType) => {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      slowActions.push({ type: actionType, averageTime: avgTime });
    });
    
    metrics.slowestActions = slowActions
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);
    
    return metrics;
  }
  
  /**
   * Add validation rule
   */
  public addValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }
  
  /**
   * Add middleware
   */
  public addMiddleware(middleware: Middleware): void {
    this.middleware.push(middleware);
  }
  
  /**
   * Enable/disable auto-save
   */
  public setAutoSaveEnabled(enabled: boolean): void {
    this.autoSaveEnabled = enabled;
    
    if (enabled) {
      this.startAutoSave();
    } else {
      this.stopAutoSave();
    }
  }
  
  // Private methods
  
  private setupMiddleware(): void {
    // Logging middleware
    this.middleware.push({
      before: (action, state) => {
        console.log(`🔄 Action: ${action.type}`, action.payload);
        return action;
      },
      after: (action, previousState, newState) => {
        // Log significant state changes
        if (action.type.includes('TRANSITION') || action.type.includes('SELECTED')) {
          console.log(`✅ State updated: ${action.type}`);
        }
      }
    });
    
    // Performance monitoring middleware
    this.middleware.push({
      before: (action, state) => {
        (action as any).__startTime = performance.now();
        return action;
      },
      after: (action, previousState, newState) => {
        const duration = performance.now() - (action as any).__startTime;
        if (duration > this.performanceThreshold) {
          console.warn(`⚠️ Slow action: ${action.type} took ${duration.toFixed(2)}ms`);
        }
      }
    });
  }
  
  private setupValidationRules(): void {
    // Basic state validation
    this.validationRules.push({
      name: 'valid_current_level',
      validate: (state) => {
        const validLevels = ['observatory', 'miranda', 'restaurant'];
        return validLevels.includes(state.currentLevel);
      },
      message: 'Current level must be a valid level ID'
    });
    
    this.validationRules.push({
      name: 'non_negative_stats',
      validate: (state) => {
        return state.gameStats.starsDiscovered >= 0 && 
               state.gameStats.timeExplored >= 0 &&
               state.gameStats.levelsVisited >= 0;
      },
      message: 'Game stats must be non-negative'
    });
  }
  
  private setupEventListeners(): void {
    // Listen for game events and convert to actions
    this.eventBus.on(GameEvents.LEVEL_TRANSITION_COMPLETE, (data) => {
      this.dispatch(GameActions.levelTransitionSuccess(data.from, data.to, data.transitionTime));
    });
    
    this.eventBus.on(GameEvents.STAR_SELECTED, (data) => {
      this.dispatch(GameActions.starSelected(data.star, data.selectionMethod));
    });
    
    this.eventBus.on(GameEvents.PLAYER_INTERACTION, (data) => {
      this.dispatch(GameActions.interactionRecorded(data.interactionType, data.objectId, data.position, data.data));
    });
  }
  
  private validateAction(action: GameAction): void {
    if (!action.type) {
      throw new Error('Action must have a type');
    }
    
    if (!action.meta) {
      throw new Error('Action must have metadata');
    }
  }
  
  private validateState(state: GameState): void {
    for (const rule of this.validationRules) {
      if (!rule.validate(state)) {
        throw new Error(`State validation failed: ${rule.message}`);
      }
    }
  }
  
  private addToHistory(action: GameAction): void {
    this.actionHistory.push(action);
    
    // Limit history size
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.shift();
    }
  }
  
  private notifySubscribers(action: GameAction, previousState: GameState, newState: GameState): void {
    this.stateSubscribers.forEach(subscriber => {
      try {
        subscriber(action, previousState, newState);
      } catch (error) {
        console.error('Subscriber error:', error);
      }
    });
  }
  
  private trackActionPerformance(actionType: string, duration: number): void {
    if (!this.actionTimings.has(actionType)) {
      this.actionTimings.set(actionType, []);
    }
    
    const timings = this.actionTimings.get(actionType)!;
    timings.push(duration);
    
    // Keep only last 10 timings per action type
    if (timings.length > 10) {
      timings.shift();
    }
  }
  
  private attemptStateRecovery(action: GameAction, error: Error): void {
    console.log('🔄 Attempting state recovery...');
    
    try {
      // Try to reload from last save
      const saveData = localStorage.getItem('megameal_save');
      if (saveData) {
        this.gameState.deserialize(saveData);
        console.log('✅ State recovered from save');
        
        this.eventBus.emit(GameEvents.ERROR_RECOVERED, {
          originalError: error,
          recoveryMethod: 'reload_from_save',
          success: true
        });
        
        return;
      }
      
      // Fallback to reset
      this.gameState.reset();
      console.log('⚠️ State reset as fallback');
      
      this.eventBus.emit(GameEvents.ERROR_RECOVERED, {
        originalError: error,
        recoveryMethod: 'reset_state',
        success: true
      });
      
    } catch (recoveryError) {
      console.error('❌ State recovery failed:', recoveryError);
      
      this.eventBus.emit(GameEvents.ERROR_RECOVERED, {
        originalError: error,
        recoveryMethod: 'failed',
        success: false
      });
    }
  }
  
  private performSaveMigration(fromVersion: string): void {
    console.log(`🔄 Migrating save data from version ${fromVersion} to ${this.gameState.sessionData.saveVersion}`);
    
    // Implement migration logic here based on version differences
    // This is a placeholder for future migration needs
    
    this.gameState.sessionData.migrationPerformed = true;
  }
  
  private startAutoSave(): void {
    if (!this.autoSaveEnabled) return;
    
    this.stopAutoSave();
    
    this.autoSaveTimer = setInterval(() => {
      this.saveGame('auto');
    }, this.autoSaveInterval);
  }
  
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
  
  /**
   * Dispose of the state manager
   */
  public dispose(): void {
    this.stopAutoSave();
    this.saveGame('auto'); // Final save
    this.stateSubscribers.clear();
    this.actionHistory = [];
    this.actionTimings.clear();
    
    console.log('🧹 GameStateManager disposed');
  }
}

// Type definitions
export type StateSubscriber = (action: GameAction, previousState: GameState, newState: GameState) => void;
export type UnsubscribeFunction = () => void;

export interface ValidationRule {
  name: string;
  validate: (state: GameState) => boolean;
  message: string;
}

export interface Middleware {
  before: (action: GameAction, state: GameState) => GameAction;
  after: (action: GameAction, previousState: GameState, newState: GameState) => void;
}

export interface PerformanceMetrics {
  actionCount: number;
  averageActionTime: number;
  slowestActions: { type: string; averageTime: number }[];
  stateSize: number;
  subscriberCount: number;
}

// Action dispatchers (for convenience)
export const GameStateActions = {
  loadGameStart: () => ({ type: 'LOAD_GAME_START', meta: { timestamp: Date.now() } }),
  loadGameFailure: (error: Error) => ({ type: 'LOAD_GAME_FAILURE', payload: { error }, meta: { timestamp: Date.now() } })
};