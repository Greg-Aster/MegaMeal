// Texture caching system

import * as THREE from 'three';

export class TextureManager {
  private textures = new Map<string, THREE.Texture>();
  private loader: THREE.TextureLoader;
  
  constructor() {
    this.loader = new THREE.TextureLoader();
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
          this.textures.set(id, texture);
          resolve(texture);
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