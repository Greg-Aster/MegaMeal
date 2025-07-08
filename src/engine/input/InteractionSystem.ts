// Object picking and selection system

import * as THREE from 'three';

export class InteractionSystem {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.PerspectiveCamera;
  private container: HTMLElement;
  
  constructor(camera: THREE.PerspectiveCamera, container: HTMLElement) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.camera = camera;
    this.container = container;
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    this.container.addEventListener('click', this.handleClick.bind(this));
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }
  
  private handleClick(event: MouseEvent): void {
    this.updateMouse(event);
    // Emit click event
  }
  
  private handleMouseMove(event: MouseEvent): void {
    this.updateMouse(event);
    // Update hover state
  }
  
  private updateMouse(event: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  
  public checkIntersections(objects: THREE.Object3D[]): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(objects);
  }
  
  public dispose(): void {
    this.container.removeEventListener('click', this.handleClick.bind(this));
    this.container.removeEventListener('mousemove', this.handleMouseMove.bind(this));
  }
}