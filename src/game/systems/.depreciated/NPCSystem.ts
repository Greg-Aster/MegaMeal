import * as THREE from 'three'
import type { EventBus } from '../../engine/core/EventBus'
import { GameObject } from '../../engine/core/GameObject'
import type { InteractionSystem } from '../../engine/systems/InteractionSystem'

/**
 * Manages Non-Player Characters (NPCs) in a level.
 * To be implemented based on restaurant.json config.
 */
export class NPCSystem extends GameObject {
  constructor(
    private THREE: any,
    private scene: THREE.Scene,
    private levelGroup: THREE.Group,
    private interactionSystem: InteractionSystem,
    private eventBus: EventBus,
    private camera: THREE.Camera,
    private gameContainer: HTMLElement,
  ) {
    super()
  }

  public async initialize(config: any): Promise<void> {
    this.validateNotDisposed()
    console.log('Initializing NPCSystem with config:', config)
    // Placeholder: Future implementation will create NPCs from config.
    this.markInitialized()
  }

  public update(deltaTime: number): void {
    // Placeholder for NPC animations or AI logic.
  }

  public dispose(): void {
    console.log('Disposing NPCSystem')
    this.markDisposed()
  }
}
