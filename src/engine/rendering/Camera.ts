// Camera management system

import * as THREE from 'three';

export class Camera {
  private camera: THREE.PerspectiveCamera;
  
  constructor(fov = 60, aspect = 1, near = 0.1, far = 2000) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(0, 10, 50);
  }
  
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  public updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
  
  public setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
  }
}