// Rigid body management for Rapier physics

import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

export class RigidBodies {
  private bodies = new Map<string, RAPIER.RigidBody>();
  private world: RAPIER.World;
  
  constructor(world: RAPIER.World) {
    this.world = world;
  }
  
  public createDynamic(id: string, position: THREE.Vector3): RAPIER.RigidBody {
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z);
    const body = this.world.createRigidBody(bodyDesc);
    this.bodies.set(id, body);
    return body;
  }
  
  public createStatic(id: string, position: THREE.Vector3): RAPIER.RigidBody {
    const bodyDesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(position.x, position.y, position.z);
    const body = this.world.createRigidBody(bodyDesc);
    this.bodies.set(id, body);
    return body;
  }
  
  public get(id: string): RAPIER.RigidBody | undefined {
    return this.bodies.get(id);
  }
  
  public remove(id: string): void {
    const body = this.bodies.get(id);
    if (body) {
      this.world.removeRigidBody(body);
      this.bodies.delete(id);
    }
  }
  
  public dispose(): void {
    this.bodies.clear();
  }
}