import * as THREE from 'three';
import { GameObject } from '../../engine/core/GameObject';
import { Engine } from '../../engine/core/Engine';
import { AssetLoader } from '../../engine/resources/AssetLoader';

/**
 * Handles the physical environment of the Star Observatory
 * Manages terrain, skybox, and water elements
 */
export class ObservatoryEnvironment extends GameObject {
  private scene: THREE.Scene;
  private engine: Engine;
  private levelGroup: THREE.Group;
  private assetLoader: AssetLoader;
  private THREE: any;
  
  // Environment elements
  private skyboxMesh: THREE.Mesh | null = null;
  private groundMesh: THREE.Mesh | null = null;
  private waterfallGroup: THREE.Group | null = null;
  private waterPool: THREE.Mesh | null = null;
  
  // Natural environment elements
  private vegetationGroup: THREE.Group | null = null;
  private treesGroup: THREE.Group | null = null;
  private firefliesGroup: THREE.Group | null = null;
  
  // Lighting elements
  private lightingGroup: THREE.Group | null = null;
  private mainLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  
  // Terrain data
  private calculatedSpawnPoint: THREE.Vector3 | null = null;
  private globalIntensityMultiplier = 100.0;
  private globalFireflySpeed = .5;
  private fireflyAnimationTime = 0;
  
  // Terrain parameters for height calculation
  private readonly terrainParams = {
    hillHeight: 15,
    hillRadius: 100,
    islandRadius: 220,
    edgeHeight: 8,
    edgeFalloff: 30,
    waterfallStart: 210, // islandRadius - 10
    baseGroundLevel: -5
  };
  
  // Configuration
  private readonly skyboxImageUrl = '/assets/hdri/skywip4.webp';
  private readonly gridRadius = 940;
  
  constructor(THREE: any, engine: Engine, levelGroup: THREE.Group, assetLoader: AssetLoader) {
    super();
    this.THREE = THREE;
    this.engine = engine;
    this.scene = engine.getScene();
    this.levelGroup = levelGroup;
    this.assetLoader = assetLoader;
  }
  
  public async initialize(config?: any): Promise<void> {
    this.validateNotDisposed();
    
    if (this.isInitialized) {
      console.warn('ObservatoryEnvironment already initialized');
      return;
    }
    
    try {
      console.log('🌍 Initializing Observatory Environment...');
      
      await this.loadSkybox();
      await this.createLighting();
      await this.createGround();
      await this.createWaterPool();
      
      // Add natural environment (field with hill - no trees)
      await this.createVegetation();
      await this.createGlowingFireflies();
      
      // Calculate and set proper spawn point based on terrain
      this.calculateSpawnPoint();
      
      this.markInitialized();
      console.log('✅ Observatory Environment initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Observatory Environment:', error);
      throw error;
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized || !this.isActive) return;
    
    // Accumulate time for animations, adjusted by speed
    this.fireflyAnimationTime += deltaTime * this.globalFireflySpeed;
    
    // Update firefly animations
    this.updateFireflies(this.fireflyAnimationTime);
    
    // Update water animations if needed
    // This can be expanded for animated water effects
  }
  
  /**
   * Update firefly animations with realistic movement and fading.
   * @param time The accumulated animation time.
   */
  private updateFireflies(time: number): void {
    if (!this.firefliesGroup) return;
    
    this.firefliesGroup.children.forEach((fireflyGroup: any) => {
      const userData = fireflyGroup.userData;
      if (!userData) return;
      
      // Realistic wandering movement
      const wanderX = Math.sin(time * userData.baseSpeed + userData.phase) * userData.wanderRange;
      const wanderZ = Math.cos(time * userData.baseSpeed + userData.phase * 1.3) * userData.wanderRange;
      
      // Floating up and down
      const floatY = Math.sin(time * userData.floatSpeed + userData.phase * 2) * userData.floatRange;
      
      // Apply smooth wandering direction changes to prevent jumping
      const directionChangeSpeed = 0.02; // Very slow direction changes
      if (Math.random() < directionChangeSpeed) {
        userData.wanderDirection.x += (Math.random() - 0.5) * 0.1;
        userData.wanderDirection.z += (Math.random() - 0.5) * 0.1;
        
        // Clamp to prevent excessive wandering
        userData.wanderDirection.x = Math.max(-1, Math.min(1, userData.wanderDirection.x));
        userData.wanderDirection.z = Math.max(-1, Math.min(1, userData.wanderDirection.z));
      }
      
      // Calculate new position with natural movement
      const newX = userData.originalX + wanderX + userData.wanderDirection.x;
      const newZ = userData.originalZ + wanderZ + userData.wanderDirection.z;
      
      // Get the current terrain height at the new position to follow the surface
      const currentGroundHeight = this.getHeightAt(newX, newZ);
      const newY = currentGroundHeight + 0.5 + floatY; // Stay close to terrain surface
      
      // Update position with terrain-following movement
      fireflyGroup.position.set(newX, newY, newZ);
      
      // Fade in and out like real fireflies
      const fadeIntensity = Math.sin(time * userData.fadeSpeed + userData.fadePhase);
      const fadeValue = Math.max(0.1, (fadeIntensity + 1) * 0.5); // Keep some minimum visibility
      
      // Update firefly mesh opacity
      const firefly = fireflyGroup.children[0]; // First child is the main mesh
      if (firefly && firefly.material) {
        firefly.material.opacity = fadeValue * 0.9;
      }
      
      // Update light intensity with more dramatic fading
      const light = fireflyGroup.children[1]; // Second child is the light
      if (light && light.isLight) {
        light.intensity = fadeValue * userData.maxIntensity * this.globalIntensityMultiplier;
      }
      
      // Update glow opacity
      const glow = fireflyGroup.children[2]; // Third child is glow
      if (glow && glow.material) {
        glow.material.opacity = fadeValue * 0.4;
      }
      
      // Add subtle scale pulsing for breathing effect - with proper null checks
      const pulseScale = 1 + Math.sin(time * userData.fadeSpeed * 3 + userData.fadePhase) * 0.2;
      if (firefly && firefly.scale) {
        firefly.scale.setScalar(pulseScale);
      }
      if (glow && glow.scale) {
        glow.scale.setScalar(pulseScale);
      }
    });
  }

  /**
   * Sets a global multiplier for the intensity of all firefly lights.
   * @param intensity The desired intensity multiplier (e.g., 1.0 for normal, 0.5 for half).
   */
  public setFireflyIntensity(intensity: number): void {
    this.globalIntensityMultiplier = Math.max(0, intensity);
  }

  /**
   * Sets a global multiplier for the animation speed of all fireflies.
   * @param speed The desired speed multiplier (e.g., 1.0 for normal, 2.0 for double speed).
   */
  public setFireflySpeed(speed: number): void {
    this.globalFireflySpeed = Math.max(0, speed);
  }

  /**
   * Sets the color and intensity of the ambient light in the scene.
   * @param color The color of the ambient light (e.g., 0x404040).
   * @param intensity The numeric intensity of the light (e.g., 0.1).
   */
  public setAmbientLight(color: number, intensity: number): void {
    if (this.ambientLight) {
      this.ambientLight.color.set(color);
      this.ambientLight.intensity = intensity;
    }
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

  private async createLighting(): Promise<void> {
    console.log('💡 Creating Observatory lighting...');
    
    this.lightingGroup = new this.THREE.Group();
    
    // Dim moonlight - fireflies will be the main light source
    this.mainLight = new this.THREE.DirectionalLight(0x8bb3ff, 0.15);
    this.mainLight.position.set(100, 200, 50);
    this.mainLight.target.position.set(0, 0, 0);
    this.mainLight.castShadow = true;
    
    // Configure shadow properties for better quality
    this.mainLight.shadow.mapSize.width = 2048;
    this.mainLight.shadow.mapSize.height = 2048;
    this.mainLight.shadow.camera.near = 0.5;
    this.mainLight.shadow.camera.far = 500;
    this.mainLight.shadow.camera.left = -300;
    this.mainLight.shadow.camera.right = 300;
    this.mainLight.shadow.camera.top = 300;
    this.mainLight.shadow.camera.bottom = -300;
    
    this.lightingGroup.add(this.mainLight);
    this.lightingGroup.add(this.mainLight.target);
    
    // Very dim fill light - fireflies will provide most illumination
    this.fillLight = new this.THREE.DirectionalLight(0x6a7db3, 1.0);
    this.fillLight.position.set(-50, 100, -30);
    this.fillLight.target.position.set(0, 0, 0);
    this.lightingGroup.add(this.fillLight);
    this.lightingGroup.add(this.fillLight.target);
    
    // Minimal ambient lighting - let fireflies be the stars
    this.ambientLight = new this.THREE.AmbientLight(0x202040, 20);
    this.lightingGroup.add(this.ambientLight);
    
    this.levelGroup.add(this.lightingGroup);
    console.log('✅ Observatory lighting created');
  }
  
  private async createGround(): Promise<void> {
    console.log('🏔️ Creating floating island terrain...');
    
    // Create detailed terrain geometry
    const groundGeometry = new this.THREE.PlaneGeometry(500, 500, 512, 512);
    const positions = groundGeometry.attributes.position.array;
    
    // Use shared terrain parameters for consistency with getHeightAt
    const { hillHeight, hillRadius, islandRadius, edgeHeight, edgeFalloff, waterfallStart, baseGroundLevel } = this.terrainParams;
    
    // Generate terrain heights
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      
      let height = 0;
      
      // Central hill
      if (distanceFromCenter < hillRadius) {
        const heightMultiplier = Math.cos((distanceFromCenter / hillRadius) * Math.PI * 0.5);
        height = baseGroundLevel + (hillHeight * heightMultiplier * heightMultiplier);
      } else {
        height = baseGroundLevel;
      }
      
      // Void drop-off
      if (distanceFromCenter >= islandRadius) {
        const voidDistance = distanceFromCenter - islandRadius;
        height = baseGroundLevel - Math.pow(voidDistance * 0.1, 2);
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
    
    // Create ground material that responds to lighting
    // Use the new global material factory to get the correct style
    const groundMaterial = this.engine.getMaterials().createPBRMaterial({ 
      map: groundTexture,
      color: 0x556633
    }) as THREE.Material;
    
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
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 250); // Slightly smaller radius for a wider beach
    gradient.addColorStop(0, '#3d6017');    // Grass center
    gradient.addColorStop(0.4, '#2d5016');  // Medium green
    gradient.addColorStop(0.7, '#c2b280');  // Sandy beach color
    gradient.addColorStop(0.85, '#a19060'); // Darker sand
    gradient.addColorStop(1, '#8b7355');    // Wet sand at the edge
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add texture details
    this.addGrassTexture(ctx, canvas);
    this.addSandTexture(ctx, canvas);
    
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
  
  private addSandTexture(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const distFromCenter = Math.sqrt((x - 256) ** 2 + (y - 256) ** 2);
      
      // Draw sand texture in the outer ring of the island
      if (distFromCenter > 180 && distFromCenter < 250) {
        const size = Math.random() * 2 + 1;
        const brightness = Math.random() * 0.3 + 0.1;
        ctx.fillStyle = `rgba(${Math.floor(180 + brightness * 20)}, ${Math.floor(160 + brightness * 20)}, ${Math.floor(120 + brightness * 20)}, 0.7)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
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
    
    // Make the water plane significantly larger to create an ocean effect
    const poolGeometry = new this.THREE.PlaneGeometry(10000, 10000);
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
  
  /**
   * Universal terrain height calculation - matches terrain generation logic
   * This enables universal ground collision for any position
   */
  public getHeightAt(x: number, z: number): number {
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    let height = this.terrainParams.baseGroundLevel;
    
    // Central hill calculation
    if (distanceFromCenter < this.terrainParams.hillRadius) {
      const heightMultiplier = Math.cos((distanceFromCenter / this.terrainParams.hillRadius) * Math.PI * 0.5);
      height = this.terrainParams.baseGroundLevel + (this.terrainParams.hillHeight * heightMultiplier * heightMultiplier);
    }
    
    // Void drop-off calculation
    if (distanceFromCenter >= this.terrainParams.islandRadius) {
      const voidDistance = distanceFromCenter - this.terrainParams.islandRadius;
      height = this.terrainParams.baseGroundLevel - Math.pow(voidDistance * 0.1, 2);
    }
    
    // Add surface detail noise (matching terrain generation)
    const noise1 = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.3;
    const noise2 = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.1;
    const noise3 = Math.sin(x * 1.0) * Math.cos(z * 1.0) * 0.05;
    
    return height + noise1 + noise2 + noise3;
  }
  
  /**
   * Calculate proper spawn point above terrain
   */
  private calculateSpawnPoint(): void {
    // Get spawn point from config (default to center of island)
    const spawnX = 0;
    const spawnZ = 50;
    
    // Calculate terrain height at spawn position
    const terrainHeight = this.getHeightAt(spawnX, spawnZ);
    
    // Set spawn point above terrain with player eye height
    const spawnY = terrainHeight + 2.0; // 2.0 units above terrain for safe spawning
    
    this.calculatedSpawnPoint = new this.THREE.Vector3(spawnX, spawnY, spawnZ);
    
    console.log(`🎯 Calculated spawn point: (${spawnX}, ${spawnY.toFixed(2)}, ${spawnZ}) - terrain height: ${terrainHeight.toFixed(2)}`);
  }
  
  /**
   * Get the calculated spawn point
   */
  public getSpawnPoint(): THREE.Vector3 | null {
    return this.calculatedSpawnPoint;
  }
  
  /**
   * Create natural vegetation around the island
   */
  private async createVegetation(): Promise<void> {
    console.log('🌱 Creating natural vegetation...');
    
    this.vegetationGroup = new this.THREE.Group();
    
    // Grass patches on the main hill area (reduced for better performance)
    await this.createGrassPatches();
    
    // Small flower clusters for magical atmosphere (reduced count)
    await this.createFlowerClusters();
    
    this.levelGroup.add(this.vegetationGroup);
    console.log('✅ Vegetation created');
  }
  
  /**
   * Create grass patches on the main hill using efficient instancing
   */
  private async createGrassPatches(): Promise<void> {
    console.log('🌱 Loading grass assets (instancing approach)...');
    
    const grassTypes = ['Grass_Small.gltf', 'Grass_Large.gltf'];
    
    try {
      // Load each grass type once (parallel loading)
      const grassAssets = await Promise.all(
        grassTypes.map(async (grassType, index) => {
          const asset = await this.assetLoader.loadModel(
            `grass_template_${index}`,
            `/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/${grassType}`,
            'gltf'
          );
          
          // Prepare the template by fixing materials once
          asset.scene.traverse((child) => {
            if (child instanceof this.THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material && child.material.map) {
                const newMaterial = new this.THREE.MeshLambertMaterial({
                  map: child.material.map,
                  transparent: child.material.transparent,
                  alphaTest: 0.1
                });
                child.material = newMaterial;
              }
            }
          });
          
          return asset;
        })
      );
      
      console.log(`✅ Loaded ${grassAssets.length} grass templates, creating instances...`);
      
      // Create instances from the loaded templates
      const grassCount = 15;
      for (let i = 0; i < grassCount; i++) {
        // Choose a random grass type
        const templateIndex = Math.floor(Math.random() * grassAssets.length);
        const template = grassAssets[templateIndex];
        
        // Create instance (clone) - much faster than loading
        const grassInstance = template.scene.clone();
        
        // Position on the main hill area
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 80; // Within hill radius
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Get terrain height and position on ground
        const terrainHeight = this.getHeightAt(x, z);
        grassInstance.position.set(x, terrainHeight - 5, z);
        grassInstance.rotation.y = Math.random() * Math.PI * 2;
        grassInstance.scale.setScalar(0.8 + Math.random() * 0.4); // Vary size
        
        this.vegetationGroup!.add(grassInstance);
      }
      
      console.log(`✅ Created ${grassCount} grass instances efficiently`);
      
    } catch (error) {
      console.error('Failed to create grass patches:', error);
    }
  }
  
  /**
   * Create bushes around the island
   */
  private async createBushes(): Promise<void> {
    const bushTypes = [
      'Bush_Small.gltf',
      'Bush.gltf', 
      'Bush_Large.gltf',
      'Bush_Small_Flowers.gltf',
      'Bush_Flowers.gltf'
    ];
    
    for (let i = 0; i < 12; i++) {
      try {
        // Place bushes in the middle ring area
        const angle = Math.random() * Math.PI * 2;
        const radius = 100 + Math.random() * 80; // Between hill and edge
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Get terrain height at this position and place on ground
        const terrainHeight = this.getHeightAt(x, z);
        
        const bushType = bushTypes[Math.floor(Math.random() * bushTypes.length)];
        const bushModel = await this.assetLoader.loadModel(
          `bush_${i}`,
          `/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/${bushType}`,
          'gltf'
        );
        
        // Position on the ground surface with proper offset
        bushModel.scene.position.set(x, terrainHeight - 5, z);
        bushModel.scene.rotation.y = Math.random() * Math.PI * 2;
        bushModel.scene.scale.setScalar(0.6 + Math.random() * 0.8);
        
        // Enable shadows and fix materials
        bushModel.scene.traverse((child) => {
          if (child instanceof this.THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // Fix material to respond to lighting
            if (child.material) {
              if (child.material.map) {
                const newMaterial = new this.THREE.MeshLambertMaterial({
                  map: child.material.map,
                  transparent: child.material.transparent,
                  alphaTest: 0.1
                });
                child.material = newMaterial;
              }
            }
          }
        });
        
        this.vegetationGroup!.add(bushModel.scene);
      } catch (error) {
        console.warn(`Failed to load bush ${i}:`, error);
      }
    }
  }
  
  /**
   * Create magical flower clusters using efficient instancing
   */
  private async createFlowerClusters(): Promise<void> {
    console.log('🌸 Loading flower assets (instancing approach)...');
    
    const flowerTypes = [
      'Flower_1_Clump.gltf',
      'Flower_2_Clump.gltf',
      'Flower_3_Clump.gltf',
      'Flower_4_Clump.gltf',
      'Flower_5_Clump.gltf'
    ];
    
    try {
      // Load each flower type once (parallel loading)
      const flowerAssets = await Promise.all(
        flowerTypes.map(async (flowerType, index) => {
          const asset = await this.assetLoader.loadModel(
            `flower_template_${index}`,
            `/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/${flowerType}`,
            'gltf'
          );
          
          // Prepare the template by fixing materials once
          asset.scene.traverse((child) => {
            if (child instanceof this.THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material && child.material.map) {
                const newMaterial = new this.THREE.MeshLambertMaterial({
                  map: child.material.map,
                  transparent: child.material.transparent,
                  alphaTest: 0.1
                });
                child.material = newMaterial;
              }
            }
          });
          
          return asset;
        })
      );
      
      console.log(`✅ Loaded ${flowerAssets.length} flower templates, creating instances...`);
      
      // Create instances from the loaded templates
      const flowerCount = 10;
      for (let i = 0; i < flowerCount; i++) {
        // Choose a random flower type
        const templateIndex = Math.floor(Math.random() * flowerAssets.length);
        const template = flowerAssets[templateIndex];
        
        // Create instance (clone) - much faster than loading
        const flowerInstance = template.scene.clone();
        
        // Place flowers in scattered locations
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 150; // Across most of the island
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Get terrain height and position on ground
        const terrainHeight = this.getHeightAt(x, z);
        flowerInstance.position.set(x, terrainHeight - 5, z);
        flowerInstance.rotation.y = Math.random() * Math.PI * 2;
        flowerInstance.scale.setScalar(0.5 + Math.random() * 0.5);
        
        this.vegetationGroup!.add(flowerInstance);
      }
      
      console.log(`✅ Created ${flowerCount} flower instances efficiently`);
      
    } catch (error) {
      console.error('Failed to create flower clusters:', error);
    }
  }
  
  /**
   * Create trees around the island perimeter
   */
  private async createTrees(): Promise<void> {
    console.log('🌳 Creating trees...');
    
    this.treesGroup = new this.THREE.Group();
    
    const treeTypes = [
      'BirchTree_1.gltf',
      'BirchTree_2.gltf', 
      'BirchTree_3.gltf',
      'MapleTree_1.gltf',
      'MapleTree_2.gltf',
      'MapleTree_3.gltf',
      'DeadTree_1.gltf',
      'DeadTree_2.gltf'
    ];
    
    for (let i = 0; i < 15; i++) {
      try {
        // Place trees around the island perimeter
        const angle = Math.random() * Math.PI * 2;
        const radius = 180 + Math.random() * 30; // Near the edge but not too close
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Get terrain height at this position and place on ground
        const terrainHeight = this.getHeightAt(x, z);
        
        const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
        const treeModel = await this.assetLoader.loadModel(
          `tree_${i}`,
          `/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/${treeType}`,
          'gltf'
        );
        
        // Position on the ground surface with proper offset
        treeModel.scene.position.set(x, terrainHeight - 5, z);
        treeModel.scene.rotation.y = Math.random() * Math.PI * 2;
        
        // Vary tree sizes
        const scale = 0.8 + Math.random() * 0.6;
        treeModel.scene.scale.setScalar(scale);
        
        // Enable shadows and fix materials
        treeModel.scene.traverse((child) => {
          if (child instanceof this.THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // Fix material to respond to lighting
            if (child.material) {
              if (child.material.map) {
                const newMaterial = new this.THREE.MeshLambertMaterial({
                  map: child.material.map,
                  transparent: child.material.transparent,
                  alphaTest: 0.1
                });
                child.material = newMaterial;
              }
            }
          }
        });
        
        this.treesGroup!.add(treeModel.scene);
      } catch (error) {
        console.warn(`Failed to load tree ${i}:`, error);
      }
    }
    
    this.levelGroup.add(this.treesGroup);
    console.log('✅ Trees created');
  }
  
  /**
   * Create glowing fireflies as actual light sources
   */
  private async createGlowingFireflies(): Promise<void> {
    console.log('✨ Creating glowing fireflies...');
    
    this.firefliesGroup = new this.THREE.Group();
    
    const fireflyCount = 200; // 10x more fireflies
    const colors = [
      0x87CEEB, // Sky blue
      0x98FB98, // Pale green
      0xFFFFE0, // Light yellow
      0xDDA0DD, // Plum
      0xF0E68C  // Khaki
    ];
    
    for (let i = 0; i < fireflyCount; i++) {
      // Create firefly position
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 180; // Across the island
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Get terrain height and add random height above ground (closer to ground)
      const groundHeight = this.getHeightAt(x, z);
      const y = groundHeight + 0.5 + Math.random() * 2; // 0.5-2.5 units above ground (closer to ground)
      
      // Create firefly visual with smaller glowing sphere
      const fireflyColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Create smaller glowing firefly with reduced geometry complexity
      const fireflyGeometry = new this.THREE.SphereGeometry(0.03, 6, 4); // Smaller and less complex
      const fireflyMaterial = new this.THREE.MeshBasicMaterial({
        color: fireflyColor,
        transparent: true,
        opacity: 0.9
      });
      
      const firefly = new this.THREE.Mesh(fireflyGeometry, fireflyMaterial);
      firefly.position.set(x, y, z);
      
      // Create bright point light for each firefly - main light source with extended range
      const light = new this.THREE.PointLight(fireflyColor, 1.2, 100); // Increased from 20 to 100
      light.position.copy(firefly.position);
      
      // Create smaller glow effect with reduced geometry complexity
      const glowGeometry = new this.THREE.SphereGeometry(0.15, 6, 4); // Smaller and less complex
      const glowMaterial = new this.THREE.MeshBasicMaterial({
        color: fireflyColor,
        transparent: true,
        opacity: 0.3,
        side: this.THREE.BackSide
      });
      const glow = new this.THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(firefly.position);
      
      // Create firefly group
      const fireflyGroup = new this.THREE.Group();
      fireflyGroup.add(firefly);
      fireflyGroup.add(light);
      fireflyGroup.add(glow);
      
      // Store animation data for realistic firefly behavior (slower movement)
      fireflyGroup.userData = {
        originalX: x,
        originalY: y,
        originalZ: z,
        baseSpeed: 0.2 + Math.random() * 0.3, // Slower base movement
        floatSpeed: 0.4 + Math.random() * 0.4, // Slower floating
        phase: Math.random() * Math.PI * 2,
        wanderRange: 4 + Math.random() * 6,
        floatRange: 1.5 + Math.random() * 2, // Smaller float range (closer to ground)
        fadePhase: Math.random() * Math.PI * 2,
        fadeSpeed: 0.3 + Math.random() * 0.4, // Slower fade speed
        maxIntensity: 1.0 + Math.random() * 0.5,
        wanderDirection: {
          x: (Math.random() - 0.5) * 1.5, // Slower wander direction changes
          z: (Math.random() - 0.5) * 1.5
        }
      };
      
      this.firefliesGroup!.add(fireflyGroup);
    }
    
    this.levelGroup.add(this.firefliesGroup);
    console.log('✅ Glowing fireflies created');
  }
  
  public dispose(): void {
    if (this.isDisposed) return;
    
    console.log('🧹 Disposing Observatory Environment...');
    
    // Clear component references - BaseLevel.dispose() handles Three.js cleanup automatically
    this.skyboxMesh = null;
    this.groundMesh = null;
    this.waterfallGroup = null;
    this.waterPool = null;
    this.vegetationGroup = null;
    this.treesGroup = null;
    this.firefliesGroup = null;
    this.lightingGroup = null;
    this.mainLight = null;
    this.fillLight = null;
    this.calculatedSpawnPoint = null;
    
    this.markDisposed();
    console.log('✅ Observatory Environment disposed - cleanup handled by BaseLevel');
  }
}