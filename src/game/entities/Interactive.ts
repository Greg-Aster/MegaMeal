// Interactive entity for selectable and clickable game objects

import * as THREE from 'three';

export interface InteractiveConfig {
  id: string;
  position?: THREE.Vector3;
  scale?: THREE.Vector3;
  rotation?: THREE.Euler;
  userData?: any;
  hoverColor?: string;
  selectedColor?: string;
  clickable?: boolean;
  hoverable?: boolean;
}

export type InteractionEvent = 'click' | 'hover' | 'unhover' | 'select' | 'deselect';

export class Interactive {
  private object3D: THREE.Object3D;
  private config: InteractiveConfig;
  private isHovered = false;
  private isSelected = false;
  private originalMaterial?: THREE.Material;
  private hoverMaterial?: THREE.Material;
  private selectedMaterial?: THREE.Material;
  private eventListeners = new Map<InteractionEvent, ((data: any) => void)[]>();
  
  constructor(object3D: THREE.Object3D, config: InteractiveConfig) {
    this.object3D = object3D;
    this.config = config;
    
    // Set up the object
    this.setupObject();
    this.setupMaterials();
  }
  
  private setupObject(): void {
    // Set transform properties
    if (this.config.position) {
      this.object3D.position.copy(this.config.position);
    }
    
    if (this.config.scale) {
      this.object3D.scale.copy(this.config.scale);
    }
    
    if (this.config.rotation) {
      this.object3D.rotation.copy(this.config.rotation);
    }
    
    // Set user data
    this.object3D.userData = {
      ...this.object3D.userData,
      interactiveId: this.config.id,
      interactive: this,
      ...this.config.userData
    };
  }
  
  private setupMaterials(): void {
    // Store original material
    this.object3D.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (!this.originalMaterial) {
          this.originalMaterial = Array.isArray(child.material) 
            ? child.material[0].clone()
            : child.material.clone();
        }
      }
    });
    
    // Create hover material
    if (this.config.hoverColor && this.originalMaterial) {
      this.hoverMaterial = this.originalMaterial.clone();
      if (this.hoverMaterial instanceof THREE.MeshBasicMaterial ||
          this.hoverMaterial instanceof THREE.MeshLambertMaterial ||
          this.hoverMaterial instanceof THREE.MeshPhongMaterial) {
        this.hoverMaterial.color.setStyle(this.config.hoverColor);
      }
    }
    
    // Create selected material
    if (this.config.selectedColor && this.originalMaterial) {
      this.selectedMaterial = this.originalMaterial.clone();
      if (this.selectedMaterial instanceof THREE.MeshBasicMaterial ||
          this.selectedMaterial instanceof THREE.MeshLambertMaterial ||
          this.selectedMaterial instanceof THREE.MeshPhongMaterial) {
        this.selectedMaterial.color.setStyle(this.config.selectedColor);
      }
    }
  }
  
  private applyMaterial(material: THREE.Material): void {
    this.object3D.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
  }
  
  private updateVisualState(): void {
    if (this.isSelected && this.selectedMaterial) {
      this.applyMaterial(this.selectedMaterial);
    } else if (this.isHovered && this.hoverMaterial) {
      this.applyMaterial(this.hoverMaterial);
    } else if (this.originalMaterial) {
      this.applyMaterial(this.originalMaterial);
    }
  }
  
  public handleClick(intersectionPoint?: THREE.Vector3): void {
    if (!this.config.clickable) return;
    
    const eventData = {
      id: this.config.id,
      object: this.object3D,
      intersectionPoint,
      userData: this.config.userData
    };
    
    this.emit('click', eventData);
  }
  
  public handleHover(intersectionPoint?: THREE.Vector3): void {
    if (!this.config.hoverable || this.isHovered) return;
    
    this.isHovered = true;
    this.updateVisualState();
    
    const eventData = {
      id: this.config.id,
      object: this.object3D,
      intersectionPoint,
      userData: this.config.userData
    };
    
    this.emit('hover', eventData);
  }
  
  public handleUnhover(): void {
    if (!this.isHovered) return;
    
    this.isHovered = false;
    this.updateVisualState();
    
    const eventData = {
      id: this.config.id,
      object: this.object3D,
      userData: this.config.userData
    };
    
    this.emit('unhover', eventData);
  }
  
  public select(): void {
    if (this.isSelected) return;
    
    this.isSelected = true;
    this.updateVisualState();
    
    const eventData = {
      id: this.config.id,
      object: this.object3D,
      userData: this.config.userData
    };
    
    this.emit('select', eventData);
  }
  
  public deselect(): void {
    if (!this.isSelected) return;
    
    this.isSelected = false;
    this.updateVisualState();
    
    const eventData = {
      id: this.config.id,
      object: this.object3D,
      userData: this.config.userData
    };
    
    this.emit('deselect', eventData);
  }
  
  public on(event: InteractionEvent, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  
  public off(event: InteractionEvent, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    }
  }
  
  private emit(event: InteractionEvent, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
  
  public getId(): string {
    return this.config.id;
  }
  
  public getObject3D(): THREE.Object3D {
    return this.object3D;
  }
  
  public isInteractiveHovered(): boolean {
    return this.isHovered;
  }
  
  public isInteractiveSelected(): boolean {
    return this.isSelected;
  }
  
  public setPosition(position: THREE.Vector3): void {
    this.object3D.position.copy(position);
  }
  
  public setScale(scale: THREE.Vector3): void {
    this.object3D.scale.copy(scale);
  }
  
  public setRotation(rotation: THREE.Euler): void {
    this.object3D.rotation.copy(rotation);
  }
  
  public setUserData(userData: any): void {
    this.config.userData = userData;
    this.object3D.userData = {
      ...this.object3D.userData,
      ...userData
    };
  }
  
  public getUserData(): any {
    return this.config.userData;
  }
  
  public dispose(): void {
    // Clean up materials
    this.originalMaterial?.dispose();
    this.hoverMaterial?.dispose();
    this.selectedMaterial?.dispose();
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Clean up object3D if needed
    this.object3D.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }
}