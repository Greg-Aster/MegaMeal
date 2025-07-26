import type * as THREE from 'three'
import type { EventBus } from '../../engine/core/EventBus'
import type { InteractionSystem } from '../../engine/systems/InteractionSystem'

/**
 * Standard interface for all level generator components
 * This enforces consistency across all level systems
 */
export interface ILevelGenerator {
  /**
   * Initialize the generator with configuration
   * @param config Configuration object specific to this generator
   */
  initialize(config: any): Promise<void>

  /**
   * Update the generator (called every frame)
   * @param deltaTime Time elapsed since last frame
   * @param camera Optional camera for systems that need it (like FireflySystem)
   */
  update(deltaTime: number, camera?: THREE.Camera): void

  /**
   * Clean up resources when the generator is disposed
   */
  dispose(): void

  /**
   * Optional: Get height at a specific world position for terrain following
   * @param x World X coordinate
   * @param z World Z coordinate
   * @returns Height at that position, or null if not supported
   */
  getHeightAt?(x: number, z: number): number | null

}

/**
 * Standard dependencies object passed to all level generators
 * This ensures all generators have access to the same core systems
 */
export interface LevelGeneratorDependencies {
  THREE: typeof THREE
  scene: THREE.Scene
  levelGroup: THREE.Group
  interactionSystem: InteractionSystem
  eventBus: EventBus
  camera: THREE.Camera
  gameContainer: HTMLElement
  assetLoader?: any
  engine?: any
  materialsFactory?: any
}

/**
 * Base class that implements common functionality for level generators
 * Generators can extend this for basic implementation
 */
export abstract class BaseLevelGenerator implements ILevelGenerator {
  protected dependencies: LevelGeneratorDependencies

  constructor(dependencies: LevelGeneratorDependencies) {
    this.dependencies = dependencies
  }

  abstract initialize(config: any): Promise<void>
  abstract update(deltaTime: number, camera?: THREE.Camera): void
  abstract dispose(): void

  // Optional methods with default implementations
  getHeightAt?(_x: number, _z: number): number | null {
    return null
  }

}
