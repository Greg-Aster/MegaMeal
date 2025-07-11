import * as THREE from 'three';
import { GameObject } from '../../engine/core/GameObject';

/**
 * Manages furniture and large props in a level.
 * To be implemented based on restaurant.json config.
 */
export class FurnitureSystem extends GameObject {
  constructor(
    private THREE: any,
    private scene: THREE.Scene,
    private levelGroup: THREE.Group,
    private interactionSystem: any,
    private eventBus: any,
    private camera: THREE.Camera,
    private gameContainer: HTMLElement
  ) {
    super();
  }

  public async initialize(config: any): Promise<void> {
    this.validateNotDisposed();
    console.log('Initializing FurnitureSystem with config:', config);
    // Placeholder: Future implementation will create furniture from config.
    this.markInitialized();
  }

  public update(deltaTime: number): void {}

  public dispose(): void {
    console.log('Disposing FurnitureSystem');
    this.markDisposed();
  }
}