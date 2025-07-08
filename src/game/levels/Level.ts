// Base level class

import * as THREE from 'three';

export abstract class Level {
  protected scene: THREE.Scene;
  protected isLoaded = false;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  public abstract async load(): Promise<void>;
  public abstract update(deltaTime: number): void;
  public abstract dispose(): void;
  
  public isLevelLoaded(): boolean {
    return this.isLoaded;
  }
}