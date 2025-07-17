// Core Game Engine
// Main engine class that orchestrates all game systems

import * as THREE from 'three';
import { Renderer } from '../rendering/Renderer';
// InputManager removed - now using UniversalInputManager
import { Materials } from '../rendering/Materials';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { AudioManager } from '../audio/AudioManager';
import { AssetLoader } from '../resources/AssetLoader';
import { Time } from './Time';
import { EventBus } from './EventBus';
import { Debug } from '../utils/Debug';
import { Performance } from '../utils/Performance';
import { OptimizationManager } from '../optimization/OptimizationManager';
import { EnvironmentalEffectsSystem } from '../systems/EnvironmentalEffectsSystem';
import { OutlineRenderer } from '../rendering/OutlineRenderer';

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
  // inputManager removed - now using UniversalInputManager in GameManager
  private materials!: Materials;
  private physicsWorld!: PhysicsWorld;
  private audioManager!: AudioManager;
  private assetLoader!: AssetLoader;
  private time!: Time;
  private eventBus!: EventBus;
  private debug!: Debug;
  private performance!: Performance;
  private optimizationManager!: OptimizationManager;
  private environmentalEffects!: EnvironmentalEffectsSystem;
  private outlineRenderer!: OutlineRenderer;
  
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
    // Auto-enable performance monitoring on mobile for diagnostics
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    this.config = {
      enablePhysics: true,
      enableAudio: true,
      enableDebug: false,
      enablePerformanceMonitoring: isMobile, // Enable on mobile for diagnostics
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
    this.optimizationManager = OptimizationManager.getInstance();
    this.environmentalEffects = EnvironmentalEffectsSystem.getInstance(this.eventBus);
    
    // Initialize Three.js
    this.scene = new THREE.Scene();
    
    // Mobile-aware camera far plane for better performance
    // Must be high enough to see stars (990) and skybox (1000)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const farPlane = isMobile ? 1200 : 2000;
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      farPlane
    );
    
    // Initialize engine systems
    this.renderer = new Renderer(this.scene, this.camera, this.container);
    this.materials = new Materials(THREE);
    // InputManager removed - now using UniversalInputManager in GameManager
    this.assetLoader = new AssetLoader();
    
    // Initialize outline renderer - disabled by default for realistic mode
    this.outlineRenderer = new OutlineRenderer(this.scene, {
      enabled: false,
      thickness: 0.025,
      color: 0x000000
    });
    
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
      // InputManager removed - now using UniversalInputManager in GameManager
      
      if (this.physicsWorld) {
        await this.physicsWorld.initialize();
      }
      
      if (this.audioManager) {
        await this.audioManager.initialize();
      }
      
      await this.assetLoader.initialize();
      
      // Initialize optimization system
      this.optimizationManager.initialize(this.camera, this.scene, this.renderer.getRenderer());
      
      // Initialize environmental effects system
      this.environmentalEffects.initialize(this.camera, this.scene);
      
      // OutlineRenderer doesn't need async initialization
      console.log('🖼️ Outline renderer initialized for toon shading');
      
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
      
      // Update systems (InputManager removed - handled by UniversalInputManager)
      
      if (this.physicsWorld) {
        this.physicsWorld.update(this.time.deltaTime);
      }
      
      if (this.audioManager) {
        this.audioManager.update(this.time.deltaTime);
      }
      
      // Update optimization system
      this.optimizationManager.update(this.time.deltaTime);
      
      // Update environmental effects system
      this.environmentalEffects.update(this.time.deltaTime);
      
      // Update outline renderer for toon shading
      this.outlineRenderer.update(this.time.deltaTime);
      
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
  
  public getMaterials(): Materials {
    return this.materials;
  }
  
  // getInputManager removed - now using UniversalInputManager in GameManager
  
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
  
  public getOptimizationManager(): OptimizationManager {
    return this.optimizationManager;
  }
  
  public getEnvironmentalEffects(): EnvironmentalEffectsSystem {
    return this.environmentalEffects;
  }
  
  public getOutlineRenderer(): OutlineRenderer {
    return this.outlineRenderer;
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
    this.materials?.dispose();
    // inputManager removed - disposed by GameManager's UniversalInputManager
    this.physicsWorld?.dispose();
    this.audioManager?.dispose();
    this.assetLoader?.dispose();
    this.debug?.dispose();
    this.performance?.dispose();
    this.optimizationManager?.dispose();
    this.environmentalEffects?.dispose();
    this.outlineRenderer?.dispose();
    
    // Clear references
    this.scene = null as any;
    this.camera = null as any;
    
    Engine.instance = null as any;
    
    console.log('✅ Game Engine disposed');
  }
}