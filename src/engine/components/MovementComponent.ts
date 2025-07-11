import * as THREE from 'three';
import { EventBus } from '../core/EventBus';
import { InputManager } from '../input/InputManager';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import type { MovementConfig, LevelMovementConfig, MovementState } from './MovementTypes';

/**
 * Unified Movement Component - Industry Standard Implementation
 * Handles all movement logic uniformly across all levels
 * Uses physics raycasting for ground detection instead of hardcoded values
 */

export class MovementComponent {
  private camera: THREE.PerspectiveCamera;
  private eventBus: EventBus;
  private inputManager: InputManager;
  private physicsWorld: PhysicsWorld | null;
  
  // Configurations
  private config: MovementConfig;
  
  // Movement state
  private state: MovementState;
  
  // Internal systems
  private raycaster: THREE.Raycaster;
  private downVector: THREE.Vector3;
  private isInitialized = false;
  
  // Level awareness
  private currentLevelId: string | null = null;
  private levelConfig: LevelMovementConfig | null = null;
  
  // Event handlers (store references for proper removal)
  private dragStartHandler: () => void = () => {};
  private dragMoveHandler: (data: any) => void = () => {};
  private dragEndHandler: () => void = () => {};
  
  // Mobile virtual controls state (from UniversalInputManager via EventBus)
  private virtualMovement = { x: 0, y: 0, z: 0 };
  private virtualActions: { [action: string]: boolean } = {};
  
  constructor(
    camera: THREE.PerspectiveCamera,
    eventBus: EventBus,
    inputManager: InputManager,
    physicsWorld: PhysicsWorld | null = null,
    config: Partial<MovementConfig> = {}
  ) {
    this.camera = camera;
    this.eventBus = eventBus;
    this.inputManager = inputManager;
    this.physicsWorld = physicsWorld;
    
    // Default configuration
    this.config = {
      moveSpeed: 8.0,
      jumpHeight: 4.0,
      gravity: -20.0,
      mouseSensitivity: 0.002,
      eyeHeight: 1.6,
      groundCheckDistance: 2.0,
      maxStepHeight: 0.5,
      ...config
    };
    
    // Initialize movement state
    this.state = {
      position: this.camera.position.clone(),
      velocity: new THREE.Vector3(0, 0, 0),
      isGrounded: false,
      groundLevel: 0,
      canJump: true
    };
    
    // Initialize raycasting system
    this.raycaster = new THREE.Raycaster();
    this.downVector = new THREE.Vector3(0, -1, 0);
  }
  
  /**
   * Initialize the movement component
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('MovementComponent already initialized');
      return;
    }
    
    console.log('🎮 Initializing Unified Movement Component...');
    
    this.setupEventListeners();
    this.setupMouseLook();
    
    this.isInitialized = true;
    console.log('✅ Unified Movement Component initialized');
  }
  
  /**
   * Set the current level for movement adaptation
   */
  public setCurrentLevel(levelId: string, levelGroup: THREE.Group, config: LevelMovementConfig): void {
    console.log(`🎮 MovementComponent: Switching to level ${levelId}`);
    this.currentLevelId = levelId;
    this.levelConfig = config;
    
    // Update base config if provided
    this.setConfig(this.levelConfig.baseConfig || {});
    
    // Reset movement state for new level
    this.resetMovementState();
  }
  
  /**
   * Main update loop - handles all movement logic
   */
  public update(deltaTime: number, levelGroup: THREE.Group): void {
    if (!this.isInitialized) return;
    
    // Update ground detection using raycasting
    this.updateGroundDetection(levelGroup);
    
    // Handle horizontal movement
    this.handleHorizontalMovement(deltaTime);
    
    // Handle vertical movement (gravity, jumping)
    this.handleVerticalMovement(deltaTime);
    
    // Apply boundary constraints
    this.applyBoundaryConstraints();
    
    // Update camera position
    this.updateCameraPosition();
    
    // Emit movement events
    this.emitMovementEvents();
  }
  
  /**
   * Unified ground detection with level-specific terrain following
   */
  private updateGroundDetection(levelGroup: THREE.Group): void {
    if (this.levelConfig?.usePhysicsRaycast) {
      // Raycast from player's feet position, not head
      const feetPosition = this.state.position.clone();
      feetPosition.y -= this.config.eyeHeight;
      this.raycaster.set(feetPosition, this.downVector);
      
      const intersectableObjects: THREE.Object3D[] = [];
      levelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.visible) {
          intersectableObjects.push(child);
        }
      });
      const intersections = this.raycaster.intersectObjects(intersectableObjects, false);
      
      if (intersections.length > 0) {
        this.state.groundLevel = intersections[0].point.y + this.config.eyeHeight;
      } else {
        this.state.groundLevel = this.getFallbackGroundLevel() + this.config.eyeHeight;
      }
    } else if (this.levelConfig?.terrainProvider) {
      // Use the level-provided terrain function - it returns camera position (ground + eye height)
      this.state.groundLevel = this.levelConfig.terrainProvider(this.state.position.x, this.state.position.z);
    } else {
      // No ground detection method, use fallback
      this.state.groundLevel = this.getFallbackGroundLevel() + this.config.eyeHeight;
    }

    // Check if player is on ground (with small tolerance)
    this.state.isGrounded = this.state.position.y <= this.state.groundLevel + 0.1;
    this.state.canJump = this.state.isGrounded;
  }
  
  /**
   * Handle horizontal movement (WASD + camera-relative)
   */
  private handleHorizontalMovement(deltaTime: number): void {
    // Get input from keyboard or virtual controls
    const isForwardPressed = this.inputManager.isActionPressed('forward');
    const isBackwardPressed = this.inputManager.isActionPressed('backward');
    const isLeftPressed = this.inputManager.isActionPressed('left');
    const isRightPressed = this.inputManager.isActionPressed('right');
    
    // Get mobile virtual movement (from EventBus or InputManager)
    const eventBusMovement = this.virtualMovement;
    const inputManagerMovement = this.inputManager.getMovementVector();
    
    // Prefer EventBus movement (from UniversalInputManager) over InputManager
    const movementVector = (eventBusMovement.x !== 0 || eventBusMovement.z !== 0) 
      ? eventBusMovement 
      : inputManagerMovement;
    const hasVirtualMovement = movementVector.x !== 0 || movementVector.z !== 0;
    
    // Calculate movement direction relative to camera
    let deltaX = 0;
    let deltaZ = 0;
    
    if (isForwardPressed || isBackwardPressed || isLeftPressed || isRightPressed || hasVirtualMovement) {
      // Get camera's forward and right vectors
      const cameraMatrix = this.camera.matrixWorld;
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      
      // Extract directional vectors from camera matrix
      forward.setFromMatrixColumn(cameraMatrix, 2).multiplyScalar(-1); // -Z is forward
      right.setFromMatrixColumn(cameraMatrix, 0); // X is right
      
      // Project to horizontal plane (no Y component)
      forward.y = 0;
      right.y = 0;
      forward.normalize();
      right.normalize();
      
      // Calculate movement direction
      const moveDirection = new THREE.Vector3();
      
      if (hasVirtualMovement) {
        // Mobile virtual movement
        moveDirection.add(right.clone().multiplyScalar(movementVector.x));
        moveDirection.add(forward.clone().multiplyScalar(-movementVector.z)); // Negative Z for forward
      } else {
        // Desktop keyboard movement
        if (isForwardPressed) moveDirection.add(forward);
        if (isBackwardPressed) moveDirection.add(forward.clone().multiplyScalar(-1));
        if (isLeftPressed) moveDirection.add(right.clone().multiplyScalar(-1));
        if (isRightPressed) moveDirection.add(right);
      }
      
      // Apply movement with speed and time scaling
      moveDirection.multiplyScalar(this.config.moveSpeed * deltaTime);
      deltaX = moveDirection.x;
      deltaZ = moveDirection.z;
    }
    
    // Update horizontal position
    this.state.position.x += deltaX;
    this.state.position.z += deltaZ;
  }
  
  /**
   * Handle vertical movement (gravity, jumping)
   */
  private handleVerticalMovement(deltaTime: number): void {
    // Handle jumping (check both InputManager and virtual actions from EventBus)
    const isJumpPressed = this.inputManager.isActionPressed('jump') || this.virtualActions['jump'];
    
    if (isJumpPressed && this.state.canJump && this.state.isGrounded) {
      const jumpVelocity = Math.sqrt(2 * Math.abs(this.config.gravity) * this.config.jumpHeight);
      this.state.velocity.y = jumpVelocity;
      this.state.canJump = false; // Prevent bunny hopping
    }
    
    // Apply gravity
    this.state.velocity.y += this.config.gravity * deltaTime;
    
    // Apply vertical velocity
    this.state.position.y += this.state.velocity.y * deltaTime;
    
    // Ground collision - groundLevel already includes eye height
    if (this.state.isGrounded && this.state.position.y <= this.state.groundLevel) {
      this.state.position.y = this.state.groundLevel;
      this.state.velocity.y = 0;
    }
    
    // Emergency fix: prevent falling through world
    const minY = this.getFallbackGroundLevel() + this.config.eyeHeight;
    if (this.state.position.y < minY) {
      this.state.position.y = minY;
      this.state.velocity.y = 0;
    }
  }
  
  /**
   * Apply level boundary constraints to prevent walking off edges
   */
  private applyBoundaryConstraints(): void {
    if (this.levelConfig?.boundaryProvider) {
      this.state.position.copy(this.levelConfig.boundaryProvider(this.state.position));
    }
  }
  
  /**
   * Update camera position to match movement state
   */
  private updateCameraPosition(): void {
    this.camera.position.copy(this.state.position);
  }
  
  /**
   * Setup mouse look controls
   */
  private setupMouseLook(): void {
    let isDragging = false;
    
    // Setup event handlers
    this.dragStartHandler = () => {
      isDragging = true;
    };
    
    this.dragMoveHandler = (data) => {
      if (isDragging && data.deltaX !== undefined && data.deltaY !== undefined) {
        // Sensitivity is now handled by UniversalInputManager
        const deltaX = data.deltaX;
        const deltaY = data.deltaY;
        
        // Get current camera rotation
        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
        
        // Apply horizontal rotation (Y axis)
        euler.y -= deltaX;
        
        // Apply vertical rotation (X axis) with limits
        euler.x -= deltaY;
        euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
        
        // Apply rotation to camera
        this.camera.quaternion.setFromEuler(euler);
      }
    };
    
    this.dragEndHandler = () => {
      isDragging = false;
    };
    
    // Listen to universal input drag events
    this.eventBus.on('input:drag:start', this.dragStartHandler);
    this.eventBus.on('input:drag:move', this.dragMoveHandler);
    this.eventBus.on('input:drag:end', this.dragEndHandler);
  }
  
  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for mobile movement events from UniversalInputManager
    this.eventBus.on('mobile.movement', (data: { x: number; z: number }) => {
      this.virtualMovement.x = data.x;
      this.virtualMovement.z = data.z;
    });
    
    // Listen for mobile action events from UniversalInputManager
    this.eventBus.on('mobile.action', (action: string) => {
      this.virtualActions[action] = true;
      
      // Clear action after a short delay to simulate button press
      setTimeout(() => {
        this.virtualActions[action] = false;
      }, 100);
    });
  }
  
  /**
   * Get fallback ground level for emergency situations
   */
  private getFallbackGroundLevel(): number {
    return this.levelConfig?.fallbackGroundLevel ?? 0;
  }
  
  /**
   * Reset movement state for level transitions
   */
  private resetMovementState(): void {
    this.state.velocity.set(0, 0, 0);
    this.state.isGrounded = false;
    this.state.canJump = true;
  }
  
  /**
   * Emit movement events for other systems
   */
  private emitMovementEvents(): void {
    this.eventBus.emit('movement.update', {
      position: this.state.position.clone(),
      velocity: this.state.velocity.clone(),
      isGrounded: this.state.isGrounded,
      groundLevel: this.state.groundLevel
    });
  }
  
  // Public API
  
  /**
   * Set movement configuration
   */
  public setConfig(config: Partial<MovementConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current movement state
   */
  public getState(): MovementState {
    return { ...this.state };
  }
  
  /**
   * Set camera position (for level transitions)
   */
  public setPosition(position: THREE.Vector3): void {
    this.state.position.copy(position);
    this.camera.position.copy(position);
    this.resetMovementState();
  }
  
  /**
   * Get camera position
   */
  public getPosition(): THREE.Vector3 {
    return this.state.position.clone();
  }
  
  /**
   * Dispose of the movement component
   */
  public dispose(): void {
    console.log('🧹 Disposing Movement Component...');
    
    // Remove event listeners
    this.eventBus.off('input:drag:start', this.dragStartHandler);
    this.eventBus.off('input:drag:move', this.dragMoveHandler);
    this.eventBus.off('input:drag:end', this.dragEndHandler);
    this.eventBus.off('mobile.movement');
    this.eventBus.off('mobile.action');
    
    this.isInitialized = false;
    console.log('✅ Movement Component disposed');
  }
}