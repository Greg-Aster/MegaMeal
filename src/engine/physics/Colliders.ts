// Collision shapes for Rapier physics

import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

export class Colliders {
  public static createBox(halfExtents: THREE.Vector3): RAPIER.ColliderDesc {
    return RAPIER.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z);
  }
  
  public static createSphere(radius: number): RAPIER.ColliderDesc {
    return RAPIER.ColliderDesc.ball(radius);
  }
  
  public static createCapsule(halfHeight: number, radius: number): RAPIER.ColliderDesc {
    return RAPIER.ColliderDesc.capsule(halfHeight, radius);
  }
}