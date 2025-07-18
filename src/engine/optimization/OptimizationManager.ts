import * as THREE from 'three';
import { Performance } from '../utils/Performance';
import { ResourceManager } from '../utils/ResourceManager';

/**
 * Global optimization manager that handles frustum culling, distance-based LOD,
 * device-specific optimizations, and asset streaming for the entire game engine.
 * 
 * Integrates with existing Performance, ResourceManager, and AssetLoader systems.
 * Automatically detects mobile devices and applies appropriate optimization profiles.
 */

// Quality levels for different device types
export enum OptimizationLevel {
  ULTRA_LOW = 'ultra_low',     // Very old/weak devices
  LOW = 'low',                 // Budget mobile devices  
  MEDIUM = 'medium',           // Mid-range devices
  HIGH = 'high',               // Flagship mobile/low-end desktop
  ULTRA = 'ultra'              // High-end desktop/gaming devices
}

interface OptimizationConfig {
  maxRenderDistance: number;
  unloadDistance: number;
  preloadDistance: number;
  lodDistances: number[];
  checkInterval: number;
  maxObjectsPerFrame: number;
  fadeDistance: number;
  fadeSpeed: number;
  shadowDistance: number; // Distance beyond which shadows are disabled
  maxShadowMapSize: number; // Maximum shadow map resolution
}

interface DeviceCapabilities {
  isMobile: boolean;
  isLowEnd: boolean;
  screenSize: { width: number; height: number };
  pixelRatio: number;
  estimatedGPUTier: 'low' | 'medium' | 'high' | 'ultra';
  supportsWebGL2: boolean;
  deviceMemory?: number; // GB of RAM if available
  hardwareConcurrency: number; // CPU cores
  maxTextureSize: number;
  deviceType: 'phone' | 'tablet' | 'desktop' | 'unknown';
  benchmarkScore?: number; // Performance benchmark result
}

interface QualitySettings {
  // Geometry complexity
  oceanSegments: { width: number; height: number };
  terrainSegments: { width: number; height: number };
  
  // Lighting
  maxFireflyLights: number;
  enableDynamicLighting: boolean;
  
  // Vegetation
  maxVegetationInstances: number;
  enableVegetation: boolean;
  
  // Materials
  textureResolution: number; // Max texture size
  enableProceduralTextures: boolean;
  enableNormalMaps: boolean;
  
  // Water Effects (Critical for performance)
  enableReflections: boolean;
  enableRefractions: boolean;
  
  // Rendering
  canvasScale: number; // Render resolution multiplier
  enablePostProcessing: boolean;
  enableShadows: boolean;
}
export class OptimizationManager {
  private static instance: OptimizationManager | null = null;
  
  private camera: THREE.Camera | null = null;
  private scene: THREE.Scene | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  
  // Culling system
  private frustum: THREE.Frustum = new THREE.Frustum();
  private cameraMatrix: THREE.Matrix4 = new THREE.Matrix4();
  
  // Distance-based management
  private managedObjects: Map<string, ManagedObject> = new Map();
  private objectsToCheck: THREE.Object3D[] = [];
  
  // Device capabilities and optimization level
  private deviceCapabilities: DeviceCapabilities | null = null;
  private currentOptimizationLevel: OptimizationLevel = OptimizationLevel.MEDIUM;
  private currentQualitySettings: QualitySettings | null = null;
  
  // Performance monitoring for real-time adaptation
  private averageFPS = 60;
  private frameTimeHistory: number[] = [];
  private lastPerformanceCheck = 0;
  private performanceCheckInterval = 5000; // Check every 5 seconds
  
  // Quality settings profiles for intelligent adaptation
  private readonly qualityProfiles: Record<OptimizationLevel, QualitySettings> = {
    [OptimizationLevel.ULTRA_LOW]: {
      // Minimal settings for very old devices - slight improvement
      oceanSegments: { width: 12, height: 12 },
      terrainSegments: { width: 16, height: 16 },
      maxFireflyLights: 0,
      enableDynamicLighting: false,
      maxVegetationInstances: 0,
      enableVegetation: false,
      textureResolution: 256,
      enableProceduralTextures: false,
      enableNormalMaps: false,
      // Water Effects - DISABLE ALL expensive effects for ultra_low
      enableReflections: false,
      enableRefractions: false,
      canvasScale: 0.6,
      enablePostProcessing: false,
      enableShadows: false
    },
    [OptimizationLevel.LOW]: {
      // Budget mobile devices - with camera-aware lighting
      oceanSegments: { width: 12, height: 12 },
      terrainSegments: { width: 16, height: 16 },
      maxFireflyLights: 4, // Moderate lights with camera-aware culling for rich visuals
      enableDynamicLighting: true, // Enable for firefly lighting
      maxVegetationInstances: 3,
      enableVegetation: true,
      textureResolution: 512,
      enableProceduralTextures: true,
      enableNormalMaps: false,
      // Water Effects - DISABLE ALL expensive effects for low
      enableReflections: false,
      enableRefractions: false,
      canvasScale: 0.75,
      enablePostProcessing: false,
      enableShadows: false
    },
    [OptimizationLevel.MEDIUM]: {
      // Mid-range devices (phones/tablets) - enhanced with camera-aware lighting
      oceanSegments: { width: 24, height: 24 },
      terrainSegments: { width: 32, height: 32 },
      maxFireflyLights: 8, // More lights with camera-aware culling
      enableDynamicLighting: true,
      maxVegetationInstances: 10,
      enableVegetation: true,
      textureResolution: 1024,
      enableProceduralTextures: true,
      enableNormalMaps: true,
      // Water Effects - DISABLE refractions but allow reflections for medium
      enableReflections: false,
      enableRefractions: false,
      canvasScale: 0.9,
      enablePostProcessing: false,
      enableShadows: true
    },
    [OptimizationLevel.HIGH]: {
      // Flagship mobile/entry desktop - enhanced with camera-aware lighting
      oceanSegments: { width: 32, height: 32 },
      terrainSegments: { width: 48, height: 48 },
      maxFireflyLights: 15, // Higher limit with camera-aware culling
      enableDynamicLighting: true,
      maxVegetationInstances: 15,
      enableVegetation: true,
      textureResolution: 1024,
      enableProceduralTextures: true,
      enableNormalMaps: true,
      // Water Effects - Enable reflections but DISABLE refractions for high
      enableReflections: true,
      enableRefractions: false,
      canvasScale: 1.0,
      enablePostProcessing: true,
      enableShadows: true
    },
    [OptimizationLevel.ULTRA]: {
      // High-end desktop/gaming devices - full quality with camera-aware lighting
      oceanSegments: { width: 64, height: 64 },
      terrainSegments: { width: 96, height: 96 },
      maxFireflyLights: 25, // High limit for rich lighting with camera-aware culling
      enableDynamicLighting: true,
      maxVegetationInstances: 30,
      enableVegetation: true,
      textureResolution: 2048,
      enableProceduralTextures: true,
      enableNormalMaps: true,
      // Water Effects - Enable ALL effects for ultra (only for high-end desktop)
      enableReflections: true,
      enableRefractions: true,
      canvasScale: 1.0,
      enablePostProcessing: true,
      enableShadows: true
    }
  };

  // Legacy configuration profiles (kept for compatibility)
  private readonly configProfiles: Record<OptimizationLevel, OptimizationConfig> = {
    [OptimizationLevel.ULTRA_LOW]: {
      maxRenderDistance: 1200,
      unloadDistance: 1400,
      preloadDistance: 800,
      lodDistances: [50, 150, 300],
      checkInterval: 300,
      maxObjectsPerFrame: 5,
      fadeDistance: 20,
      fadeSpeed: 4.0,
      shadowDistance: 0,
      maxShadowMapSize: 256
    },
    [OptimizationLevel.LOW]: {
      maxRenderDistance: 800, // Reduced render distance for better performance
      unloadDistance: 1000, // Reduced unload distance
      preloadDistance: 600, // Reduced preload distance
      lodDistances: [50, 150, 300], // More aggressive LOD switching
      checkInterval: 300, // Less frequent checks to reduce CPU usage
      maxObjectsPerFrame: 5, // Process fewer objects per frame
      fadeDistance: 30, // Shorter fade distance
      fadeSpeed: 4.0, // Faster fade to quickly cull distant objects
      shadowDistance: 0, // No shadows for performance
      maxShadowMapSize: 256
    },
    [OptimizationLevel.MEDIUM]: {
      maxRenderDistance: 1200,
      unloadDistance: 1400,
      preloadDistance: 1000,
      lodDistances: [150, 400, 700],
      checkInterval: 150,
      maxObjectsPerFrame: 20,
      fadeDistance: 60,
      fadeSpeed: 2.5,
      shadowDistance: 50,
      maxShadowMapSize: 1024
    },
    [OptimizationLevel.HIGH]: {
      maxRenderDistance: 1200,
      unloadDistance: 1400,
      preloadDistance: 1000,
      lodDistances: [200, 500, 800],
      checkInterval: 120,
      maxObjectsPerFrame: 30,
      fadeDistance: 80,
      fadeSpeed: 2.0,
      shadowDistance: 100,
      maxShadowMapSize: 1024
    },
    [OptimizationLevel.ULTRA]: {
      maxRenderDistance: 1500,
      unloadDistance: 1700,
      preloadDistance: 1200,
      lodDistances: [300, 600, 900],
      checkInterval: 60,
      maxObjectsPerFrame: 50,
      fadeDistance: 100,
      fadeSpeed: 1.5,
      shadowDistance: 200,
      maxShadowMapSize: 2048
    }
  };
  
  // Current active configuration
  private config: OptimizationConfig;
  
  private lastOptimizationCheck = 0;
  private optimizationStats = {
    objectsManaged: 0,
    objectsCulled: 0,
    objectsLoaded: 0,
    objectsUnloaded: 0,
    memoryFreed: 0
  };
  
  private constructor() {
    // Initialize with medium quality by default
    this.config = this.configProfiles[OptimizationLevel.MEDIUM];
    this.currentOptimizationLevel = OptimizationLevel.MEDIUM;
    this.currentQualitySettings = this.qualityProfiles[OptimizationLevel.MEDIUM];
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): OptimizationManager {
    if (!OptimizationManager.instance) {
      OptimizationManager.instance = new OptimizationManager();
    }
    return OptimizationManager.instance;
  }
  
  /**
   * Initialize the optimization system with core engine components
   */
  public initialize(camera: THREE.Camera, scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    
    // Detect device capabilities and set appropriate optimization level
    this.detectDeviceCapabilities();
    this.autoSetOptimizationLevel();
    
    console.log('🚀 OptimizationManager initialized with level:', this.currentOptimizationLevel);
  }

  /**
   * PHASE 2: Global Automated Clustering System
   * Automatically optimizes any level's environment by clustering small objects
   */
  public optimizeLevel(levelGroup: THREE.Group, optimizationConfig?: {
    clusterVegetation?: boolean;
    clusterDensity?: 'low' | 'medium' | 'high';
  }): void {
    if (!optimizationConfig?.clusterVegetation) {
      console.log('🎛️ Vegetation clustering disabled for this level');
      return;
    }

    console.log('🎛️ OptimizationManager: Starting automated level optimization...');
    
    // STEP 1: Scene Analysis - Find all vegetation objects
    const vegetationObjects = this.analyzeSceneForVegetation(levelGroup);
    
    if (vegetationObjects.length === 0) {
      console.log('🎛️ No vegetation found to cluster');
      return;
    }

    console.log(`🎛️ Found ${vegetationObjects.length} vegetation objects to cluster`);
    
    // STEP 2: Automated Clustering Logic
    const clusters = this.createAutomatedClusters(vegetationObjects, optimizationConfig.clusterDensity || 'medium');
    
    // STEP 3: Replace individual objects with clusters
    this.replaceIndividualObjectsWithClusters(levelGroup, vegetationObjects, clusters);
    
    console.log(`✅ OptimizationManager: Created ${clusters.length} clusters from ${vegetationObjects.length} objects`);
  }

  /**
   * STEP 1: Analyze scene to identify small vegetation objects that should be clustered
   */
  private analyzeSceneForVegetation(levelGroup: THREE.Group): THREE.Object3D[] {
    const vegetationObjects: THREE.Object3D[] = [];
    
    levelGroup.traverse((object) => {
      // Identify vegetation by name patterns and size
      const name = object.name.toLowerCase();
      const isVegetation = name.includes('grass') || 
                          name.includes('flower') || 
                          name.includes('bush') ||
                          name.includes('vegetation') ||
                          (object instanceof THREE.Mesh && this.isSmallMesh(object));
      
      // Only cluster objects that aren't already clusters
      if (isVegetation && !name.includes('cluster') && object.parent === levelGroup) {
        vegetationObjects.push(object);
      }
    });
    
    return vegetationObjects;
  }

  /**
   * Check if a mesh is small enough to be considered for clustering
   */
  private isSmallMesh(mesh: THREE.Mesh): boolean {
    const bbox = new THREE.Box3().setFromObject(mesh);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    // Objects smaller than 10 units are candidates for clustering
    return maxDimension < 10;
  }

  /**
   * STEP 2: Create spatial clusters from vegetation objects
   */
  private createAutomatedClusters(objects: THREE.Object3D[], density: 'low' | 'medium' | 'high'): THREE.Group[] {
    // Determine cluster parameters based on density setting
    const clusterParams = {
      low: { maxClusters: 8, clusterRadius: 25 },
      medium: { maxClusters: 12, clusterRadius: 20 },
      high: { maxClusters: 16, clusterRadius: 15 }
    }[density];

    const clusters: THREE.Group[] = [];
    const unassigned = [...objects];

    // Use spatial clustering algorithm
    while (unassigned.length > 0 && clusters.length < clusterParams.maxClusters) {
      const cluster = new THREE.Group();
      cluster.name = `auto_vegetation_cluster_${clusters.length}`;
      
      // Start with the first unassigned object
      const seedObject = unassigned.shift()!;
      cluster.add(seedObject.clone());
      
      // Find nearby objects to add to this cluster
      const clusterCenter = seedObject.position.clone();
      const objectsInCluster = [seedObject];
      
      // Find objects within cluster radius
      for (let i = unassigned.length - 1; i >= 0; i--) {
        const object = unassigned[i];
        const distance = object.position.distanceTo(clusterCenter);
        
        if (distance <= clusterParams.clusterRadius) {
          cluster.add(object.clone());
          objectsInCluster.push(object);
          unassigned.splice(i, 1);
        }
      }
      
      // Position cluster at the centroid of its objects
      const centroid = new THREE.Vector3();
      objectsInCluster.forEach(obj => centroid.add(obj.position));
      centroid.divideScalar(objectsInCluster.length);
      cluster.position.copy(centroid);
      
      // Adjust child positions to be relative to cluster center
      cluster.children.forEach((child, index) => {
        const originalPos = objectsInCluster[index].position;
        child.position.copy(originalPos.clone().sub(centroid));
      });
      
      clusters.push(cluster);
    }
    
    // Handle any remaining objects by adding them to the nearest cluster
    unassigned.forEach(object => {
      let nearestCluster = clusters[0];
      let nearestDistance = object.position.distanceTo(nearestCluster.position);
      
      clusters.forEach(cluster => {
        const distance = object.position.distanceTo(cluster.position);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestCluster = cluster;
        }
      });
      
      if (nearestCluster) {
        const clonedObject = object.clone();
        clonedObject.position.copy(object.position.clone().sub(nearestCluster.position));
        nearestCluster.add(clonedObject);
      }
    });
    
    return clusters;
  }

  /**
   * STEP 3: Replace individual objects with MERGED GEOMETRY clusters
   * CRITICAL: This performs geometry merging to eliminate draw call bottlenecks
   */
  private replaceIndividualObjectsWithClusters(
    levelGroup: THREE.Group, 
    originalObjects: THREE.Object3D[], 
    clusters: THREE.Group[]
  ): void {
    // Remove original individual objects
    originalObjects.forEach(object => {
      if (object.parent) {
        object.parent.remove(object);
      }
    });
    
    // Add MERGED clusters to the level
    clusters.forEach(cluster => {
      // PERFORMANCE CRITICAL: Merge geometries within each cluster
      const mergedCluster = this.createMergedGeometryCluster(cluster);
      levelGroup.add(mergedCluster);
      
      // Register the merged cluster for optimization
      this.autoRegisterObject(mergedCluster);
    });
    
    console.log(`🚀 GPU Optimization: Converted ${originalObjects.length} draw calls into ${clusters.length} merged meshes`);
  }

  /**
   * GEOMETRY MERGING: Convert a cluster of individual objects into a single merged mesh
   * This is the key optimization that eliminates GPU draw call bottlenecks
   */
  private createMergedGeometryCluster(cluster: THREE.Group): THREE.Mesh | THREE.Group {
    try {
      const meshesToMerge: { geometry: THREE.BufferGeometry; material: THREE.Material; matrix: THREE.Matrix4 }[] = [];
      let sharedMaterial: THREE.Material | null = null;

      // Collect all meshes and their transforms from the cluster
      cluster.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry && child.material) {
          // Update world matrix to get correct transforms
          child.updateWorldMatrix(true, false);
          
          // Clone geometry and apply transforms
          const geometry = child.geometry.clone();
          geometry.applyMatrix4(child.matrixWorld);
          
          // Use the first material as shared material (assumes similar vegetation uses same material)
          if (!sharedMaterial) {
            sharedMaterial = Array.isArray(child.material) ? child.material[0] : child.material;
          }
          
          meshesToMerge.push({
            geometry,
            material: Array.isArray(child.material) ? child.material[0] : child.material,
            matrix: child.matrixWorld.clone()
          });
        }
      });

      if (meshesToMerge.length === 0) {
        console.warn('No meshes found to merge in cluster');
        return cluster; // Return original cluster if no meshes to merge
      }

      // Ensure we have a material
      if (!sharedMaterial) {
        console.warn('No material found for merging, using default');
        sharedMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
      }

      // Merge geometries using Three.js BufferGeometryUtils
      const geometriesToMerge = meshesToMerge.map(item => item.geometry);
      
      // Use Three.js built-in merging (available in newer versions)
      let mergedGeometry: THREE.BufferGeometry;
      
      if (geometriesToMerge.length === 1) {
        mergedGeometry = geometriesToMerge[0];
      } else {
        // Manual geometry merging for compatibility
        mergedGeometry = this.manualMergeGeometries(geometriesToMerge);
      }

      // Create single merged mesh
      const mergedMesh = new THREE.Mesh(mergedGeometry, sharedMaterial);
      mergedMesh.name = `${cluster.name}_merged`;
      mergedMesh.castShadow = true;
      mergedMesh.receiveShadow = true;

      // Position at cluster center
      mergedMesh.position.copy(cluster.position);

      console.log(`🔧 Merged ${meshesToMerge.length} objects into 1 mesh: ${mergedMesh.name}`);
      return mergedMesh;

    } catch (error) {
      console.error('Failed to merge cluster geometry:', error);
      return cluster; // Return original cluster if merging fails
    }
  }

  /**
   * Manual geometry merging for compatibility with all Three.js versions
   */
  private manualMergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const mergedGeometry = new THREE.BufferGeometry();
    
    let positionArray: number[] = [];
    let normalArray: number[] = [];
    let uvArray: number[] = [];
    let indexArray: number[] = [];
    let currentIndexOffset = 0;

    geometries.forEach(geometry => {
      const positions = geometry.attributes.position;
      const normals = geometry.attributes.normal;
      const uvs = geometry.attributes.uv;
      const indices = geometry.index;

      if (positions) {
        positionArray.push(...Array.from(positions.array));
      }
      if (normals) {
        normalArray.push(...Array.from(normals.array));
      }
      if (uvs) {
        uvArray.push(...Array.from(uvs.array));
      }
      if (indices) {
        const offsetIndices = Array.from(indices.array).map(i => i + currentIndexOffset);
        indexArray.push(...offsetIndices);
        currentIndexOffset += positions.count;
      }
    });

    // Set merged attributes
    if (positionArray.length > 0) {
      mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positionArray, 3));
    }
    if (normalArray.length > 0) {
      mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalArray, 3));
    }
    if (uvArray.length > 0) {
      mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
    }
    if (indexArray.length > 0) {
      mergedGeometry.setIndex(indexArray);
    }

    // Compute bounding sphere for frustum culling
    mergedGeometry.computeBoundingSphere();
    
    return mergedGeometry;
  }

  /**
   * Intelligent device capability detection with detailed analysis
   */
  private detectDeviceCapabilities(): void {
    // Guard against running in a non-browser environment (e.g., SSR)
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || typeof document === 'undefined') {
      console.warn('⚠️ OptimizationManager: Cannot detect device capabilities in a non-browser environment. Using defaults.');
      return;
    }

    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Tablet|PlayBook/i.test(userAgent) || (window.innerWidth > 768 && isMobile);
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const pixelRatio = window.devicePixelRatio || 1;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    // Detect device type more accurately
    let deviceType: 'phone' | 'tablet' | 'desktop' | 'unknown' = 'unknown';
    if (!isMobile) {
      deviceType = 'desktop';
    } else if (isTablet) {
      deviceType = 'tablet';
    } else {
      deviceType = 'phone';
    }
    
    // Get WebGL context and capabilities
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const gl2 = canvas.getContext('webgl2');
    const supportsWebGL2 = !!gl2;
    
    let maxTextureSize = 2048; // Conservative default
    if (gl && 'getParameter' in gl) {
      const webglContext = gl as WebGLRenderingContext;
      maxTextureSize = webglContext.getParameter(webglContext.MAX_TEXTURE_SIZE);
    }
    
    // Detect device memory if available (needed for GPU tier estimation)
    let deviceMemory: number | undefined;
    if ('deviceMemory' in navigator) {
      deviceMemory = (navigator as any).deviceMemory;
    }
    
    // Advanced GPU tier estimation
    let estimatedGPUTier: 'low' | 'medium' | 'high' | 'ultra' = 'medium';
    
    if (isMobile) {
      // Mobile GPU estimation based on multiple factors
      const totalPixels = screenWidth * screenHeight * pixelRatio;
      const deviceYear = this.estimateDeviceYear(userAgent);
      
      if (totalPixels > 6000000 && deviceYear >= 2022 && hardwareConcurrency >= 8) {
        estimatedGPUTier = 'ultra'; // Flagship phones like iPhone 15 Pro, S24 Ultra
      } else if (totalPixels > 4000000 && deviceYear >= 2020 && hardwareConcurrency >= 6) {
        estimatedGPUTier = 'high'; // High-end phones
      } else if (totalPixels > 2000000 && deviceYear >= 2019) {
        estimatedGPUTier = 'medium'; // Mid-range phones
      } else {
        estimatedGPUTier = 'low'; // Budget/old phones
      }
    } else {
      // Desktop GPU estimation - MUCH more conservative for ULTRA quality
      // Only assign ULTRA to devices that can definitely handle expensive refractions
      if (maxTextureSize >= 16384 && hardwareConcurrency >= 24 && (deviceMemory && deviceMemory >= 16)) {
        estimatedGPUTier = 'ultra'; // True high-end gaming PCs with dedicated GPU
      } else if (maxTextureSize >= 8192 && hardwareConcurrency >= 8) {
        estimatedGPUTier = 'high'; // Mid-high end desktops
      } else if (maxTextureSize >= 4096) {
        estimatedGPUTier = 'medium'; // Standard desktops
      } else {
        estimatedGPUTier = 'low'; // Old or integrated graphics
      }
    }
    
    // Enhanced low-end detection
    const isLowEnd = (
      estimatedGPUTier === 'low' ||
      hardwareConcurrency < 4 ||
      (deviceMemory && deviceMemory < 4) ||
      maxTextureSize < 2048
    );
    
    this.deviceCapabilities = {
      isMobile,
      isLowEnd,
      screenSize: { width: screenWidth, height: screenHeight },
      pixelRatio,
      estimatedGPUTier,
      supportsWebGL2,
      deviceMemory,
      hardwareConcurrency,
      maxTextureSize,
      deviceType
    };

    console.log('📱 Advanced device detection:', {
      deviceType,
      estimatedGPUTier,
      hardwareConcurrency,
      maxTextureSize,
      totalPixels: screenWidth * screenHeight * pixelRatio,
      deviceMemory: deviceMemory || 'unknown'
    });
  }

  /**
   * Estimate device release year based on user agent patterns
   */
  private estimateDeviceYear(userAgent: string): number {
    const currentYear = new Date().getFullYear();
    
    // iPhone patterns
    if (/iPhone/.test(userAgent)) {
      if (/iPhone1[5-9]|iPhone[2-9][0-9]/.test(userAgent)) return currentYear; // iPhone 15+
      if (/iPhone1[2-4]/.test(userAgent)) return 2022; // iPhone 12-14
      if (/iPhone1[0-1]/.test(userAgent)) return 2019; // iPhone X-11
      return 2018; // Older iPhones
    }
    
    // Android patterns (approximate based on Android version)
    if (/Android/.test(userAgent)) {
      const androidMatch = userAgent.match(/Android (\d+)/);
      if (androidMatch) {
        const version = parseInt(androidMatch[1]);
        if (version >= 14) return 2023;
        if (version >= 13) return 2022;
        if (version >= 12) return 2021;
        if (version >= 11) return 2020;
        if (version >= 10) return 2019;
        return 2018;
      }
    }
    
    // Default to slightly older for unknown devices
    return currentYear - 2;
  }

  /**
   * Automatically set optimization level based on device capabilities
   */
  private autoSetOptimizationLevel(): void {
    if (!this.deviceCapabilities) return;
    
    const { isMobile, isLowEnd, estimatedGPUTier } = this.deviceCapabilities;
    
    if (isMobile) {
      // Use the correct enum values for mobile devices, which now map to LOW, MEDIUM, and HIGH.
      if (isLowEnd || estimatedGPUTier === 'low') {
        this.setOptimizationLevel(OptimizationLevel.LOW);
      } else if (estimatedGPUTier === 'high') {
        this.setOptimizationLevel(OptimizationLevel.HIGH);
      } else {
        this.setOptimizationLevel(OptimizationLevel.MEDIUM);
      }
    } else {
      // Use ULTRA for high-end desktops and HIGH for others.
      if (estimatedGPUTier === 'ultra') {
        this.setOptimizationLevel(OptimizationLevel.ULTRA);
      } else {
        this.setOptimizationLevel(OptimizationLevel.HIGH);
      }
    }
  }

  /**
   * Set the optimization level and apply corresponding configuration
   */
  public setOptimizationLevel(level: OptimizationLevel): void {
    this.currentOptimizationLevel = level;
    this.config = this.configProfiles[level];
    this.currentQualitySettings = this.qualityProfiles[level];
    
    console.log(`🎛️ Optimization level set to: ${level}`, {
      config: this.config,
      qualitySettings: this.currentQualitySettings
    });
    
    // Emit event for other systems to react to quality changes
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('optimizationLevelChanged', { 
        detail: { 
          level, 
          config: this.config, 
          qualitySettings: this.currentQualitySettings,
          deviceCapabilities: this.deviceCapabilities 
        }
      }));
    }
  }

  /**
   * Get current optimization level
   */
  public getOptimizationLevel(): OptimizationLevel {
    return this.currentOptimizationLevel;
  }

  /**
   * Get current quality settings for dynamic system configuration
   */
  public getQualitySettings(): QualitySettings {
    return this.currentQualitySettings || this.qualityProfiles[this.currentOptimizationLevel];
  }

  /**
   * Get device capabilities for system-specific optimizations
   */
  public getDeviceCapabilities(): DeviceCapabilities | null {
    return this.deviceCapabilities;
  }

  /**
   * Get device capabilities
   */
  public getDeviceCapabilities(): DeviceCapabilities | null {
    return this.deviceCapabilities;
  }

  /**
   * Get current optimization configuration
   */
  public getOptimizationConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Get optimization statistics for debugging
   */
  public getOptimizationStats() {
    return {
      ...this.optimizationStats,
      managedObjectsCount: this.managedObjects.size,
      objectsToCheckCount: this.objectsToCheck.length,
      currentOptimizationLevel: this.currentOptimizationLevel,
      managedObjectsList: Array.from(this.managedObjects.values()).map(obj => ({
        name: obj.object.name,
        type: obj.type,
        priority: obj.priority,
        isVisible: obj.isVisible,
        currentOpacity: obj.currentOpacity,
        distanceToCamera: obj.distanceToCamera
      }))
    };
  }

  /**
   * Optimize texture for mobile devices
   */
  public optimizeTexture(texture: THREE.Texture): THREE.Texture {
    if (!this.deviceCapabilities?.isMobile) return texture;
    
    // Enable mipmapping for better performance on mobile
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    // Reduce texture size for low-end mobile devices
    if (this.deviceCapabilities.isLowEnd || this.currentOptimizationLevel === OptimizationLevel.ULTRA_LOW || this.currentOptimizationLevel === OptimizationLevel.LOW) {
      // Reduce texture resolution by half on low-end devices
      if (texture.image && texture.image.width > 512) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx && texture.image) {
          const originalWidth = texture.image.width;
          const originalHeight = texture.image.height;
          const newWidth = Math.max(256, originalWidth / 2);
          const newHeight = Math.max(256, originalHeight / 2);
          
          canvas.width = newWidth;
          canvas.height = newHeight;
          ctx.drawImage(texture.image, 0, 0, newWidth, newHeight);
          
          texture.image = canvas;
          texture.needsUpdate = true;
        }
      }
    }
    
    // Set appropriate wrap modes for performance
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    
    return texture;
  }

  /**
   * Optimize material for mobile devices
   */
  public optimizeMaterial(material: THREE.Material): THREE.Material {
    if (!this.deviceCapabilities?.isMobile) return material;
    
    // Reduce material complexity on mobile
    if (material instanceof THREE.MeshStandardMaterial || 
        material instanceof THREE.MeshPhysicalMaterial) {
      
      const stdMaterial = material as THREE.MeshStandardMaterial;
      
      // Reduce roughness map resolution on low-end devices
      if (this.deviceCapabilities.isLowEnd && stdMaterial.roughnessMap) {
        stdMaterial.roughnessMap = this.optimizeTexture(stdMaterial.roughnessMap);
      }
      
      // Optimize normal maps
      if (stdMaterial.normalMap) {
        stdMaterial.normalMap = this.optimizeTexture(stdMaterial.normalMap);
        // Reduce normal map intensity on low-end devices
        if (this.deviceCapabilities.isLowEnd && stdMaterial.normalScale) {
          stdMaterial.normalScale.setScalar(Math.min(stdMaterial.normalScale.x * 0.7, 1.0));
        }
      }
      
      // Optimize diffuse/albedo textures
      if (stdMaterial.map) {
        stdMaterial.map = this.optimizeTexture(stdMaterial.map);
      }
      
      // Disable expensive features on low-end mobile
      if (this.currentOptimizationLevel === OptimizationLevel.ULTRA_LOW) {
        if (material instanceof THREE.MeshPhysicalMaterial) {
          const physMaterial = material as THREE.MeshPhysicalMaterial;
          physMaterial.clearcoat = 0;
          physMaterial.clearcoatRoughness = 1;
          physMaterial.transmission = 0;
        }
      }
    }
    
    return material;
  }

  /**
   * Create a simplified LOD version of a mesh for distant viewing
   */
  public createLODMesh(originalMesh: THREE.Mesh, lodLevel: number = 1): THREE.Mesh {
    if (!this.deviceCapabilities?.isMobile || lodLevel === 0) return originalMesh;
    
    const geometry = originalMesh.geometry;
    let simplifiedGeometry: THREE.BufferGeometry;
    
    // Create simplified geometry based on LOD level
    if (geometry instanceof THREE.BufferGeometry) {
      // Simple decimation approach - reduce vertex count
      const positions = geometry.getAttribute('position');
      const indices = geometry.getIndex();
      
      if (positions && indices) {
        const decimationFactor = Math.pow(2, lodLevel); // 2x, 4x, 8x reduction
        const newIndexCount = Math.max(6, Math.floor(indices.count / decimationFactor)); // Minimum triangle count
        
        // Create new simplified indices by skipping vertices
        const newIndices: number[] = [];
        for (let i = 0; i < newIndexCount && i < indices.count; i += 3) {
          const stride = Math.floor(indices.count / newIndexCount) * 3;
          const baseIndex = (i / 3) * stride;
          
          if (baseIndex + 2 < indices.count) {
            newIndices.push(
              indices.getX(baseIndex),
              indices.getX(baseIndex + 1), 
              indices.getX(baseIndex + 2)
            );
          }
        }
        
        simplifiedGeometry = new THREE.BufferGeometry();
        simplifiedGeometry.setAttribute('position', positions);
        
        // Copy other attributes if they exist
        if (geometry.getAttribute('normal')) {
          simplifiedGeometry.setAttribute('normal', geometry.getAttribute('normal'));
        }
        if (geometry.getAttribute('uv')) {
          simplifiedGeometry.setAttribute('uv', geometry.getAttribute('uv'));
        }
        
        simplifiedGeometry.setIndex(newIndices);
        simplifiedGeometry.computeBoundingSphere();
        simplifiedGeometry.computeBoundingBox();
      } else {
        // Fallback to original geometry if no indices
        simplifiedGeometry = geometry;
      }
    } else {
      // Fallback for non-BufferGeometry
      simplifiedGeometry = geometry;
    }
    
    // Create LOD mesh with optimized material
    const materialToUse = Array.isArray(originalMesh.material) ? 
      originalMesh.material[0].clone() : originalMesh.material.clone();
    
    const lodMesh = new THREE.Mesh(
      simplifiedGeometry,
      this.optimizeMaterial(materialToUse)
    );
    
    // Copy transform properties
    lodMesh.position.copy(originalMesh.position);
    lodMesh.rotation.copy(originalMesh.rotation);
    lodMesh.scale.copy(originalMesh.scale);
    lodMesh.name = originalMesh.name + '_LOD' + lodLevel;
    
    return lodMesh;
  }

  /**
   * Disable optimization system (for debugging)
   */
  public disableOptimization(): void {
    console.log('🚫 Disabling optimization system for debugging');
    
    // Make all managed objects fully visible
    this.managedObjects.forEach(managedObject => {
      managedObject.object.visible = true;
      if (managedObject.object instanceof THREE.Mesh && managedObject.object.material) {
        const material = managedObject.object.material as THREE.Material;
        if ('opacity' in material) {
          material.opacity = 1.0;
          material.transparent = false;
        }
      }
      managedObject.currentOpacity = 1.0;
      managedObject.isVisible = true;
    });
    
    // Clear managed objects
    this.managedObjects.clear();
    this.objectsToCheck = [];
  }

  /**
   * Enable optimization system
   */
  public enableOptimization(): void {
    console.log('✅ Enabling optimization system');
    // Optimization will resume on next update cycle
  }
  
  /**
   * Automatically scan scene for objects that need optimization
   * This is called automatically - no manual registration needed
   */
  private scanSceneForOptimization(): void {
    if (!this.scene) return;
    
    // Find all objects that match optimization criteria
    this.scene.traverse((object) => {
      // Skip if already managed
      if (this.objectsToCheck.includes(object)) return;
      
      
      // Skip system objects (cameras, etc.)
      if (object.type === 'Camera') return;
      
      // Include vegetation, decorations, and similar objects
      if (this.shouldOptimizeObject(object)) {
        this.autoRegisterObject(object);
      }
    });
  }

  /**
   * Perform light culling for performance - separate from material optimization
   */
  private performLightCulling(): void {
    if (!this.scene || !this.camera) return;
    
    // Find and cull lights based on distance and frustum
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light || 
          object instanceof THREE.DirectionalLight || 
          object instanceof THREE.AmbientLight ||
          object instanceof THREE.PointLight ||
          object instanceof THREE.SpotLight) {
        
        const distance = this.camera!.position.distanceTo(object.position);
        
        // Safe frustum check - some lights don't have proper geometry/boundingSphere
        let isInFrustum = true; // Default to visible if frustum check fails
        try {
          // Only do frustum culling for PointLight and SpotLight which have defined ranges
          if (object instanceof THREE.PointLight || object instanceof THREE.SpotLight) {
            // Create a simple sphere for frustum testing
            const sphere = new THREE.Sphere(object.position, object.distance || 50);
            isInFrustum = this.frustum.intersectsSphere(sphere);
          }
          // DirectionalLight and AmbientLight affect the entire scene, so don't cull them by frustum
        } catch (error) {
          // If frustum check fails, assume light is visible
          isInFrustum = true;
        }
        
        // Cull lights that are too far away or outside frustum for performance
        const shouldBeActive = isInFrustum && distance <= this.config.maxRenderDistance * 1.5;
        
        // Only modify light visibility, never materials of other objects
        if (object.visible !== shouldBeActive) {
          object.visible = shouldBeActive;
        }
      }
    });
  }
  
  /**
   * Determine if an object should be optimized
   */
  private shouldOptimizeObject(object: THREE.Object3D): boolean {
    // SEPARATE CONCERNS: Light culling vs Material modification
    // Light culling is handled separately and is always allowed for performance
    // This method only determines if we should do distance-based material fading
    
    // NEVER optimize essential game objects for material fading
    if (this.isEssentialObject(object)) {
      return false;
    }
    
    // Only allow material optimization on objects that explicitly opt-in
    // This prevents accidental modification of objects owned by other systems
    const name = object.name.toLowerCase();
    
    // Only optimize objects with explicit optimization markers
    if (name.includes('_optimizable') || 
        object.userData.allowOptimization === true) {
      return true;
    }
    
    // Legacy support: Only specific vegetation types that are safe to modify
    if (object instanceof THREE.Points && name.match(/(grass|flower|particle)/i) && !name.match(/fireflies/i)) {
      return true;
    }
    
    // Very conservative approach: Only modify objects that are clearly decorative and small
    if (object instanceof THREE.Mesh) {
      const bbox = new THREE.Box3().setFromObject(object);
      const size = bbox.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);
      
      // Only very small decorative objects and only if they have safe naming
      if (maxDimension < 5 && name.match(/(small|tiny|decoration|ornament)/i)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if an object is essential and should never be optimized
   */
  private isEssentialObject(object: THREE.Object3D): boolean {
    const name = object.name.toLowerCase();
    
    // NEVER optimize lighting objects - this is critical for scene visibility
    if (object instanceof THREE.Light || 
        object instanceof THREE.DirectionalLight || 
        object instanceof THREE.AmbientLight ||
        object instanceof THREE.PointLight ||
        object instanceof THREE.SpotLight ||
        name.match(/(light|lamp|sun|moon|ambient|directional|point|spot)/i)) {
      return true;
    }
    
    // NEVER optimize Groups that contain lights as DIRECT children - this is the core fix
    if (object instanceof THREE.Group) {
      let containsLights = false;
      // Only check direct children, not entire hierarchy to avoid overly broad protection
      for (const child of object.children) {
        if (child instanceof THREE.Light || 
            child instanceof THREE.DirectionalLight || 
            child instanceof THREE.AmbientLight ||
            child instanceof THREE.PointLight ||
            child instanceof THREE.SpotLight) {
          containsLights = true;
          break;
        }
      }
      if (containsLights) {
        return true;
      }
    }
    
    // NEVER optimize fireflies - they provide essential lighting
    if (name.match(/fireflies/i) || name.match(/firefly/i)) {
      return true;
    }
    
    // Essential terrain and environment objects
    if (name.match(/(ground|terrain|floor|base|platform|skybox|sky|water|pool)/i)) {
      return true;
    }
    
    // Essential structural objects
    if (name.match(/(wall|building|structure|foundation|observatory|main)/i)) {
      return true;
    }
    
    // Level containers and main groups
    if (name.match(/(level|group|container|scene|root)/i)) {
      return true;
    }
    
    // Camera and control objects
    if (object instanceof THREE.Camera || name.match(/(camera|control|helper)/i)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if a mesh is a small decoration that can be optimized
   */
  private isDecorationMesh(object: THREE.Mesh): boolean {
    const name = object.name.toLowerCase();
    
    // NEVER optimize essential objects, even if they're meshes
    if (name.match(/(ground|terrain|floor|water|main|base|primary|skybox|sky)/i)) {
      return false;
    }
    
    // Get bounding box to check object size
    const bbox = new THREE.Box3().setFromObject(object);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    // Don't optimize very large objects (likely terrain/buildings)
    if (maxDimension > 50) {
      return false;
    }
    
    // Include known decoration patterns
    if (name.match(/(prop|decoration|ornament|detail|small|rock|stone|tree|bush|flower|grass)/i)) {
      return true;
    }
    
    // For unnamed or generically named objects, optimize them if they're small-medium size
    if (maxDimension < 30) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Automatically register an object (used by scene scanning)
   */
  private autoRegisterObject(object: THREE.Object3D): void {
    // FINAL SAFETY CHECK - NEVER register lighting objects
    if (object instanceof THREE.Light || 
        object instanceof THREE.DirectionalLight || 
        object instanceof THREE.AmbientLight ||
        object instanceof THREE.PointLight ||
        object instanceof THREE.SpotLight ||
        (object as any).isLight ||
        object.type === 'Light') {
      console.warn(`🚨 Attempted to register lighting object for optimization: "${object.name}" - BLOCKED`);
      return;
    }
    
    const id = this.generateObjectId(object);
    const type = this.inferObjectType(object);
    const priority = this.inferObjectPriority(object);
    
    // Debug logging disabled - system is working properly
    // if (this.deviceCapabilities?.isMobile) {
    //   console.log(`🎛️ Registering object for optimization: "${object.name}" (${object.constructor.name}) - Type: ${type}, Priority: ${priority}`);
    // }
    
    const managedObject: ManagedObject = {
      object,
      id,
      type,
      priority,
      isLoaded: true,
      isVisible: true,
      distanceToCamera: 0,
      currentLOD: 0,
      lastUpdateTime: Date.now()
    };
    
    this.managedObjects.set(id, managedObject);
    this.objectsToCheck.push(object);
    this.optimizationStats.objectsManaged++;
  }
  
  /**
   * Generate a unique ID for an object
   */
  private generateObjectId(object: THREE.Object3D): string {
    const type = this.inferObjectType(object);
    const uuid = object.uuid.slice(0, 8);
    return `${type}_${uuid}`;
  }
  
  /**
   * Infer object type from name/properties
   */
  private inferObjectType(object: THREE.Object3D): 'vegetation' | 'decoration' | 'structure' | 'effect' {
    const name = object.name.toLowerCase();
    
    if (name.match(/(grass|tree|bush|flower|plant)/)) {
      return 'vegetation';
    }
    
    if (name.match(/(decoration|ornament|prop)/)) {
      return 'decoration';
    }
    
    if (name.match(/(building|structure|wall|platform)/)) {
      return 'structure';
    }
    
    if (name.match(/(particle|effect|glow|light)/)) {
      return 'effect';
    }
    
    // Default based on object properties
    if (object instanceof THREE.Points) {
      return 'effect';
    }
    
    return 'decoration';
  }
  
  /**
   * Infer object priority from size/distance
   */
  private inferObjectPriority(object: THREE.Object3D): 'low' | 'medium' | 'high' {
    const distance = object.position.length();
    
    if (distance < 50) {
      return 'high';
    } else if (distance < 100) {
      return 'medium';
    } else {
      return 'low';
    }
  }
  
  /**
   * Unregister an object from optimization management
   */
  public unregisterObject(id: string): void {
    const managedObject = this.managedObjects.get(id);
    if (managedObject) {
      // Remove from check list
      const index = this.objectsToCheck.indexOf(managedObject.object);
      if (index > -1) {
        this.objectsToCheck.splice(index, 1);
      }
      
      // Clean up if needed
      if (managedObject.unloadCallback) {
        managedObject.unloadCallback();
      }
      
      this.managedObjects.delete(id);
      this.optimizationStats.objectsManaged--;
      
      console.log(`🗑️ Unregistered object from optimization: ${id}`);
    }
  }
  
  /**
   * Simple distance-based fading - no complex optimizations
   */
  public update(deltaTime: number): void {
    if (!this.camera || !this.scene) return;

    this.lastOptimizationCheck += deltaTime * 1000; // Convert to ms

    // Periodically scan the scene for new objects to manage
    if (this.lastOptimizationCheck > this.config.checkInterval) {
      this.scanSceneForOptimization();
      this.performLightCulling(); // Separate light culling for performance
      this.lastOptimizationCheck = 0;
    }

    // Update the camera frustum for culling checks
    this.updateFrustum();

    // PERFORMANCE FIX: Drastically reduce batch processing to prevent frame spikes
    const objectsToProcess = Array.from(this.managedObjects.values());
    // Only process a few objects per frame, regardless of config
    const maxBatchSize = Math.min(5, this.config.maxObjectsPerFrame); // Never more than 5 per frame
    const batchSize = Math.min(objectsToProcess.length, maxBatchSize);

    // Only process if we have objects and it's time to do optimization work
    if (batchSize > 0 && this.lastOptimizationCheck % 100 < 50) { // Only 50% of frames
      for (let i = 0; i < batchSize; i++) {
        // Cycle through objects to ensure all get updated over time
        const objectIndex = (Math.floor(this.lastOptimizationCheck / 10) + i) % objectsToProcess.length;
        const managedObject = objectsToProcess[objectIndex];
        if (managedObject) {
          this.optimizeObject(managedObject.object, deltaTime);
        }
      }
    }
  }
  
  /**
   * Update camera frustum for culling calculations
   */
  private updateFrustum(): void {
    if (!this.camera || !this.renderer) return;
    
    this.cameraMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);
  }
  
  /**
   * Optimize a single object based on distance and visibility
   */
  private optimizeObject(object: THREE.Object3D, deltaTime: number): void {
    if (!this.camera) return;
    
    // Find the managed object data
    const managedObject = Array.from(this.managedObjects.values())
      .find(mo => mo.object === object);
    
    if (!managedObject) return;
    
    // Calculate distance to camera
    const distance = this.camera.position.distanceTo(object.position);
    managedObject.distanceToCamera = distance;
    
    // Check if object is within frustum
    const isInFrustum = this.frustum.intersectsObject(object);
    
    // Apply shadow optimization based on distance
    this.optimizeShadows(object, distance);
    
    // Make optimization decisions
    this.applyOptimization(managedObject, distance, isInFrustum, deltaTime);
  }
  
  /**
   * Optimize shadows based on distance to camera
   */
  private optimizeShadows(object: THREE.Object3D, distance: number): void {
    const shouldCastShadows = distance <= this.config.shadowDistance;
    const shouldReceiveShadows = distance <= this.config.shadowDistance * 1.2; // Slightly larger range for receiving
    
    object.traverse((child) => {
      // Optimize mesh shadows
      if (child instanceof THREE.Mesh) {
        if (child.castShadow !== shouldCastShadows) {
          child.castShadow = shouldCastShadows;
        }
        if (child.receiveShadow !== shouldReceiveShadows) {
          child.receiveShadow = shouldReceiveShadows;
        }
      }
      
      // Optimize light shadows and shadow map size
      if (child instanceof THREE.Light) {
        if (child.castShadow && distance > this.config.shadowDistance) {
          child.castShadow = false;
        } else if (!child.castShadow && distance <= this.config.shadowDistance) {
          // Re-enable shadows if object moved closer
          if (child instanceof THREE.DirectionalLight || 
              child instanceof THREE.SpotLight || 
              child instanceof THREE.PointLight) {
            child.castShadow = true;
            
            // Optimize shadow map size based on distance and device capabilities
            if (child.shadow) {
              const optimalSize = Math.min(
                this.config.maxShadowMapSize,
                distance < this.config.shadowDistance * 0.5 ? this.config.maxShadowMapSize : 
                Math.max(512, this.config.maxShadowMapSize / 2)
              );
              
              if (child.shadow.mapSize.width !== optimalSize) {
                child.shadow.mapSize.setScalar(optimalSize);
                child.shadow.map = null; // Force regeneration
              }
            }
          }
        }
      }
    });
  }

  /**
   * Apply optimization decisions to an object with smooth fading
   */
  private applyOptimization(
    managedObject: ManagedObject,
    distance: number,
    isInFrustum: boolean,
    deltaTime: number
  ): void {
    const shouldBeVisible = isInFrustum && distance <= this.config.maxRenderDistance;
    const shouldBeLoaded = distance <= this.config.unloadDistance;
    
    // Calculate fade factor based on distance
    const fadeStartDistance = this.config.maxRenderDistance - this.config.fadeDistance;
    const fadeEndDistance = this.config.maxRenderDistance;
    
    let targetOpacity = 1.0;
    
    if (distance > fadeStartDistance && distance <= fadeEndDistance) {
      // Fade out as object gets farther
      const fadeProgress = (distance - fadeStartDistance) / this.config.fadeDistance;
      targetOpacity = Math.max(0, 1.0 - fadeProgress);
    } else if (distance > fadeEndDistance) {
      targetOpacity = 0.0;
    }
    
    // Apply smooth fading instead of abrupt visibility changes
    this.applySmoothFade(managedObject, targetOpacity, shouldBeVisible, deltaTime);
    
    // Handle distance-based unloading (only when fully faded)
    // DISABLED: Don't actually unload objects since they don't have proper reload callbacks
    // This prevents the issue where objects fade away and don't come back
    // if (managedObject.isLoaded && !shouldBeLoaded && managedObject.currentOpacity <= 0.01) {
    //   this.unloadObject(managedObject);
    // } else if (!managedObject.isLoaded && shouldBeLoaded && distance <= this.config.preloadDistance) {
    //   this.loadObject(managedObject);
    // }
    
    // Handle LOD switching
    if (managedObject.lodVariants && managedObject.lodVariants.length > 0) {
      this.updateLOD(managedObject, distance);
    }
  }
  
  /**
   * Apply smooth fade transition to an object
   */
  private applySmoothFade(managedObject: ManagedObject, targetOpacity: number, shouldBeVisible: boolean, deltaTime: number): void {
    // Initialize opacity if not set
    if (managedObject.currentOpacity === undefined) {
      managedObject.currentOpacity = managedObject.object.visible ? 1.0 : 0.0;
    }
    
    // Debug logging for mobile optimization issues
    if (this.deviceCapabilities?.isMobile && targetOpacity < 0.5) {
      console.log(`🌫️ Fading object: "${managedObject.object.name}" to opacity ${targetOpacity.toFixed(2)}`);
    }
    
    // Smoothly interpolate to target opacity
    const opacityDelta = (targetOpacity - managedObject.currentOpacity) * this.config.fadeSpeed * deltaTime;
    managedObject.currentOpacity += opacityDelta;
    
    // Clamp opacity
    managedObject.currentOpacity = Math.max(0, Math.min(1, managedObject.currentOpacity));
    
    // Update object visibility and opacity
    const isVisible = managedObject.currentOpacity > 0.01;
    managedObject.object.visible = isVisible;
    managedObject.isVisible = isVisible;
    
    // Apply opacity to all materials in the object
    this.applyOpacityToObject(managedObject.object, managedObject.currentOpacity);
    
    // Update stats
    if (isVisible && !managedObject.wasVisible) {
      this.optimizationStats.objectsLoaded++;
    } else if (!isVisible && managedObject.wasVisible) {
      this.optimizationStats.objectsCulled++;
    }
    
    managedObject.wasVisible = isVisible;
  }
  
  /**
   * Apply opacity to all materials in an object hierarchy with ownership enforcement
   * PERFORMANCE OPTIMIZED: Cache materials and avoid redundant traverse operations
   */
  private applyOpacityToObject(object: THREE.Object3D, opacity: number): void {
    // PERFORMANCE FIX: Cache materials to avoid expensive traverse operations
    if (!object.userData.cachedMaterials) {
      object.userData.cachedMaterials = [];
      
      // Only traverse ONCE to build the cache
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            if (material && !object.userData.cachedMaterials.includes(material)) {
              object.userData.cachedMaterials.push(material);
            }
          });
        }
      });
    }
    
    // Use cached materials - NO expensive traverse operations
    object.userData.cachedMaterials.forEach((material: any) => {
      if (material) {
        // SYSTEM BOUNDARY ENFORCEMENT: Only modify materials we explicitly own
        if (material.userData.optimizationSystemOwner && 
            material.userData.optimizationSystemOwner !== 'OptimizationManager') {
          return; // Skip materials owned by other systems
        }
        
        // Claim ownership on first access
        if (!material.userData.optimizationSystemOwner) {
          material.userData.optimizationSystemOwner = 'OptimizationManager';
          material.userData.originalOpacity = material.opacity || 1.0;
        }
        
        // Only modify materials we own
        if (material.userData.optimizationSystemOwner === 'OptimizationManager') {
          // PERFORMANCE: Only update if opacity actually changed
          const targetOpacity = material.userData.originalOpacity * opacity;
          if (Math.abs(material.opacity - targetOpacity) > 0.01) {
            material.transparent = opacity < 1.0;
            material.opacity = targetOpacity;
            material.needsUpdate = true;
          }
        }
      }
    });
  }
  
  /**
   * Unload an object to free memory (uses existing ResourceManager)
   */
  private unloadObject(managedObject: ManagedObject): void {
    if (managedObject.unloadCallback) {
      managedObject.unloadCallback();
    }
    
    // Remove from scene
    if (managedObject.object.parent) {
      managedObject.object.parent.remove(managedObject.object);
    }
    
    // Use existing ResourceManager for disposal
    ResourceManager.disposeObject3D(managedObject.object);
    
    managedObject.isLoaded = false;
    this.optimizationStats.objectsUnloaded++;
    this.optimizationStats.memoryFreed++;
    
    console.log(`🗑️ Unloaded object: ${managedObject.id}`);
  }
  
  /**
   * Load an object back into the scene
   */
  private async loadObject(managedObject: ManagedObject): Promise<void> {
    if (managedObject.loadCallback) {
      try {
        await managedObject.loadCallback();
        managedObject.isLoaded = true;
        this.optimizationStats.objectsLoaded++;
        
        console.log(`📦 Loaded object: ${managedObject.id}`);
      } catch (error) {
        console.error(`Failed to load object ${managedObject.id}:`, error);
      }
    }
  }
  
  /**
   * Update LOD based on distance
   */
  private updateLOD(managedObject: ManagedObject, distance: number): void {
    if (!managedObject.lodVariants) return;
    
    let newLOD = 0;
    
    // Determine LOD level based on distance
    for (let i = 0; i < this.config.lodDistances.length; i++) {
      if (distance > this.config.lodDistances[i]) {
        newLOD = i + 1;
      }
    }
    
    // Clamp to available LOD variants
    newLOD = Math.min(newLOD, managedObject.lodVariants.length - 1);
    
    // Switch LOD if needed
    if (managedObject.currentLOD !== newLOD) {
      // Hide current LOD
      if (managedObject.lodVariants[managedObject.currentLOD]) {
        managedObject.lodVariants[managedObject.currentLOD].visible = false;
      }
      
      // Show new LOD
      if (managedObject.lodVariants[newLOD]) {
        managedObject.lodVariants[newLOD].visible = true;
      }
      
      managedObject.currentLOD = newLOD;
      
      console.log(`🔄 LOD switch for ${managedObject.id}: Level ${newLOD}`);
    }
  }
  
  /**
   * Report optimization statistics
   */
  private reportOptimizationStats(): void {
    // Only log detailed stats very rarely to avoid console spam
    if (Date.now() % 30000 < this.config.checkInterval) {
      const stats = {
        ...this.optimizationStats,
        managedObjectsCount: this.managedObjects.size,
        visibleObjectsCount: Array.from(this.managedObjects.values())
          .filter(mo => mo.isVisible).length,
        loadedObjectsCount: Array.from(this.managedObjects.values())
          .filter(mo => mo.isLoaded).length
      };
      
      // Only log if there are significant changes or first time
      if (this.managedObjects.size > 0) {
        console.log('📊 OptimizationManager Stats:', stats);
      }
    }
  }
  
  /**
   * Get current optimization statistics
   */
  public getStats(): any {
    return {
      ...this.optimizationStats,
      managedObjectsCount: this.managedObjects.size,
      config: this.config
    };
  }
  
  /**
   * Update optimization configuration
   */
  public updateConfig(newConfig: Partial<typeof this.config>): void {
    Object.assign(this.config, newConfig);
    console.log('🔧 OptimizationManager configuration updated');
  }
  
  /**
   * Clean up resources (integrates with existing cleanup systems)
   */
  public dispose(): void {
    // Restore original opacities before disposal
    this.managedObjects.forEach((managedObject) => {
      this.restoreOriginalOpacity(managedObject.object);
      
      if (managedObject.object.parent) {
        managedObject.object.parent.remove(managedObject.object);
      }
      ResourceManager.disposeObject3D(managedObject.object);
    });
    
    this.managedObjects.clear();
    this.objectsToCheck = [];
    
    console.log('🧹 OptimizationManager disposed');
  }
  
  /**
   * Restore original opacity to an object's materials
   */
  private restoreOriginalOpacity(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((material) => {
          if (material && material.userData.originalOpacity !== undefined) {
            material.opacity = material.userData.originalOpacity;
            material.transparent = material.userData.originalOpacity < 1.0;
            material.needsUpdate = true;
            delete material.userData.originalOpacity;
          }
        });
      }
    });
  }
}

/**
 * Interface for managed objects
 */
interface ManagedObject {
  object: THREE.Object3D;
  id: string;
  type: 'vegetation' | 'decoration' | 'structure' | 'effect';
  priority: 'low' | 'medium' | 'high';
  lodVariants?: THREE.Object3D[];
  loadCallback?: () => Promise<void>;
  unloadCallback?: () => void;
  isLoaded: boolean;
  isVisible: boolean;
  distanceToCamera: number;
  currentLOD: number;
  lastUpdateTime: number;
  currentOpacity?: number;
  wasVisible?: boolean;
}

/**
 * Global optimization manager instance
 */
export const optimizationManager = OptimizationManager.getInstance();