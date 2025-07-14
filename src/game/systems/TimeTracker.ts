import { EventBus } from '../../engine/core/EventBus';

/**
 * High-performance time tracking system for per-frame updates
 * Decouples frequent time updates from state management
 */
export class TimeTracker {
  private eventBus: EventBus;
  private totalPlayTime: number = 0;
  private timeExplored: number = 0;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 1000; // Emit events every 1 second
  private accumulatedTime: number = 0;
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Update time tracking (called every frame)
   * This is optimized for high-frequency calls
   */
  public update(deltaTime: number): void {
    // Update internal counters (very fast)
    this.totalPlayTime += deltaTime;
    this.timeExplored += deltaTime;
    this.accumulatedTime += deltaTime;
    
    // Only emit events at lower frequency
    if (this.accumulatedTime >= this.updateInterval) {
      this.emitTimeUpdate();
      this.accumulatedTime = 0;
    }
  }
  
  /**
   * Get current time values (no overhead)
   */
  public getCurrentTime(): { totalPlayTime: number; timeExplored: number } {
    return {
      totalPlayTime: this.totalPlayTime,
      timeExplored: this.timeExplored
    };
  }
  
  /**
   * Set time values (for loading saved games)
   */
  public setTime(totalPlayTime: number, timeExplored: number): void {
    this.totalPlayTime = totalPlayTime;
    this.timeExplored = timeExplored;
  }
  
  /**
   * Force immediate time update event
   */
  public forceUpdate(): void {
    this.emitTimeUpdate();
    this.accumulatedTime = 0;
  }
  
  /**
   * Set update interval for events
   */
  public setUpdateInterval(intervalMs: number): void {
    this.updateInterval = intervalMs;
  }
  
  /**
   * Reset time tracking
   */
  public reset(): void {
    this.totalPlayTime = 0;
    this.timeExplored = 0;
    this.accumulatedTime = 0;
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Emit time update event (low frequency)
   */
  private emitTimeUpdate(): void {
    this.eventBus.emit('time.updated', {
      totalPlayTime: this.totalPlayTime,
      timeExplored: this.timeExplored,
      timestamp: Date.now()
    });
  }
}