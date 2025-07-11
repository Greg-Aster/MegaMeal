import * as THREE from 'three';

export interface MovementConfig {
  moveSpeed: number;
  jumpHeight: number;
  gravity: number;
  mouseSensitivity: number;
  eyeHeight: number;
  groundCheckDistance: number;
  maxStepHeight: number;
}

export interface LevelMovementConfig {
  baseConfig?: Partial<MovementConfig>;
  boundaryProvider?: (position: THREE.Vector3) => THREE.Vector3;
  terrainProvider?: (x: number, z: number) => number;
  usePhysicsRaycast: boolean;
  fallbackGroundLevel?: number;
}

export interface MovementState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  isGrounded: boolean;
  groundLevel: number;
  canJump: boolean;
}