<!--
  HybridFireflyComponent - Modern ECS Architecture with Performant Glow Effect

  This component uses the full ECS architecture and combines it with a high-performance,
  shader-based rendering method for a soft "bloom" effect on each firefly.

  - ECS entities for high-performance firefly management
  - Shader-based Points rendering for a fuzzy glow (replaces InstancedMesh)
  - Perfect legacy visual parameters preserved
  - Device-aware optimization with OptimizationManager
  - Modern component lifecycle management
-->
<script lang="ts">
  import { onMount, getContext } from 'svelte'
  import { T, useTask, useThrelte } from '@threlte/core'
  import * as THREE from 'three'
  import { OptimizationManager } from '../optimization/OptimizationManager'
  import {
    BaseLevelComponent,
    ComponentType,
    MessageType,
    type LevelContext,
    type SystemMessage
  } from '../core/LevelSystem'
  import {
    fireflyQuery,
    Position,
    LightEmitter,
    LightCycling
  } from '../core/ECSIntegration'

  // --- SHADERS FOR GLOW EFFECT ---
  const vertexShader = `
    // Uniform for controlling point size dynamically
    uniform float uPointSize;

    // This attribute is passed from the BufferGeometry
    attribute vec3 aColor; 
    
    // This varying passes the color to the fragment shader
    varying vec3 vColor;   

    void main() {
      vColor = aColor;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Set the size of each point using the new uniform.
      // The size is attenuated by distance to make far away points smaller.
      gl_PointSize = uPointSize * (1.0 / -mvPosition.z);
    }
  `

  const fragmentShader = `
    // Uniforms for controlling the glow falloff
    uniform float uGlowInnerRadius;
    uniform float uGlowOuterRadius;
    uniform float uCoreRadius; // NEW: Uniform for the hard inner core
    uniform float uCoreOpacity; // NEW: Opacity multiplier for the core

    // The color received from the vertex shader
    varying vec3 vColor;

    void main() {
      // gl_PointCoord gives the 2D coordinate within the point primitive (0.0 to 1.0).
      // We calculate the distance from the center (0.5, 0.5).
      float dist = distance(gl_PointCoord, vec2(0.5));

      // 1. Calculate the soft outer glow
      float softGlow = 1.0 - smoothstep(uGlowInnerRadius, uGlowOuterRadius, dist);

      // 2. Calculate the hard inner core with defined edge
      // Use step for sharp edge, but add a tiny smoothstep for anti-aliasing
      float coreEdge = 1.0 - smoothstep(uCoreRadius - 0.001, uCoreRadius, dist);
      float hardCore = coreEdge * uCoreOpacity;

      // 3. Combine the two, taking the brightest value for any given pixel.
      float opacity = max(softGlow, hardCore);

      // Discard pixels with very low opacity to prevent square artifacts
      if (opacity < 0.01) discard;

      // Brighten the colors significantly to overcome background absorption
      vec3 brightenedColor = vColor * 3.0; // Make colors 3x brighter
      
      // Set the final color, multiplying the brightened color by the calculated opacity.
      gl_FragColor = vec4(brightenedColor, opacity);
    }
  `

  // Props with perfect legacy visual parameters
  export let count = 80
  export let maxLights = 20
  export let colors = [0x87ceeb, 0x98fb98, 0xffffe0, 0xdda0dd, 0xf0e68c, 0xffa07a, 0x20b2aa, 0x9370db]
  export let emissiveIntensity = 15.0 // Kept for logic, but not directly used by new material
  export let lightIntensity = 200.0
  export let lightRange = 300
  export let cycleDuration = 12.0
  export let fadeSpeed = 2.0
  export let heightRange = { min: 0.5, max: 2.5 }
  export let radius = 300
  export let size = 0.015 // Kept for ECS logic
  export let pointSize = 300.0 // Controls the visual size of the firefly glow
  export let glowInnerRadius = 0.05 // Controls the solid core of the glow
  export let glowOuterRadius = 0.05 // Controls the outer edge of the glow
  export let coreRadius = 0.1 // NEW: Controls the size of the hard point in the center
  export let coreOpacity = 1.0 // NEW: Controls the opacity of the core (0.0 to 1.0)
  export let movement = {
    speed: 0.2,
    wanderSpeed: 0.004,
    wanderRadius: 4,
    floatAmplitude: { x: 1.5, y: 0.5, z: 1.5 },
    lerpFactor: 1.0
  }
  export let getHeightAt: ((x: number, z: number) => number) | undefined = undefined
  export let environmentReady = true // Allow external control of when to create fireflies

  // Get level context (modern component architecture)
  const registry = getContext('systemRegistry')
  const ecsWorld = getContext('ecsWorld')
  const lightingManager = getContext('lightingManager')

  // Device optimization
  let optimizedMaxLights = maxLights
  let optimizedCount = count

  // Initialize optimization
  if (typeof window !== 'undefined') {
    try {
      const optimizationManager = OptimizationManager.getInstance()
      const qualitySettings = optimizationManager.getQualitySettings()
      optimizedMaxLights = qualitySettings.maxFireflyLights * 2 // Double the available lights
      optimizedCount = optimizedMaxLights === 0 ? Math.min(count, 30) : count
      console.log(`🎯 Firefly Optimization: ${optimizedCount} fireflies, ${optimizedMaxLights} max lights (level: ${optimizationManager.getOptimizationLevel()})`)
    } catch (error) {
      console.warn('⚠️ Using fallback optimization')
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      optimizedMaxLights = isMobile ? 0 : maxLights * 2 // Double fallback lights too
      optimizedCount = isMobile ? Math.min(count, 30) : count
    }
  }

  // ECS entities (modern architecture)
  let fireflyEntities: number[] = []

  // --- UPDATED: Rendering components for Points ---
  let points: THREE.Points
  let geometry: THREE.BufferGeometry
  let material: THREE.ShaderMaterial

  // Performance objects
  const tempColor = new THREE.Color()
  let activeLights: any[] = []
  let lightingUpdateCounter = 0
  let lightCycleTime = 0
  const lightCycleDuration = 20000 // 20 seconds for a full cycle (much slower)

  /**
   * Distributed firefly lighting - cycles through different fireflies over time
   * All fireflies glow, but only some cast light at any given moment
   */
  function selectCyclingLights(allLights: any[], camera: THREE.Camera, maxLights: number, cycleTime: number) {
    if (allLights.length === 0) return []
    if (maxLights === 0) return [] // Handle ULTRA_LOW optimization level
    
    const totalLights = allLights.length
    const cameraPosition = camera?.position || new THREE.Vector3(0, 0, 0)
    
    // Create waves of light activation across the scene
    const numWaves = Math.ceil(maxLights / 3) // Groups of 3 lights per wave
    const waveInterval = lightCycleDuration / numWaves // How long each wave lasts
    const currentWave = Math.floor(cycleTime / waveInterval) % numWaves
    
    // Calculate which fireflies should be active this cycle
    const activeLightIndices = new Set<number>()
    
    // Add lights in waves for magical distributed effect
    for (let wave = 0; wave < numWaves; wave++) {
      const wavePhase = (cycleTime - wave * waveInterval) / waveInterval
      const waveFade = Math.sin(wavePhase * Math.PI) // Sine wave for smooth fade in/out
      
      if (waveFade > 0.1) { // Only include waves that are bright enough
        // Each wave activates different fireflies
        const lightsPerWave = Math.floor(maxLights / numWaves)
        const startIndex = (wave * lightsPerWave) % totalLights
        
        for (let i = 0; i < lightsPerWave; i++) {
          const lightIndex = (startIndex + i) % totalLights
          activeLightIndices.add(lightIndex)
        }
      }
    }
    
    // Build the active lights array with distance-based intensity
    const selectedLights = Array.from(activeLightIndices).map(index => {
      const light = allLights[index]
      if (!light) return null
      
      // Calculate distance to camera for intensity scaling
      const lightPos = new THREE.Vector3(light.position.x, light.position.y, light.position.z)
      const distance = cameraPosition.distanceTo(lightPos)
      
      // Closer lights are brighter, but all lights in the cycle are visible
      const distanceFactor = Math.max(0.3, 1.0 - (distance / 400)) // Minimum 30% intensity
      
      // Wave-based cycling intensity
      const lightWave = Math.floor(index / Math.floor(maxLights / numWaves))
      const wavePhase = (cycleTime - lightWave * waveInterval) / waveInterval
      const waveFade = Math.max(0, Math.sin(wavePhase * Math.PI))
      
      return {
        ...light,
        intensity: light.intensity * distanceFactor * waveFade
      }
    }).filter(light => light !== null && light.intensity > 0.01)
    
    return selectedLights
  }

  /**
   * Modern Component Class following documented architecture
   */
  class HybridFireflyComponent extends BaseLevelComponent {
    readonly id = 'hybrid-firefly-component'
    readonly type = ComponentType.PARTICLE_SYSTEM

    protected async onInitialize(): Promise<void> {
      console.log('✅ HybridFirefly: Initializing with modern ECS architecture...')
      if (!ecsWorld) {
        console.error('❌ ECS World required for modern architecture')
        return
      }
      
      // Set up terrain following
      if (getHeightAt && ecsWorld.setTerrainHeightFunction) {
        ecsWorld.setTerrainHeightFunction(getHeightAt)
        console.log('✅ HybridFirefly: Terrain following enabled')
      }
      
      // This now sets up the BufferGeometry and ShaderMaterial
      this.setupRendering()
      // This now populates the geometry buffers as well as creating entities
      this.createECSFireflies()
      console.log(`✅ HybridFirefly: Created ${optimizedCount} ECS entities with legacy visual parameters`)
    }

    protected onUpdate(deltaTime: number): void {
      // This now updates the geometry attributes directly
      this.updatePointsRendering()
    }

    protected onMessage(message: SystemMessage): void {
      // ... (no changes needed here)
    }

    protected onDispose(): void {
      if (geometry) geometry.dispose()
      if (material) material.dispose()
      console.log('✅ HybridFirefly: Disposed properly')
    }

    private createECSFireflies(): void {
      if (!ecsWorld) return
      
      // Validate terrain function before creating fireflies
      if (!getHeightAt) {
        console.warn('🧚 Warning: No terrain height function available - fireflies may spawn below ground')
      } else {
        // Test the terrain function at center
        const testHeight = getHeightAt(0, 0)
        console.log(`🧚 Firefly spawn: Terrain function working, center height = ${testHeight.toFixed(2)}`)
      }
      
      fireflyEntities = []
      
      // Get a direct reference to the buffer arrays for performance
      const positionArray = geometry.attributes.position.array as Float32Array
      const colorArray = geometry.attributes.aColor.array as Float32Array

      for (let i = 0; i < optimizedCount; i++) {
        const i3 = i * 3
        const angle = Math.random() * Math.PI * 2
        const radiusPos = Math.random() * radius
        const x = Math.cos(angle) * radiusPos
        const z = Math.sin(angle) * radiusPos
        // Ensure fireflies spawn above ground with safety margin
        const groundHeight = getHeightAt ? getHeightAt(x, z) : 0
        const safetyMargin = 1.0 // Extra buffer to ensure above ground
        const minHeight = Math.max(groundHeight + heightRange.min, groundHeight + safetyMargin)
        const maxHeight = groundHeight + heightRange.max
        const y = minHeight + Math.random() * (maxHeight - minHeight)
        
        // Debug logging for initial spawn positions
        if (i < 3) { // Only log first 3 fireflies to avoid spam
          console.log(`🧚 Firefly ${i} spawn: ground=${groundHeight.toFixed(2)}, y=${y.toFixed(2)} at (${x.toFixed(1)}, ${z.toFixed(1)})`)
        }
        const position = new THREE.Vector3(x, y, z)
        const color = colors[Math.floor(Math.random() * colors.length)]

        // Set initial data in the geometry buffers
        position.toArray(positionArray, i3)
        tempColor.setHex(color).toArray(colorArray, i3)

        // Debug: Log the actual values being passed to ECS
        if (i === 0) { // Only log first firefly to avoid spam
          console.log('🧚 Creating firefly with props:', {
            lightIntensity, lightRange, cycleDuration,
            floatAmplitude: movement.floatAmplitude.y,
            wanderRadius: movement.wanderRadius,
            size, emissiveIntensity
          })
        }
        
        const entity = ecsWorld.createFirefly(position, color, {
            lightIntensity, lightRange, cycleDuration,
            floatAmplitude: movement.floatAmplitude.y,
            wanderRadius: movement.wanderRadius,
            size, emissiveIntensity
        });
        fireflyEntities.push(entity)
      }
    }

    private setupRendering(): void {
      geometry = new THREE.BufferGeometry()
      // Create empty buffers that will be populated and updated
      const positions = new Float32Array(optimizedCount * 3)
      const aColors = new Float32Array(optimizedCount * 3)
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('aColor', new THREE.BufferAttribute(aColors, 3))

      material = new THREE.ShaderMaterial({
        uniforms: {
          // Initialize the uniforms with the values from the props
          uPointSize: { value: pointSize },
          uGlowInnerRadius: { value: glowInnerRadius },
          uGlowOuterRadius: { value: glowOuterRadius },
          uCoreRadius: { value: coreRadius },
          uCoreOpacity: { value: coreOpacity },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        // Additive blending for bright firefly effect
        blending: THREE.AdditiveBlending,
        // Important: Disable depth writing so particles don't clip through each other
        depthWrite: false,
      })
    }

    private updatePointsRendering(): void {
      if (!points || !ecsWorld) return

      const world = ecsWorld.getWorld()
      const entities = fireflyQuery(world)
      
      const posAttr = geometry.attributes.position as THREE.BufferAttribute
      const colorAttr = geometry.attributes.aColor as THREE.BufferAttribute

      for (let i = 0; i < entities.length && i < optimizedCount; i++) {
        const eid = entities[i]
        
        // Update position buffer directly from ECS data
        posAttr.setXYZ(i, Position.x[eid], Position.y[eid], Position.z[eid])

        // Update color buffer based on light state from ECS (PROPER ECS APPROACH)
        const baseIntensity = LightEmitter.intensity[eid] // Use ECS data as base
        const fadeProgress = LightCycling.fadeProgress[eid] // Apply cycling effect
        // Fix intensity normalization - use proper range for visibility
        const normalizedIntensity = Math.min(baseIntensity / 200.0, 1.0) // Better normalization for 200 intensity
        let finalIntensity = normalizedIntensity * fadeProgress
        
        // All firefly sprites are always visible - no culling of visual elements
        
        const color = LightEmitter.color[eid]
        tempColor.setHex(color)
        tempColor.multiplyScalar(finalIntensity) // Now includes smooth view-based fading
        colorAttr.setXYZ(i, tempColor.r, tempColor.g, tempColor.b)
      }

      // Mark buffers as needing an update to be sent to the GPU
      posAttr.needsUpdate = true
      colorAttr.needsUpdate = true
    }

    public getActiveLightsFromECS() {
      if (!ecsWorld) return []
      return ecsWorld.getActiveLights();
    }

    // REMOVED: Public method that breaks encapsulation

    public handleDiscovery(): void {
      // ... (no changes needed here)
    }
  }

  // Create and register the component
  let component: HybridFireflyComponent
  onMount(async () => {
    if (registry) {
      component = new HybridFireflyComponent()
      registry.registerComponent(component)
      const levelContext = getContext('levelContext')
      if (levelContext) {
        await component.initialize(levelContext)
      }
    }
  })

  // Get camera from Threlte context
  const { camera } = useThrelte()

  useTask((delta) => {
    if (component) {
      const allLights = component.getActiveLightsFromECS()
      
      // Update cycle time for distributed lighting
      lightCycleTime += delta * 1000 // Convert to milliseconds
      if (lightCycleTime > lightCycleDuration) {
        lightCycleTime = 0 // Reset cycle
      }
      
      // Update light selection using cycling system every few frames
      if (lightingUpdateCounter % 20 === 0) { // Update every 20 frames (~0.33 seconds)
        activeLights = selectCyclingLights(allLights, $camera, optimizedMaxLights, lightCycleTime)
        
        // Debug info with optimization level
        if (lightingUpdateCounter % 180 === 0) { // Every 3 seconds
          console.log(`🌟 Cycling lights: ${activeLights.length}/${allLights.length} fireflies active (max: ${optimizedMaxLights})`)
        }
      }
      
      // Send to lighting system less frequently for ocean reflections
      if (lightingManager && activeLights.length > 0 && lightingUpdateCounter % 15 === 0) {
        const pointLights = activeLights.map(light => ({
          position: new THREE.Vector3(light.position.x, light.position.y, light.position.z),
          color: new THREE.Color(light.color),
          intensity: light.intensity,
          range: lightRange
        }))
        
        lightingManager.updatePointLights?.(pointLights)
      }
      lightingUpdateCounter++
    }
  })

  // This reactive statement will update the shader uniforms whenever the props change.
  $: if (material) {
    material.uniforms.uPointSize.value = pointSize
    material.uniforms.uGlowInnerRadius.value = glowInnerRadius
    material.uniforms.uGlowOuterRadius.value = glowOuterRadius
    material.uniforms.uCoreRadius.value = coreRadius
    material.uniforms.uCoreOpacity.value = coreOpacity
  }

  // REMOVED: Broken reactive system that violates ECS principles

  // API functions (no changes needed)
  export function triggerDiscovery() { /* ... */ }
  export function setEmotionalState(wonder: number, melancholy: number, hope: number, discovery: number) { /* ... */ }
  export function setIntensity(intensity: number) { /* ... */ }
  export function getStats() { /* ... */ }
  export function getActiveLights() { /* ... */ }
</script>

<!-- UPDATED: Render a Points object instead of an InstancedMesh -->
{#if geometry && material}
  <T.Points
    bind:ref={points}
    {geometry}
    {material}
    frustumCulled={false}
  />
{/if}

<!-- Actual Three.js lights - smoothly animated intensity -->
{#if optimizedMaxLights > 0}
  {#each activeLights as light, index (light.position.x + light.position.y + light.position.z)}
    <T.PointLight
      position={[light.position.x, light.position.y, light.position.z]}
      intensity={light.intensity}
      color={light.color}
      distance={lightRange}
      decay={2}
      castShadow={false}
    />
  {/each}
{/if}

<style>
/* No styles needed */
</style>
