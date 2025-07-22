// Scene management system

import * as THREE from 'three'

export class Scene {
  private scene: THREE.Scene
  private isInitialized = false

  constructor() {
    this.scene = new THREE.Scene()
  }

  public initialize(): void {
    if (this.isInitialized) {
      console.warn('Scene already initialized')
      return
    }

    this.isInitialized = true
    console.log('✅ Scene initialized')
  }

  public getScene(): THREE.Scene {
    return this.scene
  }

  public add(object: THREE.Object3D): void {
    this.scene.add(object)
  }

  public remove(object: THREE.Object3D): void {
    this.scene.remove(object)
  }

  public dispose(): void {
    // Dispose all objects in scene
    this.scene.clear()
    this.isInitialized = false
  }
}
