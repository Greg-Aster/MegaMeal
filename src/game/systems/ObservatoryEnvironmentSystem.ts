import * as THREE from 'three';
import { BaseLevelGenerator, type LevelGeneratorDependencies } from '../interfaces/ILevelGenerator';
import { FireflySystem } from '../../engine/systems/FireflySystem';
import { OptimizationManager } from '../../engine/optimization/OptimizationManager';

/**
 * Handles the physical environment of the Star Observatory
 * Manages terrain, skybox, and water elements - now using standardized interface
 */
export class ObservatoryEnvironmentSystem extends BaseLevelGenerator {
  // Environment elements
  private skyboxMesh: THREE.Mesh | null = null;
  private groundMesh: THREE.Mesh | null = null;
  private waterfallGroup: THREE.Group | null = null;
  
  // Natural environment elements
  private vegetationGroup: THREE.Group | null = null;
  private treesGroup: THREE.Group | null = null;
  private fireflySystem: FireflySystem | null = null;
  
  // Level of Detail (LOD) system for intelligent performance optimization
  private lodObjects: THREE.LOD[] = [];
  
  // Lighting elements
  private lightingGroup: THREE.Group | null = null;
  private mainLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  
  // Terrain data
  private calculatedSpawnPoint: THREE.Vector3 | null = null;
  
  // Removed water properties - now handled globally by EnvironmentalEffectsSystem
  
  // Configuration for level-specific effects
  private readonly bloomConfig = {
    intensity: 1.2, // Reduced intensity to prevent excessive glow
    threshold: 0.8, // Higher threshold to reduce over-sensitivity
    smoothing: 0.15
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
  
  constructor(dependencies: LevelGeneratorDependencies) {
    super(dependencies);
    console.log('🌍 ObservatoryEnvironmentSystem created with standardized interface');
  }
  
  public async initialize(config?: any): Promise<void> {
    try {
      console.log('🌍 Initializing Observatory Environment...');
      
      await this.loadSkybox();
      await this.createLighting(config);
      await this.createGround();
      
      // Add natural environment (field with hill - no trees)
      await this.createVegetation();
      await this.createFireflies();
      
      // Calculate and set spawn point for terrain following
      this.calculateSpawnPoint();
      
      // Apply post-processing effects (bloom)
      this.setupLevelEffects();
      
      console.log('✅ Observatory Environment initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Observatory Environment:', error);
      throw error;
    }
  }
  
  public update(deltaTime: number, camera?: THREE.Camera): void {
    // Update systems - pass camera to FireflySystem for efficient culling
    const activeCamera = camera || this.dependencies.camera;
    this.fireflySystem?.update(deltaTime, activeCamera);
    
    // Update LOD objects
    this.lodObjects.forEach(lodObject => {
      lodObject.update(activeCamera);
    });
  }
  
  public dispose(): void {
    // Reset bloom to default values so other levels aren't overly bright
    const renderer = this.dependencies.engine.getRenderer?.();
    if (renderer) {
      renderer.setBloomConfig?.({
        intensity: 0.8,
        threshold: 0.85,
        smoothing: 0.07
      });
      console.log('🌟 Bloom configuration reset to defaults');
    }
    
    // Dispose of systems
    this.fireflySystem?.dispose();
    // Water disposal now handled globally by EnvironmentalEffectsSystem
    
    // Clean up Three.js objects
    if (this.skyboxMesh) {
      this.dependencies.levelGroup.remove(this.skyboxMesh);
      this.skyboxMesh = null;
    }
    
    if (this.groundMesh) {
      this.dependencies.levelGroup.remove(this.groundMesh);
      this.groundMesh = null;
    }
    
    if (this.waterfallGroup) {
      this.dependencies.levelGroup.remove(this.waterfallGroup);
      this.waterfallGroup = null;
    }
    
    console.log('🧹 ObservatoryEnvironmentSystem disposed');
  }
  
  // Terrain-specific methods for terrain following
  public getHeightAt(x: number, z: number): number {
    // Calculate terrain height using the EXACT same algorithm as the ground creation
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    
    let height = 0;
    
    // Central hill - exact same calculation as createGround
    if (distanceFromCenter < this.terrainParams.hillRadius) {
      const heightMultiplier = Math.cos((distanceFromCenter / this.terrainParams.hillRadius) * Math.PI * 0.5);
      height = this.terrainParams.baseGroundLevel + (this.terrainParams.hillHeight * heightMultiplier * heightMultiplier);
    } else {
      height = this.terrainParams.baseGroundLevel;
    }
    
    // Void drop-off - exact same calculation as createGround
    if (distanceFromCenter >= this.terrainParams.islandRadius) {
      const voidDistance = distanceFromCenter - this.terrainParams.islandRadius;
      height = this.terrainParams.baseGroundLevel - Math.pow(voidDistance * 0.1, 2);
    }
    
    // Add surface detail - exact same calculation as createGround
    height += this.getSurfaceNoise(x, z);
    
    return height;
  }
  
  public getSpawnPoint(): THREE.Vector3 | null {
    return this.calculatedSpawnPoint;
  }
  
  private calculateSpawnPoint(): void {
    // Calculate spawn point on the terrain
    const spawnX = 0;
    const spawnZ = 50;
    const spawnY = this.getHeightAt(spawnX, spawnZ) + 1.6; // Add player height
    
    this.calculatedSpawnPoint = new this.dependencies.THREE.Vector3(spawnX, spawnY, spawnZ);
    console.log(`🎯 Calculated spawn point: [${spawnX}, ${spawnY.toFixed(2)}, ${spawnZ}]`);
  }
  
  private setupLevelEffects(): void {
    // Apply custom bloom configuration for observatory level with reasonable threshold
    const correctedBloomConfig = {
      ...this.bloomConfig,
      threshold: 0.8 // FIXED: Increase threshold to reduce over-sensitivity and prevent excessive bloom
    };
    const renderer = this.dependencies.engine.getRenderer?.();
    if (renderer) {
      renderer.setBloomConfig?.(correctedBloomConfig);
      console.log('🌟 Observatory bloom effects applied with corrected threshold:', correctedBloomConfig);
    }
  }
  
  // Private methods for environment creation
  private async loadSkybox(): Promise<void> {
    return new Promise((resolve, reject) => {
      const textureLoader = new this.dependencies.THREE.TextureLoader();
      
      textureLoader.load(
        this.skyboxImageUrl,
        (skyTexture: any) => {
          // Configure texture for equirectangular mapping
          skyTexture.mapping = this.dependencies.THREE.EquirectangularReflectionMapping;
          skyTexture.colorSpace = this.dependencies.THREE.SRGBColorSpace;
          skyTexture.flipY = false;
          
          // Create skybox material
          const skyMaterial = new this.dependencies.THREE.MeshBasicMaterial({ 
            map: skyTexture, 
            side: this.dependencies.THREE.BackSide, 
            depthWrite: false,
            toneMapped: true // FIXED: Enable tone mapping to prevent over-bright sky
          });
          
          // Create skybox mesh
          const skyGeometry = new this.dependencies.THREE.SphereGeometry(1000, 60, 40);
          this.skyboxMesh = new this.dependencies.THREE.Mesh(skyGeometry, skyMaterial);
          this.skyboxMesh.rotation.x = Math.PI;
          
          // Add to level group
          this.dependencies.levelGroup.add(this.skyboxMesh);
          
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
    const fallbackTexture = new this.dependencies.THREE.CanvasTexture(canvas);
    fallbackTexture.mapping = this.dependencies.THREE.EquirectangularReflectionMapping;
    
    const skyMaterial = new this.dependencies.THREE.MeshBasicMaterial({ 
      map: fallbackTexture, 
      side: this.dependencies.THREE.BackSide, 
      depthWrite: false,
      toneMapped: true // FIXED: Enable tone mapping for fallback skybox too
    });
    
    const skyGeometry = new this.dependencies.THREE.SphereGeometry(1000, 60, 40);
    this.skyboxMesh = new this.dependencies.THREE.Mesh(skyGeometry, skyMaterial);
    this.skyboxMesh.rotation.x = Math.PI;
    
    this.dependencies.levelGroup.add(this.skyboxMesh);
    console.log('✅ Fallback skybox created');
  }
  
  private async createLighting(config?: any): Promise<void> {
    console.log('💡 Creating Observatory lighting...');
    
    this.lightingGroup = new this.dependencies.THREE.Group();
    
    // Get lighting configuration from level data (data-driven approach)
    const lightingConfig = config?.lighting || {
      style: 'realistic',
      mainIntensity: 0.5,
      fillIntensity: 0.25,
      ambientIntensity: 0.5,
      mainColor: '#8bb3ff',
      fillColor: '#6a7db3',
      ambientColor: '#404060'
    };
    
    // Adjust for mobile devices
    const optimizationManager = this.dependencies.engine.getOptimizationManager();
    const isMobile = optimizationManager.getDeviceCapabilities()?.isMobile ?? false;
    const mobileMultiplier = isMobile ? 1.2 : 1.0; // Slightly brighter on mobile
    
    // Create main directional light
    const mainLightColor = new this.dependencies.THREE.Color(lightingConfig.mainColor);
    this.mainLight = new this.dependencies.THREE.DirectionalLight(
      mainLightColor.getHex(), 
      lightingConfig.mainIntensity * mobileMultiplier
    );
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
    
    if (this.lightingGroup && this.mainLight) {
      this.lightingGroup.add(this.mainLight);
      this.lightingGroup.add(this.mainLight.target);
    }
    
    // Create fill light
    const fillLightColor = new this.dependencies.THREE.Color(lightingConfig.fillColor);
    this.fillLight = new this.dependencies.THREE.DirectionalLight(
      fillLightColor.getHex(), 
      lightingConfig.fillIntensity * mobileMultiplier
    );
    this.fillLight.position.set(-50, 100, -30);
    this.fillLight.target.position.set(0, 0, 0);
    if (this.lightingGroup) {
      this.lightingGroup.add(this.fillLight);
      this.lightingGroup.add(this.fillLight.target);
    }
    
    // Create ambient light
    const ambientLightColor = new this.dependencies.THREE.Color(lightingConfig.ambientColor);
    this.ambientLight = new this.dependencies.THREE.AmbientLight(
      ambientLightColor.getHex(), 
      lightingConfig.ambientIntensity * mobileMultiplier
    );
    if (this.lightingGroup) {
      this.lightingGroup.add(this.ambientLight);
    }
    
    if (this.lightingGroup) {
      this.dependencies.levelGroup.add(this.lightingGroup);
    }
    
    console.log('✅ Observatory lighting created with data-driven configuration:', {
      style: lightingConfig.style,
      mainIntensity: lightingConfig.mainIntensity * mobileMultiplier,
      fillIntensity: lightingConfig.fillIntensity * mobileMultiplier,
      ambientIntensity: lightingConfig.ambientIntensity * mobileMultiplier,
      isMobile
    });
  }
  
  private async createGround(): Promise<void> {
    console.log('🏔️ Creating floating island terrain...');
    
    // Create geometry with intelligent optimization
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let groundGeometry;
    const terrainSegments = this.getIntelligentTerrainSettings();
    groundGeometry = new this.dependencies.THREE.PlaneGeometry(500, 500, terrainSegments.width, terrainSegments.height);
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
      positions[i + 2] += this.getSurfaceNoise(x, z);
    }
    
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();
    
    // Create intelligent terrain material based on device capabilities
    const groundMaterial = this.createIntelligentTerrainMaterial();
    
    // Create ground mesh
    this.groundMesh = new this.dependencies.THREE.Mesh(groundGeometry, groundMaterial);
    if (this.groundMesh) {
      this.groundMesh.rotation.x = -Math.PI / 2;
      this.groundMesh.position.y = 0; // Heights are now absolute, based on terrainParams
      this.groundMesh.receiveShadow = true;
      
      this.dependencies.levelGroup.add(this.groundMesh);
    }
    console.log('✅ Terrain created');
  }
  
  private getIntelligentTerrainSettings(): { width: number; height: number } {
    try {
      const optimizationManager = this.dependencies.engine.getOptimizationManager();
      const qualitySettings = optimizationManager.getQualitySettings();
      
      if (qualitySettings) {
        console.log(`🎯 Terrain: Using intelligent optimization`, {
          segments: qualitySettings.terrainSegments,
          qualityLevel: optimizationManager.getOptimizationLevel()
        });
        return qualitySettings.terrainSegments;
      }
    } catch (error) {
      // Fallback to original logic
    }
    
    // Fallback to mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      return { width: 20, height: 20 };
    } else {
      return { width: 64, height: 64 };
    }
  }
  
  private getSurfaceNoise(x: number, z: number): number {
    // Use multiple octaves with different frequencies, amplitudes, and phases to create organic variation
    const octaves = [
      { freq: 0.08, amp: 0.25, angleX: Math.PI / 7.3, angleZ: Math.PI / 3.7, phaseX: 2.1, phaseZ: 5.8 },
      { freq: 0.15, amp: 0.15, angleX: Math.PI / 2.8, angleZ: Math.PI / 5.2, phaseX: 1.7, phaseZ: 3.4 },
      { freq: 0.32, amp: 0.08, angleX: Math.PI / 4.1, angleZ: Math.PI / 6.9, phaseX: 4.2, phaseZ: 1.9 },
      { freq: 0.67, amp: 0.04, angleX: Math.PI / 1.9, angleZ: Math.PI / 8.3, phaseX: 0.9, phaseZ: 6.1 },
      { freq: 1.23, amp: 0.02, angleX: Math.PI / 3.4, angleZ: Math.PI / 2.1, phaseX: 3.8, phaseZ: 2.7 }
    ];
    
    let noise = 0;
    for (const octave of octaves) {
      // Rotate coordinates to break grid alignment
      const x1 = x * Math.cos(octave.angleX) - z * Math.sin(octave.angleX);
      const z1 = x * Math.sin(octave.angleZ) + z * Math.cos(octave.angleZ);
      
      // Add phase offset and calculate noise
      const noiseValue = Math.sin((x1 + octave.phaseX) * octave.freq) * Math.cos((z1 + octave.phaseZ) * octave.freq);
      noise += noiseValue * octave.amp;
    }
    
    return noise;
  }
  
  private createIntelligentTerrainMaterial(): THREE.Material {
    try {
      const optimizationManager = this.dependencies.engine.getOptimizationManager();
      const qualitySettings = optimizationManager.getQualitySettings();
      const optimizationLevel = optimizationManager.getOptimizationLevel();
      
      if (!qualitySettings) {
        // Fallback to basic material
        return new this.dependencies.THREE.MeshLambertMaterial({
          color: 0x556633
        });
      }

      console.log(`🎯 Terrain Material: Creating for quality level ${optimizationLevel}`);

      // ULTRA_LOW: Basic colored material, no textures
      if (!qualitySettings.enableProceduralTextures) {
        return new this.dependencies.THREE.MeshBasicMaterial({
          color: 0x556633,
          fog: true
        });
      }

      // LOW: Lambert material with texture but no normal maps
      if (!qualitySettings.enableNormalMaps) {
        const terrainTexture = this.createTerrainTexture();
        return new this.dependencies.THREE.MeshLambertMaterial({
          map: terrainTexture,
          fog: true
        });
      }

      // MEDIUM and above: Full material with normal maps
      const terrainTexture = this.createTerrainTexture();
      const normalMap = this.createTerrainNormalMap();
      
      return new this.dependencies.THREE.MeshLambertMaterial({
        map: terrainTexture,
        normalMap: normalMap,
        fog: true
      });

    } catch (error) {
      console.warn('Error creating intelligent terrain material:', error);
      // Fallback to basic material
      return new this.dependencies.THREE.MeshLambertMaterial({
        color: 0x556633
      });
    }
  }
  
  private createTerrainTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    
    // Use realistic style by default - no more global mode dependency
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.98;
    
    // Always use realistic gradient - consistent with data-driven lighting
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    gradient.addColorStop(0, '#3d6017');    // Grass center
    gradient.addColorStop(0.4, '#2d5016');  // Medium green
    gradient.addColorStop(0.7, '#c2b280');  // Sandy beach color
    gradient.addColorStop(0.85, '#a19060'); // Darker sand
    gradient.addColorStop(1, '#8b7355');    // Wet sand at the edge
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add organic texture details
    this.addGrassTexture(ctx, canvas);
    this.addSandTexture(ctx, canvas);
    this.addNoiseOverlay(ctx, canvas);
    
    const texture = new this.dependencies.THREE.CanvasTexture(canvas);
    texture.wrapS = this.dependencies.THREE.RepeatWrapping;
    texture.wrapT = this.dependencies.THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    
    return texture;
  }
  
  private createTerrainNormalMap(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create a simple normal map with slight variations
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Default normal pointing up (0.5, 0.5, 1.0 in RGB)
      data[i] = 128;     // Red (X)
      data[i + 1] = 128; // Green (Y)
      data[i + 2] = 255; // Blue (Z)
      data[i + 3] = 255; // Alpha
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const texture = new this.dependencies.THREE.CanvasTexture(canvas);
    texture.wrapS = this.dependencies.THREE.RepeatWrapping;
    texture.wrapT = this.dependencies.THREE.RepeatWrapping;
    
    return texture;
  }
  
  private addGrassTexture(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const distFromCenter = Math.sqrt((x - canvas.width/2) ** 2 + (y - canvas.height/2) ** 2);
      
      if (distFromCenter < canvas.width * 0.4) {
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
      const distFromCenter = Math.sqrt((x - canvas.width/2) ** 2 + (y - canvas.height/2) ** 2);
      
      if (distFromCenter > canvas.width * 0.3) {
        const size = Math.random() * 1.5 + 0.5;
        const brightness = Math.random() * 0.3 + 0.3;
        ctx.fillStyle = `rgba(${Math.floor(160 + brightness * 40)}, ${Math.floor(140 + brightness * 30)}, ${Math.floor(100 + brightness * 20)}, 0.5)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  private addNoiseOverlay(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 20;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  // Water creation removed - now handled globally by EnvironmentalEffectsSystem
  
  private async createVegetation(): Promise<void> {
    // Use intelligent vegetation settings
    const vegetationSettings = this.getIntelligentVegetationSettings();
    if (!vegetationSettings.enableVegetation) {
      console.log('🌱 Skipping vegetation for better performance');
      return;
    }
    
    console.log(`🌱 Creating natural vegetation (${vegetationSettings.maxInstances} max instances)...`);
    
    this.vegetationGroup = new this.dependencies.THREE.Group();
    
    // Create beautiful natural environment with proper asset loading
    await this.createGrassPatches();
    await this.createFlowerClusters();
    await this.createBushes();
    await this.createTrees();
    await this.createStonesAndRocks();
    
    this.dependencies.levelGroup.add(this.vegetationGroup);
    console.log('✅ Beautiful vegetation ecosystem created');
  }
  
  private getIntelligentVegetationSettings(): { enableVegetation: boolean; maxInstances: number } {
    try {
      const optimizationManager = this.dependencies.engine.getOptimizationManager();
      const qualitySettings = optimizationManager.getQualitySettings();
      
      if (qualitySettings) {
        console.log(`🎯 Vegetation: Using intelligent optimization`, {
          enabled: qualitySettings.enableVegetation,
          maxInstances: qualitySettings.maxVegetationInstances,
          qualityLevel: optimizationManager.getOptimizationLevel()
        });
        return {
          enableVegetation: qualitySettings.enableVegetation,
          maxInstances: qualitySettings.maxVegetationInstances
        };
      }
    } catch (error) {
      // Fallback to original logic
    }
    
    // Fallback to simple mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return {
      enableVegetation: !isMobile,
      maxInstances: isMobile ? 0 : 25
    };
  }
  
  /**
   * Create realistic grass patches on the main hill using efficient instancing
   */
  private async createGrassPatches(): Promise<void> {
    console.log('🌱 Loading grass assets (instancing approach)...');
    
    const grassTypes = ['Grass_Small.gltf', 'Grass_Large.gltf'];
    
    try {
      // Load each grass type once (parallel loading)
      const grassAssets = await Promise.all(
        grassTypes.map(async (grassType, index) => {
          const asset = await this.dependencies.assetLoader.loadModel(
            `grass_template_${index}`,
            `/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/${grassType}`,
            'gltf'
          );
          
          // Prepare the template by fixing materials once - FORCE non-emissive
          asset.scene.traverse((child: any) => {
            if (child instanceof this.dependencies.THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                // DEBUG: Log original material properties
                console.log('🔍 Original material:', {
                  type: child.material.constructor.name,
                  emissive: child.material.emissive,
                  emissiveIntensity: child.material.emissiveIntensity,
                  color: child.material.color
                });
                
                // Use working material replacement pattern from original ObservatoryEnvironment.ts
                if (child.material && child.material.map) {
                  const newMaterial = new this.dependencies.THREE.MeshLambertMaterial({
                    map: child.material.map,
                    transparent: child.material.transparent,
                    alphaTest: 0.1
                  });
                  child.material = newMaterial;
                }
                
                console.log('✅ Replaced with non-emissive LambertMaterial');
              }
            }
          });
          
          return asset.scene;
        })
      );
      
      // Create instances using the loaded templates
      const vegetationSettings = this.getIntelligentVegetationSettings();
      const grassCount = Math.min(vegetationSettings.maxInstances, 25);
      
      for (let i = 0; i < grassCount; i++) {
        // Pick a random grass type
        const grassTemplate = grassAssets[Math.floor(Math.random() * grassAssets.length)];
        const grassInstance = grassTemplate.clone();
        
        // Position on the hill with natural clustering
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.terrainParams.hillRadius * 0.9;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = this.getHeightAt(x, z);
        
        // Add natural variation
        grassInstance.rotation.y = Math.random() * Math.PI * 2;
        grassInstance.scale.multiplyScalar(0.8 + Math.random() * 0.4);
        
        const position = new this.dependencies.THREE.Vector3(x, y, z);
        const lodObject = this.createLODVegetation(grassInstance, position);
        
        this.vegetationGroup!.add(lodObject);
      }
      
      console.log(`🌱 Created ${grassCount} grass patches`);
      
    } catch (error) {
      console.error('Failed to create grass patches:', error);
      // Fallback to simple grass
      this.createFallbackGrass();
    }
  }
  
  /**
   * Create beautiful flower clusters for magical atmosphere
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
          const asset = await this.dependencies.assetLoader.loadModel(
            `flower_template_${index}`,
            `/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/${flowerType}`,
            'gltf'
          );
          
          // Prepare the template by fixing materials once - FORCE non-emissive
          asset.scene.traverse((child: any) => {
            if (child instanceof this.dependencies.THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                // DEBUG: Log original material properties
                console.log('🔍 Original material:', {
                  type: child.material.constructor.name,
                  emissive: child.material.emissive,
                  emissiveIntensity: child.material.emissiveIntensity,
                  color: child.material.color
                });
                
                // Use working material replacement pattern from original ObservatoryEnvironment.ts
                if (child.material && child.material.map) {
                  const newMaterial = new this.dependencies.THREE.MeshLambertMaterial({
                    map: child.material.map,
                    transparent: child.material.transparent,
                    alphaTest: 0.1
                  });
                  child.material = newMaterial;
                }
                
                console.log('✅ Replaced with non-emissive LambertMaterial');
              }
            }
          });
          
          return asset.scene;
        })
      );
      
      // Create instances using the loaded templates
      const vegetationSettings = this.getIntelligentVegetationSettings();
      const flowerCount = Math.min(vegetationSettings.maxInstances, 15);
      
      for (let i = 0; i < flowerCount; i++) {
        // Pick a random flower type
        const flowerTemplate = flowerAssets[Math.floor(Math.random() * flowerAssets.length)];
        const flowerInstance = flowerTemplate.clone();
        
        // Position around the hill with natural clustering
        const angle = Math.random() * Math.PI * 2;
        const radius = 60 + Math.random() * 50; // Around the hill
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = this.getHeightAt(x, z);
        
        // Add natural variation
        flowerInstance.rotation.y = Math.random() * Math.PI * 2;
        flowerInstance.scale.multiplyScalar(0.7 + Math.random() * 0.6);
        
        const position = new this.dependencies.THREE.Vector3(x, y, z);
        const lodObject = this.createLODVegetation(flowerInstance, position);
        
        this.vegetationGroup!.add(lodObject);
      }
      
      console.log(`🌸 Created ${flowerCount} flower clusters`);
      
    } catch (error) {
      console.error('Failed to create flower clusters:', error);
    }
  }
  
  /**
   * Create bushes around the island for natural boundaries
   */
  private async createBushes(): Promise<void> {
    console.log('🌿 Loading bush assets...');
    
    const bushTypes = [
      'Bush_Small.gltf',
      'Bush.gltf', 
      'Bush_Large.gltf',
      'Bush_Small_Flowers.gltf',
      'Bush_Flowers.gltf'
    ];
    
    try {
      const vegetationSettings = this.getIntelligentVegetationSettings();
      const bushCount = Math.min(vegetationSettings.maxInstances, 12);
      
      for (let i = 0; i < bushCount; i++) {
        // Pick a random bush type
        const bushType = bushTypes[Math.floor(Math.random() * bushTypes.length)];
        const asset = await this.dependencies.assetLoader.loadModel(
          `bush_${i}`,
          `/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/${bushType}`,
          'gltf'
        );
        
        // Prepare materials
        asset.scene.traverse((child) => {
          if (child instanceof this.dependencies.THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material && child.material.map) {
              const newMaterial = new this.dependencies.THREE.MeshLambertMaterial({
                map: child.material.map,
                transparent: child.material.transparent,
                alphaTest: 0.1
              });
              child.material = newMaterial;
            }
          }
        });
        
        // Place bushes in the middle ring area
        const angle = Math.random() * Math.PI * 2;
        const radius = 100 + Math.random() * 80; // Between hill and edge
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = this.getHeightAt(x, z);
        
        // Add natural variation
        asset.scene.rotation.y = Math.random() * Math.PI * 2;
        asset.scene.scale.multiplyScalar(0.8 + Math.random() * 0.4);
        
        const position = new this.dependencies.THREE.Vector3(x, y, z);
        const lodObject = this.createLODVegetation(asset.scene, position);
        
        this.vegetationGroup!.add(lodObject);
      }
      
      console.log(`🌿 Created ${bushCount} bushes`);
      
    } catch (error) {
      console.error('Failed to create bushes:', error);
    }
  }
  
  /**
   * Create trees around the island perimeter for natural boundaries
   */
  private async createTrees(): Promise<void> {
    console.log('🌳 Loading tree assets...');
    
    const treeTypes = [
      'BirchTree_1.gltf',
      'BirchTree_2.gltf', 
      'BirchTree_3.gltf',
      'MapleTree_1.gltf',
      'MapleTree_2.gltf',
      'MapleTree_3.gltf'
    ];
    
    try {
      const vegetationSettings = this.getIntelligentVegetationSettings();
      const treeCount = Math.min(vegetationSettings.maxInstances, 8);
      
      for (let i = 0; i < treeCount; i++) {
        // Pick a random tree type
        const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
        const asset = await this.dependencies.assetLoader.loadModel(
          `tree_${i}`,
          `/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/${treeType}`,
          'gltf'
        );
        
        // Prepare materials
        asset.scene.traverse((child) => {
          if (child instanceof this.dependencies.THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material && child.material.map) {
              const newMaterial = new this.dependencies.THREE.MeshLambertMaterial({
                map: child.material.map,
                transparent: child.material.transparent,
                alphaTest: 0.1
              });
              child.material = newMaterial;
            }
          }
        });
        
        // Place trees near the island perimeter
        const angle = Math.random() * Math.PI * 2;
        const radius = 180 + Math.random() * 30; // Near the edge
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = this.getHeightAt(x, z);
        
        // Add natural variation
        asset.scene.rotation.y = Math.random() * Math.PI * 2;
        asset.scene.scale.multiplyScalar(0.9 + Math.random() * 0.2);
        
        const position = new this.dependencies.THREE.Vector3(x, y, z);
        const lodObject = this.createLODVegetation(asset.scene, position);
        
        this.vegetationGroup!.add(lodObject);
      }
      
      console.log(`🌳 Created ${treeCount} trees`);
      
    } catch (error) {
      console.error('Failed to create trees:', error);
    }
  }
  
  /**
   * Create stones and rocks for natural detail - using procedural generation
   */
  private async createStonesAndRocks(): Promise<void> {
    console.log('🪨 Creating procedural stones and rocks...');
    
    try {
      const vegetationSettings = this.getIntelligentVegetationSettings();
      const rockCount = Math.min(vegetationSettings.maxInstances, 15);
      
      for (let i = 0; i < rockCount; i++) {
        // Create procedural rock geometry
        const rockGeometry = new this.dependencies.THREE.DodecahedronGeometry(
          0.3 + Math.random() * 0.4, // Size variation
          0 // Detail level for performance
        );
        
        // Create rock material
        const rockMaterial = new this.dependencies.THREE.MeshLambertMaterial({
          color: new this.dependencies.THREE.Color().setHSL(
            0.1 + Math.random() * 0.1, // Brownish hue
            0.2 + Math.random() * 0.3, // Low saturation
            0.3 + Math.random() * 0.4  // Medium darkness
          )
        });
        
        const rockMesh = new this.dependencies.THREE.Mesh(rockGeometry, rockMaterial);
        
        // Set up rock properties
        rockMesh.castShadow = true;
        rockMesh.receiveShadow = true;
        
        // Scatter rocks naturally across the island
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.terrainParams.islandRadius * 0.9;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = this.getHeightAt(x, z);
        
        // Add natural variation
        rockMesh.rotation.set(
          Math.random() * Math.PI * 0.2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 0.2
        );
        rockMesh.scale.multiplyScalar(0.5 + Math.random() * 0.8);
        
        const position = new this.dependencies.THREE.Vector3(x, y, z);
        const lodObject = this.createLODVegetation(rockMesh, position);
        
        this.vegetationGroup!.add(lodObject);
      }
      
      console.log(`🪨 Created ${rockCount} stones and rocks`);
      
    } catch (error) {
      console.error('Failed to create stones and rocks:', error);
    }
  }
  
  /**
   * Create Level of Detail (LOD) system for vegetation
   */
  private createLODVegetation(instance: THREE.Object3D, position: THREE.Vector3): THREE.LOD | THREE.Object3D {
    try {
      const optimizationManager = this.dependencies.engine.getOptimizationManager();
      const optimizationLevel = optimizationManager.getOptimizationLevel();
      
      // Only use LOD on devices that can benefit from it (MEDIUM+ quality)
      if (optimizationLevel === 'ultra_low' || optimizationLevel === 'low') {
        // Simple placement for low-end devices
        instance.position.copy(position);
        return instance;
      }
      
      // Create LOD system for better performance on capable devices
      const lod = new this.dependencies.THREE.LOD();
      
      // Level 0: Full detail (close up)
      const highDetailInstance = instance.clone();
      highDetailInstance.position.copy(position);
      lod.addLevel(highDetailInstance, 0);
      
      // Level 1: Reduced detail (medium distance) - only for HIGH/ULTRA
      if (optimizationLevel === 'high' || optimizationLevel === 'ultra') {
        const mediumDetailInstance = this.createReducedDetailVegetation(instance);
        mediumDetailInstance.position.copy(position);
        lod.addLevel(mediumDetailInstance, 50);
      }
      
      // Level 2: Very low detail (far distance) - only for ULTRA
      if (optimizationLevel === 'ultra') {
        const lowDetailInstance = this.createLowDetailVegetation(instance);
        lowDetailInstance.position.copy(position);
        lod.addLevel(lowDetailInstance, 100);
      }
      
      // Register LOD object for updates
      this.lodObjects.push(lod);
      
      return lod;
      
    } catch (error) {
      console.warn('Error creating LOD vegetation:', error);
      instance.position.copy(position);
      return instance;
    }
  }
  
  private createReducedDetailVegetation(original: THREE.Object3D): THREE.Object3D {
    const simplified = original.clone();
    simplified.scale.multiplyScalar(0.8); // Slightly smaller
    
    // Reduce geometric complexity for medium distance
    simplified.traverse((child) => {
      if (child instanceof this.dependencies.THREE.Mesh && child.geometry) {
        // Simplify geometry if possible
        if (child.geometry.attributes.position.count > 100) {
          // For complex meshes, reduce by scaling
          child.scale.multiplyScalar(0.9);
        }
      }
    });
    
    return simplified;
  }
  
  private createLowDetailVegetation(original: THREE.Object3D): THREE.Object3D {
    const simplified = original.clone();
    simplified.scale.multiplyScalar(0.6); // Much smaller
    
    // Aggressive simplification for far distance
    simplified.traverse((child) => {
      if (child instanceof this.dependencies.THREE.Mesh && child.geometry) {
        // Use simpler materials for far distance
        if (child.material) {
          child.material = new this.dependencies.THREE.MeshBasicMaterial({
            color: child.material.color || 0x4a7c59,
            transparent: false
          });
        }
      }
    });
    
    return simplified;
  }
  
  /**
   * Fallback grass creation when asset loading fails
   */
  private createFallbackGrass(): void {
    console.log('🌱 Creating fallback grass (simple geometry)...');
    
    const grassGeometry = new this.dependencies.THREE.BoxGeometry(0.1, 0.5, 0.1);
    const grassMaterial = new this.dependencies.THREE.MeshLambertMaterial({ color: 0x4a7c59 });
    
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.terrainParams.hillRadius * 0.8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = this.getHeightAt(x, z);
      
      const grass = new this.dependencies.THREE.Mesh(grassGeometry, grassMaterial);
      grass.position.set(x, y + 0.25, z);
      grass.castShadow = true;
      grass.rotation.y = Math.random() * Math.PI * 2;
      grass.scale.multiplyScalar(0.8 + Math.random() * 0.4);
      
      this.vegetationGroup!.add(grass);
    }
  }
  
  private async createFireflies(): Promise<void> {
    if (!this.dependencies.engine) {
      console.warn('Engine not available, skipping fireflies');
      return;
    }
    
    try {
      // Detailed firefly configuration with slower movement parameters
      const fireflyConfig = {
        count: 80, // Keep all fireflies for visual richness
        // maxLights removed - let OptimizationManager control based on device capabilities
        colors: [
          0x87CEEB, // Sky blue
          0x98FB98, // Pale green
          0xFFFFE0, // Light yellow
          0xDDA0DD, // Plum
          0xF0E68C, // Khaki
          0xFFA07A, // Light salmon
          0x20B2AA, // Light sea green
          0x9370DB  // Medium purple
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
      
      this.fireflySystem = new FireflySystem(
        this.dependencies.THREE,
        this.dependencies.scene,
        fireflyConfig,
        (x: number, z: number) => this.getHeightAt(x, z)
      );
      
      await this.fireflySystem.initialize();
      
      console.log('✨ FireflySystem created with mobile optimization');
    } catch (error) {
      console.warn('Failed to create fireflies:', error);
    }
  }
}