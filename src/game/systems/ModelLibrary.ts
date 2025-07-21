// 3D Model Library System
// Manages reusable 3D models across levels with asset organization

import type * as THREE from 'three'
import type { Materials } from '../../engine/rendering/Materials'
import type { AssetLoader } from '../../engine/resources/AssetLoader'

export interface ModelConfig {
  position: THREE.Vector3
  rotation?: THREE.Euler
  scale?: number | THREE.Vector3
  materialOverride?: any
}

export interface ModelLibraryManifest {
  models: {
    [category: string]: {
      [modelName: string]: {
        file: string
        format?: 'glb' | 'gltf' | 'obj' | 'fbx'
        mtl?: string // For OBJ files
        scale?: number
        materials?: string[]
        tags?: string[]
        description?: string
      }
    }
  }
}

export class ModelLibrary {
  private THREE: any
  private assetLoader: AssetLoader
  private materials: Materials
  private loadedModels = new Map<string, any>()
  private modelInstances = new Map<string, THREE.Group[]>()

  // Organized by category for easy browsing
  private categories = {
    trees: ['pine', 'fir', 'oak', 'dead_tree'],
    rocks: ['boulder', 'cliff', 'stone_pile'],
    vegetation: ['fern', 'bush', 'grass_cluster'],
    structures: ['ruins', 'bridge', 'platform'],
    decorative: ['mushroom', 'fallen_log', 'stump'],
  }

  constructor(THREE: any, assetLoader: AssetLoader, materials: Materials) {
    this.THREE = THREE
    this.assetLoader = assetLoader
    this.materials = materials
  }

  /**
   * Load model library manifest and preload common models
   */
  public async initialize(
    manifestPath = '/assets/game/shared/models/library.json',
  ): Promise<void> {
    try {
      console.log('📚 Initializing Model Library...')

      const response = await fetch(manifestPath)
      if (!response.ok) {
        console.warn(
          '⚠️ Model library manifest not found, using procedural generation only',
        )
        return
      }

      const manifest: ModelLibraryManifest = await response.json()

      // Try to preload essential models, but don't fail if they don't exist
      console.log('🔍 Checking for available models...')
      const essentialModels = this.getEssentialModels(manifest)
      const loadResults = await this.preloadModels(essentialModels)

      const successCount = loadResults.filter(result => result).length
      if (successCount > 0) {
        console.log(
          `✅ Model Library initialized with ${successCount}/${essentialModels.length} models`,
        )
      } else {
        console.log('⚠️ No 3D models found, using procedural generation')
      }
    } catch (error) {
      console.warn(
        '⚠️ Failed to initialize model library, using procedural fallback:',
        error,
      )
    }
  }

  /**
   * Get a model instance (cloned for independent use)
   */
  public getModel(
    category: string,
    modelName: string,
    config: ModelConfig,
  ): THREE.Group | null {
    const modelId = `${category}/${modelName}`
    const gltf = this.loadedModels.get(modelId)

    if (!gltf) {
      console.warn(`Model not found: ${modelId}`)
      return null
    }

    // Clone the scene for independent use
    const model = gltf.scene.clone()

    // Apply configuration
    model.position.copy(config.position)
    if (config.rotation) model.rotation.copy(config.rotation)

    if (config.scale) {
      if (typeof config.scale === 'number') {
        model.scale.setScalar(config.scale)
      } else {
        model.scale.copy(config.scale)
      }
    }

    // Apply material override if provided
    if (config.materialOverride) {
      model.traverse(child => {
        if (child instanceof this.THREE.Mesh) {
          child.material = config.materialOverride
        }
      })
    }

    // Enable shadows
    model.traverse(child => {
      if (child instanceof this.THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    // Track instance for management
    if (!this.modelInstances.has(modelId)) {
      this.modelInstances.set(modelId, [])
    }
    this.modelInstances.get(modelId)!.push(model)

    return model
  }

  /**
   * Create a forest scatter pattern using available models
   */
  public createForestScatter(
    center: THREE.Vector3,
    radius: number,
    density = 25,
  ): THREE.Group {
    const scatterGroup = new this.THREE.Group()

    for (let i = 0; i < density; i++) {
      // Random position within radius
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * radius
      const position = new this.THREE.Vector3(
        center.x + Math.cos(angle) * distance,
        center.y,
        center.z + Math.sin(angle) * distance,
      )

      // Choose random model type
      const modelType = Math.random()
      let model = null

      if (modelType < 0.4) {
        // 40% trees
        model = this.getRandomTreeModel(position)
      } else if (modelType < 0.7) {
        // 30% rocks
        model = this.getRandomRockModel(position)
      } else if (modelType < 0.9) {
        // 20% vegetation
        model = this.getRandomVegetationModel(position)
      } else {
        // 10% decorative
        model = this.getRandomDecorativeModel(position)
      }

      if (model) {
        scatterGroup.add(model)
      }
    }

    return scatterGroup
  }

  /**
   * Get available model categories
   */
  public getCategories(): string[] {
    return Object.keys(this.categories)
  }

  /**
   * Get models in a specific category
   */
  public getModelsInCategory(category: string): string[] {
    return this.categories[category] || []
  }

  /**
   * Check if a specific model is loaded
   */
  public isModelLoaded(category: string, modelName: string): boolean {
    return this.loadedModels.has(`${category}/${modelName}`)
  }

  /**
   * Load a specific model on demand
   */
  public async loadModel(
    category: string,
    modelName: string,
    filePath: string,
    format = 'glb',
    mtlPath?: string,
  ): Promise<boolean> {
    const modelId = `${category}/${modelName}`

    if (this.loadedModels.has(modelId)) {
      return true // Already loaded
    }

    try {
      console.log(
        `🔄 Loading ${format.toUpperCase()} model: ${modelId} from ${filePath}`,
      )
      const model = await this.assetLoader.loadModel(
        modelId,
        filePath,
        format,
        mtlPath,
      )
      this.loadedModels.set(modelId, model)
      console.log(`✅ Model loaded: ${modelId}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to load model ${modelId}:`, error)
      return false
    }
  }

  /**
   * Cleanup and dispose of model instances
   */
  public dispose(): void {
    console.log('🧹 Disposing Model Library...')

    // Dispose of all instances
    this.modelInstances.forEach((instances, modelId) => {
      instances.forEach(instance => {
        instance.traverse(child => {
          if (child instanceof this.THREE.Mesh) {
            if (child.geometry) child.geometry.dispose()
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose())
              } else {
                child.material.dispose()
              }
            }
          }
        })
      })
    })

    this.modelInstances.clear()
    this.loadedModels.clear()
    console.log('✅ Model Library disposed')
  }

  // Private helper methods
  private getEssentialModels(
    manifest: ModelLibraryManifest,
  ): Array<{
    category: string
    name: string
    path: string
    format: string
    mtl?: string
  }> {
    const essential = []

    // Load one model from each category for basic functionality
    for (const [category, models] of Object.entries(manifest.models)) {
      const modelNames = Object.keys(models)
      if (modelNames.length > 0) {
        const firstModel = modelNames[0]
        const modelData = models[firstModel]
        essential.push({
          category,
          name: firstModel,
          path: modelData.file,
          format: modelData.format || 'glb',
          mtl: modelData.mtl,
        })
      }
    }

    return essential
  }

  private async preloadModels(
    models: Array<{
      category: string
      name: string
      path: string
      format: string
      mtl?: string
    }>,
  ): Promise<boolean[]> {
    const loadPromises = models.map(model =>
      this.loadModel(
        model.category,
        model.name,
        model.path,
        model.format,
        model.mtl,
      ),
    )

    const results = await Promise.allSettled(loadPromises)
    return results.map(
      result => result.status === 'fulfilled' && result.value === true,
    )
  }

  private getRandomTreeModel(position: THREE.Vector3): THREE.Group | null {
    const treeTypes = this.categories.trees
    const randomType = treeTypes[Math.floor(Math.random() * treeTypes.length)]

    return this.getModel('trees', randomType, {
      position,
      rotation: new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0),
      scale: 0.8 + Math.random() * 0.6,
    })
  }

  private getRandomRockModel(position: THREE.Vector3): THREE.Group | null {
    const rockTypes = this.categories.rocks
    const randomType = rockTypes[Math.floor(Math.random() * rockTypes.length)]

    return this.getModel('rocks', randomType, {
      position,
      rotation: new this.THREE.Euler(
        (Math.random() - 0.5) * 0.3,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.3,
      ),
      scale: 0.6 + Math.random() * 0.8,
    })
  }

  private getRandomVegetationModel(
    position: THREE.Vector3,
  ): THREE.Group | null {
    const vegTypes = this.categories.vegetation
    const randomType = vegTypes[Math.floor(Math.random() * vegTypes.length)]

    return this.getModel('vegetation', randomType, {
      position,
      rotation: new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0),
      scale: 0.7 + Math.random() * 0.6,
    })
  }

  private getRandomDecorativeModel(
    position: THREE.Vector3,
  ): THREE.Group | null {
    const decTypes = this.categories.decorative
    const randomType = decTypes[Math.floor(Math.random() * decTypes.length)]

    return this.getModel('decorative', randomType, {
      position,
      rotation: new this.THREE.Euler(
        (Math.random() - 0.5) * 0.2,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.2,
      ),
      scale: 0.8 + Math.random() * 0.4,
    })
  }
}
