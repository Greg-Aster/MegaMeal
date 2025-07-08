// Core Game Engine
// Main engine class that orchestrates all game systems

import * as THREE from 'three';
import { Renderer } from '../rendering/Renderer';
import { InputManager } from '../input/InputManager';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { AudioManager } from '../audio/AudioManager';
import { AssetLoader } from '../resources/AssetLoader';
import { Time } from './Time';
import { EventBus } from './EventBus';
import { Debug } from '../utils/Debug';
import { Performance } from '../utils/Performance';

export interface EngineConfig {
  canvas?: HTMLCanvasElement;
  container?: HTMLElement;
  enablePhysics?: boolean;
  enableAudio?: boolean;
  enableDebug?: boolean;
  enablePerformanceMonitoring?: boolean;
  targetFPS?: number;
}

export class Engine {
  private static instance: Engine;
  
  // Core systems
  private renderer!: Renderer;
  private inputManager!: InputManager;
  private physicsWorld!: PhysicsWorld;
  private audioManager!: AudioManager;
  private assetLoader!: AssetLoader;
  private time!: Time;
  private eventBus!: EventBus;
  private debug!: Debug;
  private performance!: Performance;
  
  // Three.js core
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  
  // State
  private isRunning = false;
  private isInitialized = false;
  private animationId: number | null = null;
  private config: EngineConfig;
  private container: HTMLElement;
  
  private constructor(config: EngineConfig) {
    this.config = {
      enablePhysics: true,
      enableAudio: true,
      enableDebug: false,
      enablePerformanceMonitoring: false,
      targetFPS: 60,
      ...config
    };
    
    if (!config.container) {
      throw new Error('Engine requires a container element');
    }
    
    this.container = config.container;
    this.initializeSystems();
  }
  
  public static getInstance(config?: EngineConfig): Engine {
    if (!Engine.instance) {
      if (!config) {
        throw new Error('Engine not initialized. Provide config on first call.');
      }
      Engine.instance = new Engine(config);
    }
    return Engine.instance;
  }
  
  private initializeSystems(): void {
    // Initialize core systems
    this.eventBus = new EventBus();
    this.time = new Time();
    this.performance = new Performance();
    
    // Initialize Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      2000
    );
    
    // Initialize engine systems
    this.renderer = new Renderer(this.scene, this.camera, this.container);
    this.inputManager = new InputManager(this.container, this.eventBus, {
      enablePointerLock: false  // Disable FPS pointer lock for now
    });
    this.assetLoader = new AssetLoader();
    
    if (this.config.enablePhysics) {
      this.physicsWorld = new PhysicsWorld();
    }
    
    if (this.config.enableAudio) {
      this.audioManager = new AudioManager();
    }
    
    if (this.config.enableDebug) {
      this.debug = new Debug(this);
    }
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Engine events
    this.eventBus.on('engine.pause', () => this.pause());
    this.eventBus.on('engine.resume', () => this.resume());
    this.eventBus.on('engine.stop', () => this.stop());
  }
  
  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    
    this.eventBus.emit('engine.resize', { width, height });
  }
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Engine already initialized');
      return;
    }
    
    console.log('🚀 Initializing Game Engine...');
    
    try {
      // Initialize systems in order
      await this.renderer.initialize();
      await this.inputManager.initialize();
      
      if (this.physicsWorld) {
        await this.physicsWorld.initialize();
      }
      
      if (this.audioManager) {
        await this.audioManager.initialize();
      }
      
      await this.assetLoader.initialize();
      
      if (this.debug) {
        await this.debug.initialize();
      }
      
      this.isInitialized = true;
      console.log('✅ Game Engine initialized successfully');
      
      this.eventBus.emit('engine.initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Game Engine:', error);
      throw error;
    }
  }
  
  public start(): void {
    if (!this.isInitialized) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }
    
    if (this.isRunning) {
      console.warn('Engine already running');
      return;
    }
    
    console.log('🎮 Starting Game Engine...');
    this.isRunning = true;
    this.time.start();
    
    if (this.config.enablePerformanceMonitoring) {
      this.performance.start();
    }
    
    this.gameLoop();
    this.eventBus.emit('engine.started');
  }
  
  public pause(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.time.pause();
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.eventBus.emit('engine.paused');
  }
  
  public resume(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.time.resume();
    this.gameLoop();
    this.eventBus.emit('engine.resumed');
  }
  
  public stop(): void {
    this.isRunning = false;
    this.time.stop();
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.config.enablePerformanceMonitoring) {
      this.performance.stop();
    }
    
    this.eventBus.emit('engine.stopped');
  }
  
  private gameLoop = (): void => {
    if (!this.isRunning) return;
    
    this.animationId = requestAnimationFrame(this.gameLoop);
    
    try {
      // Update time
      this.time.update();
      
      // Update performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.performance.begin();
      }
      
      // Update systems
      this.inputManager.update(this.time.deltaTime);
      
      if (this.physicsWorld) {
        this.physicsWorld.update(this.time.deltaTime);
      }
      
      if (this.audioManager) {
        this.audioManager.update(this.time.deltaTime);
      }
      
      // Emit update event for game systems
      this.eventBus.emit('engine.update', {
        deltaTime: this.time.deltaTime,
        totalTime: this.time.totalTime
      });
      
      // Render
      this.renderer.render();
      
      // Update debug
      if (this.debug) {
        this.debug.update();
      }
      
      // End performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.performance.end();
      }
      
    } catch (error) {
      console.error('Error in game loop:', error);
      this.eventBus.emit('engine.error', error);
    }
  };
  
  // Getters
  public getScene(): THREE.Scene {
    return this.scene;
  }
  
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  public getRenderer(): Renderer {
    return this.renderer;
  }
  
  public getInputManager(): InputManager {
    return this.inputManager;
  }
  
  public getPhysicsWorld(): PhysicsWorld | null {
    return this.physicsWorld || null;
  }
  
  public getAudioManager(): AudioManager | null {
    return this.audioManager || null;
  }
  
  public getAssetLoader(): AssetLoader {
    return this.assetLoader;
  }
  
  public getTime(): Time {
    return this.time;
  }
  
  public getEventBus(): EventBus {
    return this.eventBus;
  }
  
  public getDebug(): Debug | null {
    return this.debug || null;
  }
  
  public getContainer(): HTMLElement {
    return this.container;
  }
  
  public isEngineRunning(): boolean {
    return this.isRunning;
  }
  
  public dispose(): void {
    console.log('🧹 Disposing Game Engine...');
    
    this.stop();
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // Dispose systems
    this.renderer?.dispose();
    this.inputManager?.dispose();
    this.physicsWorld?.dispose();
    this.audioManager?.dispose();
    this.assetLoader?.dispose();
    this.debug?.dispose();
    this.performance?.dispose();
    
    // Clear references
    this.scene = null as any;
    this.camera = null as any;
    
    Engine.instance = null as any;
    
    console.log('✅ Game Engine disposed');
  }
}