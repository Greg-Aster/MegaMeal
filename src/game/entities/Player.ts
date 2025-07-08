// Player entity with FPS movement and interaction capabilities

import * as THREE from 'three';

export interface PlayerConfig {
  position?: THREE.Vector3;
  speed?: number;
  jumpHeight?: number;
  lookSensitivity?: number;
}

export class Player {
  private camera: THREE.PerspectiveCamera;
  private velocity = new THREE.Vector3();
  private position = new THREE.Vector3();
  private euler = new THREE.Euler(0, 0, 0, 'YXZ');
  
  // Player properties
  public speed = 10;
  public jumpHeight = 5;
  public lookSensitivity = 0.002;
  
  // Movement state
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private canJump = false;
  
  constructor(camera: THREE.PerspectiveCamera, config: PlayerConfig = {}) {
    this.camera = camera;
    
    // Apply configuration
    if (config.position) {
      this.position.copy(config.position);
      this.camera.position.copy(config.position);
    }
    
    if (config.speed) this.speed = config.speed;
    if (config.jumpHeight) this.jumpHeight = config.jumpHeight;
    if (config.lookSensitivity) this.lookSensitivity = config.lookSensitivity;
  }
  
  public update(deltaTime: number): void {
    // Apply movement
    const direction = new THREE.Vector3();
    
    if (this.moveForward) direction.z -= 1;
    if (this.moveBackward) direction.z += 1;
    if (this.moveLeft) direction.x -= 1;
    if (this.moveRight) direction.x += 1;
    
    // Normalize direction for consistent speed
    if (direction.length() > 0) {
      direction.normalize();
      
      // Apply camera rotation to movement direction
      direction.applyEuler(this.euler);
      
      // Apply movement
      this.velocity.x = direction.x * this.speed;
      this.velocity.z = direction.z * this.speed;
    } else {
      // Apply friction when not moving
      this.velocity.x *= 0.9;
      this.velocity.z *= 0.9;
    }
    
    // Apply gravity (simple version)
    if (!this.canJump) {
      this.velocity.y -= 9.81 * deltaTime;
    }
    
    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Update camera position
    this.camera.position.copy(this.position);
    this.camera.setRotationFromEuler(this.euler);
  }
  
  public handleMouseMove(movementX: number, movementY: number): void {
    this.euler.setFromQuaternion(this.camera.quaternion);
    
    this.euler.y -= movementX * this.lookSensitivity;
    this.euler.x -= movementY * this.lookSensitivity;
    
    // Clamp vertical rotation
    this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
    
    this.camera.quaternion.setFromEuler(this.euler);
  }
  
  public handleKeyDown(code: string): void {
    switch (code) {
      case 'KeyW':
        this.moveForward = true;
        break;
      case 'KeyS':
        this.moveBackward = true;
        break;
      case 'KeyA':
        this.moveLeft = true;
        break;
      case 'KeyD':
        this.moveRight = true;
        break;
      case 'Space':
        if (this.canJump) {
          this.velocity.y = this.jumpHeight;
          this.canJump = false;
        }
        break;
    }
  }
  
  public handleKeyUp(code: string): void {
    switch (code) {
      case 'KeyW':
        this.moveForward = false;
        break;
      case 'KeyS':
        this.moveBackward = false;
        break;
      case 'KeyA':
        this.moveLeft = false;
        break;
      case 'KeyD':
        this.moveRight = false;
        break;
    }
  }
  
  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }
  
  public setPosition(position: THREE.Vector3): void {
    this.position.copy(position);
    this.camera.position.copy(position);
  }
  
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  public setCanJump(canJump: boolean): void {
    this.canJump = canJump;
  }
  
  public dispose(): void {
    // Clean up any resources
  }
}