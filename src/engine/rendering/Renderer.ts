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
    
    this.config = {
      antialias: true,
      enableShadows: true,
      shadowMapType: THREE.PCFSoftShadowMap,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.0,
      outputColorSpace: THREE.SRGBColorSpace,
      enablePostProcessing: true,
      enableBloom: true,
      enableSSAO: false, // Can be expensive, disabled by default
      enableFXAA: true,
      enableToneMapping: true,
      ...config
    };
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
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.config.antialias,
      alpha: false,
      premultipliedAlpha: false,
      stencil: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });
    
    // Set size
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit to 2x for performance
    
    // Append to container
    this.container.appendChild(this.renderer.domElement);
  }
  
  private configureRenderer(): void {
    // Basic settings
    this.renderer.outputColorSpace = this.config.outputColorSpace!;
    this.renderer.toneMapping = this.config.toneMapping!;
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
    
    // Bloom effect
    if (this.config.enableBloom) {
      this.effects.bloom = new BloomEffect({
        intensity: 0.5,
        luminanceThreshold: 0.9,
        luminanceSmoothing: 0.025,
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
    
    this.renderer.setSize(width, height);
    
    if (this.composer) {
      this.composer.setSize(width, height);
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
  
  public dispose(): void {
    console.log('🧹 Disposing Renderer...');
    
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