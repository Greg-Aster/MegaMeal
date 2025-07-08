// Asset loading and management system

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// GLTF type definition
export interface GLTF {
  animations: THREE.AnimationClip[];
  scene: THREE.Group;
  scenes: THREE.Group[];
  cameras: THREE.Camera[];
  asset: {
    copyright?: string;
    generator?: string;
    version?: string;
    minVersion?: string;
    extensions?: any;
    extras?: any;
  };
  parser: any;
  userData: any;
}

export interface AssetManifest {
  textures: { [key: string]: string };
  models: { [key: string]: string };
  audio: { [key: string]: string };
  hdri: { [key: string]: string };
}

export interface LoadProgress {
  total: number;
  loaded: number;
  percentage: number;
  currentAsset: string;
}

export class AssetLoader {
  private loadingManager: THREE.LoadingManager;
  private textureLoader: THREE.TextureLoader;
  private gltfLoader: GLTFLoader;
  private cubeTextureLoader: THREE.CubeTextureLoader;
  private rgbeLoader: any; // RGBELoader for HDR
  
  // Asset caches
  private textures = new Map<string, THREE.Texture>();
  private models = new Map<string, GLTF>();
  private cubeMaps = new Map<string, THREE.CubeTexture>();
  private hdriTextures = new Map<string, THREE.DataTexture>();
  
  // Loading state
  private isInitialized = false;
  private loadingProgress: LoadProgress = {
    total: 0,
    loaded: 0,
    percentage: 0,
    currentAsset: ''
  };
  
  // Callbacks
  private onProgressCallback?: (progress: LoadProgress) => void;
  private onLoadCallback?: () => void;
  private onErrorCallback?: (error: Error) => void;
  
  constructor() {
    this.setupLoadingManager();
    this.setupLoaders();
  }
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('AssetLoader already initialized');
      return;
    }
    
    console.log('📦 Initializing Asset Loader...');
    
    try {
      // Load DRACO decoder (for compressed models)
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
      this.gltfLoader.setDRACOLoader(dracoLoader);
      
      // Try to load RGBELoader for HDR textures
      try {
        const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js');
        this.rgbeLoader = new RGBELoader(this.loadingManager);
        this.rgbeLoader.setDataType(THREE.HalfFloatType);
      } catch (error) {
        console.warn('RGBELoader not available, HDR loading disabled');
      }
      
      this.isInitialized = true;
      console.log('✅ Asset Loader initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Asset Loader:', error);
      throw error;
    }
  }
  
  private setupLoadingManager(): void {
    this.loadingManager = new THREE.LoadingManager();
    
    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      this.loadingProgress.total = itemsTotal;
      this.loadingProgress.loaded = itemsLoaded;
      this.loadingProgress.percentage = 0;
      console.log(`Started loading: ${itemsTotal} items`);
    };
    
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      this.loadingProgress.loaded = itemsLoaded;
      this.loadingProgress.total = itemsTotal;
      this.loadingProgress.percentage = (itemsLoaded / itemsTotal) * 100;
      this.loadingProgress.currentAsset = url;
      
      this.onProgressCallback?.(this.loadingProgress);
      console.log(`Loading progress: ${this.loadingProgress.percentage.toFixed(1)}% (${itemsLoaded}/${itemsTotal}) - ${url}`);
    };
    
    this.loadingManager.onLoad = () => {
      this.loadingProgress.percentage = 100;
      this.onLoadCallback?.();
      console.log('✅ All assets loaded');
    };
    
    this.loadingManager.onError = (url) => {
      const error = new Error(`Failed to load asset: ${url}`);
      this.onErrorCallback?.(error);
      console.error('❌ Asset loading error:', url);
    };
  }
  
  private setupLoaders(): void {
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.cubeTextureLoader = new THREE.CubeTextureLoader(this.loadingManager);
  }
  
  // Texture loading
  public loadTexture(id: string, url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      if (this.textures.has(id)) {
        resolve(this.textures.get(id)!);
        return;
      }
      
      this.textureLoader.load(
        url,
        (texture) => {
          this.textures.set(id, texture);
          resolve(texture);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }
  
  // Model loading
  public loadModel(id: string, url: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      if (this.models.has(id)) {
        resolve(this.models.get(id)!);
        return;
      }
      
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.models.set(id, gltf);
          resolve(gltf);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }
  
  // Cube map loading
  public loadCubeMap(id: string, urls: string[]): Promise<THREE.CubeTexture> {
    return new Promise((resolve, reject) => {
      if (this.cubeMaps.has(id)) {
        resolve(this.cubeMaps.get(id)!);
        return;
      }
      
      this.cubeTextureLoader.load(
        urls,
        (cubeTexture) => {
          this.cubeMaps.set(id, cubeTexture);
          resolve(cubeTexture);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }
  
  // HDR loading
  public loadHDRI(id: string, url: string): Promise<THREE.DataTexture> {
    return new Promise((resolve, reject) => {
      if (!this.rgbeLoader) {
        reject(new Error('RGBELoader not available'));
        return;
      }
      
      if (this.hdriTextures.has(id)) {
        resolve(this.hdriTextures.get(id)!);
        return;
      }
      
      this.rgbeLoader.load(
        url,
        (texture: THREE.DataTexture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          this.hdriTextures.set(id, texture);
          resolve(texture);
        },
        undefined,
        (error: any) => reject(error)
      );
    });
  }
  
  // Batch loading from manifest
  public async loadManifest(manifest: AssetManifest): Promise<void> {
    const promises: Promise<any>[] = [];
    
    // Load textures
    Object.entries(manifest.textures).forEach(([id, url]) => {
      promises.push(this.loadTexture(id, url));
    });
    
    // Load models
    Object.entries(manifest.models).forEach(([id, url]) => {
      promises.push(this.loadModel(id, url));
    });
    
    // Load HDRI
    Object.entries(manifest.hdri).forEach(([id, url]) => {
      promises.push(this.loadHDRI(id, url));
    });
    
    await Promise.all(promises);
  }
  
  // Getters
  public getTexture(id: string): THREE.Texture | undefined {
    return this.textures.get(id);
  }
  
  public getModel(id: string): GLTF | undefined {
    return this.models.get(id);
  }
  
  public getCubeMap(id: string): THREE.CubeTexture | undefined {
    return this.cubeMaps.get(id);
  }
  
  public getHDRI(id: string): THREE.DataTexture | undefined {
    return this.hdriTextures.get(id);
  }
  
  // Clone model for reuse
  public cloneModel(id: string): THREE.Group | undefined {
    const gltf = this.models.get(id);
    if (!gltf) return undefined;
    
    return gltf.scene.clone();
  }
  
  // Progress monitoring
  public getLoadingProgress(): LoadProgress {
    return { ...this.loadingProgress };
  }
  
  public onProgress(callback: (progress: LoadProgress) => void): void {
    this.onProgressCallback = callback;
  }
  
  public onLoad(callback: () => void): void {
    this.onLoadCallback = callback;
  }
  
  public onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }
  
  // Cache management
  public clearTextureCache(): void {
    this.textures.forEach((texture) => {
      texture.dispose();
    });
    this.textures.clear();
  }
  
  public clearModelCache(): void {
    this.models.clear(); // Models don't need manual disposal
  }
  
  public clearAllCaches(): void {
    this.clearTextureCache();
    this.clearModelCache();
    
    this.cubeMaps.forEach((cubeTexture) => {
      cubeTexture.dispose();
    });
    this.cubeMaps.clear();
    
    this.hdriTextures.forEach((texture) => {
      texture.dispose();
    });
    this.hdriTextures.clear();
  }
  
  // Asset information
  public getLoadedAssets(): {
    textures: string[];
    models: string[];
    cubeMaps: string[];
    hdriTextures: string[];
  } {
    return {
      textures: Array.from(this.textures.keys()),
      models: Array.from(this.models.keys()),
      cubeMaps: Array.from(this.cubeMaps.keys()),
      hdriTextures: Array.from(this.hdriTextures.keys())
    };
  }
  
  public isAssetLoaded(id: string): boolean {
    return this.textures.has(id) || 
           this.models.has(id) || 
           this.cubeMaps.has(id) || 
           this.hdriTextures.has(id);
  }
  
  // Preloading utilities
  public preloadTextures(textureUrls: { [key: string]: string }): Promise<THREE.Texture[]> {
    const promises = Object.entries(textureUrls).map(([id, url]) => 
      this.loadTexture(id, url)
    );
    return Promise.all(promises);
  }
  
  public preloadModels(modelUrls: { [key: string]: string }): Promise<GLTF[]> {
    const promises = Object.entries(modelUrls).map(([id, url]) => 
      this.loadModel(id, url)
    );
    return Promise.all(promises);
  }
  
  public dispose(): void {
    console.log('🧹 Disposing Asset Loader...');
    
    // Clear all caches (this will dispose textures)
    this.clearAllCaches();
    
    // Clear callbacks
    this.onProgressCallback = undefined;
    this.onLoadCallback = undefined;
    this.onErrorCallback = undefined;
    
    this.isInitialized = false;
    
    console.log('✅ Asset Loader disposed');
  }
}