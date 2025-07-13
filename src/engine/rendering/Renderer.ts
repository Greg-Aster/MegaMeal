// Advanced Three.js renderer with post-processing pipeline

import * as THREE from 'three';
import { EffectComposer } from 'postprocessing';
import { RenderPass } from 'postprocessing';
import { BloomEffect } from 'postprocessing';
import { SSAOEffect } from 'postprocessing';
import { FXAAEffect } from 'postprocessing';
import { ToneMappingEffect } from 'postprocessing';
import { EffectPass } from 'postprocessing';

export interface RendererConfig {
  antialias?: boolean;
  enableShadows?: boolean;
  shadowMapType?: THREE.ShadowMapType;
  toneMapping?: THREE.ToneMapping;
  toneMappingExposure?: number;
  outputColorSpace?: THREE.ColorSpace;
  enablePostProcessing?: boolean;
  enableBloom?: boolean;
  enableSSAO?: boolean;
  enableFXAA?: boolean;
  enableToneMapping?: boolean;
  // Mobile-specific settings
  isMobile?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  maxPixelRatio?: number;
}

export class Renderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private config: RendererConfig;
  private isInitialized = false;
  
  // Post-processing effects
  private effects: {
    bloom?: BloomEffect;
    ssao?: SSAOEffect;
    fxaa?: FXAAEffect;
    toneMapping?: ToneMappingEffect;
  } = {};
  
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, container: HTMLElement, config?: RendererConfig) {
    this.scene = scene;
    this.camera = camera;
    this.container = container;
    
    // Detect mobile for default configuration
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    this.config = {
      antialias: !isMobile, // Disable on mobile by default
      enableShadows: !isMobile, // Disable shadows on mobile for better performance
      shadowMapType: isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap, // Use simpler shadows on mobile
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.0,
      outputColorSpace: THREE.SRGBColorSpace,
      enablePostProcessing: !isMobile, // Disable post-processing on mobile for performance
      enableBloom: !isMobile, // Disable bloom on mobile for performance
      enableSSAO: false, // Expensive, disabled by default
      enableFXAA: !isMobile, // Disable FXAA on mobile, use native antialiasing
      enableToneMapping: !isMobile, // Disable tone mapping on mobile for performance
      // Mobile-specific defaults
      isMobile,
      powerPreference: isMobile ? 'default' : 'high-performance',
      maxPixelRatio: isMobile ? 1.0 : 2,
      ...config
    };
    
    // Listen for optimization level changes
    if (typeof window !== 'undefined') {
      window.addEventListener('optimizationLevelChanged', this.handleOptimizationChange.bind(this) as EventListener);
    }
  }
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Renderer already initialized');
      return;
    }
    
    console.log('🎨 Initializing Renderer...');
    
    try {
      this.createRenderer();
      this.configureRenderer();
      this.setupPostProcessing();
      
      this.isInitialized = true;
      console.log('✅ Renderer initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Renderer:', error);
      throw error;
    }
  }
  
  private createRenderer(): void {
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: this.config.antialias,
        alpha: false,
        premultipliedAlpha: false,
        stencil: !this.config.isMobile, // Disable stencil buffer on mobile
        preserveDrawingBuffer: false,
        powerPreference: this.config.powerPreference || 'high-performance',
        failIfMajorPerformanceCaveat: false // Don't fail if software rendering is required
      });
      
      console.log('✅ WebGL renderer created successfully');
      
      // Log WebGL context info for debugging
      const gl = this.renderer.getContext();
      if (gl) {
        console.log('🎮 WebGL Context Info:', {
          vendor: gl.getParameter(gl.VENDOR),
          renderer: gl.getParameter(gl.RENDERER),
          version: gl.getParameter(gl.VERSION),
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          isMobile: this.config.isMobile
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to create WebGL renderer:', error);
      throw new Error(`WebGL initialization failed: ${error.message}`);
    }
    
    // Set size with mobile resolution scaling
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    // Scale down render resolution on mobile for better performance
    const isMobile = this.config.isMobile;
    const mobileScale = 0.75; // Render at 75% resolution on mobile
    const renderWidth = isMobile ? Math.floor(width * mobileScale) : width;
    const renderHeight = isMobile ? Math.floor(height * mobileScale) : height;
    
    console.log('📐 Setting renderer size:', { 
      display: { width, height }, 
      render: { width: renderWidth, height: renderHeight },
      mobile: isMobile 
    });
    
    this.renderer.setSize(renderWidth, renderHeight);
    
    // Scale canvas to full container size via CSS
    if (isMobile) {
      this.renderer.domElement.style.width = width + 'px';
      this.renderer.domElement.style.height = height + 'px';
    }
    
    // Use mobile-aware pixel ratio
    const maxPixelRatio = this.config.maxPixelRatio || 2;
    const pixelRatio = Math.min(window.devicePixelRatio, maxPixelRatio);
    this.renderer.setPixelRatio(pixelRatio);
    console.log('📱 Pixel ratio set to:', pixelRatio, '(max:', maxPixelRatio + ')');
    
    // Append to container
    this.container.appendChild(this.renderer.domElement);
  }
  
  private configureRenderer(): void {
    // Basic settings
    this.renderer.outputColorSpace = this.config.outputColorSpace!;
    
    // When using a post-processing pipeline with a ToneMappingEffect,
    // the renderer's own tone mapping must be disabled. The composer will handle it.
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = this.config.toneMappingExposure!;
    
    // Shadows
    if (this.config.enableShadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = this.config.shadowMapType!;
    }
    
    // Background
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.autoClear = true;
    
    // Performance optimizations
    this.renderer.info.autoReset = false;
  }
  
  private setupPostProcessing(): void {
    if (!this.config.enablePostProcessing) {
      return;
    }
    
    this.composer = new EffectComposer(this.renderer);
    
    // Base render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Create effects array for the effect pass
    const effects: any[] = [];
    
    // Bloom effect with smooth transitions to avoid hard edges
    if (this.config.enableBloom) {
      this.effects.bloom = new BloomEffect({
        intensity: 1.0, // Balanced intensity
        luminanceThreshold: 0.3, // Lower threshold to catch firefly emissive
        luminanceSmoothing: 0.25, // Higher smoothing to prevent hard edges
        mipmapBlur: true
      });
      effects.push(this.effects.bloom);
    }
    
    // SSAO effect
    if (this.config.enableSSAO) {
      this.effects.ssao = new SSAOEffect(this.camera, this.scene, {
        intensity: 0.5,
        radius: 0.1,
        bias: 0.01,
        samples: 32
      });
      effects.push(this.effects.ssao);
    }
    
    // FXAA effect (anti-aliasing)
    if (this.config.enableFXAA) {
      this.effects.fxaa = new FXAAEffect();
      effects.push(this.effects.fxaa);
    }
    
    // Tone mapping effect
    if (this.config.enableToneMapping) {
      this.effects.toneMapping = new ToneMappingEffect({
        mode: this.config.toneMapping,
        resolution: 256,
        whitePoint: 4.0,
        middleGrey: 0.6,
        minLuminance: 0.01,
        averageLuminance: 1.0,
        adaptationRate: 1.0
      });
      effects.push(this.effects.toneMapping);
    }
    
    // Add effects pass if we have any effects
    if (effects.length > 0) {
      const effectPass = new EffectPass(this.camera, ...effects);
      this.composer.addPass(effectPass);
    }
  }
  
  public render(): void {
    if (!this.isInitialized) return;
    
    // Update renderer info
    this.renderer.info.reset();
    
    if (this.composer && this.config.enablePostProcessing) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  public setSize(width: number, height: number): void {
    if (!this.isInitialized) return;
    
    // Scale down render resolution on mobile for better performance
    const isMobile = this.config.isMobile;
    const mobileScale = 0.75; // Render at 75% resolution on mobile
    const renderWidth = isMobile ? Math.floor(width * mobileScale) : width;
    const renderHeight = isMobile ? Math.floor(height * mobileScale) : height;
    
    this.renderer.setSize(renderWidth, renderHeight);
    
    // Scale canvas to full container size via CSS
    if (isMobile) {
      this.renderer.domElement.style.width = width + 'px';
      this.renderer.domElement.style.height = height + 'px';
    }
    
    // Update composer if it exists
    if (this.composer) {
      this.composer.setSize(renderWidth, renderHeight);
    }
  }
  
  public setPixelRatio(ratio: number): void {
    if (!this.isInitialized) return;
    
    this.renderer.setPixelRatio(Math.min(ratio, 2));
    
    if (this.composer) {
      this.composer.setSize(
        this.container.clientWidth,
        this.container.clientHeight
      );
    }
  }
  
  // Effect controls
  public setBloomIntensity(intensity: number): void {
    if (this.effects.bloom) {
      this.effects.bloom.intensity = intensity;
    }
  }
  
  public setSSAOIntensity(intensity: number): void {
    if (this.effects.ssao) {
      this.effects.ssao.intensity = intensity;
    }
  }
  
  public setToneMappingExposure(exposure: number): void {
    this.renderer.toneMappingExposure = exposure;
    this.config.toneMappingExposure = exposure;
  }
  
  public setBloomConfig(config: { intensity?: number; threshold?: number; smoothing?: number }): void {
    if (this.effects.bloom) {
      if (config.intensity !== undefined) {
        this.effects.bloom.intensity = config.intensity;
      }
      if (config.threshold !== undefined) {
        this.effects.bloom.luminanceMaterial.threshold = config.threshold;
      }
      if (config.smoothing !== undefined) {
        this.effects.bloom.luminanceMaterial.smoothing = config.smoothing;
      }
      console.log('✨ Bloom effect updated:', { 
        intensity: this.effects.bloom.intensity, 
        threshold: this.effects.bloom.luminanceMaterial.threshold,
        smoothing: this.effects.bloom.luminanceMaterial.smoothing
      });
    } else {
      console.warn('Bloom effect not enabled, cannot set config.');
    }
  }
  
  public toggleEffect(effectName: keyof typeof this.effects, enabled: boolean): void {
    const effect = this.effects[effectName];
    if (effect) {
      // This depends on the effect having a 'enabled' property
      // Most postprocessing effects don't have this, so we'd need to rebuild the composer
      console.warn(`Toggling ${effectName} effect not implemented - requires rebuilding composer`);
    }
  }
  

  // Performance monitoring
  public getRenderInfo(): THREE.WebGLInfo {
    return this.renderer.info;
  }
  
  public getMemoryInfo(): { geometries: number; textures: number } {
    return {
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures
    };
  }
  
  public getDrawCallInfo(): { calls: number; triangles: number; points: number; lines: number } {
    return {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      points: this.renderer.info.render.points,
      lines: this.renderer.info.render.lines
    };
  }
  
  // Getters
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
  
  public getComposer(): EffectComposer | null {
    return this.composer;
  }
  
  public getConfig(): RendererConfig {
    return { ...this.config };
  }
  
  public getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }
  
  // Screenshot functionality
  public captureScreenshot(format: 'image/png' | 'image/jpeg' = 'image/png', quality?: number): string {
    return this.renderer.domElement.toDataURL(format, quality);
  }
  
  public async captureScreenshotBlob(format: 'image/png' | 'image/jpeg' = 'image/png', quality?: number): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.renderer.domElement.toBlob(resolve, format, quality);
    });
  }
  
  /**
   * Handle optimization level changes from OptimizationManager
   */
  private handleOptimizationChange(event: Event): void {
    const { level } = (event as CustomEvent).detail;
    
    console.log('🎛️ Renderer responding to optimization level change:', level);
    
    // Update renderer configuration based on optimization level
    if (level.includes('mobile')) {
      // Aggressive mobile optimizations - disable expensive effects
      if (level === 'mobile_low' || level === 'mobile_medium') {
        this.config.enablePostProcessing = false; // Disable entirely for low/medium mobile
        this.config.enableBloom = false; // Very expensive on mobile
        this.config.enableFXAA = false;
        this.config.enableToneMapping = false;
      } else {
        // mobile_high - minimal post-processing
        this.config.enablePostProcessing = true;
        this.config.enableBloom = false; // Still disable bloom - too expensive
        this.config.enableFXAA = false;
        this.config.enableToneMapping = true;
      }
      this.config.enableShadows = true; // Keep shadows for lighting
    } else {
      // Desktop optimizations
      this.config.enablePostProcessing = true;
      this.config.enableBloom = true;
      this.config.enableFXAA = true;
      this.config.enableToneMapping = true;
      this.config.enableShadows = true;
    }
    
    // Update actual renderer shadow settings
    if (this.renderer) {
      this.renderer.shadowMap.enabled = this.config.enableShadows;
      console.log('🌓 Shadow settings updated:', this.config.enableShadows);
    }
    
    // Rebuild post-processing pipeline if initialized
    if (this.isInitialized) {
      this.rebuildPostProcessing();
    }
  }

  /**
   * Rebuild the post-processing pipeline with current configuration
   */
  private rebuildPostProcessing(): void {
    // Dispose existing composer
    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
    }
    
    // Dispose existing effects
    Object.values(this.effects).forEach(effect => {
      if (effect && typeof effect.dispose === 'function') {
        effect.dispose();
      }
    });
    this.effects = {};
    
    // Rebuild with current configuration
    this.setupPostProcessing();
    
    console.log('🔄 Post-processing pipeline rebuilt with current optimization settings');
  }

  public dispose(): void {
    console.log('🧹 Disposing Renderer...');
    
    // Remove optimization level listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('optimizationLevelChanged', this.handleOptimizationChange.bind(this) as EventListener);
    }
    
    // Dispose post-processing
    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
    }
    
    // Dispose effects
    Object.values(this.effects).forEach(effect => {
      if (effect && typeof effect.dispose === 'function') {
        effect.dispose();
      }
    });
    this.effects = {};
    
    // Remove canvas from container
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    
    // Dispose renderer
    this.renderer.dispose();
    
    this.isInitialized = false;
    
    console.log('✅ Renderer disposed');
  }
}