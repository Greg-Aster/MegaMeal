// Ship Props System Component
// Handles placement and rendering of ship interior props and decorative objects

import * as THREE from 'three';

export interface PropsConfig {
  props?: Array<{
    model: string;
    positions: Array<[number, number, number]>;
    rotation?: 'random' | [number, number, number];
    attach_to?: 'floor' | 'ceiling' | 'wall';
    lighting?: boolean;
  }>;
}

export class ShipPropsSystem {
  private props: THREE.Object3D[] = [];
  
  constructor(
    private THREE: any,
    private scene: any,
    private levelGroup: any,
    private assetLoader: any
  ) {}
  
  async initialize(config: PropsConfig): Promise<void> {
    console.log('📦 Creating ship props system...', config);
    
    if (config.props) {
      for (const propConfig of config.props) {
        for (const position of propConfig.positions) {
          const prop = this.createProp(propConfig.model, position, propConfig);
          if (prop) {
            this.levelGroup.add(prop);
            this.props.push(prop);
          }
        }
      }
    }
  }
  
  private createProp(modelType: string, position: [number, number, number], config: any): THREE.Object3D | null {
    let propMesh: THREE.Object3D;
    
    switch (modelType) {
      case 'Prop_Crate3':
        const crateGeometry = new this.THREE.BoxGeometry(1, 1, 1);
        const crateMaterial = new this.THREE.MeshStandardMaterial({ 
          color: 0x8B4513,
          roughness: 0.8,
          metalness: 0.1
        });
        propMesh = new this.THREE.Mesh(crateGeometry, crateMaterial);
        break;
        
      case 'Prop_Barrel_Large':
        const barrelGeometry = new this.THREE.CylinderGeometry(0.5, 0.5, 1.2, 12);
        const barrelMaterial = new this.THREE.MeshStandardMaterial({ 
          color: 0x444444,
          roughness: 0.7,
          metalness: 0.3
        });
        propMesh = new this.THREE.Mesh(barrelGeometry, barrelMaterial);
        break;
        
      case 'Prop_Cable_3':
        const cableGeometry = new this.THREE.CylinderGeometry(0.05, 0.05, 3, 8);
        const cableMaterial = new this.THREE.MeshStandardMaterial({ 
          color: 0x222222,
          roughness: 0.9,
          metalness: 0.1
        });
        propMesh = new this.THREE.Mesh(cableGeometry, cableMaterial);
        if (config.attach_to === 'ceiling') {
          propMesh.rotation.x = Math.PI / 2;
        }
        break;
        
      case 'Prop_Light_Corner':
        const lightGeometry = new this.THREE.BoxGeometry(0.3, 0.3, 0.3);
        const lightMaterial = new this.THREE.MeshStandardMaterial({ 
          color: 0xffffff,
          emissive: 0x444444
        });
        propMesh = new this.THREE.Mesh(lightGeometry, lightMaterial);
        
        if (config.lighting) {
          const light = new this.THREE.PointLight(0xffffff, 0.5, 10);
          light.position.set(...position);
          this.levelGroup.add(light);
        }
        break;
        
      case 'Prop_Vent_Big':
        const ventGeometry = new this.THREE.BoxGeometry(1.5, 0.2, 1.5);
        const ventMaterial = new this.THREE.MeshStandardMaterial({ 
          color: 0x666666,
          roughness: 0.5,
          metalness: 0.8
        });
        propMesh = new this.THREE.Mesh(ventGeometry, ventMaterial);
        break;
        
      default:
        console.warn(`Unknown prop model: ${modelType}`);
        const defaultGeometry = new this.THREE.BoxGeometry(0.5, 0.5, 0.5);
        const defaultMaterial = new this.THREE.MeshStandardMaterial({ color: 0x888888 });
        propMesh = new this.THREE.Mesh(defaultGeometry, defaultMaterial);
    }
    
    if (propMesh) {
      propMesh.position.set(...position);
      
      if (config.rotation === 'random') {
        propMesh.rotation.y = Math.random() * Math.PI * 2;
      } else if (Array.isArray(config.rotation)) {
        propMesh.rotation.set(...config.rotation);
      }
      
      if (propMesh instanceof this.THREE.Mesh) {
        propMesh.castShadow = true;
        propMesh.receiveShadow = true;
      }
    }
    
    return propMesh;
  }
  
  update(_deltaTime: number): void {
    // Update prop animations if needed
  }
  
  dispose(): void {
    this.props.forEach(prop => {
      this.levelGroup.remove(prop);
    });
    this.props = [];
  }
}