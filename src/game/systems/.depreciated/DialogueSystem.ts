import * as THREE from 'three'
import { GameObject } from '../../engine/core/GameObject'

/**
 * Manages the display of dialogue in the UI.
 * To be implemented based on restaurant.json config.
 */
export class DialogueSystem extends GameObject {
  constructor(
    private THREE: any,
    private scene: THREE.Scene,
    private levelGroup: THREE.Group,
    private interactionSystem: any,
    private eventBus: any,
    private camera: THREE.Camera,
    private gameContainer: HTMLElement,
  ) {
    super()
  }

  public async initialize(config: any): Promise<void> {
    this.validateNotDisposed()
    console.log('Initializing DialogueSystem with config:', config)
    // Placeholder: Future implementation will manage dialogue UI.
    this.markInitialized()
  }

  public update(deltaTime: number): void {}

  public dispose(): void {
    console.log('Disposing DialogueSystem')
    this.markDisposed()
  }
}
