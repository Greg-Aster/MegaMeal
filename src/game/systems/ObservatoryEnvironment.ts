import * as THREE from 'three';
import { GameObject } from '../../engine/core/GameObject';
import { AssetLoader } from '../../engine/resources/AssetLoader';

/**
 * Handles the physical environment of the Star Observatory
 * Manages terrain, skybox, and water elements
 */
export class ObservatoryEnvironment extends GameObject {
  private scene: THREE.Scene;
  private levelGroup: THREE.Group;
  private assetLoader: AssetLoader;
  private THREE: any;
  
  // Environment elements
  private skyboxMesh: THREE.Mesh | null = null;
  private groundMesh: THREE.Mesh | null = null;
  private waterfallGroup: THREE.Group | null = null;
  private waterPool: THREE.Mesh | null = null;
  
  // Configuration
  private readonly skyboxImageUrl = '/assets/hdri/skywip4.webp';
  private readonly gridRadius = 940;
  
  constructor(THREE: any, scene: THREE.Scene, levelGroup: THREE.Group, assetLoader: AssetLoader) {
    super();
    this.THREE = THREE;
    this.scene = scene;
    this.levelGroup = levelGroup;
    this.assetLoader = assetLoader;
  }
  
  public async initialize(): Promise<void> {
    this.validateNotDisposed();
    
    if (this.isInitialized) {
      console.warn('ObservatoryEnvironment already initialized');
      return;
    }
    
    try {
      console.log('🌍 Initializing Observatory Environment...');
      
      await this.loadSkybox();
      await this.createGround();
      await this.createWaterfalls();
      await this.createWaterPool();
      
      this.markInitialized();
      console.log('✅ Observatory Environment initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Observatory Environment:', error);
      throw error;
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized || !this.isActive) return;
    
    // Update water animations if needed
    // This can be expanded for animated water effects
  }
  
  private async loadSkybox(): Promise<void> {
    return new Promise((resolve, reject) => {
      const textureLoader = new this.THREE.TextureLoader();
      
      textureLoader.load(
        this.skyboxImageUrl,
        (skyTexture) => {
          // Configure texture for equirectangular mapping
          skyTexture.mapping = this.THREE.EquirectangularReflectionMapping;
          skyTexture.colorSpace = this.THREE.SRGBColorSpace;
          skyTexture.flipY = false;
          
          // Create skybox material
          const skyMaterial = new this.THREE.MeshBasicMaterial({ 
            map: skyTexture, 
            side: this.THREE.BackSide, 
            depthWrite: false,
            toneMapped: false
          });
          
          // Create skybox mesh
          const skyGeometry = new this.THREE.SphereGeometry(1000, 60, 40);
          this.skyboxMesh = new this.THREE.Mesh(skyGeometry, skyMaterial);
          this.skyboxMesh.rotation.x = Math.PI;
          
          // Add to level group
          this.levelGroup.add(this.skyboxMesh);
          
          console.log('✅ Skybox loaded successfully');
          resolve();
        },
        (progress) => {
          console.log('Skybox loading progress:', Math.round((progress.loaded / progress.total) * 100) + '%');
        },
        (error) => {
          console.error('Failed to load skybox texture:', error);
          this.createFallbackSkybox();
          resolve(); // Don't reject, continue with fallback
        }
      );
    });
  }
  
  private createFallbackSkybox(): void {
    console.log('Creating fallback skybox...');
    
    // Create a dark space-like gradient
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create gradient from dark blue to black
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000510');
    gradient.addColorStop(0.5, '#000208');
    gradient.addColorStop(1, '#000000');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Create texture and material
    const fallbackTexture = new this.THREE.CanvasTexture(canvas);
    fallbackTexture.mapping = this.THREE.EquirectangularReflectionMapping;
    
    const skyMaterial = new this.THREE.MeshBasicMaterial({ 
      map: fallbackTexture, 
      side: this.THREE.BackSide, 
      depthWrite: false 
    });
    
    const skyGeometry = new this.THREE.SphereGeometry(100, 60, 40);
    this.skyboxMesh = new this.THREE.Mesh(skyGeometry, skyMaterial);
    
    this.levelGroup.add(this.skyboxMesh);
    console.log('✅ Fallback skybox created');
  }
  
  private async createGround(): Promise<void> {
    console.log('🏔️ Creating floating island terrain...');
    
    // Create detailed terrain geometry
    const groundGeometry = new this.THREE.PlaneGeometry(500, 500, 512, 512);
    const positions = groundGeometry.attributes.position.array;
    
    // Island parameters
    const hillHeight = 15;
    const hillRadius = 100;
    const islandRadius = 220;
    const edgeHeight = 8;
    const edgeFalloff = 30;
    const waterfallStart = islandRadius - 10;
    
    // Generate terrain heights
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      
      let height = 0;
      
      // Central hill
      if (distanceFromCenter < hillRadius) {
        const heightMultiplier = Math.cos((distanceFromCenter / hillRadius) * Math.PI * 0.5);
        height = hillHeight * heightMultiplier * heightMultiplier;
      }
      
      // Rocky edges
      if (distanceFromCenter > islandRadius - edgeFalloff && distanceFromCenter < islandRadius) {
        const edgeProgress = (distanceFromCenter - (islandRadius - edgeFalloff)) / edgeFalloff;
        const rockiness = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 2;
        const edgeHeightMultiplier = Math.cos(edgeProgress * Math.PI * 0.5);
        
        const rockHeight = (edgeHeight + rockiness) * edgeHeightMultiplier;
        height = Math.max(height, rockHeight);
      }
      
      // Waterfall cliffs
      if (distanceFromCenter >= waterfallStart && distanceFromCenter < islandRadius) {
        const waterfallProgress = (distanceFromCenter - waterfallStart) / (islandRadius - waterfallStart);
        height = height * (1 - waterfallProgress * waterfallProgress);
      }
      
      // Void drop-off
      if (distanceFromCenter >= islandRadius) {
        const voidDistance = distanceFromCenter - islandRadius;
        height = -Math.pow(voidDistance * 0.1, 2);
      }
      
      positions[i + 2] = height;
    }
    
    // Add surface detail
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      
      const noise1 = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.3;
      const noise2 = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.1;
      const noise3 = Math.sin(x * 1.0) * Math.cos(z * 1.0) * 0.05;
      
      positions[i + 2] += noise1 + noise2 + noise3;
    }
    
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();
    
    // Create terrain texture
    const groundTexture = this.createTerrainTexture();
    
    // Create ground material
    const groundMaterial = new this.THREE.MeshBasicMaterial({ 
      map: groundTexture,
      color: 0x556633
    });
    
    // Create ground mesh
    this.groundMesh = new this.THREE.Mesh(groundGeometry, groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -5;
    this.groundMesh.receiveShadow = true;
    
    this.levelGroup.add(this.groundMesh);
    console.log('✅ Terrain created');
  }
  
  private createTerrainTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create base gradient
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 280);
    gradient.addColorStop(0, '#3d6017');    // Grass center
    gradient.addColorStop(0.4, '#2d5016');  // Medium green
    gradient.addColorStop(0.7, '#4a3c28');  // Dirt transition
    gradient.addColorStop(0.85, '#5a5a5a'); // Gray rock
    gradient.addColorStop(1, '#2a2a2a');    // Dark rock edges
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add texture details
    this.addGrassTexture(ctx, canvas);
    this.addRockTexture(ctx, canvas);
    this.addWaterfallStreaks(ctx, canvas);
    
    const texture = new this.THREE.CanvasTexture(canvas);
    texture.wrapS = this.THREE.RepeatWrapping;
    texture.wrapT = this.THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    
    return texture;
  }
  
  private addGrassTexture(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const distFromCenter = Math.sqrt((x - 256) ** 2 + (y - 256) ** 2);
      
      if (distFromCenter < 200) {
        const size = Math.random() * 2 + 1;
        const brightness = Math.random() * 0.4 + 0.2;
        ctx.fillStyle = `rgba(${Math.floor(45 + brightness * 30)}, ${Math.floor(90 + brightness * 50)}, ${Math.floor(25 + brightness * 20)}, 0.7)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  private addRockTexture(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const distFromCenter = Math.sqrt((x - 256) ** 2 + (y - 256) ** 2);
      
      if (distFromCenter > 220) {
        const size = Math.random() * 4 + 2;
        const brightness = Math.random() * 0.3 + 0.1;
        ctx.fillStyle = `rgba(${Math.floor(80 + brightness * 40)}, ${Math.floor(80 + brightness * 40)}, ${Math.floor(80 + brightness * 40)}, 0.6)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  private addWaterfallStreaks(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 240 + Math.random() * 40;
      const x = 256 + Math.cos(angle) * radius;
      const y = 256 + Math.sin(angle) * radius;
      
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
      ctx.lineWidth = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x, y + 10);
      ctx.stroke();
    }
  }
  
  private async createWaterfalls(): Promise<void> {
    console.log('💧 Creating waterfalls...');
    
    this.waterfallGroup = new this.THREE.Group();
    
    const islandRadius = 220;
    const waterfallCount = 12;
    
    for (let i = 0; i < waterfallCount; i++) {
      const angle = (i / waterfallCount) * Math.PI * 2;
      const x = Math.cos(angle) * islandRadius;
      const z = Math.sin(angle) * islandRadius;
      
      this.createSingleWaterfall(x, z);
    }
    
    this.levelGroup.add(this.waterfallGroup);
    console.log('✅ Waterfalls created');
  }
  
  private createSingleWaterfall(x: number, z: number): void {
    const waterfallWidth = 15;
    const waterfallHeight = 30;
    
    // Create water geometry
    const waterGeometry = new this.THREE.PlaneGeometry(waterfallWidth, waterfallHeight);
    
    // Create water texture
    const waterTexture = this.createWaterTexture();
    
    // Create water material
    const waterMaterial = new this.THREE.MeshBasicMaterial({
      map: waterTexture,
      transparent: true,
      opacity: 0.7,
      side: this.THREE.DoubleSide,
      blending: this.THREE.AdditiveBlending
    });
    
    // Create water mesh
    const waterMesh = new this.THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.position.set(x, -5 + waterfallHeight / 2, z);
    
    // Orient waterfall
    const angleToCenter = Math.atan2(z, x);
    waterMesh.rotation.y = angleToCenter;
    waterMesh.rotation.x = 0.2;
    
    this.waterfallGroup!.add(waterMesh);
    
    // Add particle effects
    this.createWaterfallParticles(x, z);
  }
  
  private createWaterTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    // Create flowing water gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(150, 200, 255, 0.8)');
    gradient.addColorStop(0.3, 'rgba(100, 150, 255, 0.9)');
    gradient.addColorStop(0.7, 'rgba(50, 100, 200, 0.95)');
    gradient.addColorStop(1, 'rgba(30, 80, 180, 1.0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add flowing streaks
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const startY = Math.random() * canvas.height * 0.3;
      const endY = startY + canvas.height * 0.7;
      
      ctx.strokeStyle = 'rgba(200, 230, 255, 0.6)';
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x + (Math.random() - 0.5) * 10, endY);
      ctx.stroke();
    }
    
    const texture = new this.THREE.CanvasTexture(canvas);
    texture.wrapS = this.THREE.RepeatWrapping;
    texture.wrapT = this.THREE.RepeatWrapping;
    
    return texture;
  }
  
  private createWaterfallParticles(x: number, z: number): void {
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = x + (Math.random() - 0.5) * 10;
      positions[i3 + 1] = Math.random() * 15 - 5;
      positions[i3 + 2] = z + (Math.random() - 0.5) * 10;
    }
    
    const geometry = new this.THREE.BufferGeometry();
    geometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
    
    const material = new this.THREE.PointsMaterial({
      color: 0x87CEEB,
      size: 2,
      transparent: true,
      opacity: 0.6,
      blending: this.THREE.AdditiveBlending
    });
    
    const particles = new this.THREE.Points(geometry, material);
    this.waterfallGroup!.add(particles);
  }
  
  private async createWaterPool(): Promise<void> {
    console.log('🌊 Creating water pool...');
    
    const poolGeometry = new this.THREE.PlaneGeometry(600, 600);
    const poolTexture = this.createPoolTexture();
    
    const poolMaterial = new this.THREE.MeshBasicMaterial({
      map: poolTexture,
      transparent: true,
      opacity: 0.6,
      side: this.THREE.DoubleSide
    });
    
    this.waterPool = new this.THREE.Mesh(poolGeometry, poolMaterial);
    this.waterPool.rotation.x = -Math.PI / 2;
    this.waterPool.position.y = -50;
    
    this.levelGroup.add(this.waterPool);
    console.log('✅ Water pool created');
  }
  
  private createPoolTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const wave = Math.sin(distance * 0.1) * 0.3 + 0.7;
        
        const blue = Math.floor(100 + wave * 100);
        const green = Math.floor(120 + wave * 80);
        
        ctx.fillStyle = `rgba(20, ${green}, ${blue}, 0.8)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    
    const texture = new this.THREE.CanvasTexture(canvas);
    texture.wrapS = this.THREE.RepeatWrapping;
    texture.wrapT = this.THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    return texture;
  }
  
  public getSkybox(): THREE.Mesh | null {
    return this.skyboxMesh;
  }
  
  public getGround(): THREE.Mesh | null {
    return this.groundMesh;
  }
  
  public dispose(): void {
    if (this.isDisposed) return;
    
    console.log('🧹 Disposing Observatory Environment...');
    
    // Dispose skybox
    if (this.skyboxMesh) {
      this.disposeMesh(this.skyboxMesh);
      this.levelGroup.remove(this.skyboxMesh);
      this.skyboxMesh = null;
    }
    
    // Dispose ground
    if (this.groundMesh) {
      this.disposeMesh(this.groundMesh);
      this.levelGroup.remove(this.groundMesh);
      this.groundMesh = null;
    }
    
    // Dispose waterfalls
    if (this.waterfallGroup) {
      this.waterfallGroup.traverse((child) => {
        if (child instanceof this.THREE.Mesh) {
          this.disposeMesh(child);
        }
      });
      this.levelGroup.remove(this.waterfallGroup);
      this.waterfallGroup = null;
    }
    
    // Dispose water pool
    if (this.waterPool) {
      this.disposeMesh(this.waterPool);
      this.levelGroup.remove(this.waterPool);
      this.waterPool = null;
    }
    
    this.markDisposed();
    console.log('✅ Observatory Environment disposed');
  }
  
  private disposeMesh(mesh: THREE.Mesh): void {
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(material => this.disposeMaterial(material));
      } else {
        this.disposeMaterial(mesh.material);
      }
    }
  }
  
  private disposeMaterial(material: THREE.Material): void {
    const materialWithTextures = material as any;
    Object.keys(materialWithTextures).forEach(key => {
      const value = materialWithTextures[key];
      if (value && value.isTexture) {
        value.dispose();
      }
    });
    material.dispose();
  }
}