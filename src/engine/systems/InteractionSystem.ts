import * as THREE from 'three';
import { EventBus } from '../core/EventBus';
import { ErrorHandler } from '../utils/ErrorHandler';
import type { 
  InteractableObject, 
  InteractionData, 
  InteractionResult, 
  InteractionMetadata
} from '../interfaces/InteractableObject';
import { InteractionType } from '../interfaces/InteractableObject';

/**
 * Unified interaction system for handling all game interactions
 * Supports mouse, touch, and proximity-based interactions
 */
export class InteractionSystem {
  private interactables: Map<string, InteractableObject> = new Map();
  private eventBus: EventBus;
  private camera: THREE.PerspectiveCamera;
  private container: HTMLElement;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  // State tracking
  private isEnabled = true;
  private lastInteractionTime = 0;
  private interactionCooldown = 100; // ms between interactions
  
  // Proximity tracking
  private lastPlayerPosition: THREE.Vector3 = new THREE.Vector3();
  private proximityCheckInterval = 100; // ms between proximity checks
  private lastProximityCheck = 0;
  
  constructor(
    camera: THREE.PerspectiveCamera,
    container: HTMLElement,
    eventBus: EventBus
  ) {
    this.camera = camera;
    this.container = container;
    this.eventBus = eventBus;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for mouse and touch interactions
   */
  private setupEventListeners(): void {
    // Mouse events
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Touch events
    this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
    
    // Track mouse down time for click vs drag detection
    this.container.addEventListener('mousedown', (event) => {
      (window as any).lastMouseDownTime = event.timeStamp;
    });
    
    this.container.addEventListener('touchstart', (event) => {
      if (event.touches.length === 1) {
        (window as any).lastTouchDownTime = event.timeStamp;
      }
    });
  }
  
  /**
   * Register an interactable object
   */
  public registerInteractable(interactable: InteractableObject): void {
    if (this.interactables.has(interactable.id)) {
      console.warn(`Interactable with id '${interactable.id}' already exists`);
      return;
    }
    
    this.interactables.set(interactable.id, interactable);
    // Interactable registered (logging disabled for performance)
    
    // Emit registration event
    this.eventBus.emit('interaction.registered', {
      interactable: interactable.getInteractionData()
    });
  }
  
  /**
   * Unregister an interactable object
   */
  public unregisterInteractable(id: string): void {
    const interactable = this.interactables.get(id);
    if (interactable) {
      this.interactables.delete(id);
      console.log(`🗑️ Unregistered interactable: ${id}`);
      
      // Emit unregistration event
      this.eventBus.emit('interaction.unregistered', {
        interactableId: id
      });
    }
  }
  
  /**
   * Clear all registered interactables
   */
  public clearInteractables(): void {
    const count = this.interactables.size;
    this.interactables.clear();
    console.log(`🧹 Cleared ${count} interactables`);
    
    this.eventBus.emit('interaction.cleared', { count });
  }
  
  /**
   * Update the interaction system (call each frame)
   */
  public update(deltaTime: number, playerPosition?: THREE.Vector3): void {
    if (!this.isEnabled) return;
    
    // Check proximity interactions
    if (playerPosition) {
      this.checkProximityInteractions(playerPosition);
      this.lastPlayerPosition.copy(playerPosition);
    }
  }
  
  /**
   * Handle mouse up events
   */
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isEnabled || event.button !== 0) return;
    
    // Check if this was a click (not a drag)
    const mouseDownTime = event.timeStamp - ((window as any).lastMouseDownTime || 0);
    if (mouseDownTime < 200) { // Less than 200ms = click
      this.handleClick(event.clientX, event.clientY, 'mouse');
    }
  }
  
  /**
   * Handle mouse down events
   */
  private handleMouseDown(event: MouseEvent): void {
    // Just track the time - actual interaction happens on mouseup
  }
  
  /**
   * Handle mouse move events (for hover interactions)
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isEnabled) return;
    
    // Update mouse position for hover interactions
    this.updateMousePosition(event.clientX, event.clientY);
    
    // Check for hover interactions
    this.checkHoverInteractions();
  }
  
  /**
   * Handle touch end events
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isEnabled || event.changedTouches.length !== 1) return;
    
    const touch = event.changedTouches[0];
    const touchDownTime = event.timeStamp - ((window as any).lastTouchDownTime || 0);
    
    if (touchDownTime < 200) { // Quick tap
      this.handleClick(touch.clientX, touch.clientY, 'touch');
    }
  }
  
  /**
   * Handle touch start events
   */
  private handleTouchStart(event: TouchEvent): void {
    // Just track the time - actual interaction happens on touchend
  }
  
  /**
   * Handle click/tap interactions
   */
  private handleClick(clientX: number, clientY: number, inputType: 'mouse' | 'touch'): void {
    // Check cooldown
    const now = Date.now();
    if (now - this.lastInteractionTime < this.interactionCooldown) {
      return;
    }
    
    this.updateMousePosition(clientX, clientY);
    const result = this.performRaycast(InteractionType.CLICK);
    
    if (result) {
      this.lastInteractionTime = now;
      
      const interactionData: InteractionData = {
        worldPosition: result.worldPosition,
        cameraPosition: this.camera.position.clone(),
        direction: result.worldPosition.clone().sub(this.camera.position).normalize(),
        interactionType: InteractionType.CLICK,
        platformData: { inputType },
        timestamp: now
      };
      
      // Call the interaction handler
      result.interactable.onInteract(interactionData);
      
      // Emit interaction event
      this.eventBus.emit('interaction.performed', {
        interactable: result.interactable.getInteractionData(),
        interactionData,
        result
      });
      
      console.log(`🎯 Interaction performed: ${result.interactable.id}`);
    } else {
      // No interactable was hit - emit background click event
      this.eventBus.emit('interaction.background.click', {
        clientX,
        clientY,
        inputType,
        timestamp: now
      });
      console.log('🎯 Background click detected');
    }
  }
  
  /**
   * Update mouse position for raycasting
   */
  private updateMousePosition(clientX: number, clientY: number): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }
  
  /**
   * Perform raycast to find interactable objects
   */
  private performRaycast(interactionType: InteractionType): InteractionResult | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Get all interactable meshes
    const interactableMeshes: THREE.Object3D[] = [];
    const meshToInteractable: Map<THREE.Object3D, InteractableObject> = new Map();
    
    this.interactables.forEach((interactable) => {
      if (interactable.isInteractable && interactable.interactionType === interactionType) {
        interactableMeshes.push(interactable.mesh);
        meshToInteractable.set(interactable.mesh, interactable);
      }
    });
    
    if (interactableMeshes.length === 0) {
      return null;
    }
    
    // Perform raycast
    const intersections = this.raycaster.intersectObjects(interactableMeshes, true);
    
    if (intersections.length > 0) {
      const intersection = intersections[0];
      let targetMesh = intersection.object;
      
      // Find the registered interactable mesh (might be a parent)
      let interactable = meshToInteractable.get(targetMesh);
      while (!interactable && targetMesh.parent) {
        targetMesh = targetMesh.parent;
        interactable = meshToInteractable.get(targetMesh);
      }
      
      if (interactable) {
        return {
          interactable,
          distance: intersection.distance,
          worldPosition: intersection.point,
          success: true
        };
      }
    }
    
    return null;
  }
  
  /**
   * Check for proximity-based interactions
   */
  private checkProximityInteractions(playerPosition: THREE.Vector3): void {
    const now = Date.now();
    if (now - this.lastProximityCheck < this.proximityCheckInterval) {
      return;
    }
    
    this.lastProximityCheck = now;
    
    this.interactables.forEach((interactable) => {
      if (!interactable.isInteractable || interactable.interactionType !== InteractionType.PROXIMITY) {
        return;
      }
      
      const distance = playerPosition.distanceTo(interactable.mesh.position);
      const wasInRange = this.lastPlayerPosition.distanceTo(interactable.mesh.position) <= interactable.interactionRadius;
      const isInRange = distance <= interactable.interactionRadius;
      
      // Check for enter/leave range events
      if (isInRange && !wasInRange && interactable.onEnterRange) {
        interactable.onEnterRange(playerPosition);
        this.eventBus.emit('interaction.enter_range', {
          interactable: interactable.getInteractionData(),
          playerPosition: playerPosition.clone()
        });
      } else if (!isInRange && wasInRange && interactable.onLeaveRange) {
        interactable.onLeaveRange(playerPosition);
        this.eventBus.emit('interaction.leave_range', {
          interactable: interactable.getInteractionData(),
          playerPosition: playerPosition.clone()
        });
      }
      
      // Auto-interact on proximity if configured
      if (isInRange) {
        const interactionData: InteractionData = {
          worldPosition: interactable.mesh.position.clone(),
          cameraPosition: this.camera.position.clone(),
          direction: interactable.mesh.position.clone().sub(this.camera.position).normalize(),
          interactionType: InteractionType.PROXIMITY,
          platformData: { distance },
          timestamp: now
        };
        
        interactable.onInteract(interactionData);
      }
    });
  }
  
  /**
   * Check for hover interactions
   */
  private checkHoverInteractions(): void {
    const result = this.performRaycast(InteractionType.HOVER);
    
    if (result) {
      const interactionData: InteractionData = {
        worldPosition: result.worldPosition,
        cameraPosition: this.camera.position.clone(),
        direction: result.worldPosition.clone().sub(this.camera.position).normalize(),
        interactionType: InteractionType.HOVER,
        platformData: { distance: result.distance },
        timestamp: Date.now()
      };
      
      result.interactable.onInteract(interactionData);
      
      this.eventBus.emit('interaction.hover', {
        interactable: result.interactable.getInteractionData(),
        interactionData,
        result
      });
    }
  }
  
  /**
   * Enable/disable the interaction system
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🎮 Interaction system ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Get all registered interactables
   */
  public getInteractables(): Map<string, InteractableObject> {
    return new Map(this.interactables);
  }
  
  /**
   * Get interactable by id
   */
  public getInteractable(id: string): InteractableObject | undefined {
    return this.interactables.get(id);
  }
  
  /**
   * Get system statistics
   */
  public getStats(): InteractionSystemStats {
    return {
      totalInteractables: this.interactables.size,
      enabledInteractables: Array.from(this.interactables.values()).filter(i => i.isInteractable).length,
      isEnabled: this.isEnabled,
      lastInteractionTime: this.lastInteractionTime,
      interactionCooldown: this.interactionCooldown
    };
  }
  
  /**
   * Dispose of the interaction system
   */
  public dispose(): void {
    // Remove event listeners
    this.container.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.container.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.container.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    
    // Clear all interactables
    this.clearInteractables();
    
    console.log('🧹 InteractionSystem disposed');
  }
}

/**
 * Statistics about the interaction system
 */
export interface InteractionSystemStats {
  totalInteractables: number;
  enabledInteractables: number;
  isEnabled: boolean;
  lastInteractionTime: number;
  interactionCooldown: number;
}