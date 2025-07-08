// Material library system

import * as THREE from 'three';

export class Materials {
  private materials = new Map<string, THREE.Material>();
  
  public createStarMaterial(color: number): THREE.MeshBasicMaterial {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8
    });
    return material;
  }
  
  public createGlowMaterial(color: number): THREE.MeshBasicMaterial {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    return material;
  }
  
  public store(id: string, material: THREE.Material): void {
    this.materials.set(id, material);
  }
  
  public get(id: string): THREE.Material | undefined {
    return this.materials.get(id);
  }
  
  public dispose(): void {
    this.materials.forEach(material => material.dispose());
    this.materials.clear();
  }
}