// Object picking and selection system with interactable objects

import * as THREE from 'three';
import { EventBus } from '../core/EventBus';

export interface InteractableObject {
  id: string;
  mesh: THREE.Object3D;
  type: 'note' | 'safe' | 'button' | 'terminal' | 'star';
  data: any;
  onInteract?: (data: any) => void;
}

export class InteractionSystem {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.PerspectiveCamera;
  private container: HTMLElement;
  private eventBus?: EventBus;
  
  private interactables: Map<string, InteractableObject> = new Map();
  private hoveredObject: InteractableObject | null = null;
  
  constructor(camera: THREE.PerspectiveCamera, container: HTMLElement, eventBus?: EventBus) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.camera = camera;
    this.container = container;
    this.eventBus = eventBus;
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    this.container.addEventListener('click', this.handleClick.bind(this));
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }
  
  private handleClick(event: MouseEvent): void {
    this.updateMouse(event);
    
    const intersections = this.getIntersections();
    if (intersections.length > 0) {
      const object = intersections[0].object;
      const interactable = this.findInteractableByMesh(object);
      
      if (interactable) {
        this.interact(interactable);
      }
    }
  }
  
  private handleMouseMove(event: MouseEvent): void {
    this.updateMouse(event);
    
    const intersections = this.getIntersections();
    const newHovered = intersections.length > 0 ? this.findInteractableByMesh(intersections[0].object) : null;
    
    if (newHovered !== this.hoveredObject) {
      // Remove hover from previous object
      if (this.hoveredObject) {
        this.setHoverState(this.hoveredObject, false);
      }
      
      // Add hover to new object
      if (newHovered) {
        this.setHoverState(newHovered, true);
        this.container.style.cursor = 'pointer';
      } else {
        this.container.style.cursor = 'default';
      }
      
      this.hoveredObject = newHovered;
    }
  }
  
  private updateMouse(event: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  
  private getIntersections(): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const interactableMeshes = Array.from(this.interactables.values()).map(obj => obj.mesh);
    return this.raycaster.intersectObjects(interactableMeshes, true);
  }
  
  private findInteractableByMesh(mesh: THREE.Object3D): InteractableObject | null {
    for (const interactable of this.interactables.values()) {
      if (interactable.mesh === mesh || interactable.mesh.children.includes(mesh)) {
        return interactable;
      }
    }
    return null;
  }
  
  private setHoverState(interactable: InteractableObject, hovered: boolean): void {
    // Add visual feedback for hover
    if (interactable.mesh.material) {
      const material = interactable.mesh.material as THREE.MeshBasicMaterial;
      if (hovered) {
        material.emissive = new THREE.Color(0x333333);
      } else {
        material.emissive = new THREE.Color(0x000000);
      }
    }
  }
  
  private interact(interactable: InteractableObject): void {
    console.log(`🔗 Interacting with ${interactable.type}: ${interactable.id}`);
    
    // Call custom interaction callback if provided
    if (interactable.onInteract) {
      interactable.onInteract(interactable.data);
    }
    
    // Emit interaction event
    if (this.eventBus) {
      this.eventBus.emit('interaction', {
        id: interactable.id,
        type: interactable.type,
        data: interactable.data
      });
    }
  }
  
  // Public API
  public addInteractable(interactable: InteractableObject): void {
    this.interactables.set(interactable.id, interactable);
    console.log(`➕ Added interactable: ${interactable.id} (${interactable.type})`);
  }
  
  public removeInteractable(id: string): void {
    if (this.interactables.has(id)) {
      const interactable = this.interactables.get(id)!;
      
      // Clear hover state if this object is currently hovered
      if (this.hoveredObject === interactable) {
        this.setHoverState(interactable, false);
        this.hoveredObject = null;
        this.container.style.cursor = 'default';
      }
      
      this.interactables.delete(id);
      console.log(`➖ Removed interactable: ${id}`);
    }
  }
  
  public checkIntersections(objects: THREE.Object3D[]): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(objects);
  }
  
  public dispose(): void {
    console.log('🧹 Disposing Interaction System...');
    
    this.container.removeEventListener('click', this.handleClick.bind(this));
    this.container.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    
    this.interactables.clear();
    this.hoveredObject = null;
    this.container.style.cursor = 'default';
    
    console.log('✅ Interaction System disposed');
  }
}