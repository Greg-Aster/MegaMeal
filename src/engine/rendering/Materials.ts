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
  private toonGradientTexture: THREE.DataTexture | null = null;
  private THREE: any;

  constructor(THREE: any) {
    this.THREE = THREE;
    this.createToonGradientTexture();
  }
  
  /**
   * Create custom toon gradient texture for better cell shading
   */
  private createToonGradientTexture(): void {
    // Create a small texture for toon shading gradient
    const size = 16;
    const data = new Uint8Array(size * size * 4);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const index = (i * size + j) * 4;
        
        // Create stepped gradient for bold toon shading - brighter for better visibility
        const intensity = i / (size - 1);
        let stepped;
        
        if (intensity < 0.1) {
          stepped = 0.7; // Much brighter shadow
        } else if (intensity < 0.4) {
          stepped = 0.85; // Much brighter mid shadow  
        } else if (intensity < 0.7) {
          stepped = 0.95; // Very bright mid tone
        } else {
          stepped = 1.0; // Full highlight
        }
        
        const value = Math.floor(stepped * 255);
        data[index] = value;     // R
        data[index + 1] = value; // G  
        data[index + 2] = value; // B
        data[index + 3] = 255;   // A
      }
    }
    
    this.toonGradientTexture = new this.THREE.DataTexture(data, size, size, this.THREE.RGBAFormat);
    this.toonGradientTexture.needsUpdate = true;
    this.toonGradientTexture.magFilter = this.THREE.NearestFilter;
    this.toonGradientTexture.minFilter = this.THREE.NearestFilter;
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
      const toonMaterial = new this.THREE.MeshToonMaterial({
        color: options.color || 0x808080,
        emissive: options.emissive || 0x000000,
        emissiveIntensity: options.emissiveIntensity || 1.0,
        map: (options as any).map, // Pass through texture map if it exists
        normalMap: options.normalMap,
        side: options.side || THREE.FrontSide,
        gradientMap: this.toonGradientTexture, // Use custom toon gradient
      });
      
      return toonMaterial;
    } else {
      // Return a standard PBR material for a realistic look - only set defined properties
      const materialConfig: any = {
        color: options.color || 0xffffff,
        metalness: options.metalness || 0.1,
        roughness: options.roughness || 0.8,
        envMap: options.envMap || this.environmentMap,
        envMapIntensity: options.envMapIntensity || 1.0,
        emissive: options.emissive || 0x000000,
        emissiveIntensity: options.emissiveIntensity || 0.0,
        transparent: options.transparent || false,
        opacity: options.opacity || 1.0,
        side: options.side || THREE.FrontSide,
        displacementScale: options.displacementScale || 1.0
      };
      
      // Only add optional maps if they're actually defined
      if (options.map) materialConfig.map = options.map;
      if (options.normalMap) materialConfig.normalMap = options.normalMap;
      if (options.roughnessMap) materialConfig.roughnessMap = options.roughnessMap;
      if (options.metalnessMap) materialConfig.metalnessMap = options.metalnessMap;
      if (options.displacementMap) materialConfig.displacementMap = options.displacementMap;
      
      const material = new this.THREE.MeshStandardMaterial(materialConfig);
      
      return material;
    }
  }
  
  // Preset PBR materials for common use cases
  public createGroundMaterial(): THREE.MeshStandardMaterial {
    const isVectorMode = (window as any).MEGAMEAL_VECTOR_MODE === true;
    
    if (isVectorMode) {
      // Vibrant cartoon colors for toon mode
      return this.createPBRMaterial({
        color: 0x88bb44, // Bright cartoon green
        metalness: 0.0,
        roughness: 0.9,
        emissive: 0x334411, // Bright emissive glow
        emissiveIntensity: 0.4,
        envMapIntensity: 0.2
      });
    } else {
      return this.createPBRMaterial({
        color: 0x2a2a2a,
        metalness: 0.1,
        roughness: 0.9,
        envMapIntensity: 0.5
      });
    }
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
    
    // Dispose toon gradient texture
    if (this.toonGradientTexture) {
      this.toonGradientTexture.dispose();
      this.toonGradientTexture = null;
    }
  }
}