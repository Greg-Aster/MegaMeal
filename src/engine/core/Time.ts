// Time management system for consistent timing across the game

export class Time {
  private startTime: number = 0;
  private currentTime: number = 0;
  private lastTime: number = 0;
  private pausedTime: number = 0;
  private totalPausedTime: number = 0;
  private isPaused: boolean = false;
  
  public deltaTime: number = 0;
  public totalTime: number = 0;
  public frameCount: number = 0;
  public fps: number = 0;
  
  // FPS calculation
  private fpsCounter: number = 0;
  private fpsTime: number = 0;
  private readonly fpsUpdateInterval: number = 1000; // Update FPS every second
  
  constructor() {
    this.reset();
  }
  
  public start(): void {
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.currentTime = this.startTime;
    this.isPaused = false;
    this.totalPausedTime = 0;
  }
  
  public update(): void {
    if (this.isPaused) {
      this.deltaTime = 0;
      return;
    }
    
    this.currentTime = performance.now();
    this.deltaTime = (this.currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = this.currentTime;
    
    // Calculate total time excluding paused periods
    this.totalTime = (this.currentTime - this.startTime - this.totalPausedTime) / 1000;
    
    // Update frame count
    this.frameCount++;
    
    // Update FPS
    this.updateFPS();
    
    // Clamp delta time to prevent large jumps (e.g., when tab is not focused)
    this.deltaTime = Math.min(this.deltaTime, 1/30); // Cap at 30 FPS minimum
  }
  
  private updateFPS(): void {
    this.fpsCounter++;
    this.fpsTime += this.deltaTime * 1000;
    
    if (this.fpsTime >= this.fpsUpdateInterval) {
      this.fps = Math.round((this.fpsCounter * 1000) / this.fpsTime);
      this.fpsCounter = 0;
      this.fpsTime = 0;
    }
  }
  
  public pause(): void {
    if (this.isPaused) return;
    
    this.isPaused = true;
    this.pausedTime = performance.now();
  }
  
  public resume(): void {
    if (!this.isPaused) return;
    
    const now = performance.now();
    this.totalPausedTime += now - this.pausedTime;
    this.lastTime = now;
    this.isPaused = false;
  }
  
  public stop(): void {
    this.isPaused = false;
    this.deltaTime = 0;
  }
  
  public reset(): void {
    this.startTime = 0;
    this.currentTime = 0;
    this.lastTime = 0;
    this.pausedTime = 0;
    this.totalPausedTime = 0;
    this.isPaused = false;
    this.deltaTime = 0;
    this.totalTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsCounter = 0;
    this.fpsTime = 0;
  }
  
  // Utility methods
  public getDeltaTime(): number {
    return this.deltaTime;
  }
  
  public getTotalTime(): number {
    return this.totalTime;
  }
  
  public getFPS(): number {
    return this.fps;
  }
  
  public getFrameCount(): number {
    return this.frameCount;
  }
  
  public isPausedState(): boolean {
    return this.isPaused;
  }
  
  // Time utilities
  public static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
  
  public static smoothStep(t: number): number {
    return t * t * (3 - 2 * t);
  }
  
  public static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
  
  public static map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }
}