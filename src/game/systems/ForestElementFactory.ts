// Factory for creating reusable 3D forest elements
// Generates procedural trees, rocks, and vegetation using the loaded textures

import type * as THREE from 'three'
import type { Materials } from '../../engine/rendering/Materials'
import type { AssetLoader } from '../../engine/resources/AssetLoader'
import { ModelLibrary } from './ModelLibrary'

export interface ForestElementConfig {
  position: THREE.Vector3
  scale?: number
  rotation?: THREE.Euler
  materialVariant?: string
}

export class ForestElementFactory {
  private THREE: any
  private assetLoader: AssetLoader
  private materials: Materials
  private modelLibrary: ModelLibrary

  constructor(THREE: any, assetLoader: AssetLoader, materials: Materials) {
    this.THREE = THREE
    this.assetLoader = assetLoader
    this.materials = materials
    this.modelLibrary = new ModelLibrary(THREE, assetLoader, materials)
  }

  public async initialize(): Promise<void> {
    await this.modelLibrary.initialize()
  }

  // Create a procedural pine tree (with model library fallback)
  public createPineTree(config: ForestElementConfig): THREE.Group {
    // Try to use model library first
    const libraryTree = this.modelLibrary.getModel('trees', 'pine_01', {
      position: config.position,
      rotation: config.rotation,
      scale: config.scale,
    })

    if (libraryTree) {
      console.log('🌲 Using library tree model')
      return libraryTree
    }

    // Fallback to procedural generation
    console.log('🌲 Using procedural tree (library model not available)')
    const treeGroup = new this.THREE.Group()

    // Get bark texture
    const barkTextureSet =
      this.assetLoader.getPBRTextureSet('pine_bark') ||
      this.assetLoader.getPBRTextureSet('tree_trunk')

    // Create trunk
    const trunkGeometry = new this.THREE.CylinderGeometry(0.3, 0.5, 8, 8)
    let trunkMaterial

    if (barkTextureSet) {
      // Configure bark texture
      Object.values(barkTextureSet).forEach(texture => {
        if (texture) {
          texture.wrapS = this.THREE.RepeatWrapping
          texture.wrapT = this.THREE.RepeatWrapping
          texture.repeat.set(1, 3) // Vertical repetition for trunk
        }
      })

      trunkMaterial = this.materials.createPBRMaterial({
        map: barkTextureSet.map,
        normalMap: barkTextureSet.normalMap,
        roughnessMap: barkTextureSet.roughnessMap,
        displacementMap: barkTextureSet.displacementMap,
        displacementScale: 0.05,
        roughness: 0.9,
        metalness: 0.1,
      })
    } else {
      trunkMaterial = this.materials.createPBRMaterial({
        color: 0x4a3728,
        roughness: 0.9,
        metalness: 0.1,
      })
    }

    const trunk = new this.THREE.Mesh(trunkGeometry, trunkMaterial)
    trunk.position.y = 4
    trunk.castShadow = true
    treeGroup.add(trunk)

    // Create pine needle branches (simple cone shapes)
    const branchMaterial = this.materials.createPBRMaterial({
      color: 0x1e4d2b,
      roughness: 0.8,
      metalness: 0.0,
    })

    // Multiple branch layers
    const branchLayers = [
      { y: 6, radius: 3, height: 4 },
      { y: 8, radius: 2.5, height: 3.5 },
      { y: 10, radius: 2, height: 3 },
      { y: 11.5, radius: 1.5, height: 2.5 },
    ]

    branchLayers.forEach(layer => {
      const branchGeometry = new this.THREE.ConeGeometry(
        layer.radius,
        layer.height,
        8,
      )
      const branch = new this.THREE.Mesh(branchGeometry, branchMaterial)
      branch.position.y = layer.y
      branch.castShadow = true
      treeGroup.add(branch)
    })

    // Apply configuration
    treeGroup.position.copy(config.position)
    if (config.scale) treeGroup.scale.setScalar(config.scale)
    if (config.rotation) treeGroup.rotation.copy(config.rotation)

    return treeGroup
  }

  // Create a forest boulder
  public createBoulder(config: ForestElementConfig): THREE.Mesh {
    // Create irregular boulder geometry
    const geometry = new this.THREE.DodecahedronGeometry(2, 1)
    const positions = geometry.attributes.position.array

    // Randomize for natural boulder shape
    for (let i = 0; i < positions.length; i += 3) {
      const vertex = new this.THREE.Vector3(
        positions[i],
        positions[i + 1],
        positions[i + 2],
      )

      const noise = (Math.random() - 0.5) * 0.4
      vertex.normalize().multiplyScalar(2 + noise)

      positions[i] = vertex.x
      positions[i + 1] = vertex.y
      positions[i + 2] = vertex.z
    }

    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()

    // Get rock texture
    const rockTextureSet =
      this.assetLoader.getPBRTextureSet('rock_moss_01') ||
      this.assetLoader.getPBRTextureSet('rock_moss_02')

    let material
    if (rockTextureSet) {
      Object.values(rockTextureSet).forEach(texture => {
        if (texture) {
          texture.wrapS = this.THREE.RepeatWrapping
          texture.wrapT = this.THREE.RepeatWrapping
          texture.repeat.set(2, 2)
        }
      })

      material = this.materials.createPBRMaterial({
        map: rockTextureSet.map,
        normalMap: rockTextureSet.normalMap,
        roughnessMap: rockTextureSet.roughnessMap,
        roughness: 0.8,
        metalness: 0.1,
      })
    } else {
      material = this.materials.createPBRMaterial({
        color: 0x666666,
        roughness: 0.9,
        metalness: 0.1,
      })
    }

    const boulder = new this.THREE.Mesh(geometry, material)
    boulder.position.copy(config.position)
    if (config.scale) boulder.scale.setScalar(config.scale)
    if (config.rotation) boulder.rotation.copy(config.rotation)
    boulder.castShadow = true
    boulder.receiveShadow = true

    return boulder
  }

  // Create a fern cluster
  public createFernCluster(config: ForestElementConfig): THREE.Group {
    const fernGroup = new this.THREE.Group()

    // Get fern texture
    const fernTextureSet = this.assetLoader.getPBRTextureSet('fern')

    let fernMaterial
    if (fernTextureSet) {
      fernMaterial = this.materials.createPBRMaterial({
        map: fernTextureSet.map,
        normalMap: fernTextureSet.normalMap,
        roughnessMap: fernTextureSet.roughnessMap,
        alphaMap: fernTextureSet.aoMap,
        transparent: true,
        alphaTest: 0.5,
        side: this.THREE.DoubleSide,
        roughness: 0.7,
        metalness: 0.0,
      })
    } else {
      fernMaterial = this.materials.createPBRMaterial({
        color: 0x2d5016,
        roughness: 0.8,
        metalness: 0.0,
        transparent: true,
        opacity: 0.9,
        side: this.THREE.DoubleSide,
      })
    }

    // Create multiple fern fronds
    for (let i = 0; i < 5; i++) {
      const frondGeometry = new this.THREE.PlaneGeometry(1, 2)
      const frond = new this.THREE.Mesh(frondGeometry, fernMaterial)

      // Position and rotate each frond
      const angle = (i / 5) * Math.PI * 2
      frond.position.set(Math.cos(angle) * 0.3, 1, Math.sin(angle) * 0.3)
      frond.rotation.y = angle
      frond.rotation.x = -0.2 // Slight tilt

      fernGroup.add(frond)
    }

    fernGroup.position.copy(config.position)
    if (config.scale) fernGroup.scale.setScalar(config.scale)
    if (config.rotation) fernGroup.rotation.copy(config.rotation)

    return fernGroup
  }

  // Create a dead tree/log
  public createDeadTree(config: ForestElementConfig): THREE.Mesh {
    const logGeometry = new this.THREE.CylinderGeometry(0.4, 0.3, 6, 8)

    // Get dead tree texture
    const deadTreeSet =
      this.assetLoader.getPBRTextureSet('dead_tree') ||
      this.assetLoader.getPBRTextureSet('tree_trunk')

    let material
    if (deadTreeSet) {
      Object.values(deadTreeSet).forEach(texture => {
        if (texture) {
          texture.wrapS = this.THREE.RepeatWrapping
          texture.wrapT = this.THREE.RepeatWrapping
          texture.repeat.set(1, 2)
        }
      })

      material = this.materials.createPBRMaterial({
        map: deadTreeSet.map,
        normalMap: deadTreeSet.normalMap,
        roughnessMap: deadTreeSet.roughnessMap,
        roughness: 0.9,
        metalness: 0.0,
      })
    } else {
      material = this.materials.createPBRMaterial({
        color: 0x3d2914,
        roughness: 0.9,
        metalness: 0.0,
      })
    }

    const log = new this.THREE.Mesh(logGeometry, material)
    log.position.copy(config.position)
    log.rotation.z = Math.PI / 2 // Lay it on its side
    if (config.scale) log.scale.setScalar(config.scale)
    if (config.rotation) {
      log.rotation.x = config.rotation.x
      log.rotation.y = config.rotation.y
    }
    log.castShadow = true
    log.receiveShadow = true

    return log
  }

  // Populate an area with random forest elements
  public populateArea(
    center: THREE.Vector3,
    radius: number,
    density = 20,
  ): THREE.Group {
    const forestGroup = new this.THREE.Group()

    for (let i = 0; i < density; i++) {
      // Random position within radius
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * radius
      const position = new this.THREE.Vector3(
        center.x + Math.cos(angle) * distance,
        center.y,
        center.z + Math.sin(angle) * distance,
      )

      // Random element type
      const elementType = Math.random()
      const scale = 0.5 + Math.random() * 1.0
      const rotation = new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0)

      let element

      if (elementType < 0.3) {
        // 30% trees
        element = this.createPineTree({ position, scale, rotation })
      } else if (elementType < 0.6) {
        // 30% boulders
        element = this.createBoulder({ position, scale, rotation })
      } else if (elementType < 0.8) {
        // 20% ferns
        element = this.createFernCluster({ position, scale, rotation })
      } else {
        // 20% dead logs
        element = this.createDeadTree({ position, scale, rotation })
      }

      forestGroup.add(element)
    }

    console.log(`Created forest area with ${density} elements`)
    return forestGroup
  }
}
