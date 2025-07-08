// Environment entity for scene objects and atmospheric elements

import * as THREE from 'three';

export interface EnvironmentConfig {
  skybox?: string;
  fog?: {
    color: string;
    density: number;
    near?: number;
    far?: number;
  };
  lighting?: {
    ambientColor: string;
    ambientIntensity: number;
    directionalColor: string;
    directionalIntensity: number;
    directionalPosition: THREE.Vector3;
  };
  postProcessing?: {
    bloom?: boolean;
    ssao?: boolean;
    fxaa?: boolean;
  };
}

export class Environment {
  private scene: THREE.Scene;
  private skybox?: THREE.Mesh;
  private ambientLight?: THREE.AmbientLight;
  private directionalLight?: THREE.DirectionalLight;
  private config: EnvironmentConfig;
  
  constructor(scene: THREE.Scene, config: EnvironmentConfig = {}) {
    this.scene = scene;
    this.config = config;
  }
  
  public async initialize(): Promise<void> {
    console.log('🌍 Initializing Environment...');
    
    // Set up fog
    if (this.config.fog) {
      if (this.config.fog.near !== undefined && this.config.fog.far !== undefined) {
        this.scene.fog = new THREE.Fog(
          this.config.fog.color,
          this.config.fog.near,
          this.config.fog.far
        );
      } else {
        this.scene.fog = new THREE.FogExp2(
          this.config.fog.color,
          this.config.fog.density
        );
      }
    }
    
    // Set up lighting
    await this.setupLighting();
    
    // Set up skybox
    if (this.config.skybox) {
      await this.setupSkybox();
    }
    
    console.log('✅ Environment initialized');
  }
  
  private async setupLighting(): Promise<void> {
    const lightingConfig = this.config.lighting || {
      ambientColor: '#404040',
      ambientIntensity: 0.4,
      directionalColor: '#ffffff',
      directionalIntensity: 0.8,
      directionalPosition: new THREE.Vector3(10, 10, 10)
    };
    
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(
      lightingConfig.ambientColor,
      lightingConfig.ambientIntensity
    );
    this.scene.add(this.ambientLight);
    
    // Directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(
      lightingConfig.directionalColor,
      lightingConfig.directionalIntensity
    );
    this.directionalLight.position.copy(lightingConfig.directionalPosition);
    this.directionalLight.castShadow = true;
    
    // Configure shadow properties
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    
    this.scene.add(this.directionalLight);
  }
  
  private async setupSkybox(): Promise<void> {
    try {
      // For now, create a simple gradient skybox
      // In a real implementation, this would load an HDR or cubemap texture
      const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
      const skyMaterial = new THREE.ShaderMaterial({
        uniforms: {
          topColor: { value: new THREE.Color(0x0077ff) },
          bottomColor: { value: new THREE.Color(0x000033) },
          offset: { value: 33 },
          exponent: { value: 0.6 }
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition + offset).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
          }
        `,
        side: THREE.BackSide
      });
      
      this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
      this.scene.add(this.skybox);
      
    } catch (error) {
      console.warn('Failed to setup skybox:', error);
    }
  }
  
  public update(deltaTime: number): void {
    // Update any animated environment elements
    if (this.directionalLight) {
      // Example: slowly rotate the sun
      // this.directionalLight.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), deltaTime * 0.1);
    }
  }
  
  public setFog(color: string, density: number): void {
    if (this.scene.fog) {
      (this.scene.fog as THREE.FogExp2).color.setStyle(color);
      (this.scene.fog as THREE.FogExp2).density = density;
    }
  }
  
  public setAmbientLight(color: string, intensity: number): void {
    if (this.ambientLight) {
      this.ambientLight.color.setStyle(color);
      this.ambientLight.intensity = intensity;
    }
  }
  
  public setDirectionalLight(color: string, intensity: number, position?: THREE.Vector3): void {
    if (this.directionalLight) {
      this.directionalLight.color.setStyle(color);
      this.directionalLight.intensity = intensity;
      if (position) {
        this.directionalLight.position.copy(position);
      }
    }
  }
  
  public getAmbientLight(): THREE.AmbientLight | undefined {
    return this.ambientLight;
  }
  
  public getDirectionalLight(): THREE.DirectionalLight | undefined {
    return this.directionalLight;
  }
  
  public dispose(): void {
    console.log('🧹 Disposing Environment...');
    
    if (this.skybox) {
      this.scene.remove(this.skybox);
      this.skybox.geometry.dispose();
      if (this.skybox.material instanceof THREE.Material) {
        this.skybox.material.dispose();
      }
    }
    
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
    }
    
    if (this.directionalLight) {
      this.scene.remove(this.directionalLight);
    }
    
    console.log('✅ Environment disposed');
  }
}