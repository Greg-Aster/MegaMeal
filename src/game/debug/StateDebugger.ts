import { GameState } from '../state/GameState';
import { GameAction } from '../state/GameActions';
import { GameStateManager } from '../state/GameStateManager_Enhanced';
import { ValidationResult } from '../state/StateValidator';
import { GameEvents } from '../events/GameEvents';
import { EventBus } from '../../engine/core/EventBus';

/**
 * Comprehensive debugging and monitoring tools for game state
 * Provides real-time insights into state changes, performance, and issues
 */

export interface StateSnapshot {
  timestamp: number;
  state: GameState;
  action: GameAction;
  validationResult?: ValidationResult;
  performance: {
    actionTime: number;
    stateSize: number;
    memoryUsage?: number;
  };
}

export interface DebugConfig {
  enabled: boolean;
  logActions: boolean;
  logStateChanges: boolean;
  logPerformance: boolean;
  logValidation: boolean;
  maxSnapshots: number;
  performanceThreshold: number;
}

export class StateDebugger {
  private config: DebugConfig;
  private snapshots: StateSnapshot[] = [];
  private eventBus: EventBus;
  private gameStateManager: GameStateManager;
  
  // Performance tracking
  private actionTimings: Map<string, number[]> = new Map();
  private stateTimeline: Array<{ time: number; state: GameState; action: GameAction }> = [];
  
  // Debug UI elements
  private debugPanel: HTMLElement | null = null;
  private isDebugPanelVisible = false;
  
  constructor(eventBus: EventBus, gameStateManager: GameStateManager, config?: Partial<DebugConfig>) {
    this.eventBus = eventBus;
    this.gameStateManager = gameStateManager;
    
    this.config = {
      enabled: true,
      logActions: true,
      logStateChanges: true,
      logPerformance: true,
      logValidation: true,
      maxSnapshots: 100,
      performanceThreshold: 16, // 16ms
      ...config
    };
    
    this.initialize();
  }
  
  /**
   * Initialize the debugger
   */
  private initialize(): void {
    if (!this.config.enabled) return;
    
    // Subscribe to state changes
    this.gameStateManager.subscribe((action, previousState, newState) => {
      this.handleStateChange(action, previousState, newState);
    });
    
    // Subscribe to relevant events
    this.eventBus.on(GameEvents.ERROR_OCCURRED, (data) => {
      this.logError(data.error, data.context);
    });
    
    this.eventBus.on(GameEvents.PERFORMANCE_WARNING, (data) => {
      this.logPerformanceWarning(data.type, data.value, data.threshold);
    });
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Create debug panel
    this.createDebugPanel();
  }
  
  /**
   * Handle state change for debugging
   */
  private handleStateChange(action: GameAction, previousState: GameState, newState: GameState): void {
    const startTime = performance.now();
    
    // Log action if enabled
    if (this.config.logActions) {
      console.group(`🔄 Action: ${action.type}`)
      console.log('Payload:', action.payload);
      console.log('Meta:', action.meta);
      console.groupEnd();
    }
    
    // Log state changes if enabled
    if (this.config.logStateChanges) {
      const changes = this.getStateChanges(previousState, newState);
      if (changes.length > 0) {
        console.group(`📊 State Changes: ${action.type}`);
        changes.forEach(change => {
          console.log(`${change.path}: ${change.from} → ${change.to}`);
        });
        console.groupEnd();
      }
    }
    
    // Track performance
    const actionTime = performance.now() - startTime;
    this.trackActionPerformance(action.type, actionTime);
    
    // Log performance if enabled and threshold exceeded
    if (this.config.logPerformance && actionTime > this.config.performanceThreshold) {
      console.warn(`⚠️ Slow action: ${action.type} took ${actionTime.toFixed(2)}ms`);
    }
    
    // Create snapshot
    const snapshot: StateSnapshot = {
      timestamp: Date.now(),
      state: newState.clone(),
      action,
      performance: {
        actionTime,
        stateSize: new Blob([newState.serialize()]).size,
        memoryUsage: (performance as any).memory?.usedJSHeapSize
      }
    };
    
    this.addSnapshot(snapshot);
    
    // Update debug panel if visible
    if (this.isDebugPanelVisible) {
      this.updateDebugPanel();
    }
  }
  
  /**
   * Get changes between two states
   */
  private getStateChanges(previous: GameState, current: GameState): StateChange[] {
    const changes: StateChange[] = [];
    
    // Compare basic properties
    if (previous.currentLevel !== current.currentLevel) {
      changes.push({
        path: 'currentLevel',
        from: previous.currentLevel,
        to: current.currentLevel,
        type: 'primitive'
      });
    }
    
    if (previous.previousLevel !== current.previousLevel) {
      changes.push({
        path: 'previousLevel',
        from: previous.previousLevel,
        to: current.previousLevel,
        type: 'primitive'
      });
    }
    
    // Compare selected star
    if (previous.selectedStar?.uniqueId !== current.selectedStar?.uniqueId) {
      changes.push({
        path: 'selectedStar',
        from: previous.selectedStar?.title || 'null',
        to: current.selectedStar?.title || 'null',
        type: 'object'
      });
    }
    
    // Compare stats
    for (const [key, value] of Object.entries(current.gameStats)) {
      if ((previous.gameStats as any)[key] !== value) {
        changes.push({
          path: `gameStats.${key}`,
          from: (previous.gameStats as any)[key],
          to: value,
          type: 'primitive'
        });
      }
    }
    
    // Compare sets
    if (previous.discoveredStars.size !== current.discoveredStars.size) {
      changes.push({
        path: 'discoveredStars',
        from: previous.discoveredStars.size,
        to: current.discoveredStars.size,
        type: 'set'
      });
    }
    
    if (previous.completedLevels.size !== current.completedLevels.size) {
      changes.push({
        path: 'completedLevels',
        from: previous.completedLevels.size,
        to: current.completedLevels.size,
        type: 'set'
      });
    }
    
    return changes;
  }
  
  /**
   * Track action performance
   */
  private trackActionPerformance(actionType: string, duration: number): void {
    if (!this.actionTimings.has(actionType)) {
      this.actionTimings.set(actionType, []);
    }
    
    const timings = this.actionTimings.get(actionType)!;
    timings.push(duration);
    
    // Keep only last 20 timings
    if (timings.length > 20) {
      timings.shift();
    }
  }
  
  /**
   * Add snapshot to history
   */
  private addSnapshot(snapshot: StateSnapshot): void {
    this.snapshots.push(snapshot);
    
    // Limit snapshot history
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift();
    }
  }
  
  /**
   * Log error with context
   */
  private logError(error: Error, context: any): void {
    console.group('🚨 Game Error');
    console.error('Error:', error);
    console.log('Context:', context);
    console.log('Current State:', this.gameStateManager.getState());
    console.log('Recent Actions:', this.gameStateManager.getActionHistory().slice(-5));
    console.groupEnd();
  }
  
  /**
   * Log performance warning
   */
  private logPerformanceWarning(type: string, value: number, threshold: number): void {
    console.warn(`⚠️ Performance Warning: ${type} = ${value} (threshold: ${threshold})`);
  }
  
  /**
   * Set up keyboard shortcuts for debugging
   */
  private setupKeyboardShortcuts(): void {
    if (typeof window === 'undefined') return;
    
    document.addEventListener('keydown', (event) => {
      // Ctrl+Shift+D: Toggle debug panel
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        this.toggleDebugPanel();
      }
      
      // Ctrl+Shift+S: Take state snapshot
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        this.takeSnapshot();
      }
      
      // Ctrl+Shift+R: Reset state
      if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        this.resetState();
      }
      
      // Ctrl+Shift+P: Print debug info
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        this.printDebugInfo();
      }
    });
  }
  
  /**
   * Create debug panel UI
   */
  private createDebugPanel(): void {
    if (typeof window === 'undefined') return;
    
    const panel = document.createElement('div');
    panel.id = 'game-debug-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 400px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      overflow-y: auto;
      z-index: 10000;
      display: none;
    `;
    
    document.body.appendChild(panel);
    this.debugPanel = panel;
  }
  
  /**
   * Toggle debug panel visibility
   */
  private toggleDebugPanel(): void {
    if (!this.debugPanel) return;
    
    this.isDebugPanelVisible = !this.isDebugPanelVisible;
    this.debugPanel.style.display = this.isDebugPanelVisible ? 'block' : 'none';
    
    if (this.isDebugPanelVisible) {
      this.updateDebugPanel();
    }
  }
  
  /**
   * Update debug panel content
   */
  private updateDebugPanel(): void {
    if (!this.debugPanel) return;
    
    const state = this.gameStateManager.getState();
    const performance = this.gameStateManager.getPerformanceMetrics();
    const recentActions = this.gameStateManager.getActionHistory().slice(-5);
    
    this.debugPanel.innerHTML = `
      <div style="margin-bottom: 10px;">
        <h3 style="margin: 0 0 10px 0;">🔍 Game State Debug</h3>
        <button onclick="this.parentElement.parentElement.style.display='none'" style="float: right; margin-top: -30px;">✕</button>
      </div>
      
      <div style="margin-bottom: 10px;">
        <h4>Current State</h4>
        <div>Level: ${state.currentLevel}</div>
        <div>Selected Star: ${state.selectedStar?.title || 'None'}</div>
        <div>Stars Discovered: ${state.gameStats.starsDiscovered}</div>
        <div>Time Explored: ${Math.floor(state.gameStats.timeExplored)}s</div>
      </div>
      
      <div style="margin-bottom: 10px;">
        <h4>Performance</h4>
        <div>Actions: ${performance.actionCount}</div>
        <div>Avg Action Time: ${performance.averageActionTime.toFixed(2)}ms</div>
        <div>State Size: ${performance.stateSize} bytes</div>
        <div>Subscribers: ${performance.subscriberCount}</div>
      </div>
      
      <div style="margin-bottom: 10px;">
        <h4>Recent Actions</h4>
        ${recentActions.map(action => `
          <div style="margin: 2px 0; padding: 2px; background: rgba(255,255,255,0.1);">
            ${action.type}
          </div>
        `).join('')}
      </div>
      
      <div style="margin-bottom: 10px;">
        <h4>Debug Controls</h4>
        <button onclick="window.gameDebugger.takeSnapshot()">Take Snapshot</button>
        <button onclick="window.gameDebugger.printDebugInfo()">Print Info</button>
        <button onclick="window.gameDebugger.resetState()">Reset State</button>
      </div>
    `;
  }
  
  /**
   * Take a manual snapshot
   */
  public takeSnapshot(): void {
    const state = this.gameStateManager.getState();
    const snapshot: StateSnapshot = {
      timestamp: Date.now(),
      state: state.clone(),
      action: { type: 'MANUAL_SNAPSHOT', meta: { timestamp: Date.now() } },
      performance: {
        actionTime: 0,
        stateSize: new Blob([state.serialize()]).size,
        memoryUsage: (performance as any).memory?.usedJSHeapSize
      }
    };
    
    this.addSnapshot(snapshot);
    console.log('📸 Manual snapshot taken:', snapshot);
  }
  
  /**
   * Reset game state (for debugging)
   */
  public resetState(): void {
    if (confirm('Reset game state? This will clear all progress.')) {
      this.gameStateManager.resetGame();
      console.log('🔄 Game state reset');
    }
  }
  
  /**
   * Print comprehensive debug information
   */
  public printDebugInfo(): void {
    const state = this.gameStateManager.getState();
    const performance = this.gameStateManager.getPerformanceMetrics();
    const actionHistory = this.gameStateManager.getActionHistory();
    
    console.group('🔍 Debug Information');
    
    console.group('📊 Current State');
    console.log('State:', state);
    console.log('Serialized Size:', new Blob([state.serialize()]).size, 'bytes');
    console.groupEnd();
    
    console.group('⚡ Performance');
    console.log('Metrics:', performance);
    console.log('Action Timings:', Array.from(this.actionTimings.entries()));
    console.groupEnd();
    
    console.group('📚 Action History');
    console.log('Total Actions:', actionHistory.length);
    console.log('Recent Actions:', actionHistory.slice(-10));
    console.groupEnd();
    
    console.group('📸 Snapshots');
    console.log('Total Snapshots:', this.snapshots.length);
    console.log('Recent Snapshots:', this.snapshots.slice(-5));
    console.groupEnd();
    
    console.groupEnd();
  }
  
  /**
   * Get debug statistics
   */
  public getDebugStats(): DebugStats {
    const actionTypes = new Set(this.gameStateManager.getActionHistory().map(a => a.type));
    const totalActionTime = Array.from(this.actionTimings.values())
      .flat()
      .reduce((sum, time) => sum + time, 0);
    
    return {
      totalSnapshots: this.snapshots.length,
      totalActions: this.gameStateManager.getActionHistory().length,
      uniqueActionTypes: actionTypes.size,
      averageActionTime: totalActionTime / this.gameStateManager.getActionHistory().length,
      stateSize: new Blob([this.gameStateManager.getState().serialize()]).size,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    };
  }
  
  /**
   * Export debug data
   */
  public exportDebugData(): string {
    const data = {
      config: this.config,
      snapshots: this.snapshots,
      actionTimings: Array.from(this.actionTimings.entries()),
      debugStats: this.getDebugStats(),
      timestamp: Date.now()
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  /**
   * Enable/disable debugging
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (!enabled && this.debugPanel) {
      this.debugPanel.style.display = 'none';
      this.isDebugPanelVisible = false;
    }
  }
}

// Interfaces
interface StateChange {
  path: string;
  from: any;
  to: any;
  type: 'primitive' | 'object' | 'set' | 'array';
}

interface DebugStats {
  totalSnapshots: number;
  totalActions: number;
  uniqueActionTypes: number;
  averageActionTime: number;
  stateSize: number;
  memoryUsage: number;
}

// Global debug instance (for console access)
declare global {
  interface Window {
    gameDebugger?: StateDebugger;
  }
}

export function initializeDebugger(eventBus: EventBus, gameStateManager: GameStateManager): StateDebugger {
  const stateDebugger = new StateDebugger(eventBus, gameStateManager);
  
  // Make available globally for console access
  if (typeof window !== 'undefined') {
    window.gameDebugger = stateDebugger;
  }
  
  return stateDebugger;
}