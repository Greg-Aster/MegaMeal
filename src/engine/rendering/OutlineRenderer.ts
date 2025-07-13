// Global outline rendering system for toon shading
import * as THREE from 'three';

export interface OutlineConfig {
  enabled: boolean;
  thickness: number;
  color: number;
  pulsate: boolean;
  pulsateSpeed: number;
}

/**
 * Global outline renderer for creating cartoon-style black outlines
 * Uses the scaled geometry technique for reliable cross-platform performance
 */
export class OutlineRenderer {
  private scene: THREE.Scene;
  private outlineGroup: THREE.Group;
  private outlineMap = new Map<THREE.Mesh, THREE.Mesh>();
  private config: OutlineConfig;
  
  // Default outline configuration
  private static readonly DEFAULT_CONFIG: OutlineConfig = {
    enabled: true,
    thickness: 0.02,
    color: 0x000000,
    pulsate: false,
    pulsateSpeed: 2.0
  };
  
  constructor(scene: THREE.Scene, config?: Partial<OutlineConfig>) {
    this.scene = scene;
    this.config = { ...OutlineRenderer.DEFAULT_CONFIG, ...config };
    
    // Create outline group for organization
    this.outlineGroup = new THREE.Group();
    this.outlineGroup.name = 'outline_group';
    this.scene.add(this.outlineGroup);
  }
  
  /**
   * Add outline to a mesh automatically
   */
  public addOutlineToMesh(mesh: THREE.Mesh): void {
    if (!this.config.enabled) return;
    if (this.outlineMap.has(mesh)) return; // Already has outline
    
    // Don't outline certain objects
    if (this.shouldSkipOutline(mesh)) return;
    
    const outlineMesh = this.createOutlineMesh(mesh);
    if (outlineMesh) {
      this.outlineMap.set(mesh, outlineMesh);
      this.outlineGroup.add(outlineMesh);
    }
  }
  
  /**
   * Remove outline from a mesh
   */
  public removeOutlineFromMesh(mesh: THREE.Mesh): void {
    const outlineMesh = this.outlineMap.get(mesh);
    if (outlineMesh) {
      this.outlineGroup.remove(outlineMesh);
      outlineMesh.geometry.dispose();
      if (outlineMesh.material instanceof THREE.Material) {
        outlineMesh.material.dispose();
      }
      this.outlineMap.delete(mesh);
    }
  }
  
  /**
   * Automatically scan scene and add outlines to appropriate meshes
   */
  public scanAndOutlineScene(): void {
    if (!this.config.enabled) return;
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.parent !== this.outlineGroup) {
        this.addOutlineToMesh(object);
      }
    });
  }
  
  /**
   * Update outline positions and animations
   */
  public update(deltaTime: number): void {
    if (!this.config.enabled) return;
    
    const time = Date.now() * 0.001;
    
    this.outlineMap.forEach((outlineMesh, originalMesh) => {
      // Update outline position to match original mesh
      outlineMesh.position.copy(originalMesh.position);
      outlineMesh.rotation.copy(originalMesh.rotation);
      outlineMesh.scale.copy(originalMesh.scale);
      
      // Apply pulsating effect if enabled
      if (this.config.pulsate && outlineMesh.material instanceof THREE.MeshBasicMaterial) {
        const pulseFactor = (Math.sin(time * this.config.pulsateSpeed) + 1) * 0.5;
        const thickness = this.config.thickness * (0.8 + pulseFactor * 0.4);
        
        // Update outline scale
        const scaleMultiplier = 1 + thickness;
        outlineMesh.scale.multiplyScalar(scaleMultiplier);
      }
      
      // Update visibility based on original mesh
      outlineMesh.visible = originalMesh.visible;
    });
  }
  
  /**
   * Create outline mesh using scaled geometry technique
   */
  private createOutlineMesh(originalMesh: THREE.Mesh): THREE.Mesh | null {
    try {
      // Clone the geometry
      const outlineGeometry = originalMesh.geometry.clone();
      
      // Create black outline material
      const outlineMaterial = new THREE.MeshBasicMaterial({
        color: this.config.color,
        side: THREE.BackSide, // Show only back faces
        depthTest: true,
        depthWrite: false, // Don't write to depth buffer to avoid z-fighting
        transparent: true,
        opacity: 0.8
      });
      
      // Create outline mesh
      const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
      
      // Scale slightly larger for outline effect
      const scaleMultiplier = 1 + this.config.thickness;
      outlineMesh.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
      
      // Copy transform from original
      outlineMesh.position.copy(originalMesh.position);
      outlineMesh.rotation.copy(originalMesh.rotation);
      outlineMesh.name = originalMesh.name + '_outline';
      
      return outlineMesh;
      
    } catch (error) {
      console.warn('Failed to create outline for mesh:', originalMesh.name, error);
      return null;
    }
  }
  
  /**
   * Determine if a mesh should be skipped for outlining
   */
  private shouldSkipOutline(mesh: THREE.Mesh): boolean {
    const name = mesh.name.toLowerCase();
    
    // Skip certain object types that don't need outlines
    if (name.includes('skybox') || 
        name.includes('sky') ||
        name.includes('water') ||
        name.includes('ocean') ||
        name.includes('particle') ||
        name.includes('effect') ||
        name.includes('glow') ||
        name.includes('outline') ||
        name.includes('helper')) {
      return true;
    }
    
    // Skip transparent objects
    if (mesh.material instanceof THREE.Material && 
        mesh.material.transparent && 
        mesh.material.opacity < 0.9) {
      return true;
    }
    
    // Skip very small objects (fireflies, etc.)
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    if (maxDimension < 0.1) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Update outline configuration
   */
  public updateConfig(newConfig: Partial<OutlineConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...newConfig };
    
    // If outlines were disabled, remove all outlines
    if (wasEnabled && !this.config.enabled) {
      this.clearAllOutlines();
    }
    // If outlines were enabled, scan scene
    else if (!wasEnabled && this.config.enabled) {
      this.scanAndOutlineScene();
    }
  }
  
  /**
   * Clear all outlines
   */
  public clearAllOutlines(): void {
    this.outlineMap.forEach((outlineMesh) => {
      this.outlineGroup.remove(outlineMesh);
      outlineMesh.geometry.dispose();
      if (outlineMesh.material instanceof THREE.Material) {
        outlineMesh.material.dispose();
      }
    });
    this.outlineMap.clear();
  }
  
  /**
   * Get outline configuration
   */
  public getConfig(): OutlineConfig {
    return { ...this.config };
  }
  
  /**
   * Dispose of the outline renderer
   */
  public dispose(): void {
    this.clearAllOutlines();
    this.scene.remove(this.outlineGroup);
  }
}