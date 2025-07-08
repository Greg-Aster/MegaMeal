// FPS Controls for world exploration
// WASD movement + mouse look as specified in the plan

import * as THREE from 'three';
import type { InputManager } from './InputManager';

export interface ControlsConfig {
  moveSpeed: number;
  mouseSensitivity: number;
  enableVerticalMovement: boolean;
}

export class Controls {
  private camera: THREE.PerspectiveCamera;
  private inputManager: InputManager;
  private config: ControlsConfig;
  
  // Movement state
  private velocity = new THREE.Vector3();
  private euler = new THREE.Euler(0, 0, 0, 'YXZ');
  
  constructor(camera: THREE.PerspectiveCamera, inputManager: InputManager, config?: Partial<ControlsConfig>) {
    this.camera = camera;
    this.inputManager = inputManager;
    this.config = {
      moveSpeed: 50,
      mouseSensitivity: 0.002,
      enableVerticalMovement: true,
      ...config
    };
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Mouse look
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Pointer lock
    document.addEventListener('click', this.requestPointerLock.bind(this));
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
  }
  
  private handleMouseMove(event: MouseEvent): void {
    if (document.pointerLockElement !== this.inputManager.getContainer()) return;
    
    this.euler.y -= event.movementX * this.config.mouseSensitivity;
    this.euler.x -= event.movementY * this.config.mouseSensitivity;
    this.euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.euler.x));
    
    this.camera.quaternion.setFromEuler(this.euler);
  }
  
  private requestPointerLock(): void {
    this.inputManager.getContainer().requestPointerLock();
  }
  
  private handlePointerLockChange(): void {
    // Handle pointer lock state changes
  }
  
  public update(deltaTime: number): void {
    // Get input state
    const forward = this.inputManager.isKeyPressed('KeyW');
    const backward = this.inputManager.isKeyPressed('KeyS');
    const left = this.inputManager.isKeyPressed('KeyA');
    const right = this.inputManager.isKeyPressed('KeyD');
    const up = this.inputManager.isKeyPressed('Space');
    const down = this.inputManager.isKeyPressed('ShiftLeft');
    
    // Calculate movement
    this.velocity.set(0, 0, 0);
    
    if (forward || backward || left || right) {
      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction);
      
      if (forward) this.velocity.add(direction.multiplyScalar(this.config.moveSpeed * deltaTime));
      if (backward) this.velocity.add(direction.multiplyScalar(-this.config.moveSpeed * deltaTime));
      
      const right_vec = new THREE.Vector3().crossVectors(direction, this.camera.up).normalize();
      if (right) this.velocity.add(right_vec.multiplyScalar(this.config.moveSpeed * deltaTime));
      if (left) this.velocity.add(right_vec.multiplyScalar(-this.config.moveSpeed * deltaTime));
    }
    
    if (this.config.enableVerticalMovement) {
      if (up) this.velocity.y += this.config.moveSpeed * deltaTime;
      if (down) this.velocity.y -= this.config.moveSpeed * deltaTime;
    }
    
    // Apply movement
    this.camera.position.add(this.velocity);
  }
  
  public dispose(): void {
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('click', this.requestPointerLock.bind(this));
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
  }
}