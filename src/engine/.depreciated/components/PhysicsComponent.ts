import * as THREE from 'three'
import type { PhysicsWorld } from '../physics/PhysicsWorld'

/**
 * Physics Component - Auto-Alignment with Visual Geometry
 * Automatically generates physics collision boundaries that match visual elements
 * Ensures physics and visuals are always in sync
 */

export interface PhysicsObjectData {
  id: string
  mesh: THREE.Object3D
  bodyType: 'dynamic' | 'kinematic' | 'static'
  colliderType:
    | 'ball'
    | 'cuboid'
    | 'capsule'
    | 'cylinder'
    | 'cone'
    | 'trimesh'
    | 'heightfield'
  options: {
    restitution?: number
    friction?: number
    density?: number
    isSensor?: boolean
  }
}

export interface FloorData {
  id: string
  geometry: THREE.BufferGeometry
  position: THREE.Vector3
  rotation: THREE.Quaternion
  scale: THREE.Vector3
}

export class PhysicsComponent {
  private physicsWorld: PhysicsWorld | null
  private levelId: string
  private physicsObjects: Map<string, string> = new Map() // visual ID -> physics ID
  private autoFloors: Map<string, FloorData> = new Map()

  constructor(physicsWorld: PhysicsWorld | null, levelId: string) {
    this.physicsWorld = physicsWorld
    this.levelId = levelId
  }

  /**
   * Automatically analyze a level group and create matching physics
   */
  public async autoGeneratePhysics(levelGroup: THREE.Group): Promise<void> {
    if (!this.physicsWorld) {
      console.warn(
        'PhysicsWorld not available, skipping auto-physics generation',
      )
      return
    }

    console.log(`⚡ Auto-generating physics for level: ${this.levelId}`)

    // Clear existing physics objects for this level
    this.clearLevelPhysics()

    // Analyze level geometry and create physics
    await this.analyzeAndCreatePhysics(levelGroup)

    console.log(
      `✅ Auto-physics generation completed for level: ${this.levelId}`,
    )
  }

  /**
   * Analyze level geometry and create appropriate physics objects
   */
  private async analyzeAndCreatePhysics(group: THREE.Group): Promise<void> {
    const walkableSurfaces: THREE.Mesh[] = []
    const walls: THREE.Mesh[] = []
    const props: THREE.Mesh[] = []

    // Traverse level group and categorize objects
    group.traverse(child => {
      if (child instanceof THREE.Mesh && child.visible) {
        const category = this.categorizeMesh(child)

        switch (category) {
          case 'floor':
            walkableSurfaces.push(child)
            break
          case 'wall':
            walls.push(child)
            break
          case 'prop':
            props.push(child)
            break
        }
      }
    })

    // Create physics for each category
    await this.createFloorPhysics(walkableSurfaces)
    await this.createWallPhysics(walls)
    await this.createPropPhysics(props)
  }

  /**
   * Categorize a mesh based on its properties and position
   */
  private categorizeMesh(mesh: THREE.Mesh): 'floor' | 'wall' | 'prop' {
    const boundingBox = new THREE.Box3().setFromObject(mesh)
    const size = boundingBox.getSize(new THREE.Vector3())
    const center = boundingBox.getCenter(new THREE.Vector3())

    // Analyze mesh to determine category
    const aspectRatio = {
      x: size.x / size.y,
      z: size.z / size.y,
      xy: size.x / size.z,
    }

    // Floor detection: wide, flat, low Y position
    if (aspectRatio.x > 2 && aspectRatio.z > 2 && size.y < 1 && center.y < 2) {
      return 'floor'
    }

    // Wall detection: tall, thin
    if (size.y > 3 && (aspectRatio.x > 3 || aspectRatio.z > 3)) {
      return 'wall'
    }

    // Everything else is a prop
    return 'prop'
  }

  /**
   * Create physics for floor/walkable surfaces
   */
  private async createFloorPhysics(floors: THREE.Mesh[]): Promise<void> {
    for (const floor of floors) {
      const floorId = this.generatePhysicsId('floor', floor.name || 'unnamed')

      // Extract geometry data
      const geometry = floor.geometry
      const worldMatrix = new THREE.Matrix4()
      floor.updateMatrixWorld(true)
      worldMatrix.copy(floor.matrixWorld)

      // Decompose world matrix
      const position = new THREE.Vector3()
      const quaternion = new THREE.Quaternion()
      const scale = new THREE.Vector3()
      worldMatrix.decompose(position, quaternion, scale)

      // Store floor data for advanced collision detection
      this.autoFloors.set(floorId, {
        id: floorId,
        geometry: geometry,
        position: position,
        rotation: quaternion,
        scale: scale,
      })

      // Create simple box collider for now (can be enhanced to use mesh colliders)
      const boundingBox = new THREE.Box3().setFromObject(floor)
      const size = boundingBox.getSize(new THREE.Vector3())

      const physicsData = {
        bodyType: 'static' as const,
        colliderType: 'cuboid' as const,
        position: position,
        rotation: quaternion,
        scale: size,
        restitution: 0.0,
        friction: 0.8,
        density: 1.0,
        isSensor: false,
      }

      const physicsId = this.physicsWorld!.createRigidBody(
        floorId,
        physicsData,
        floor,
      )
      if (physicsId) {
        this.physicsObjects.set(floor.uuid, physicsId)
        console.log(`⚡ Created floor physics: ${floorId}`)
      }
    }
  }

  /**
   * Create physics for walls
   */
  private async createWallPhysics(walls: THREE.Mesh[]): Promise<void> {
    for (const wall of walls) {
      const wallId = this.generatePhysicsId('wall', wall.name || 'unnamed')

      // Get wall transform data
      const position = new THREE.Vector3()
      const quaternion = new THREE.Quaternion()
      const scale = new THREE.Vector3()

      wall.updateMatrixWorld(true)
      wall.matrixWorld.decompose(position, quaternion, scale)

      // Get wall dimensions
      const boundingBox = new THREE.Box3().setFromObject(wall)
      const size = boundingBox.getSize(new THREE.Vector3())

      const physicsData = {
        bodyType: 'static' as const,
        colliderType: 'cuboid' as const,
        position: position,
        rotation: quaternion,
        scale: size,
        restitution: 0.1,
        friction: 0.9,
        density: 1.0,
        isSensor: false,
      }

      const physicsId = this.physicsWorld!.createRigidBody(
        wallId,
        physicsData,
        wall,
      )
      if (physicsId) {
        this.physicsObjects.set(wall.uuid, physicsId)
        console.log(`⚡ Created wall physics: ${wallId}`)
      }
    }
  }

  /**
   * Create physics for props and interactive objects
   */
  private async createPropPhysics(props: THREE.Mesh[]): Promise<void> {
    for (const prop of props) {
      const propId = this.generatePhysicsId('prop', prop.name || 'unnamed')

      // Get prop transform data
      const position = new THREE.Vector3()
      const quaternion = new THREE.Quaternion()
      const scale = new THREE.Vector3()

      prop.updateMatrixWorld(true)
      prop.matrixWorld.decompose(position, quaternion, scale)

      // Get prop dimensions
      const boundingBox = new THREE.Box3().setFromObject(prop)
      const size = boundingBox.getSize(new THREE.Vector3())

      // Choose appropriate collider type based on shape
      let colliderType: 'cuboid' | 'cylinder' | 'ball' = 'cuboid'

      // Simple heuristics for collider type
      const aspectRatio = Math.max(size.x, size.z) / Math.min(size.x, size.z)
      if (aspectRatio < 1.2 && size.y > Math.max(size.x, size.z) * 0.8) {
        colliderType = 'cylinder' // Tall, round objects
      } else if (
        aspectRatio < 1.2 &&
        Math.abs(size.x - size.y) < 0.2 &&
        Math.abs(size.y - size.z) < 0.2
      ) {
        colliderType = 'ball' // Roughly spherical objects
      }

      const physicsData = {
        bodyType: 'static' as const,
        colliderType: colliderType,
        position: position,
        rotation: quaternion,
        scale: size,
        restitution: 0.3,
        friction: 0.7,
        density: 1.0,
        isSensor: false,
      }

      const physicsId = this.physicsWorld!.createRigidBody(
        propId,
        physicsData,
        prop,
      )
      if (physicsId) {
        this.physicsObjects.set(prop.uuid, physicsId)
        console.log(`⚡ Created prop physics: ${propId}`)
      }
    }
  }

  /**
   * Add physics to a specific mesh manually
   */
  public addPhysicsToMesh(
    mesh: THREE.Object3D,
    bodyType: 'dynamic' | 'kinematic' | 'static' = 'static',
    colliderType:
      | 'ball'
      | 'cuboid'
      | 'capsule'
      | 'cylinder'
      | 'cone'
      | 'trimesh'
      | 'heightfield' = 'cuboid',
    options: {
      restitution?: number
      friction?: number
      density?: number
      isSensor?: boolean
    } = {},
  ): string | null {
    if (!this.physicsWorld) {
      console.warn('PhysicsWorld not available for manual physics addition')
      return null
    }

    const meshId = this.generatePhysicsId('manual', mesh.name || 'unnamed')

    // Get mesh transform data
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    mesh.updateMatrixWorld(true)
    mesh.matrixWorld.decompose(position, quaternion, scale)

    const physicsData = {
      bodyType,
      colliderType,
      position: position,
      rotation: quaternion,
      scale: scale,
      restitution: options.restitution || 0.1,
      friction: options.friction || 0.8,
      density: options.density || 1.0,
      isSensor: options.isSensor || false,
    }

    const physicsId = this.physicsWorld.createRigidBody(
      meshId,
      physicsData,
      mesh,
    )
    if (physicsId) {
      this.physicsObjects.set(mesh.uuid, physicsId)
      console.log(`⚡ Added manual physics: ${meshId}`)
    }

    return physicsId
  }

  /**
   * Get accurate ground level at a specific position using floor data
   */
  public getGroundLevelAt(position: THREE.Vector3): number | null {
    let closestGroundLevel: number | null = null
    let closestDistance = Number.POSITIVE_INFINITY

    // Check each auto-generated floor
    this.autoFloors.forEach(floorData => {
      // Simple distance check for now (can be enhanced with proper raycast to mesh)
      const distance = position.distanceTo(floorData.position)

      if (distance < closestDistance) {
        closestDistance = distance
        closestGroundLevel = floorData.position.y
      }
    })

    return closestGroundLevel
  }

  /**
   * Check if a position is within level bounds
   */
  public isPositionValid(
    position: THREE.Vector3,
    levelGroup: THREE.Group,
  ): boolean {
    const boundingBox = new THREE.Box3().setFromObject(levelGroup)
    return boundingBox.containsPoint(position)
  }

  /**
   * Generate unique physics ID for level objects
   */
  private generatePhysicsId(category: string, name: string): string {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_')
    const timestamp = Date.now().toString().slice(-6)
    return `${this.levelId}_${category}_${cleanName}_${timestamp}`
  }

  /**
   * Clear all physics objects for this level
   */
  public clearLevelPhysics(): void {
    if (!this.physicsWorld) return

    console.log(`🧹 Clearing physics objects for level: ${this.levelId}`)

    // Remove all physics bodies for this level
    this.physicsObjects.forEach((physicsId, meshId) => {
      this.physicsWorld!.removeRigidBody(physicsId)
    })

    // Clear tracking maps
    this.physicsObjects.clear()
    this.autoFloors.clear()

    console.log(`✅ Physics cleared for level: ${this.levelId}`)
  }

  /**
   * Get physics object ID for a mesh
   */
  public getPhysicsIdForMesh(mesh: THREE.Object3D): string | null {
    return this.physicsObjects.get(mesh.uuid) || null
  }

  /**
   * Get all auto-generated floor data
   */
  public getFloorData(): Map<string, FloorData> {
    return new Map(this.autoFloors)
  }

  /**
   * Dispose of the physics component
   */
  public dispose(): void {
    console.log(`🧹 Disposing PhysicsComponent for level: ${this.levelId}`)
    this.clearLevelPhysics()
    console.log(`✅ PhysicsComponent disposed for level: ${this.levelId}`)
  }
}
