// Rapier physics engine integration

import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

export interface PhysicsConfig {
  gravity: THREE.Vector3;
  enableDebugRender: boolean;
  maxSubSteps: number;
  fixedTimeStep: number;
}

export interface RigidBodyData {
  bodyType: 'dynamic' | 'kinematic' | 'static';
  colliderType: 'ball' | 'cuboid' | 'capsule' | 'cylinder' | 'cone' | 'trimesh' | 'heightfield';
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  scale: THREE.Vector3;
  restitution?: number;
  friction?: number;
  density?: number;
  isSensor?: boolean;
}

export class PhysicsWorld {
  private world: RAPIER.World | null = null;
  private config: PhysicsConfig;
  private isInitialized = false;
  private debugRenderer: RAPIER.DebugRenderBuffers | null = null;
  private accumulator = 0;
  
  // Object tracking
  private rigidBodies = new Map<string, RAPIER.RigidBody>();
  private colliders = new Map<string, RAPIER.Collider>();
  private meshToBodyMap = new Map<THREE.Object3D, string>();
  
  constructor(config?: Partial<PhysicsConfig>) {
    this.config = {
      gravity: new THREE.Vector3(0, -9.81, 0),
      enableDebugRender: false,
      maxSubSteps: 5,
      fixedTimeStep: 1/60,
      ...config
    };
  }
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('PhysicsWorld already initialized');
      return;
    }
    
    console.log('⚡ Initializing Physics World...');
    
    try {
      // Initialize RAPIER
      await RAPIER.init();
      
      // Create world
      const gravity = { x: this.config.gravity.x, y: this.config.gravity.y, z: this.config.gravity.z };
      this.world = new RAPIER.World(gravity);
      
      // Enable debug rendering if requested
      if (this.config.enableDebugRender) {
        this.debugRenderer = this.world.debugRender();
      }
      
      this.isInitialized = true;
      console.log('✅ Physics World initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Physics World:', error);
      throw error;
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized || !this.world) return;
    
    // Fixed timestep physics simulation
    this.accumulator += deltaTime;
    
    let steps = 0;
    while (this.accumulator >= this.config.fixedTimeStep && steps < this.config.maxSubSteps) {
      this.world.step();
      this.accumulator -= this.config.fixedTimeStep;
      steps++;
    }
    
    // Update debug renderer
    if (this.debugRenderer) {
      this.world.debugRender();
    }
    
    // Sync Three.js objects with physics bodies
    this.syncMeshes();
  }
  
  private syncMeshes(): void {
    this.meshToBodyMap.forEach((bodyId, mesh) => {
      const rigidBody = this.rigidBodies.get(bodyId);
      if (rigidBody) {
        const position = rigidBody.translation();
        const rotation = rigidBody.rotation();
        
        mesh.position.set(position.x, position.y, position.z);
        mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      }
    });
  }
  
  public createRigidBody(id: string, data: RigidBodyData, mesh?: THREE.Object3D): string {
    if (!this.world) {
      throw new Error('Physics world not initialized');
    }
    
    // Create rigid body descriptor
    let rigidBodyDesc: RAPIER.RigidBodyDesc;
    
    switch (data.bodyType) {
      case 'dynamic':
        rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
        break;
      case 'kinematic':
        rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
        break;
      case 'static':
      default:
        rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
        break;
    }
    
    // Set position and rotation
    rigidBodyDesc.setTranslation(data.position.x, data.position.y, data.position.z);
    rigidBodyDesc.setRotation({
      x: data.rotation.x,
      y: data.rotation.y,
      z: data.rotation.z,
      w: data.rotation.w
    });
    
    // Create rigid body
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);
    
    // Create collider
    const collider = this.createCollider(data, rigidBody);
    
    // Store references
    this.rigidBodies.set(id, rigidBody);
    this.colliders.set(id, collider);
    
    // Link mesh if provided
    if (mesh) {
      this.meshToBodyMap.set(mesh, id);
    }
    
    return id;
  }
  
  private createCollider(data: RigidBodyData, rigidBody: RAPIER.RigidBody): RAPIER.Collider {
    if (!this.world) {
      throw new Error('Physics world not initialized');
    }
    
    let colliderDesc: RAPIER.ColliderDesc;
    
    switch (data.colliderType) {
      case 'ball':
        colliderDesc = RAPIER.ColliderDesc.ball(data.scale.x);
        break;
      case 'cuboid':
        colliderDesc = RAPIER.ColliderDesc.cuboid(
          data.scale.x / 2,
          data.scale.y / 2,
          data.scale.z / 2
        );
        break;
      case 'capsule':
        colliderDesc = RAPIER.ColliderDesc.capsule(data.scale.y / 2, data.scale.x);
        break;
      case 'cylinder':
        colliderDesc = RAPIER.ColliderDesc.cylinder(data.scale.y / 2, data.scale.x);
        break;
      case 'cone':
        colliderDesc = RAPIER.ColliderDesc.cone(data.scale.y, data.scale.x);
        break;
      default:
        // Default to cuboid
        colliderDesc = RAPIER.ColliderDesc.cuboid(
          data.scale.x / 2,
          data.scale.y / 2,
          data.scale.z / 2
        );
        break;
    }
    
    // Set material properties
    if (data.restitution !== undefined) {
      colliderDesc.setRestitution(data.restitution);
    }
    if (data.friction !== undefined) {
      colliderDesc.setFriction(data.friction);
    }
    if (data.density !== undefined) {
      colliderDesc.setDensity(data.density);
    }
    if (data.isSensor) {
      colliderDesc.setSensor(true);
    }
    
    return this.world.createCollider(colliderDesc, rigidBody);
  }
  
  public createStaticMesh(id: string, geometry: THREE.BufferGeometry, position: THREE.Vector3, rotation: THREE.Quaternion): string {
    if (!this.world) {
      throw new Error('Physics world not initialized');
    }
    
    // Extract vertices and indices from geometry
    const vertices = geometry.attributes.position.array as Float32Array;
    const indices = geometry.index ? geometry.index.array as Uint32Array : undefined;
    
    // Create rigid body
    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(position.x, position.y, position.z)
      .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w });
    
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);
    
    // Create trimesh collider
    const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
    const collider = this.world.createCollider(colliderDesc, rigidBody);
    
    // Store references
    this.rigidBodies.set(id, rigidBody);
    this.colliders.set(id, collider);
    
    return id;
  }
  
  public removeRigidBody(id: string): void {
    if (!this.world) return;
    
    const rigidBody = this.rigidBodies.get(id);
    const collider = this.colliders.get(id);
    
    if (rigidBody) {
      // Remove mesh mapping
      for (const [mesh, bodyId] of this.meshToBodyMap.entries()) {
        if (bodyId === id) {
          this.meshToBodyMap.delete(mesh);
          break;
        }
      }
      
      // Remove from world
      this.world.removeRigidBody(rigidBody);
      this.rigidBodies.delete(id);
    }
    
    if (collider) {
      this.colliders.delete(id);
    }
  }
  
  public getRigidBody(id: string): RAPIER.RigidBody | undefined {
    return this.rigidBodies.get(id);
  }
  
  public getCollider(id: string): RAPIER.Collider | undefined {
    return this.colliders.get(id);
  }
  
  public setGravity(gravity: THREE.Vector3): void {
    if (this.world) {
      this.world.gravity = { x: gravity.x, y: gravity.y, z: gravity.z };
      this.config.gravity = gravity.clone();
    }
  }
  
  public getGravity(): THREE.Vector3 {
    return this.config.gravity.clone();
  }
  
  public castRay(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number, solid = true): RAPIER.RayIntersection | null {
    if (!this.world) return null;
    
    const ray = new RAPIER.Ray(origin, direction);
    const hit = this.world.castRay(ray, maxDistance, solid);
    
    return hit;
  }
  
  public castRayAndGetNormal(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number, solid = true): {
    intersection: RAPIER.RayIntersection;
    normal: THREE.Vector3;
  } | null {
    if (!this.world) return null;
    
    const ray = new RAPIER.Ray(origin, direction);
    const hit = this.world.castRayAndGetNormal(ray, maxDistance, solid);
    
    if (hit) {
      return {
        intersection: hit,
        normal: new THREE.Vector3(hit.normal.x, hit.normal.y, hit.normal.z)
      };
    }
    
    return null;
  }
  
  public enableDebugRender(enable: boolean): void {
    this.config.enableDebugRender = enable;
    
    if (this.world) {
      if (enable && !this.debugRenderer) {
        this.debugRenderer = this.world.debugRender();
      } else if (!enable) {
        this.debugRenderer = null;
      }
    }
  }
  
  public getDebugRenderBuffers(): RAPIER.DebugRenderBuffers | null {
    return this.debugRenderer;
  }
  
  public getWorld(): RAPIER.World | null {
    return this.world;
  }
  
  public getConfig(): PhysicsConfig {
    return { ...this.config };
  }
  
  public dispose(): void {
    console.log('🧹 Disposing Physics World...');
    
    // Clear mappings
    this.meshToBodyMap.clear();
    this.rigidBodies.clear();
    this.colliders.clear();
    
    // Dispose world
    if (this.world) {
      this.world.free();
      this.world = null;
    }
    
    this.debugRenderer = null;
    this.isInitialized = false;
    
    console.log('✅ Physics World disposed');
  }
}