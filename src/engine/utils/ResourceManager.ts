import * as THREE from 'three'

/**
 * Centralized resource management utility for Three.js cleanup
 * Eliminates duplicate disposal code across the codebase
 */
export class ResourceManager {
  private static disposalCount = 0
  private static memoryTracker: { [key: string]: number } = {}

  /**
   * Dispose of a Three.js Object3D and all its children recursively
   * Handles meshes, materials, geometries, and textures
   */
  public static disposeObject3D(obj: THREE.Object3D): void {
    if (!obj) return

    console.log(
      `🧹 ResourceManager disposing Object3D: ${obj.type || 'Unknown'}`,
    )

    // Recursively dispose of all children
    obj.traverse(child => {
      if (child instanceof THREE.Mesh) {
        ResourceManager.disposeMesh(child)
      } else if (child instanceof THREE.Points) {
        ResourceManager.disposePoints(child)
      } else if (child instanceof THREE.Line) {
        ResourceManager.disposeLine(child)
      } else if (child instanceof THREE.Light) {
        ResourceManager.disposeLight(child)
      }
    })

    // Clear the object
    obj.clear()

    ResourceManager.disposalCount++
    console.log(
      `✅ ResourceManager disposed Object3D (Total: ${ResourceManager.disposalCount})`,
    )
  }

  /**
   * Dispose of a Three.js Group and all its children
   */
  public static disposeGroup(group: THREE.Group): void {
    if (!group) return

    console.log(
      `🧹 ResourceManager disposing Group with ${group.children.length} children`,
    )

    // Dispose of all children first
    const children = [...group.children] // Copy array to avoid modification during iteration
    children.forEach(child => {
      ResourceManager.disposeObject3D(child)
    })

    // Clear the group
    group.clear()

    console.log(`✅ ResourceManager disposed Group`)
  }

  /**
   * Dispose of a Three.js Mesh
   */
  public static disposeMesh(mesh: THREE.Mesh): void {
    if (!mesh) return

    console.log(`🧹 ResourceManager disposing Mesh: ${mesh.name || 'Unnamed'}`)

    // Dispose geometry
    if (mesh.geometry) {
      ResourceManager.disposeGeometry(mesh.geometry)
    }

    // Dispose material(s)
    if (mesh.material) {
      ResourceManager.disposeMaterial(mesh.material)
    }

    console.log(`✅ ResourceManager disposed Mesh`)
  }

  /**
   * Dispose of a Three.js Points object
   */
  public static disposePoints(points: THREE.Points): void {
    if (!points) return

    console.log(`🧹 ResourceManager disposing Points`)

    if (points.geometry) {
      ResourceManager.disposeGeometry(points.geometry)
    }

    if (points.material) {
      ResourceManager.disposeMaterial(points.material)
    }

    console.log(`✅ ResourceManager disposed Points`)
  }

  /**
   * Dispose of a Three.js Line object
   */
  public static disposeLine(line: THREE.Line): void {
    if (!line) return

    console.log(`🧹 ResourceManager disposing Line`)

    if (line.geometry) {
      ResourceManager.disposeGeometry(line.geometry)
    }

    if (line.material) {
      ResourceManager.disposeMaterial(line.material)
    }

    console.log(`✅ ResourceManager disposed Line`)
  }

  /**
   * Dispose of a Three.js Light object
   */
  public static disposeLight(light: THREE.Light): void {
    if (!light) return

    console.log(`🧹 ResourceManager disposing Light: ${light.type}`)

    // Dispose shadow map if present
    if (light.shadow && light.shadow.map) {
      light.shadow.map.dispose()
    }

    console.log(`✅ ResourceManager disposed Light`)
  }

  /**
   * Dispose of a Three.js BufferGeometry
   */
  public static disposeGeometry(geometry: THREE.BufferGeometry): void {
    if (!geometry) return

    console.log(`🧹 ResourceManager disposing Geometry`)

    geometry.dispose()
    ResourceManager.trackMemory('geometry', -1)

    console.log(`✅ ResourceManager disposed Geometry`)
  }

  /**
   * Dispose of Three.js Material(s) - handles both single materials and arrays
   */
  public static disposeMaterial(
    material: THREE.Material | THREE.Material[],
  ): void {
    if (!material) return

    console.log(`🧹 ResourceManager disposing Material(s)`)

    const materials = Array.isArray(material) ? material : [material]

    materials.forEach(mat => {
      if (mat) {
        ResourceManager.disposeSingleMaterial(mat)
      }
    })

    console.log(`✅ ResourceManager disposed ${materials.length} Material(s)`)
  }

  /**
   * Dispose of a single Three.js Material and its textures
   */
  private static disposeSingleMaterial(material: THREE.Material): void {
    // Dispose all textures in the material
    const materialWithTextures = material as any
    Object.keys(materialWithTextures).forEach(key => {
      const value = materialWithTextures[key]
      if (value && value.isTexture) {
        ResourceManager.disposeTexture(value)
      }
    })

    // Dispose the material itself
    material.dispose()
    ResourceManager.trackMemory('material', -1)
  }

  /**
   * Dispose of a Three.js Texture
   */
  public static disposeTexture(texture: THREE.Texture): void {
    if (!texture) return

    console.log(
      `🧹 ResourceManager disposing Texture: ${texture.name || 'Unnamed'}`,
    )

    texture.dispose()
    ResourceManager.trackMemory('texture', -1)

    console.log(`✅ ResourceManager disposed Texture`)
  }

  /**
   * Dispose of a Three.js Scene and all its contents
   */
  public static disposeScene(scene: THREE.Scene): void {
    if (!scene) return

    console.log(
      `🧹 ResourceManager disposing Scene with ${scene.children.length} children`,
    )

    // Dispose all children
    const children = [...scene.children]
    children.forEach(child => {
      ResourceManager.disposeObject3D(child)
    })

    // Clear the scene
    scene.clear()

    console.log(`✅ ResourceManager disposed Scene`)
  }

  /**
   * Dispose of an AssetLoader cached model
   */
  public static disposeAssetLoaderModel(model: any): void {
    if (!model) return

    console.log(`🧹 ResourceManager disposing AssetLoader model`)

    // Handle GLTF models
    if (model.scene) {
      ResourceManager.disposeObject3D(model.scene)
    }

    // Handle direct Object3D models
    if (model.isObject3D) {
      ResourceManager.disposeObject3D(model)
    }

    // Handle animations
    if (model.animations && Array.isArray(model.animations)) {
      model.animations.forEach((animation: THREE.AnimationClip) => {
        // AnimationClips don't have a dispose method, just clear references
        animation.tracks = []
      })
    }

    console.log(`✅ ResourceManager disposed AssetLoader model`)
  }

  /**
   * Track memory usage for debugging
   */
  private static trackMemory(type: string, delta: number): void {
    const current = ResourceManager.memoryTracker[type] || 0
    ResourceManager.memoryTracker[type] = current + delta
  }

  /**
   * Get memory usage statistics
   */
  public static getMemoryStats(): { [key: string]: number } {
    return { ...ResourceManager.memoryTracker }
  }

  /**
   * Get total disposal count
   */
  public static getDisposalCount(): number {
    return ResourceManager.disposalCount
  }

  /**
   * Reset memory tracking (for testing)
   */
  public static resetTracking(): void {
    ResourceManager.disposalCount = 0
    ResourceManager.memoryTracker = {}
  }

  /**
   * Force garbage collection hint (for debugging)
   */
  public static forceGC(): void {
    if (typeof window !== 'undefined' && (window as any).gc) {
      console.log('🗑️ ResourceManager forcing garbage collection')
      ;(window as any).gc()
    }
  }

  /**
   * Log memory usage summary
   */
  public static logMemoryStats(): void {
    console.log('📊 ResourceManager Memory Stats:')
    console.log(`   Total Disposals: ${ResourceManager.disposalCount}`)
    Object.keys(ResourceManager.memoryTracker).forEach(type => {
      console.log(`   ${type}: ${ResourceManager.memoryTracker[type]}`)
    })
  }
}
