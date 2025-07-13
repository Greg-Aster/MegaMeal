// Texture caching system

import * as THREE from 'three';
import { OptimizationManager } from '../optimization/OptimizationManager';

export class TextureManager {
  private textures = new Map<string, THREE.Texture>();
  private loader: THREE.TextureLoader;
  private optimizationManager: OptimizationManager;
  
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.optimizationManager = OptimizationManager.getInstance();
  }
  
  public load(id: string, url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      if (this.textures.has(id)) {
        resolve(this.textures.get(id)!);
        return;
      }
      
      this.loader.load(
        url,
        (texture) => {
          // Apply mobile optimizations to texture
          const optimizedTexture = this.optimizationManager.optimizeTexture(texture);
          this.textures.set(id, optimizedTexture);
          resolve(optimizedTexture);
        },
        undefined,
        reject
      );
    });
  }
  
  public get(id: string): THREE.Texture | undefined {
    return this.textures.get(id);
  }
  
  public dispose(): void {
    this.textures.forEach(texture => texture.dispose());
    this.textures.clear();
  }
}