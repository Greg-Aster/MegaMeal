<!--
  OceanComponent - Modern ECS Architecture with Legacy Visual Features

  This component migrates all the beautiful features from the legacy ocean systems
  while maintaining modern ECS integration and component architecture:
  - Water level rise system with dynamic animation
  - Advanced procedural textures with multi-layered wave noise  
  - Intelligent device-aware optimization using OptimizationManager
  - Perfect legacy wave timing (slow, realistic movement)
  - ECS firefly reflection integration for real-time lighting
  - Vertex wave displacement with multiple wave layers
  - Clean, maintainable, DRY codebase following modern practices
-->
<script lang="ts">
  import { onMount, getContext, onDestroy, createEventDispatcher } from 'svelte'
  import { T, useTask } from '@threlte/core'
  import { Collider, RigidBody, useRapier } from '@threlte/rapier'
  import * as THREE from 'three'
  import { OptimizationManager, OptimizationLevel } from '../optimization/OptimizationManager'
  import { 
    BaseLevelComponent, 
    ComponentType, 
    MessageType,
    type LevelContext,
    type SystemMessage,
    type LightingData 
  } from '../core/LevelSystem'
  import { underwaterActions } from '../stores/underwaterStore'
  import UnderwaterEffect from '../effects/UnderwaterEffect.svelte'

  // --- PROPS (Enhanced with legacy features) ---
  export let size = { width: 2000, height: 2000 }
  export let color = 0x006994 // Deep ocean blue from legacy
  export let opacity = 0.95
  export let position: [number, number, number] = [0, 0, 0]
  export let enableAnimation = true
  export let animationSpeed = 0.1 // Legacy uses much slower speeds for realism
  
  // --- WATER LEVEL RISE SYSTEM (Modern Props) ---
  export let enableRising: boolean = false
  export let initialLevel: number = 0
  export let targetLevel: number = 0
  export let riseRate: number = 0.01
  
  // --- UNDERWATER EFFECTS INTEGRATION ---
  export let enableUnderwaterEffects: boolean = true
  export let waterCollisionSize: [number, number, number] = [10000, 20, 10000]
  export let underwaterFogDensity: number = 0.08 // How thick the underwater fog is (higher = less visibility)
  export let underwaterFogColor: number = 0x0a1922 // Dark blue-gray fog color
  export let surfaceFogDensity: number = 0.003 // Normal surface fog density
  
  // --- LEGACY VISUAL ENHANCEMENT PROPS ---
  export let metalness = 0.02 // Very low metalness for water (from legacy)
  export let roughness = 0.05 // Very smooth for reflections (from legacy)
  export let envMap: THREE.CubeTexture | null = null
  export let envMapIntensity = 1.5 // Higher reflection intensity like legacy
  export let reflectionStrength = 1.0 // Reflection intensity
  export let fresnelPower = 5.0 // Fresnel power for realistic edge reflections

  // --- CONTEXT & MANAGERS ---
  const registry = getContext('systemRegistry')
  const lightingManager = getContext('lightingManager')
  const rapier = useRapier()
  
  // --- STATE ---
  let oceanMesh: THREE.Mesh
  let oceanMaterial: THREE.Material // Can be ShaderMaterial or MeshStandardMaterial
  let oceanGeometry: THREE.PlaneGeometry
  let animationTime = 0
  let waterLevel = initialLevel // Initialize water level
  
  // --- UNDERWATER DETECTION STATE ---
  let waterColliderRef: any
  let playerInWater = false
  const dispatch = createEventDispatcher()
  
  // --- UNDERWATER COLLISION HANDLERS ---
  function handleIntersectionEnter(event: any) {
    console.log('🌊 Ocean: ===== COLLISION DETECTED =====')
    console.log('🌊 Ocean: RAW intersection enter event:', event)
    console.log('🌊 Ocean: Event detail:', event?.detail)
    console.log('🌊 Ocean: Event target:', event?.detail?.target)
    console.log('🌊 Ocean: Event other:', event?.detail?.other)
    
    // Try both target and other from the event
    const target = event?.detail?.target || event?.detail?.other
    
    console.log('🌊 Ocean: Using collision target:', target)
    console.log('🌊 Ocean: Target type:', typeof target)
    console.log('🌊 Ocean: Target properties:', target ? Object.keys(target) : 'No target')
    
    // Check if the colliding object is the player
    if (isPlayer(target)) {
      console.log('🌊 Ocean: ✅ PLAYER ENTERED WATER VOLUME!')
      
      playerInWater = true
      
      // Calculate depth based on player position vs water level
      const playerY = getPlayerYPosition(target)
      const depth = Math.max(0, waterLevel - playerY)
      
      underwaterActions.enterWater(depth)
      dispatch('waterEnter', { depth })
    } else {
      console.log('🌊 Ocean: ❌ Not identified as player')
    }
  }

  function handleIntersectionExit(event: any) {
    const { target } = event.detail
    
    console.log('🏖️ Ocean: Intersection exit detected:', target)
    
    if (isPlayer(target) && playerInWater) {
      console.log('🏖️ Ocean: Player exited water volume')
      
      playerInWater = false
      underwaterActions.exitWater()
      dispatch('waterExit')
    }
  }

  function isPlayer(collider: any): boolean {
    // Check if the collider belongs to the player
    console.log('🔍 Ocean: Checking collider:', collider)
    
    // Try multiple ways to identify the player
    const userData = collider?.userData || collider?.parent?.userData || collider?.rigidBody?.userData
    const isPlayerByUserData = userData?.isPlayer === true || userData?.type === 'player'
    
    // Also check if it's a capsule collider (typical for player)
    const isPlayerByCapsule = collider?.shape === 'capsule' || collider?.args?.length === 2
    
    console.log('🔍 Ocean: Player detection:', { userData, isPlayerByUserData, isPlayerByCapsule })
    
    return isPlayerByUserData || isPlayerByCapsule
  }

  function getPlayerYPosition(collider: any): number {
    // Get the Y position of the player's collider
    const position = collider?.position || collider?.parent?.position || collider?.rigidBody?.translation()
    const y = position?.y || position?.[1] || 0
    console.log('🔍 Ocean: Player Y position:', y)
    return y
  }

  // --- INTELLIGENT OPTIMIZATION SETTINGS (from legacy) ---
  let deviceOptimizedSettings = {
    segments: { width: 64, height: 64 }, // Balanced performance/quality from legacy
    textureSize: 1024, // Higher quality textures
    ambientIntensity: 0.4,
    directionalIntensity: 0.5,
    enableComplexShaders: false,
    useSimpleMaterial: false,
    enableProceduralTextures: true, // Key legacy feature
    enableNormalMaps: true, // Enhanced surface detail
    enableReflections: true, // Firefly reflections
    enableRefractions: false, // Expensive, disabled by default
    waveLayers: 4, // Multi-layer wave complexity
    enableVertexAnimation: true // Real-time wave displacement
  }

  if (typeof window !== 'undefined') {
    try {
      const optimizationManager = OptimizationManager.getInstance()
      const optimizationLevel = optimizationManager.getOptimizationLevel()
      
      // Apply intelligent optimization exactly like legacy OceanSystem
      switch (optimizationLevel) {
        case OptimizationLevel.ULTRA_LOW:
          deviceOptimizedSettings = {
            segments: { width: 8, height: 8 }, textureSize: 256, ambientIntensity: 0.8,
            directionalIntensity: 0.3, enableComplexShaders: false, useSimpleMaterial: true,
            enableProceduralTextures: false, enableNormalMaps: false, enableReflections: false,
            enableRefractions: false, waveLayers: 1, enableVertexAnimation: false
          }; break
        case OptimizationLevel.LOW:
          deviceOptimizedSettings = {
            segments: { width: 16, height: 16 }, textureSize: 256, ambientIntensity: 0.6,
            directionalIntensity: 0.4, enableComplexShaders: false, useSimpleMaterial: false,
            enableProceduralTextures: false, enableNormalMaps: false, enableReflections: false,
            enableRefractions: false, waveLayers: 2, enableVertexAnimation: false
          }; break
        case OptimizationLevel.MEDIUM:
          deviceOptimizedSettings = {
            segments: { width: 32, height: 32 }, textureSize: 512, ambientIntensity: 0.4,
            directionalIntensity: 0.5, enableComplexShaders: true, useSimpleMaterial: false,
            enableProceduralTextures: true, enableNormalMaps: true, enableReflections: false,
            enableRefractions: false, waveLayers: 3, enableVertexAnimation: true
          }; break
        case OptimizationLevel.HIGH:
          deviceOptimizedSettings = {
            segments: { width: 64, height: 64 }, textureSize: 1024, ambientIntensity: 0.4,
            directionalIntensity: 0.5, enableComplexShaders: true, useSimpleMaterial: false,
            enableProceduralTextures: true, enableNormalMaps: true, enableReflections: true,
            enableRefractions: false, waveLayers: 4, enableVertexAnimation: true
          }; break
        case OptimizationLevel.ULTRA:
          deviceOptimizedSettings = {
            segments: { width: 128, height: 128 }, textureSize: 2048, ambientIntensity: 0.4,
            directionalIntensity: 0.5, enableComplexShaders: true, useSimpleMaterial: false,
            enableProceduralTextures: true, enableNormalMaps: true, enableReflections: true,
            enableRefractions: true, waveLayers: 4, enableVertexAnimation: true
          }; break
      }
      // Optimization level applied
    } catch (error) {
      console.warn('⚠️ Ocean: OptimizationManager not available, using conservative fallback:', error)
      // Ultra-conservative fallback matching legacy system
      deviceOptimizedSettings = {
        segments: { width: 8, height: 8 }, textureSize: 256, ambientIntensity: 0.8,
        directionalIntensity: 0.3, enableComplexShaders: false, useSimpleMaterial: true,
        enableProceduralTextures: false, enableNormalMaps: false, enableReflections: false,
        enableRefractions: false, waveLayers: 1, enableVertexAnimation: false
      }
    }
  }

  // --- LEGACY VERTEX SHADER (Advanced Displacement) ---
  const createLegacyVertexShader = (): string => `
    precision mediump float;
    
    uniform float uTime;
    uniform sampler2D uDisplacementMap;
    uniform float uDisplacementScale;
    uniform vec2 uDisplacementOffset;
    uniform int uWaveLayers;
    
    varying vec2 vUv;
    varying float vWaveHeight;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Multi-layered wave displacement exactly like legacy (much slower for realism)
      vec2 baseUv = vUv + uDisplacementOffset;
      float totalDisplacement = 0.0;
      
      // Layer 1: Large ocean swells (legacy timing)
      vec2 animatedUv1 = baseUv + vec2(uTime * 0.005, uTime * 0.003);
      float displacement1 = texture2D(uDisplacementMap, animatedUv1).r;
      totalDisplacement += displacement1 * 0.4;
      
      if (uWaveLayers > 1) {
        // Layer 2: Medium waves
        vec2 animatedUv2 = baseUv * 0.7 + vec2(uTime * -0.004, uTime * 0.006);
        float displacement2 = texture2D(uDisplacementMap, animatedUv2).g;
        totalDisplacement += displacement2 * 0.3;
      }
      
      if (uWaveLayers > 2) {
        // Layer 3: Small ripples
        vec2 animatedUv3 = baseUv * 1.5 + vec2(uTime * 0.008, uTime * -0.005);
        float displacement3 = texture2D(uDisplacementMap, animatedUv3).b;
        totalDisplacement += displacement3 * 0.2;
      }
      
      if (uWaveLayers > 3) {
        // Layer 4: Fine surface detail
        vec2 animatedUv4 = baseUv * 2.0 + vec2(uTime * -0.01, uTime * 0.007);
        float displacement4 = texture2D(uDisplacementMap, animatedUv4).a;
        totalDisplacement += displacement4 * 0.1;
      }
      
      // Apply total displacement with legacy scale
      pos.z = totalDisplacement * uDisplacementScale;
      vWaveHeight = totalDisplacement;
      
      vNormal = normalMatrix * normal;
      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `

  // --- LEGACY FRAGMENT SHADER (Enhanced Lighting & Firefly Reflections) ---
  const createLegacyFragmentShader = (): string => `
    precision mediump float;
    
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform sampler2D uTexture;
    uniform sampler2D uNormalMap;
    uniform sampler2D uDisplacementMap;
    uniform samplerCube uEnvMap;
    uniform float uEnvMapIntensity;
    uniform float uMetalness;
    uniform float uRoughness;
    
    // Legacy lighting system
    uniform vec3 uAmbientColor;
    uniform float uAmbientIntensity;
    uniform vec3 uDirectionalLightColor;
    uniform float uDirectionalLightIntensity;
    uniform vec3 uDirectionalLightDirection;
    
    // ECS Firefly integration (up to 6 lights for better reflections)
    uniform vec3 uFireflyPositions[6];
    uniform vec3 uFireflyColors[6];
    uniform float uFireflyIntensities[6];
    uniform float uFireflyRanges[6];
    
    varying vec2 vUv;
    varying float vWaveHeight;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      // Legacy animated UV coordinates (much slower for realism)
      vec2 animatedUv = vUv + vec2(uTime * 0.003, uTime * 0.001);
      vec2 animatedUv2 = vUv * 1.3 + vec2(uTime * -0.002, uTime * 0.004);
      
      // Sample textures with legacy blend ratios
      vec3 texColor = texture2D(uTexture, animatedUv).rgb;
      vec3 normalMapColor = texture2D(uNormalMap, animatedUv2).rgb;
      float displacement = texture2D(uDisplacementMap, animatedUv).r;
      
      // Legacy water color mixing
      vec3 waterColor = mix(uColor, texColor, 0.4);
      
      // Enhanced normal mapping for better surface detail
      vec3 normal = normalize(normalMapColor * 2.0 - 1.0);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      
      // --- LEGACY LIGHTING CALCULATION ---
      vec3 lightDir = normalize(-uDirectionalLightDirection);
      vec3 ambient = uAmbientColor * uAmbientIntensity;
      
      // Directional lighting with enhanced specular
      float NdotL = max(dot(normal, lightDir), 0.0);
      vec3 diffuse = uDirectionalLightColor * uDirectionalLightIntensity * NdotL;
      
      // Legacy specular reflection (smooth water surface)
      vec3 halfDir = normalize(lightDir + viewDir);
      float NdotH = max(dot(normal, halfDir), 0.0);
      float specPower = mix(64.0, 16.0, uRoughness); // Roughness affects specular
      float spec = pow(NdotH, specPower) * (1.0 - uRoughness) * 0.8;
      vec3 specular = uDirectionalLightColor * spec;
      
      vec3 lighting = ambient + diffuse + specular;
      
      // --- ECS FIREFLY REFLECTIONS (Enhanced) ---
      for (int i = 0; i < 6; i++) {
        if (uFireflyIntensities[i] > 0.0) {
          vec3 fireflyDir = uFireflyPositions[i] - vWorldPosition;
          float fireflyDist = length(fireflyDir);
          
          // Only process fireflies within range
          if (fireflyDist < uFireflyRanges[i]) {
            fireflyDir = normalize(fireflyDir);
            
            // Legacy attenuation formula
            float attenuation = 1.0 / (1.0 + 0.1 * fireflyDist + 0.01 * fireflyDist * fireflyDist);
            
            // Enhanced specular reflection for fireflies
            vec3 fireflyHalf = normalize(fireflyDir + viewDir);
            float fireflySpec = pow(max(dot(normal, fireflyHalf), 0.0), 32.0) * attenuation;
            
            // Add firefly color reflection to water
            lighting += uFireflyColors[i] * fireflySpec * uFireflyIntensities[i] * 0.6;
            
            // Subtle diffuse contribution for nearby fireflies
            float fireflyDiffuse = max(dot(normal, fireflyDir), 0.0) * attenuation * 0.2;
            lighting += uFireflyColors[i] * fireflyDiffuse * uFireflyIntensities[i];
          }
        }
      }
      
      waterColor *= lighting;
      
      // --- LEGACY ENVIRONMENT REFLECTION ---
      if (uEnvMapIntensity > 0.0) {
        vec3 I = normalize(vWorldPosition - cameraPosition);
        vec3 R = reflect(I, normal);
        vec3 envColor = textureCube(uEnvMap, R).rgb;
        
        // Legacy Fresnel calculation
        float fresnel = uMetalness + (1.0 - uMetalness) * pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0);
        waterColor = mix(waterColor, envColor, fresnel * uEnvMapIntensity);
      }
      
      // --- LEGACY WAVE-BASED EFFECTS ---
      // Wave height affects color depth (deeper = darker)
      waterColor = mix(waterColor * 0.7, waterColor * 1.3, vWaveHeight);
      
      // Subtle shimmer from displacement
      float shimmer = displacement * 0.1;
      waterColor += vec3(shimmer * 0.08, shimmer * 0.12, shimmer * 0.15);
      
      // Legacy opacity variation for depth simulation
      float depthOpacity = uOpacity + (vWaveHeight - 0.5) * 0.1;
      
      gl_FragColor = vec4(waterColor, clamp(depthOpacity, 0.0, 1.0));
    }
  `

  class OceanComponent extends BaseLevelComponent {
    readonly id = 'ocean-component'
    readonly type = ComponentType.OCEAN
    private lastPointLightCount = 0

    protected async onInitialize(): Promise<void> {
      console.log('🌊 Ocean: Initializing...')
      this.createOcean()
      if (lightingManager) {
        lightingManager.subscribe((lighting: LightingData) => {
          this.updateOceanLighting(lighting)
        })
        console.log('🌊 Ocean: Connected to lighting system')
      } else {
        console.warn('🌊 Ocean: No lightingManager found in context!')
      }
    }

    protected onUpdate(deltaTime: number): void {
      if (!enableAnimation) return
      animationTime += deltaTime * animationSpeed
      
      // Handle rising water
      if (enableRising) {
        if (waterLevel < targetLevel) {
          waterLevel = Math.min(waterLevel + riseRate * deltaTime, targetLevel)
        } else if (waterLevel > targetLevel) {
          waterLevel = Math.max(waterLevel - riseRate * deltaTime, targetLevel)
        }
      }
      
      if (oceanMaterial instanceof THREE.MeshStandardMaterial) {
        // Animate texture offsets for water movement
        if (oceanMaterial.map) {
          oceanMaterial.map.offset.x = Math.sin(animationTime * 0.02) * 0.01
          oceanMaterial.map.offset.y = animationTime * 0.001
        }
        if (oceanMaterial.normalMap) {
          oceanMaterial.normalMap.offset.x = Math.sin(animationTime * 0.06) * 0.008
          oceanMaterial.normalMap.offset.y = animationTime * 0.002
        }
      }
    }
    
    protected onMessage(message: SystemMessage): void {
      if (message.type === MessageType.LIGHTING_UPDATE) {
        this.updateOceanLighting(message.data)
      }
    }

    protected onDispose(): void {
      oceanGeometry?.dispose()
      oceanMaterial?.dispose()
    }

    private createOcean(): void {
      oceanGeometry = new THREE.PlaneGeometry(
        size.width, size.height,
        deviceOptimizedSettings.segments.width,
        deviceOptimizedSettings.segments.height
      )

      // ALWAYS use MeshStandardMaterial for proper Threlte lighting integration
      const textureData = this.createLegacyWaveTextures()
      
      oceanMaterial = new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        roughness: roughness,
        metalness: metalness,
        envMap: envMap,
        envMapIntensity: envMapIntensity,
        
        // Apply our beautiful procedural textures
        map: textureData.colorTexture,
        normalMap: textureData.normalMap,
        displacementMap: textureData.displacementMap,
        displacementScale: 0.5, // Subtle displacement
        normalScale: new THREE.Vector2(0.3, 0.3), // Subtle normal mapping
        
        // Enable proper lighting integration
        fog: true, // Respond to scene fog
        side: THREE.DoubleSide,
        
        // FIX: Ensure fireflies render properly over ocean
        depthWrite: true, // Ocean writes to depth buffer
        depthTest: true   // Ocean tests against depth buffer
      })
      
      // Ocean setup complete
    }

    private updateOceanLighting(lighting: LightingData): void {
      // MeshStandardMaterial automatically receives lighting from Three.js lights!
      // The HybridFireflyComponent creates actual T.PointLight components,
      // so the ocean will automatically receive those lights.
      
      // Only log significant changes (but less frequently)
      if (lighting.point.length !== this.lastPointLightCount) {
        this.lastPointLightCount = lighting.point.length
        // Only log every 10th light change to avoid spam
        if (this.lastPointLightCount % 10 === 0) {
          console.log(`🌊 Ocean: Now receiving ${lighting.point.length} lights via Threlte's standard lighting`)
        }
      }
      
      // No manual uniform updates needed - Three.js handles everything!
    }

    // --- LEGACY PROCEDURAL TEXTURE GENERATION (Enhanced Multi-Layer) ---
    private createLegacyWaveTextures(): {
      displacementMap: THREE.DataTexture,
      normalMap: THREE.DataTexture,
      colorTexture: THREE.CanvasTexture
    } {
      const size = deviceOptimizedSettings.textureSize
      // Texture generation (logging removed for performance)
      
      // Multi-layered noise function exactly matching legacy OceanSystem
      const legacyWaveNoise = (x: number, y: number, time = 0): number => {
        let value = 0
        
        // Large ocean swells (legacy parameters)
        value += Math.sin(x * 0.02 + y * 0.01 + time * 0.5) * 0.4
        value += Math.cos(x * 0.015 - y * 0.02 + time * 0.3) * 0.3
        
        // Medium waves
        value += Math.sin(x * 0.05 + y * 0.08 + time * 1.2) * 0.2
        value += Math.cos(x * 0.08 - y * 0.05 + time * 0.8) * 0.15
        
        // Small ripples
        value += Math.sin(x * 0.15 + y * 0.12 + time * 2.0) * 0.08
        value += Math.cos(x * 0.18 - y * 0.15 + time * 1.5) * 0.06
        
        // Fine surface detail
        value += Math.sin(x * 0.3 + y * 0.25 + time * 3.0) * 0.04
        value += Math.cos(x * 0.35 - y * 0.3 + time * 2.5) * 0.03
        
        return (value + 1) / 2 // Normalize to 0-1 range
      }
      
      // Generate height map with legacy algorithm
      const heightMap: number[][] = []
      for (let y = 0; y < size; y++) {
        heightMap[y] = []
        for (let x = 0; x < size; x++) {
          heightMap[y][x] = legacyWaveNoise(x, y)
        }
      }
      
      // Create enhanced displacement map (RGBA for multiple wave layers)
      const displacementData = new Uint8Array(size * size * 4)
      const normalData = new Uint8Array(size * size * 4)
      
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const index = (y * size + x) * 4
          
          // Multi-layer displacement data
          const height1 = legacyWaveNoise(x, y, 0) * 255
          const height2 = legacyWaveNoise(x * 0.7, y * 0.7, 1) * 255
          const height3 = legacyWaveNoise(x * 1.5, y * 1.5, 2) * 255
          const height4 = legacyWaveNoise(x * 2.0, y * 2.0, 3) * 255
          
          displacementData[index] = height1     // R: Large waves
          displacementData[index + 1] = height2 // G: Medium waves  
          displacementData[index + 2] = height3 // B: Small ripples
          displacementData[index + 3] = height4 // A: Fine detail
          
          // Enhanced normal map calculation
          const height = heightMap[y][x]
          const heightL = x > 0 ? heightMap[y][x - 1] : height
          const heightR = x < size - 1 ? heightMap[y][x + 1] : height
          const heightU = y > 0 ? heightMap[y - 1][x] : height
          const heightD = y < size - 1 ? heightMap[y + 1][x] : height
          
          const dx = (heightR - heightL) * 2.0 // Enhanced normal strength
          const dy = (heightD - heightU) * 2.0
          const length = Math.sqrt(dx * dx + dy * dy + 1)
          
          normalData[index] = (-dx / length * 0.5 + 0.5) * 255     // R
          normalData[index + 1] = (-dy / length * 0.5 + 0.5) * 255 // G
          normalData[index + 2] = (1 / length * 0.5 + 0.5) * 255   // B
          normalData[index + 3] = 255                               // A
        }
      }
      
      // Create legacy color texture with exact original colors
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      const ctx = canvas.getContext('2d')!
      
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const wave = heightMap[y][x]
          
          // Exact legacy color values from OceanSystem
          const blueBase = 20
          const greenBase = 50
          const blue = Math.floor(blueBase + wave * 120)
          const green = Math.floor(greenBase + wave * 100)
          const red = Math.floor(10 + wave * 30)
          
          ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`
          ctx.fillRect(x, y, 1, 1)
        }
      }
      
      // Create Three.js textures with legacy settings
      const displacementTexture = new THREE.DataTexture(
        displacementData, size, size, THREE.RGBAFormat, THREE.UnsignedByteType
      )
      displacementTexture.wrapS = displacementTexture.wrapT = THREE.RepeatWrapping
      displacementTexture.repeat.set(15, 15) // Legacy repeat values
      displacementTexture.needsUpdate = true
      
      const normalTexture = new THREE.DataTexture(
        normalData, size, size, THREE.RGBAFormat, THREE.UnsignedByteType
      )
      normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping
      normalTexture.repeat.set(15, 15)
      normalTexture.needsUpdate = true
      
      const colorTexture = new THREE.CanvasTexture(canvas)
      colorTexture.wrapS = colorTexture.wrapT = THREE.RepeatWrapping
      colorTexture.repeat.set(15, 15) // Legacy repeat values
      
      return {
        displacementMap: displacementTexture,
        normalMap: normalTexture,
        colorTexture: colorTexture
      }
    }
  }

  // --- COMPONENT INITIALIZATION ---
  let component: OceanComponent
  // --- OPTIMIZED COLLISION DETECTION ---
  let lastPlayerInWater = false
  let collisionCheckCounter = 0
  
  // Only check collision every 10 frames (6fps instead of 60fps) for performance
  useTask(() => {
    collisionCheckCounter++
    if (collisionCheckCounter < 10) return // Skip 9 out of 10 frames
    collisionCheckCounter = 0

    if (!rapier?.world) return

    // Find the player rigid body (cached approach)
    const bodies = rapier.world.bodies
    let playerBody = null
    
    for (let i = 0; i < bodies.len(); i++) {
      const body = bodies.get(i)
      if (body && body.userData?.isPlayer) {
        playerBody = body
        break
      }
    }

    if (playerBody) {
      const playerPos = playerBody.translation()
      
      // Check if player is BELOW the water surface (actually underwater)
      const isInWaterBounds = (
        Math.abs(playerPos.x - position[0]) < waterCollisionSize[0] / 2 &&
        Math.abs(playerPos.z - position[2]) < waterCollisionSize[2] / 2 &&
        playerPos.y < waterLevel // Player head is below water surface
      )

      // Trigger events on state change
      if (isInWaterBounds && !lastPlayerInWater) {
        const depth = Math.max(0, waterLevel - playerPos.y)
        console.log('🌊 Ocean: OPTIMIZED collision - Player entered water at Y:', playerPos.y, 'water level:', waterLevel, 'depth:', depth)
        underwaterActions.enterWater(depth)
        dispatch('waterEnter', { depth })
        lastPlayerInWater = true
      } else if (!isInWaterBounds && lastPlayerInWater) {
        console.log('🏖️ Ocean: OPTIMIZED collision - Player exited water at Y:', playerPos.y, 'water level:', waterLevel)
        underwaterActions.exitWater()
        dispatch('waterExit')
        lastPlayerInWater = false
      }
    }
  })

  onMount(async () => {
    console.log('🌊 Ocean: Mounting with water level:', waterLevel, 'rising enabled:', enableRising)
    console.log('🌊 Ocean: Collision box size:', waterCollisionSize)
    console.log('🌊 Ocean: Ocean position:', position)
    console.log('🌊 Ocean: Underwater effects enabled:', enableUnderwaterEffects)
    console.log('🌊 Ocean: Using MANUAL collision detection')
    
    if (registry) {
      component = new OceanComponent()
      registry.registerComponent(component)
      const levelContext = getContext('levelContext')
      if (levelContext) {
        await component.initialize(levelContext)
      }
    }
    
    // Add a debug timer to show current water level every few seconds
    setInterval(() => {
      console.log('🌊 Ocean: Current water level:', waterLevel, 'target:', targetLevel)
    }, 5000)
  })

  onDestroy(() => {
    component?.dispose()
  })

  // --- REACTIVE UPDATES for new props ---
  $: if (oceanMaterial instanceof THREE.MeshStandardMaterial) {
    oceanMaterial.envMapIntensity = envMapIntensity
    oceanMaterial.metalness = metalness
    oceanMaterial.roughness = roughness
    if (envMap) oceanMaterial.envMap = envMap
  }
</script>

<!-- Ocean mesh -->
{#if oceanGeometry && oceanMaterial}
  <T.Mesh 
    bind:ref={oceanMesh}
    geometry={oceanGeometry}
    material={oceanMaterial}
    position.x={position[0]}
    position.y={waterLevel}
    position.z={position[2]}
    rotation={[-Math.PI / 2, 0, 0]}
    receiveShadow={true}
    castShadow={false}
    name="ocean_surface"
    renderOrder={0}
  />
{/if}

<!-- Integrated Underwater Effects System -->
{#if enableUnderwaterEffects}
  <T.Group position={[position[0], waterLevel + 10, position[2]]}>
    <!-- Water collision detection using same pattern as working ground system -->
    <RigidBody type="fixed">
      <Collider
        shape="cuboid"
        args={[waterCollisionSize[0] / 2, waterCollisionSize[1] / 2, waterCollisionSize[2] / 2]}
        sensor={true}
        on:intersectionenter={handleIntersectionEnter}
        on:intersectionexit={handleIntersectionExit}
        on:create={(e) => console.log('🌊 Ocean: Collision sensor created at Y:', waterLevel + 10, 'Box size:', waterCollisionSize)}
      />
    </RigidBody>
    
    <!-- Underwater particle effects (bubbles and mist) - also follow water level -->
    <UnderwaterEffect 
      position={[0, 0, 0]}
      size={waterCollisionSize}
    />
  </T.Group>
{/if}
