// Material library system with PBR support

import * as THREE from 'three';
import { AssetLoader } from '../resources/AssetLoader';

export interface PBRMaterialOptions {
  color?: number;
  metalness?: number;
  roughness?: number;
  map?: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
  envMap?: THREE.CubeTexture | THREE.Texture;
  envMapIntensity?: number;
  emissive?: number;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  displacementMap?: THREE.Texture;
  displacementScale?: number;
}

export class Materials {
  private materials = new Map<string, THREE.Material>();
  private environmentMap: THREE.CubeTexture | THREE.Texture | null = null;
  private THREE: any;

  constructor(THREE: any) {
    this.THREE = THREE;
  }
  
  public createStarMaterial(color: number): THREE.MeshBasicMaterial {
    // Keep stars as basic material for performance (they're sprites)
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8
    });
    return material;
  }
  
  public createGlowMaterial(color: number): THREE.MeshBasicMaterial {
    // Keep glow as basic material for additive blending
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    return material;
  }
  
  // Set environment map for all PBR materials
  public setEnvironmentMap(envMap: THREE.CubeTexture | THREE.Texture): void {
    this.environmentMap = envMap;
  }
  
  // Create PBR material with physically-based properties
  public createPBRMaterial(options: PBRMaterialOptions = {}): THREE.MeshStandardMaterial {
    const isVectorMode = (window as any).MEGAMEAL_VECTOR_MODE === true;

    if (isVectorMode) {
      // Return a ToonMaterial for the stylized vector graphic look
      return new this.THREE.MeshToonMaterial({
        color: options.color || 0x808080,
        emissive: options.emissive || 0x000000,
        emissiveIntensity: options.emissiveIntensity || 1.0,
        map: (options as any).map, // Pass through texture map if it exists
        normalMap: options.normalMap,
        side: options.side || THREE.FrontSide,
      });
    } else {
      // Return a standard PBR material for a realistic look
      const material = new this.THREE.MeshStandardMaterial({
        color: options.color || 0xffffff,
        metalness: options.metalness || 0.1,
        roughness: options.roughness || 0.8,
        map: options.map,
        normalMap: options.normalMap,
        roughnessMap: options.roughnessMap,
        metalnessMap: options.metalnessMap,
        envMap: options.envMap || this.environmentMap,
        envMapIntensity: options.envMapIntensity || 1.0,
        emissive: options.emissive || 0x000000,
        emissiveIntensity: options.emissiveIntensity || 0.0,
        transparent: options.transparent || false,
        opacity: options.opacity || 1.0,
        side: options.side || THREE.FrontSide,
        displacementMap: options.displacementMap,
        displacementScale: options.displacementScale || 1.0
      });
      
      return material;
    }
  }
  
  // Preset PBR materials for common use cases
  public createGroundMaterial(): THREE.MeshStandardMaterial {
    return this.createPBRMaterial({
      color: 0x2a2a2a,
      metalness: 0.1,
      roughness: 0.9,
      envMapIntensity: 0.5
    });
  }
  
  public createMetalMaterial(color: number = 0x888888): THREE.MeshStandardMaterial {
    return this.createPBRMaterial({
      color,
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.0
    });
  }
  
  public createPlasticMaterial(color: number = 0xffffff): THREE.MeshStandardMaterial {
    return this.createPBRMaterial({
      color,
      metalness: 0.0,
      roughness: 0.3,
      envMapIntensity: 0.8
    });
  }
  
  public createFabricMaterial(color: number = 0x444444): THREE.MeshStandardMaterial {
    return this.createPBRMaterial({
      color,
      metalness: 0.0,
      roughness: 0.8,
      envMapIntensity: 0.3
    });
  }
  
  public createGlassMaterial(color: number = 0xffffff): THREE.MeshStandardMaterial {
    return this.createPBRMaterial({
      color,
      metalness: 0.0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8,
      envMapIntensity: 1.0
    });
  }
  
  public createEmissiveMaterial(color: number, emissiveColor: number, intensity: number = 1.0): THREE.MeshStandardMaterial {
    return this.createPBRMaterial({
      color,
      emissive: emissiveColor,
      emissiveIntensity: intensity,
      metalness: 0.0,
      roughness: 0.5
    });
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
    this.environmentMap = null;
  }
}