// Hybrid control system: OrbitControls for mouse look + WASD for movement
// Perfect for star observatory exploration

import { EventBus } from '../core/EventBus';
import { InputManager } from './InputManager';

export interface HybridControlsConfig {
  moveSpeed: number;
  orbitControls: {
    enableDamping: boolean;
    dampingFactor: number;
    rotateSpeed: number;
    zoomSpeed: number;
    enablePan: boolean;
    minDistance: number;
    maxDistance: number;
    minPolarAngle?: number;
    maxPolarAngle?: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    // Mobile/touch specific
    enableTouch: boolean;
    touchRotateSpeed: number;
    touchZoomSpeed: number;
  };
}

export class HybridControls {
  private THREE: any;
  private camera: any;
  private domElement: HTMLElement;
  private eventBus: EventBus;
  private inputManager: InputManager;
  private orbitControls: any;
  private config: HybridControlsConfig;
  private isInitialized = false;
  private physicsWorld: any;
  
  // Physics body for player
  private playerBodyId: string | null = null;
  
  // Movement state
  private moveSpeed: number;
  private targetPosition = { x: 0, y: 0, z: 0 };
  private velocity: any = null;
  
  constructor(
    THREE: any,
    camera: any,
    domElement: HTMLElement,
    eventBus: EventBus,
    inputManager: InputManager,
    physicsWorld?: any,
    config?: Partial<HybridControlsConfig>
  ) {
    this.THREE = THREE;
    this.camera = camera;
    this.domElement = domElement;
    this.eventBus = eventBus;
    this.inputManager = inputManager;
    this.physicsWorld = physicsWorld;
    
    this.config = {
      moveSpeed: 50,
      orbitControls: {
        enableDamping: true,
        dampingFactor: 0.2,
        rotateSpeed: 0.1,
        zoomSpeed: 0.3,
        enablePan: false,
        minDistance: 50,
        maxDistance: 300,
        autoRotate: false,
        autoRotateSpeed: 0.05,
        // Mobile/touch defaults
        enableTouch: true,
        touchRotateSpeed: 0.15, // Slightly faster for touch
        touchZoomSpeed: 0.5, // Faster zoom on mobile
        ...config?.orbitControls
      },
      ...config
    };
    
    this.moveSpeed = this.config.moveSpeed;
    
    // Initialize target position to camera position
    this.targetPosition.x = camera.position.x;
    this.targetPosition.y = camera.position.y;
    this.targetPosition.z = camera.position.z;
  }
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('HybridControls already initialized');
      return;
    }
    
    console.log('🎮 Initializing Hybrid Controls...');
    
    await this.setupOrbitControls();
    this.setupEventListeners();
    this.setupPlayerPhysics();
    
    this.isInitialized = true;
    console.log('✅ Hybrid Controls initialized');
  }
  
  private async setupOrbitControls(): Promise<void> {
    console.log('🚫 OrbitControls DISABLED - using first-person camera instead');
    // Completely disable OrbitControls for first-person experience
    // No orbit controls = no camera conflicts = smooth movement
    return Promise.resolve();
  }
  
  private setupEventListeners(): void {
    // Listen for input events
    this.eventBus.on('engine.update', (data) => {
      this.update(data.deltaTime);
    });
    
    // Set up first-person mouse look
    this.setupFirstPersonMouseLook();
  }
  
  private setupFirstPersonMouseLook(): void {
    // Mouse look sensitivity
    const mouseSensitivity = 0.002;
    
    // Track mouse movement for first-person look
    this.domElement.addEventListener('mousemove', (event) => {
      // Only apply mouse look if mouse button is held down
      if (event.buttons === 1) { // Left mouse button
        const deltaX = event.movementX * mouseSensitivity;
        const deltaY = event.movementY * mouseSensitivity;
        
        // Get current camera rotation
        const euler = new this.THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
        
        // Apply horizontal rotation (Y axis)
        euler.y -= deltaX;
        
        // Apply vertical rotation (X axis) with limits
        euler.x -= deltaY;
        euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x)); // Limit vertical look
        
        // Apply rotation to camera
        this.camera.quaternion.setFromEuler(euler);
      }
    });
    
    console.log('👁️ First-person mouse look enabled (click and drag to look around)');
  }
  
  private setupPlayerPhysics(): void {
    // EMERGENCY: Disable physics due to crazy movement bug
    console.log('🚨 PHYSICS DISABLED - movement was throwing player around, using direct movement');
    return;
    
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    // EMERGENCY: Disable OrbitControls completely - it's conflicting with movement!
    // if (this.orbitControls) {
    //   this.orbitControls.update();
    // }
    
    // Handle WASD movement with completely new simple system
    this.handleSimpleMovement(deltaTime);
  }
  
  private handleMovement(deltaTime: number): void {
    // EMERGENCY: Completely disable movement until we figure out what's wrong
    console.log('🚨 MOVEMENT DISABLED - all movement temporarily disabled for debugging');
    return;
    
  }
  
  private handlePhysicsMovement(movementVector: { x: number; y: number; z: number }, deltaTime: number): void {
    // Skip if no movement
    if (movementVector.x === 0 && movementVector.z === 0) {
      return;
    }
    
    const rigidBody = this.physicsWorld.getRigidBody(this.playerBodyId);
    if (!rigidBody) {
      console.warn('Physics movement requested but no rigid body found - falling back to direct movement');
      this.handleDirectMovement(movementVector, deltaTime);
      return;
    }
    
    // Get camera's forward and right vectors (ignore Y for ground movement)
    const cameraMatrix = this.camera.matrixWorld;
    const forward = new this.THREE.Vector3();
    const right = new this.THREE.Vector3();
    
    // Extract directional vectors from camera matrix
    forward.setFromMatrixColumn(cameraMatrix, 2).multiplyScalar(-1); // -Z is forward
    right.setFromMatrixColumn(cameraMatrix, 0); // X is right
    
    // Project onto horizontal plane (ignore Y component for ground movement)
    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();
    
    // Calculate movement direction
    const moveDirection = new this.THREE.Vector3();
    
    // Forward/backward (Z) - reversed to fix controls
    if (movementVector.z !== 0) {
      moveDirection.add(forward.clone().multiplyScalar(-movementVector.z));
    }
    
    // Left/right (X)
    if (movementVector.x !== 0) {
      moveDirection.add(right.clone().multiplyScalar(movementVector.x));
    }
    
    // Apply movement force to physics body (much gentler force)
    const force = moveDirection.multiplyScalar(this.moveSpeed * 2); // Reduced from 10 to 2
    rigidBody.addForce({ x: force.x, y: 0, z: force.z }, true);
    
    // Limit horizontal velocity to prevent crazy movement
    const velocity = rigidBody.linvel();
    const maxSpeed = 5; // Much lower max speed
    if (Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z) > maxSpeed) {
      const horizontalVel = new this.THREE.Vector2(velocity.x, velocity.z);
      horizontalVel.normalize().multiplyScalar(maxSpeed);
      rigidBody.setLinvel({ x: horizontalVel.x, y: velocity.y, z: horizontalVel.y }, true);
    }
    
    // Update camera position to follow physics body
    const position = rigidBody.translation();
    this.camera.position.set(position.x, position.y + 1.6, position.z); // Eye level height
    
    // Update orbit controls target
    if (this.orbitControls) {
      this.orbitControls.target.copy(this.camera.position);
    }
    
    // Emit movement event
    this.eventBus.emit('controls.movement', {
      position: this.camera.position.clone(),
      target: this.orbitControls?.target.clone()
    });
  }
  
  private handleDirectMovement(movementVector: { x: number; y: number; z: number }, deltaTime: number): void {
    // TEMPORARY: Bypass buggy movement vector, use direct key checks
    let moveX = 0, moveZ = 0;
    
    if (this.inputManager.isActionPressed('forward')) moveZ = -1;
    if (this.inputManager.isActionPressed('backward')) moveZ = 1;
    if (this.inputManager.isActionPressed('left')) moveX = -1;
    if (this.inputManager.isActionPressed('right')) moveX = 1;
    
    // Skip if no movement
    if (moveX === 0 && moveZ === 0) {
      return;
    }
    
    console.log('🐛 Direct key check - moveX:', moveX, 'moveZ:', moveZ);
    
    // EMERGENCY FIX: Use simple movement without camera matrix complexity
    const moveDistance = this.moveSpeed * deltaTime * 0.1; // Very slow for testing
    const groundLevel = -3.4; // Ground is at y = -5, so eye level is -5 + 1.6 = -3.4
    
    // Get current position but lock Y to ground level
    const currentPosition = this.camera.position.clone();
    currentPosition.y = groundLevel; // Force to ground level
    
    // Simple movement: forward/back along Z axis, left/right along X axis
    const moveDirection = new this.THREE.Vector3();
    
    // Forward/backward movement (world space Z axis)
    if (moveZ !== 0) {
      moveDirection.z = moveZ * moveDistance;
    }
    
    // Left/right movement (world space X axis)  
    if (moveX !== 0) {
      moveDirection.x = moveX * moveDistance;
    }
    
    // NO Y movement at all
    moveDirection.y = 0;
    
    console.log('🐛 Simple moveDirection:', moveDirection.clone());
    
    // Apply movement to current position
    const newPosition = currentPosition.add(moveDirection);
    
    // Double-check Y is locked to ground
    newPosition.y = groundLevel;
    
    console.log('🐛 newPosition (Y locked):', newPosition);
    
    // Update camera position
    this.camera.position.copy(newPosition);
    
    // Update orbit controls target to prevent conflicts
    if (this.orbitControls) {
      this.orbitControls.target.set(newPosition.x, newPosition.y, newPosition.z);
    }
    
    // Emit movement event
    this.eventBus.emit('controls.movement', {
      movement: moveDirection,
      position: this.camera.position.clone(),
      target: this.orbitControls?.target.clone()
    });
  }
  
  private handleSimpleMovement(deltaTime: number): void {
    // Check for movement keys directly
    const isForwardPressed = this.inputManager.isActionPressed('forward');
    const isBackwardPressed = this.inputManager.isActionPressed('backward');
    const isLeftPressed = this.inputManager.isActionPressed('left');
    const isRightPressed = this.inputManager.isActionPressed('right');
    const isJumpPressed = this.inputManager.isActionPressed('jump');
    
    // Movement constants
    const groundLevel = -3.4;
    const moveSpeed = 8; // Units per second
    const jumpHeight = 4; // Jump height
    const jumpSpeed = 12; // Jump speed
    const gravity = -20; // Gravity strength
    
    // Get current position
    const currentPos = this.camera.position.clone();
    
    // Initialize or update velocity
    if (!this.velocity) {
      this.velocity = new this.THREE.Vector3(0, 0, 0);
    }
    
    // Handle jumping
    const isOnGround = currentPos.y <= groundLevel + 0.1;
    if (isJumpPressed && isOnGround) {
      this.velocity.y = jumpSpeed;
      console.log('🦘 Jump!');
    }
    
    // Apply gravity
    this.velocity.y += gravity * deltaTime;
    
    // Handle horizontal movement (relative to camera direction)
    let deltaX = 0;
    let deltaZ = 0;
    
    if (isForwardPressed || isBackwardPressed || isLeftPressed || isRightPressed) {
      console.log('🎮 Movement - F:', isForwardPressed, 'B:', isBackwardPressed, 'L:', isLeftPressed, 'R:', isRightPressed);
      
      // Get camera's forward and right vectors for relative movement
      const cameraMatrix = this.camera.matrixWorld;
      const forward = new this.THREE.Vector3();
      const right = new this.THREE.Vector3();
      
      // Extract directional vectors from camera matrix
      forward.setFromMatrixColumn(cameraMatrix, 2).multiplyScalar(-1); // -Z is forward
      right.setFromMatrixColumn(cameraMatrix, 0); // X is right
      
      // Project to horizontal plane (no Y component)
      forward.y = 0;
      right.y = 0;
      forward.normalize();
      right.normalize();
      
      // Calculate movement direction
      const moveDirection = new this.THREE.Vector3();
      
      if (isForwardPressed) moveDirection.add(forward.clone().multiplyScalar(moveSpeed * deltaTime));
      if (isBackwardPressed) moveDirection.add(forward.clone().multiplyScalar(-moveSpeed * deltaTime));
      if (isLeftPressed) moveDirection.add(right.clone().multiplyScalar(-moveSpeed * deltaTime));
      if (isRightPressed) moveDirection.add(right.clone().multiplyScalar(moveSpeed * deltaTime));
      
      deltaX = moveDirection.x;
      deltaZ = moveDirection.z;
    }
    
    // Calculate the height at the new position using hill formula
    const newX = currentPos.x + deltaX;
    const newZ = currentPos.z + deltaZ;
    const hillGroundLevel = this.calculateHillHeight(newX, newZ);
    
    // Apply movement
    const newPos = new this.THREE.Vector3(
      newX,
      Math.max(hillGroundLevel, currentPos.y + this.velocity.y * deltaTime), // Apply gravity but don't go below hill surface
      newZ
    );
    
    // Reset vertical velocity if we hit the ground/hill
    if (newPos.y <= hillGroundLevel) {
      newPos.y = hillGroundLevel;
      this.velocity.y = 0;
    }
    
    // Update camera position
    this.camera.position.copy(newPos);
  }
  
  private calculateHillHeight(x: number, z: number): number {
    // Same hill parameters as in StarObservatory.ts
    const baseGroundLevel = -18; // Base ground level
    const eyeHeight = 1.6; // Height above ground
    const hillHeight = 15; // Maximum height of the hill
    const hillRadius = 100; // Radius of the hill
    
    // Calculate distance from center (0, 0)
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    
    // Calculate hill height using same formula as visual mesh
    let terrainHeight = 0;
    if (distanceFromCenter < hillRadius) {
      const heightMultiplier = Math.cos((distanceFromCenter / hillRadius) * Math.PI * 0.5);
      terrainHeight = hillHeight * heightMultiplier * heightMultiplier; // Square for smoother curve
    }
    
    // Return the ground level at this position plus eye height
    return baseGroundLevel + terrainHeight + eyeHeight;
  }
  
  // Public API
  public resetView(): void {
    if (!this.orbitControls) return;
    
    // Reset camera position
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);
    
    // Reset orbit controls
    this.orbitControls.target.set(0, 0, 0);
    this.orbitControls.update();
    
    this.eventBus.emit('controls.reset');
  }
  
  public setMoveSpeed(speed: number): void {
    this.moveSpeed = speed;
  }
  
  public getMoveSpeed(): number {
    return this.moveSpeed;
  }
  
  public setAutoRotate(enabled: boolean): void {
    if (this.orbitControls) {
      this.orbitControls.autoRotate = enabled;
    }
  }
  
  public getOrbitControls(): any {
    return this.orbitControls;
  }
  
  public getCamera(): any {
    return this.camera;
  }
  
  public getCameraPosition(): { x: number; y: number; z: number } {
    return {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z
    };
  }
  
  public setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
    if (this.orbitControls) {
      this.orbitControls.update();
    }
  }
  
  public dispose(): void {
    console.log('🧹 Disposing Hybrid Controls...');
    
    // Dispose orbit controls
    if (this.orbitControls) {
      this.orbitControls.dispose();
      this.orbitControls = null;
    }
    
    // Clear references
    this.camera = null as any;
    this.domElement = null as any;
    
    this.isInitialized = false;
    console.log('✅ Hybrid Controls disposed');
  }
}