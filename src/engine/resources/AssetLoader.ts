// Asset loading and management system

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
// RGBELoader is imported dynamically to handle potential module resolution issues
// import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// --- INTERFACES ---

// GLTF type definition (no change)
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

/**
 * NEW: Defines the structure for a loaded PBR texture set.
 * This is what the AssetLoader provides to the Materials factory.
 */
export interface PBRTextureSet {
  map: THREE.Texture; // Color (Albedo)
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  aoMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
  displacementMap?: THREE.Texture;
}

/**
 * NEW: Defines the file paths for a PBR texture set within the manifest.
 */
export interface PBRTextureSetPaths {
  map: string;
  normalMap: string;
  roughnessMap: string;
  aoMap?: string;
  metalnessMap?: string;
  displacementMap?: string;
}

/**
 * EVOLVED: The manifest now includes an optional category for PBR texture sets.
 */
export interface AssetManifest {
  textures?: { [key: string]: string };
  pbrTextureSets?: { [key: string]: PBRTextureSetPaths };
  models?: { [key: string]: string };
  audio?: { [key: string]: string };
  hdri?: { [key: string]: string };
}

// LoadProgress interface (no change)
export interface LoadProgress {
  total: number;
  loaded: number;
  percentage: number;
  currentAsset: string;
}

// --- CLASS DEFINITION ---

export class AssetLoader {
  private loadingManager: THREE.LoadingManager;
  private textureLoader: THREE.TextureLoader;
  private gltfLoader: GLTFLoader;
  private objLoader: OBJLoader;
  private mtlLoader: MTLLoader;
  private fbxLoader: FBXLoader;
  private cubeTextureLoader: THREE.CubeTextureLoader;
  private rgbeLoader: any; // Dynamically imported RGBELoader for HDR

  // --- ASSET CACHES ---
  private textures = new Map<string, THREE.Texture>();
  private models = new Map<string, any>(); // Support both GLTF and OBJ formats
  private cubeMaps = new Map<string, THREE.CubeTexture>();
  private hdriTextures = new Map<string, THREE.DataTexture>();
  /**
   * NEW: A cache specifically for loaded PBR texture sets.
   */
  private pbrTextureSets = new Map<string, PBRTextureSet>();

  // Loading state and callbacks (no change)
  private isInitialized = false;
  private loadingProgress: LoadProgress = { total: 0, loaded: 0, percentage: 0, currentAsset: '' };
  private onProgressCallback?: (progress: LoadProgress) => void;
  private onLoadCallback?: () => void;
  private onErrorCallback?: (error: Error) => void;

  constructor() {
    this.setupLoadingManager();
    this.setupLoaders();
  }

  // --- INITIALIZATION ---

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('AssetLoader already initialized');
      return;
    }
    console.log('📦 Initializing Asset Loader...');
    try {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
      this.gltfLoader.setDRACOLoader(dracoLoader);

      const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js');
      this.rgbeLoader = new RGBELoader(this.loadingManager);
      this.rgbeLoader.setDataType(THREE.HalfFloatType);

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
      // Started loading assets (reduced logging)
    };

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      this.loadingProgress.loaded = itemsLoaded;
      this.loadingProgress.total = itemsTotal;
      this.loadingProgress.percentage = (itemsLoaded / itemsTotal) * 100;
      this.loadingProgress.currentAsset = url;

      this.onProgressCallback?.(this.loadingProgress);
      // Loading progress (reduced logging)
    };

    this.loadingManager.onLoad = () => {
      this.loadingProgress.percentage = 100;
      this.onLoadCallback?.();
      // All assets loaded (reduced logging)
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
    this.objLoader = new OBJLoader(this.loadingManager);
    this.mtlLoader = new MTLLoader(this.loadingManager);
    this.fbxLoader = new FBXLoader(this.loadingManager);
    this.cubeTextureLoader = new THREE.CubeTextureLoader(this.loadingManager);
  }

  // --- ASSET LOADING METHODS ---

  public loadTexture(id: string, url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      if (this.textures.has(id)) {
        resolve(this.textures.get(id)!);
        return;
      }
      
      console.log(`🖼️ Loading texture: ${id} from ${url}`);
      
      this.textureLoader.load(url, (texture) => {
        console.log(`✅ Texture loaded: ${id}`);
        this.textures.set(id, texture);
        resolve(texture);
      }, undefined, (error) => {
        console.error(`❌ Failed to load texture ${id} from ${url}:`, error);
        reject(error);
      });
    });
  }

  public loadModel(id: string, url: string, format: string = 'glb', mtlPath?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.models.has(id)) {
        resolve(this.models.get(id)!);
        return;
      }

      if (format === 'obj') {
        this.loadOBJModel(id, url, mtlPath).then(resolve).catch(reject);
      } else if (format === 'fbx') {
        this.loadFBXModel(id, url).then(resolve).catch(reject);
      } else {
        // Default to GLTF/GLB
        this.gltfLoader.load(url, (gltf) => {
          this.models.set(id, gltf as GLTF);
          resolve(gltf as GLTF);
        }, undefined, (error) => reject(error));
      }
    });
  }

  private loadOBJModel(id: string, objPath: string, mtlPath?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (mtlPath) {
        // Load MTL first, then OBJ
        this.mtlLoader.load(mtlPath, (materials) => {
          materials.preload();
          this.objLoader.setMaterials(materials);
          
          this.objLoader.load(objPath, (object) => {
            const modelData = { scene: object };
            this.models.set(id, modelData);
            resolve(modelData);
          }, undefined, reject);
        }, undefined, reject);
      } else {
        // Load OBJ without materials
        this.objLoader.load(objPath, (object) => {
          const modelData = { scene: object };
          this.models.set(id, modelData);
          resolve(modelData);
        }, undefined, reject);
      }
    });
  }

  private loadFBXModel(id: string, fbxPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log(`🔄 Loading FBX model: ${id} from ${fbxPath}`);
      
      this.fbxLoader.load(fbxPath, (fbx) => {
        // FBX models come as a Group, similar to GLTF scene
        const model = {
          scene: fbx,
          animations: fbx.animations || []
        };
        
        this.models.set(id, model);
        console.log(`✅ FBX model loaded: ${id}`);
        resolve(model);
      }, undefined, (error) => {
        console.error(`❌ Failed to load FBX model ${id} from ${fbxPath}:`, error);
        reject(error);
      });
    });
  }

  public loadCubeMap(id: string, urls: string[]): Promise<THREE.CubeTexture> {
    return new Promise((resolve, reject) => {
      if (this.cubeMaps.has(id)) {
        resolve(this.cubeMaps.get(id)!);
        return;
      }
      this.cubeTextureLoader.load(urls, (cubeTexture) => {
        this.cubeMaps.set(id, cubeTexture);
        resolve(cubeTexture);
      }, undefined, (error) => reject(error));
    });
  }

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
      this.rgbeLoader.load(url, (texture: THREE.DataTexture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.hdriTextures.set(id, texture);
        resolve(texture);
      }, undefined, (error: any) => reject(error));
    });
  }

  /**
   * NEW: Loads a complete set of PBR textures defined by paths.
   */
  public async loadPBRTextureSet(id: string, paths: PBRTextureSetPaths): Promise<PBRTextureSet> {
    if (this.pbrTextureSets.has(id)) {
      return this.pbrTextureSets.get(id)!;
    }

    console.log(`🔍 Loading PBR texture set: ${id}`, paths);
    
    const textureSet: Partial<PBRTextureSet> = {};
    const promises: Promise<any>[] = [];

    // Only load textures that are defined (not undefined)
    if (paths.map) {
      promises.push(this.loadTexture(`${id}_map`, paths.map).then(t => { textureSet.map = t; }));
    }
    if (paths.normalMap) {
      promises.push(this.loadTexture(`${id}_normal`, paths.normalMap).then(t => { textureSet.normalMap = t; }));
    }
    if (paths.roughnessMap) {
      promises.push(this.loadTexture(`${id}_roughness`, paths.roughnessMap).then(t => { textureSet.roughnessMap = t; }));
    }

    if (paths.aoMap) {
      promises.push(this.loadTexture(`${id}_ao`, paths.aoMap).then(t => { textureSet.aoMap = t; }));
    }
    if (paths.metalnessMap) {
      promises.push(this.loadTexture(`${id}_metal`, paths.metalnessMap).then(t => { textureSet.metalnessMap = t; }));
    }
    if (paths.displacementMap) {
      promises.push(this.loadTexture(`${id}_disp`, paths.displacementMap).then(t => { textureSet.displacementMap = t; }));
    }

    await Promise.all(promises);
    const completeSet = textureSet as PBRTextureSet;
    this.pbrTextureSets.set(id, completeSet);
    return completeSet;
  }

  /**
   * EVOLVED: The manifest loader now processes the new pbrTextureSets category.
   */
  public async loadManifest(manifest: AssetManifest): Promise<void> {
    const promises: Promise<any>[] = [];

    if (manifest.textures) {
      Object.entries(manifest.textures).forEach(([id, url]) => promises.push(this.loadTexture(id, url)));
    }
    if (manifest.pbrTextureSets) {
      Object.entries(manifest.pbrTextureSets).forEach(([id, paths]) => promises.push(this.loadPBRTextureSet(id, paths)));
    }
    if (manifest.models) {
      Object.entries(manifest.models).forEach(([id, url]) => promises.push(this.loadModel(id, url)));
    }
    if (manifest.hdri) {
      Object.entries(manifest.hdri).forEach(([id, url]) => promises.push(this.loadHDRI(id, url)));
    }

    await Promise.all(promises);
  }

  // --- GETTERS ---

  public getTexture(id: string): THREE.Texture | undefined { return this.textures.get(id); }
  public getModel(id: string): GLTF | undefined { return this.models.get(id); }
  public getCubeMap(id: string): THREE.CubeTexture | undefined { return this.cubeMaps.get(id); }
  public getHDRI(id: string): THREE.DataTexture | undefined { return this.hdriTextures.get(id); }
  
  /**
   * NEW: Retrieves a cached PBR texture set by its ID.
   */
  public getPBRTextureSet(id: string): PBRTextureSet | undefined {
    return this.pbrTextureSets.get(id);
  }

  // --- UTILITIES & MANAGEMENT ---

  public cloneModel(id: string): THREE.Group | undefined {
    const gltf = this.models.get(id);
    if (!gltf) return undefined;
    return gltf.scene.clone();
  }

  public getLoadingProgress(): LoadProgress {
    return { ...this.loadingProgress };
  }

  public onProgress(callback: (progress: LoadProgress) => void): void { this.onProgressCallback = callback; }
  public onLoad(callback: () => void): void { this.onLoadCallback = callback; }
  public onError(callback: (error: Error) => void): void { this.onErrorCallback = callback; }

  public clearTextureCache(): void {
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();
  }

  public clearModelCache(): void { this.models.clear(); }

  public clearAllCaches(): void {
    this.clearTextureCache();
    this.clearModelCache();
    this.cubeMaps.forEach((cubeTexture) => cubeTexture.dispose());
    this.cubeMaps.clear();
    this.hdriTextures.forEach((texture) => texture.dispose());
    this.hdriTextures.clear();
    // EVOLVED: Also clear the new PBR cache
    this.pbrTextureSets.clear(); // The individual textures are already disposed by clearTextureCache
  }

  public getLoadedAssets(): {
    textures: string[];
    pbrTextureSets: string[];
    models: string[];
    cubeMaps: string[];
    hdriTextures: string[];
  } {
    return {
      textures: Array.from(this.textures.keys()),
      pbrTextureSets: Array.from(this.pbrTextureSets.keys()),
      models: Array.from(this.models.keys()),
      cubeMaps: Array.from(this.cubeMaps.keys()),
      hdriTextures: Array.from(this.hdriTextures.keys())
    };
  }

  public isAssetLoaded(id: string): boolean {
    return this.textures.has(id) ||
           this.models.has(id) ||
           this.cubeMaps.has(id) ||
           this.hdriTextures.has(id) ||
           this.pbrTextureSets.has(id);
  }

  public preloadTextures(textureUrls: { [key: string]: string }): Promise<THREE.Texture[]> {
    const promises = Object.entries(textureUrls).map(([id, url]) => this.loadTexture(id, url));
    return Promise.all(promises);
  }

  public preloadModels(modelUrls: { [key: string]: string }): Promise<GLTF[]> {
    const promises = Object.entries(modelUrls).map(([id, url]) => this.loadModel(id, url));
    return Promise.all(promises);
  }

  public dispose(): void {
    console.log('🧹 Disposing Asset Loader...');
    this.clearAllCaches();
    this.onProgressCallback = undefined;
    this.onLoadCallback = undefined;
    this.onErrorCallback = undefined;
    this.isInitialized = false;
    console.log('✅ Asset Loader disposed');
  }
}
