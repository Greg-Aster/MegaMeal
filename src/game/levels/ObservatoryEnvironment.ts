import * as THREE from 'three';
import { GameObject } from '../../engine/core/GameObject';
import { Engine } from '../../engine/core/Engine';
import { AssetLoader } from '../../engine/resources/AssetLoader';
import { FireflySystem } from '../../engine/systems/FireflySystem';
import { OceanSystem } from '../../engine/systems/OceanSystem';

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
  
  // Natural environment elements
  private vegetationGroup: THREE.Group | null = null;
  private treesGroup: THREE.Group | null = null;
  private fireflySystem: FireflySystem | null = null;
  private oceanSystem: OceanSystem | null = null;
  
  // Lighting elements
  private lightingGroup: THREE.Group | null = null;
  private mainLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  
  // Terrain data
  private calculatedSpawnPoint: THREE.Vector3 | null = null;
  
  
  // Rising water effect
  private initialWaterLevel = -10;
  private waterRiseRate = 0.008; // Much slower, more gradual rise
  private maxWaterLevel = 2; // Stop rising at this level
  private currentWaterLevel = -6;
  
  // Configuration for level-specific effects
  private readonly bloomConfig = {
    intensity: 1.5, // Increased for more glow
    threshold: 0.55, // Slightly lower threshold to catch more light
    smoothing: 0.2
  };
  
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
      await this.createFireflies();
      
      // Setup level-specific post-processing
      this.setupLevelEffects();
      
      // Calculate and set proper spawn point based on terrain
      this.calculateSpawnPoint();
      
      this.markInitialized();
      console.log('✅ Observatory Environment initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Observatory Environment:', error);
      throw error;
    }
  }
  
  private setupLevelEffects(): void {
    console.log('✨ Applying level-specific post-processing effects...');
    const renderer = this.engine.getRenderer();
    if (renderer) {
      renderer.setBloomConfig(this.bloomConfig);
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized || !this.isActive) return;
    
    // Update firefly animations
    this.updateFireflies(deltaTime);
    
    // Update ocean system (now manages its own time)
    if (this.oceanSystem) {
      this.oceanSystem.update(deltaTime);
    }
    
    // Update rising water effect
    this.updateRisingWater(deltaTime);
  }
  
  /**
   * Update firefly animations using the new FireflySystem.
   * @param deltaTime Frame time in seconds.
   */
  private updateFireflies(deltaTime: number): void {
    if (!this.fireflySystem) return;
    
    // FireflySystem handles all animation internally
    this.fireflySystem.update(deltaTime);
  }




  /**
   * Update the rising water effect for dramatic atmosphere
   * Controls the base water level via mesh Y position.
   * Wave animations (vertex displacement) work as offsets from this base level.
   * @param deltaTime Frame time in seconds
   */
  private updateRisingWater(deltaTime: number): void {
    if (!this.oceanSystem) return;
    
    // Only rise if we haven't reached the maximum level
    if (this.currentWaterLevel < this.maxWaterLevel) {
      // Calculate new water level
      this.currentWaterLevel += this.waterRiseRate * deltaTime;
      
      // Clamp to maximum level
      this.currentWaterLevel = Math.min(this.currentWaterLevel, this.maxWaterLevel);
      
      // Update ocean system water level
      this.oceanSystem.setWaterLevel(this.currentWaterLevel);
      
      // Optional: Log dramatic milestones
      const riseAmount = this.currentWaterLevel - this.initialWaterLevel;
      // if (Math.floor(riseAmount * 10) % 10 === 0 && riseAmount > 0) {
      //   console.log(`🌊 Water has risen ${riseAmount.toFixed(1)} units... the island is being consumed by the sea!`);
      // }
      
      // Optional: When water reaches certain levels, trigger atmosphere changes
      // if (this.currentWaterLevel > -2 && this.currentWaterLevel < -1.8) {
      //   // Water is approaching ground level - could trigger special effects here
      //   console.log('🌊 The waters are rising dangerously high!');
      // }
      
      if (this.currentWaterLevel >= this.maxWaterLevel - 0.1) {
        // Water has reached maximum level
        // console.log('🌊 The ocean has claimed the observatory... only the highest peaks remain above the waves.');
      }
    }
  }

  /**
   * Get current water level (useful for other systems that need to know flood status)
   */
  public getCurrentWaterLevel(): number {
    return this.currentWaterLevel;
  }

  /**
   * Set water rise rate for dynamic control
   */
  public setWaterRiseRate(rate: number): void {
    this.waterRiseRate = Math.max(0, rate); // Prevent negative rates
    console.log(`🌊 Water rise rate set to ${rate} units per second`);
  }

  /**
   * Reset water to initial level (for level restart)
   */
  public resetWaterLevel(): void {
    this.currentWaterLevel = this.initialWaterLevel;
    if (this.oceanSystem) {
      this.oceanSystem.setWaterLevel(this.initialWaterLevel);
    }
    console.log('🌊 Water level reset to initial position');
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
        (skyTexture: any) => {
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
        (progress: any) => {
          console.log('Skybox loading progress:', Math.round((progress.loaded / progress.total) * 100) + '%');
        },
        (error: any) => {
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
    
    const isVectorMode = (window as any).MEGAMEAL_VECTOR_MODE === true;
    const optimizationManager = this.engine.getOptimizationManager();
    const isMobile = optimizationManager.getDeviceCapabilities()?.isMobile ?? false;
    
    if (isVectorMode) {
      // Monument Valley lighting - minimal lighting with atmospheric depth
      console.log('🏔️ Creating Monument Valley lighting system...');
      
      // Minimal directional light for subtle form definition
      this.mainLight = new this.THREE.DirectionalLight(0xF0E8D4, 0.6); // Cream light
      this.mainLight.position.set(0, 10, 5);
      this.mainLight.castShadow = false; // No shadows for clean look
      
      // Soft ambient light in Monument Valley style
      this.ambientLight = new this.THREE.AmbientLight(0xE8B4B8, 0.8); // Dusty rose ambient
      
      // No accent light needed - Monument Valley relies on atmospheric fog for depth
      this.fillLight = new this.THREE.DirectionalLight(0xD4C5A0, 0.2); // Subtle warm beige fill
      this.fillLight.position.set(-5, 5, -5);
      
      // Add atmospheric perspective fog for Monument Valley depth
      console.log('🌫️ Adding atmospheric perspective fog...');
      this.scene.fog = new this.THREE.Fog(
        0xE8D8C8, // Warm beige fog matching Monument Valley palette
        80,       // Near distance - fog starts closer for subtle depth
        350       // Far distance - distant objects fade to atmospheric color
      );
      
    } else {
      // Standard realistic lighting
      const mainIntensity = isMobile ? 0.4 : 0.3;
      const fillIntensity = isMobile ? 0.2 : 0.15;
      const ambientIntensity = isMobile ? 4.0 : 2.0;

      // Soft moonlight - provides base visibility while fireflies add atmosphere
      this.mainLight = new this.THREE.DirectionalLight(0x8bb3ff, mainIntensity);
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
      
      // Soft fill light - helps with shadow contrast
      this.fillLight = new this.THREE.DirectionalLight(0x6a7db3, fillIntensity);
      this.fillLight.position.set(-50, 100, -30);
      this.fillLight.target.position.set(0, 0, 0);
      
      // Gentle moonlight ambient
      this.ambientLight = new this.THREE.AmbientLight(0x404060, ambientIntensity);
    }
    
    // Add lights to group
    if (this.lightingGroup && this.mainLight) {
      this.lightingGroup.add(this.mainLight);
      if (this.mainLight.target) {
        this.lightingGroup.add(this.mainLight.target);
      }
    }
    
    if (this.lightingGroup && this.fillLight) {
      this.lightingGroup.add(this.fillLight);
      if (this.fillLight.target) {
        this.lightingGroup.add(this.fillLight.target);
      }
    }
    
    if (this.lightingGroup && this.ambientLight) {
      this.lightingGroup.add(this.ambientLight);
    }
    
    if (this.lightingGroup) {
      this.levelGroup.add(this.lightingGroup);
    }
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
    
    // Monument Valley style - clean geometric shapes with minimal surface detail
    const isVectorMode = (window as any).MEGAMEAL_VECTOR_MODE === true;
    if (!isVectorMode) {
      // Only add surface detail for realistic mode
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 1];
        
        const noise1 = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.3;
        const noise2 = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.1;
        const noise3 = Math.sin(x * 1.0) * Math.cos(z * 1.0) * 0.05;
        
        positions[i + 2] += noise1 + noise2 + noise3;
      }
    } else {
      // Monument Valley: add subtle geometric beveled edges
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 1];
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        
        // Add subtle geometric terracing for Monument Valley effect
        if (distanceFromCenter < 150) {
          const terraceLevel = Math.floor(positions[i + 2] / 2) * 2;
          positions[i + 2] = terraceLevel + 0.2; // Slight beveled edge
        }
      }
    }
    
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();
    
    // Create terrain texture
    const groundTexture = this.createTerrainTexture();
    
    // Use vector art materials for stylized look
    const materials = this.engine.getMaterials();
    
    let groundMaterial: THREE.Material;
    if (isVectorMode) {
      // Monument Valley style - use clean geometric texture with Monument material
      groundMaterial = materials.createVectorGroundMaterial();
      // Apply the Monument Valley texture to the material
      (groundMaterial as any).map = groundTexture;
      (groundMaterial as any).needsUpdate = true;
      console.log('🎨 Applied Monument Valley terrain texture to material');
      console.log('🎨 Texture size:', groundTexture.image.width, 'x', groundTexture.image.height);
      console.log('🎨 Material type:', groundMaterial.type);
      console.log('🎨 Material has map:', !!(groundMaterial as any).map);
    } else {
      // Standard PBR material
      groundMaterial = materials.createPBRMaterial({ 
        map: groundTexture,
        color: 0x556633
      });
    }
    
    // Create ground mesh
    this.groundMesh = new this.THREE.Mesh(groundGeometry, groundMaterial);
    if (this.groundMesh) {
      this.groundMesh.rotation.x = -Math.PI / 2;
      this.groundMesh.position.y = 0; // Heights are now absolute, based on terrainParams
      this.groundMesh.receiveShadow = true;
      
      this.levelGroup.add(this.groundMesh);
      
      // Monument Valley style doesn't use wireframes - relies on clean geometry
    }
    console.log('✅ Terrain created');
  }
  
  private createTerrainTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    const isVectorMode = (window as any).MEGAMEAL_VECTOR_MODE === true;
    
    if (isVectorMode) {
      // Vector art style - geometric patterns and bold colors
      this.createVectorTerrainTexture(ctx, canvas);
    } else {
      // Standard realistic terrain texture
      this.createRealisticTerrainTexture(ctx, canvas);
    }
    
    const texture = new this.THREE.CanvasTexture(canvas);
    texture.wrapS = this.THREE.RepeatWrapping;
    texture.wrapT = this.THREE.RepeatWrapping;
    texture.repeat.set(isVectorMode ? 1 : 3, isVectorMode ? 1 : 3);
    
    return texture;
  }

  private createVectorTerrainTexture(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // Monument Valley style - clean geometric patterns with soft pastels
    console.log('🎨 Creating Monument Valley terrain texture...');
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Monument Valley soft pastel colors (converted from hex)
    const monumentColors = [
      '#E8B4B8', // Dusty rose pink
      '#B8C5A0', // Muted sage green
      '#D4C5A0', // Warm sandy beige
      '#A8C4D4', // Soft powder blue
      '#C4B5D4', // Gentle lavender
      '#C47A5C', // Warm terracotta accent
      '#F0E8D4'  // Clean cream white
    ];
    
    // Create clean geometric terrain pattern
    const regionSize = 64; // Larger regions for cleaner look
    
    for (let y = 0; y < canvas.height; y += regionSize) {
      for (let x = 0; x < canvas.width; x += regionSize) {
        // Calculate region center distance for color selection
        const regionCenterX = x + regionSize / 2;
        const regionCenterY = y + regionSize / 2;
        const dist = Math.sqrt((regionCenterX - centerX) ** 2 + (regionCenterY - centerY) ** 2);
        
        // Select Monument Valley color based on distance (creates natural gradient)
        let colorIndex;
        if (dist < 60) {
          colorIndex = Math.floor(Math.random() * 2); // Warm colors for center
        } else if (dist < 120) {
          colorIndex = 2 + Math.floor(Math.random() * 2); // Earth tones for middle
        } else if (dist < 180) {
          colorIndex = 4 + Math.floor(Math.random() * 2); // Cool colors for edges
        } else {
          colorIndex = 6; // Cream for outer areas
        }
        
        const regionColor = monumentColors[colorIndex];
        
        // Fill clean rectangular region (no cell borders for Monument Valley)
        ctx.fillStyle = regionColor;
        ctx.fillRect(x, y, regionSize, regionSize);
        
        // Add subtle geometric beveled edge detail
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x, y, regionSize, 2); // Top highlight
        ctx.fillRect(x, y, 2, regionSize); // Left highlight
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(x, y + regionSize - 2, regionSize, 2); // Bottom shadow
        ctx.fillRect(x + regionSize - 2, y, 2, regionSize); // Right shadow
      }
    }
    
    console.log('✅ Monument Valley terrain texture created with clean geometric regions');
  }

  /**
   * Add wireframe outline for vector art definition
   */
  private addWireframeOutline(mesh: THREE.Mesh, geometry: THREE.BufferGeometry): void {
    console.log('🔲 Adding wireframe outline for vector definition...');
    
    try {
      // Create wireframe material for outline effect
      const wireframeMaterial = new this.THREE.MeshBasicMaterial({
        color: 0x000000, // Black wireframe
        wireframe: true,
        transparent: true,
        opacity: 0.3,
        depthTest: false // Render on top
      });
      
      // Create wireframe mesh
      const wireframeMesh = new this.THREE.Mesh(geometry, wireframeMaterial);
      wireframeMesh.rotation.x = -Math.PI / 2;
      wireframeMesh.position.copy(mesh.position);
      wireframeMesh.position.y += 0.01; // Slightly above the surface
      
      this.levelGroup.add(wireframeMesh);
      console.log('✅ Wireframe outline added for enhanced definition');
    } catch (error) {
      console.warn('⚠️ Failed to add wireframe outline:', error);
    }
  }

  private createRealisticTerrainTexture(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // Create base gradient
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 250);
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
  }

  private addStainedGlassPatterns(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Add radial lead lines (like stained glass)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    
    // Radial lines from center
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const endX = centerX + Math.cos(angle) * 200;
      const endY = centerY + Math.sin(angle) * 200;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    // Concentric circles for zone divisions
    const circles = [80, 140, 200];
    circles.forEach(radius => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    // Add decorative stained glass motifs
    ctx.strokeStyle = '#FFD700'; // Gold accent lines
    ctx.lineWidth = 2;
    
    // Central star pattern
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x1 = centerX + Math.cos(angle) * 15;
      const y1 = centerY + Math.sin(angle) * 15;
      const x2 = centerX + Math.cos(angle + Math.PI) * 15;
      const y2 = centerY + Math.sin(angle + Math.PI) * 15;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // Add some curved elements for organic stained glass feel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * 100;
      const y = centerY + Math.sin(angle) * 100;
      const size = 10;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.stroke();
    }
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
    console.log('🌊 Creating ocean system...');
    
    // Configure ocean system to match original Observatory water system exactly
    const oceanConfig = {
      // Exact dimensions and segments from original
      size: { width: 10000, height: 10000 }, 
      segments: { width: 128, height: 128 },
      position: new this.THREE.Vector3(0, this.initialWaterLevel, 0),
      waterLevel: this.initialWaterLevel,
      
      // Visual properties exactly matching original
      color: 0x006994, // Deep ocean blue from original
      opacity: 0.98, // Increased for a more opaque, less transparent look
      metalness: 0.02, // Very low metalness for water
      roughness: 0.1,  // Very smooth for reflections
      
      // Use default 8-layer wave system (matches original complexity)
      // The default waves are configured to match the original's 8-layer system
      
      enableReflection: true,
      enableRefraction: true,
      enableAnimation: true,
      animationSpeed: 1.0,
      
      // Performance optimization
      enableLOD: true,
      maxDetailDistance: 500
    };
    
    // Create and initialize ocean system with material factory
    this.oceanSystem = new OceanSystem(this.THREE, this.scene, oceanConfig, this.engine.getMaterials());
    await this.oceanSystem.initialize();
    
    // Apply vector materials if in vector mode
    const isVectorMode = (window as any).MEGAMEAL_VECTOR_MODE === true;
    if (isVectorMode) {
      this.updateOceanForVectorMode();
    }
    
    // Initialize current water level
    this.currentWaterLevel = this.initialWaterLevel;
    
    console.log('✅ Ocean system created with wave simulation');
  }

  /**
   * Update ocean material for vector art mode
   */
  private updateOceanForVectorMode(): void {
    if (!this.oceanSystem) return;
    
    console.log('🎨 Updating ocean for vector art mode...');
    
    try {
      // Get the ocean mesh
      const oceanMesh = this.oceanSystem.getOceanMesh();
      if (oceanMesh) {
        // Create vector water material with stained glass texture
        const materials = this.engine.getMaterials();
        const vectorWaterMaterial = materials.createVectorWaterMaterial();
        
        // Apply the new material
        oceanMesh.material = vectorWaterMaterial;
        oceanMesh.material.needsUpdate = true;
        
        // Add wireframe outline for definition
        this.addOceanWireframe(oceanMesh);
        
        console.log('✅ Ocean updated with vector art material and stained glass texture');
      }
    } catch (error) {
      console.warn('⚠️ Failed to update ocean for vector mode:', error);
    }
  }

  /**
   * Add wireframe outline to ocean for vector art definition
   */
  private addOceanWireframe(oceanMesh: THREE.Mesh): void {
    console.log('🌊 Adding ocean wireframe for vector definition...');
    
    try {
      // Create wireframe material for water outline
      const wireframeMaterial = new this.THREE.MeshBasicMaterial({
        color: 0x003366, // Dark blue wireframe for water
        wireframe: true,
        transparent: true,
        opacity: 0.4,
        depthTest: false // Render on top
      });
      
      // Create wireframe mesh using ocean geometry
      const wireframeMesh = new this.THREE.Mesh(oceanMesh.geometry, wireframeMaterial);
      wireframeMesh.position.copy(oceanMesh.position);
      wireframeMesh.rotation.copy(oceanMesh.rotation);
      wireframeMesh.position.y += 0.05; // Slightly above the water surface
      
      this.levelGroup.add(wireframeMesh);
      console.log('✅ Ocean wireframe outline added for enhanced water definition');
    } catch (error) {
      console.warn('⚠️ Failed to add ocean wireframe outline:', error);
    }
  }

  /**
   * Create custom water geometry with vertex displacement for 3D waves
   */
  private createWaterGeometry(): THREE.BufferGeometry {
    const size = 10000;
    const segments = 128; // Reduced from 256 for better performance
    
    // Create a flat plane. The wave displacement will be handled entirely
    // by the updateWaterWaves() method for animation. This prevents a static
    // displacement from being baked into the geometry.
    const geometry = new this.THREE.PlaneGeometry(size, size, segments, segments);
    
    return geometry;
  }
  
  private createAnimatedWaterData(): { map: THREE.CanvasTexture, normalMap: THREE.CanvasTexture, displacementMap: THREE.CanvasTexture } {
    const size = 1024; // Higher resolution for better quality
    
    // Create color map canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Create displacement map canvas
    const displacementCanvas = document.createElement('canvas');
    displacementCanvas.width = size;
    displacementCanvas.height = size;
    const displacementCtx = displacementCanvas.getContext('2d')!;

    // Create normal map canvas for surface detail
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = size;
    normalCanvas.height = size;
    const normalCtx = normalCanvas.getContext('2d')!;

    // Multi-layered noise function for realistic water patterns
    const waveNoise = (x: number, y: number, time: number = 0) => {
      let value = 0;
      // Large ocean swells
      value += Math.sin((x * 0.02 + y * 0.01) + time * 0.5) * 0.4;
      value += Math.cos((x * 0.015 - y * 0.02) + time * 0.3) * 0.3;
      
      // Medium waves
      value += Math.sin((x * 0.05 + y * 0.08) + time * 1.2) * 0.2;
      value += Math.cos((x * 0.08 - y * 0.05) + time * 0.8) * 0.15;
      
      // Small ripples
      value += Math.sin((x * 0.15 + y * 0.12) + time * 2.0) * 0.08;
      value += Math.cos((x * 0.18 - y * 0.15) + time * 1.5) * 0.06;
      
      // Fine surface detail
      value += Math.sin((x * 0.3 + y * 0.25) + time * 3.0) * 0.04;
      value += Math.cos((x * 0.35 - y * 0.3) + time * 2.5) * 0.03;
      
      return (value + 1) / 2; // Normalize to 0-1 range
    };

    // Generate textures
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const wave = waveNoise(x, y);
        
        // Color map - deep ocean blues with wave-based variation
        const blueBase = 20;
        const greenBase = 50;
        const blue = Math.floor(blueBase + wave * 120);
        const green = Math.floor(greenBase + wave * 100);
        const red = Math.floor(10 + wave * 30);
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(x, y, 1, 1);

        // Displacement map - grayscale height for wave geometry
        const displacement = Math.floor(wave * 255);
        displacementCtx.fillStyle = `rgb(${displacement}, ${displacement}, ${displacement})`;
        displacementCtx.fillRect(x, y, 1, 1);

        // Normal map - calculate surface normals for lighting
        const waveHeight = wave;
        const waveHeightX = waveNoise(x + 1, y) - waveHeight;
        const waveHeightY = waveNoise(x, y + 1) - waveHeight;
        
        // Convert height gradients to normal map colors
        const normalX = Math.floor((waveHeightX + 1) * 127.5);
        const normalY = Math.floor((waveHeightY + 1) * 127.5);
        const normalZ = 255; // Pointing up
        
        normalCtx.fillStyle = `rgb(${normalX}, ${normalY}, ${normalZ})`;
        normalCtx.fillRect(x, y, 1, 1);
      }
    }

    // Create Three.js textures
    const map = new this.THREE.CanvasTexture(canvas);
    map.wrapS = map.wrapT = this.THREE.RepeatWrapping;
    map.repeat.set(15, 15); // More repetitions for finer detail

    const displacementMap = new this.THREE.CanvasTexture(displacementCanvas);
    displacementMap.wrapS = displacementMap.wrapT = this.THREE.RepeatWrapping;
    displacementMap.repeat.set(15, 15);

    const normalMap = new this.THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = normalMap.wrapT = this.THREE.RepeatWrapping;
    normalMap.repeat.set(15, 15);

    return { map, normalMap, displacementMap };
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
   * Create fireflies using the new FireflySystem
   */
  private async createFireflies(): Promise<void> {
    console.log('✨ Creating fireflies with mobile-optimized system...');
    
    // Configure firefly system for Observatory environment
    const fireflyConfig = {
      count: 80, // Keep all 200 fireflies for visual richness
      maxLights: 80, // Full firefly lighting on desktop (FireflySystem auto-detects mobile and reduces to 8)
      colors: [
        0xE8B4B8, // Dusty rose pink
        0xB8C5A0, // Muted sage green
        0xD4C5A0, // Warm sandy beige
        0xA8C4D4, // Soft powder blue
        0xC4B5D4, // Gentle lavender
        0xC47A5C, // Warm terracotta
        0xF0E8D4, // Clean cream white
        0xA8C4D4  // Soft powder blue (duplicate for variation)
      ],
      emissiveIntensity: 15.0, // A softer, more subtle glow
      lightIntensity: 15.0, // Less intense light cast on the environment
      lightRange: 80,
      cycleDuration: 12.0, // Even longer cycle for very stable lighting
      fadeSpeed: 0.3, // Very slow fade for smooth transitions
      heightRange: { min: 0.5, max: 2.5 },
      radius: 180,
      size: 0.015, // Smaller, more delicate fireflies
      // New movement configuration for fine-tuning
      movement: {
        speed: 0.2, // Slower floating animation
        wanderSpeed: 0.004, // Slower, more gentle wandering
        wanderRadius: 4, // Wander in a smaller area
        floatAmplitude: { x: 1.5, y: 0.5, z: 1.5 }, // Less dramatic up/down and side-to-side movement
        lerpFactor: 1.0 // Smoother, less snappy movement
      }
    };
    
    // Create firefly system with height callback
    this.fireflySystem = new FireflySystem(
      this.THREE,
      this.scene,
      fireflyConfig,
      (x: number, z: number) => this.getHeightAt(x, z)
    );
    
    await this.fireflySystem.initialize();
    
    console.log('✅ FireflySystem created with mobile optimization');
  }
  
  public dispose(): void {
    if (this.isDisposed) return;
    
    console.log('🧹 Disposing Observatory Environment and resetting effects...');
    
    // Reset bloom to default values so other levels aren't overly bright
    const renderer = this.engine.getRenderer();
    if (renderer) {
      renderer.setBloomConfig({
        intensity: 0.8,
        threshold: 0.85,
        smoothing: 0.07
      });
    }

    // Unregister water from environmental effects system
    const environmentalEffects = this.engine.getEnvironmentalEffects();
    environmentalEffects.unregisterWaterSource('observatory_water');
    
    // Clear component references - BaseLevel.dispose() handles Three.js cleanup automatically
    this.skyboxMesh = null;
    this.groundMesh = null;
    this.waterfallGroup = null;
    this.waterPool = null;
    this.vegetationGroup = null;
    this.treesGroup = null;
    
    // Dispose firefly system
    if (this.fireflySystem) {
      this.fireflySystem.dispose();
      this.fireflySystem = null;
    }
    this.lightingGroup = null;
    this.mainLight = null;
    this.fillLight = null;
    this.calculatedSpawnPoint = null;
    
    this.markDisposed();
    console.log('✅ Observatory Environment disposed - cleanup handled by BaseLevel');
  }
}