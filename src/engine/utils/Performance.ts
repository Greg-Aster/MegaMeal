// Performance monitoring utilities

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
  } | null;
  renderCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

export class Performance {
  private isMonitoring = false;
  private startTime = 0;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 0;
  private frameTime = 0;
  
  // FPS calculation
  private fpsHistory: number[] = [];
  private readonly fpsHistorySize = 60; // Keep 60 frames for smoothing
  
  // Memory monitoring
  private memoryInfo: { used: number; total: number; limit: number } | null = null;
  
  // Performance markers
  private markers = new Map<string, { start: number; end?: number; duration?: number }>();
  
  // Callbacks
  private onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  
  constructor() {
    this.setupMemoryMonitoring();
  }
  
  private setupMemoryMonitoring(): void {
    // Check if memory API is available (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.memoryInfo = {
        used: 0,
        total: 0,
        limit: memory.jsHeapSizeLimit || 0
      };
    }
  }
  
  public start(): void {
    if (this.isMonitoring) {
      console.warn('Performance monitoring already started');
      return;
    }
    
    this.isMonitoring = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.frameCount = 0;
    this.fpsHistory = [];
    
    console.log('📊 Performance monitoring started');
  }
  
  public stop(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    this.markers.clear();
    
    console.log('📊 Performance monitoring stopped');
  }
  
  public begin(): void {
    if (!this.isMonitoring) return;
    
    const now = performance.now();
    this.frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.frameCount++;
    
    // Calculate FPS
    this.calculateFPS();
    
    // Update memory info
    this.updateMemoryInfo();
  }
  
  public end(): void {
    if (!this.isMonitoring) return;
    
    // Emit metrics if callback is set
    if (this.onMetricsUpdate) {
      const metrics = this.getMetrics();
      this.onMetricsUpdate(metrics);
    }
  }
  
  private calculateFPS(): void {
    if (this.frameTime > 0) {
      const currentFPS = 1000 / this.frameTime;
      this.fpsHistory.push(currentFPS);
      
      // Keep history size manageable
      if (this.fpsHistory.length > this.fpsHistorySize) {
        this.fpsHistory.shift();
      }
      
      // Calculate smoothed FPS
      const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
      this.fps = Math.round(sum / this.fpsHistory.length);
    }
  }
  
  private updateMemoryInfo(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (this.memoryInfo) {
        this.memoryInfo.used = memory.usedJSHeapSize;
        this.memoryInfo.total = memory.totalJSHeapSize;
      }
    }
  }
  
  public mark(name: string): void {
    if (!this.isMonitoring) return;
    
    const marker = this.markers.get(name);
    if (marker && !marker.end) {
      // End existing marker
      marker.end = performance.now();
      marker.duration = marker.end - marker.start;
    } else {
      // Start new marker
      this.markers.set(name, { start: performance.now() });
    }
  }
  
  public measure(name: string, startMark?: string, endMark?: string): number {
    if (!this.isMonitoring) return 0;
    
    let startTime = 0;
    let endTime = performance.now();
    
    if (startMark) {
      const startMarker = this.markers.get(startMark);
      startTime = startMarker ? startMarker.start : 0;
    }
    
    if (endMark) {
      const endMarker = this.markers.get(endMark);
      endTime = endMarker ? (endMarker.end || endMarker.start) : performance.now();
    }
    
    const duration = endTime - startTime;
    this.markers.set(name, { start: startTime, end: endTime, duration });
    
    return duration;
  }
  
  public getMarkerDuration(name: string): number {
    const marker = this.markers.get(name);
    return marker?.duration || 0;
  }
  
  public clearMarkers(): void {
    this.markers.clear();
  }
  
  public getMetrics(renderInfo?: any): PerformanceMetrics {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      memoryUsage: this.memoryInfo ? { ...this.memoryInfo } : null,
      renderCalls: renderInfo?.render?.calls || 0,
      triangles: renderInfo?.render?.triangles || 0,
      geometries: renderInfo?.memory?.geometries || 0,
      textures: renderInfo?.memory?.textures || 0
    };
  }
  
  public getFPS(): number {
    return this.fps;
  }
  
  public getFrameTime(): number {
    return this.frameTime;
  }
  
  public getAverageFrameTime(): number {
    if (this.fpsHistory.length === 0) return 0;
    
    const frameTimeHistory = this.fpsHistory.map(fps => 1000 / fps);
    const sum = frameTimeHistory.reduce((a, b) => a + b, 0);
    return sum / frameTimeHistory.length;
  }
  
  public getMemoryUsage(): { used: number; total: number; limit: number } | null {
    return this.memoryInfo ? { ...this.memoryInfo } : null;
  }
  
  public getUptime(): number {
    return this.isMonitoring ? performance.now() - this.startTime : 0;
  }
  
  public onUpdate(callback: (metrics: PerformanceMetrics) => void): void {
    this.onMetricsUpdate = callback;
  }
  
  // Performance utilities
  public static time<T>(label: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  
  public static async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  
  // Performance analysis
  public analyzePerformance(): {
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    frameDrops: number;
    memoryTrend: 'stable' | 'increasing' | 'decreasing' | 'unknown';
  } {
    const analysis = {
      averageFPS: 0,
      minFPS: 0,
      maxFPS: 0,
      frameDrops: 0,
      memoryTrend: 'unknown' as const
    };
    
    if (this.fpsHistory.length > 0) {
      analysis.averageFPS = Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);
      analysis.minFPS = Math.round(Math.min(...this.fpsHistory));
      analysis.maxFPS = Math.round(Math.max(...this.fpsHistory));
      
      // Count frame drops (FPS below 50)
      analysis.frameDrops = this.fpsHistory.filter(fps => fps < 50).length;
    }
    
    return analysis;
  }
  
  public logPerformanceReport(): void {
    const analysis = this.analyzePerformance();
    const uptime = this.getUptime();
    const memory = this.getMemoryUsage();
    
    console.group('📊 Performance Report');
    console.log(`Uptime: ${(uptime / 1000).toFixed(2)}s`);
    console.log(`Current FPS: ${this.fps}`);
    console.log(`Average FPS: ${analysis.averageFPS}`);
    console.log(`FPS Range: ${analysis.minFPS} - ${analysis.maxFPS}`);
    console.log(`Frame Drops: ${analysis.frameDrops}/${this.fpsHistory.length}`);
    console.log(`Frame Time: ${this.frameTime.toFixed(2)}ms`);
    
    if (memory) {
      console.log(`Memory: ${(memory.used / 1024 / 1024).toFixed(2)}MB / ${(memory.total / 1024 / 1024).toFixed(2)}MB`);
    }
    
    if (this.markers.size > 0) {
      console.log('Markers:');
      this.markers.forEach((marker, name) => {
        if (marker.duration !== undefined) {
          console.log(`  ${name}: ${marker.duration.toFixed(2)}ms`);
        }
      });
    }
    
    console.groupEnd();
  }
  
  public dispose(): void {
    this.stop();
    this.onMetricsUpdate = undefined;
    this.fpsHistory = [];
    this.memoryInfo = null;
  }
}