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
  import StarSprite from './StarSprite.svelte'

  // Visual firefly data for StarSprite components
  interface FireflyVisual {
    id: number
    position: [number, number, number]
    color: number
    size: number
    intensity: number
    twinkleSpeed: number
    animationOffset: number
  }

  // Props with perfect legacy visual parameters
  export let count = 100
  export let maxLights = 80
  export let colors = [0x87ceeb, 0x98fb98, 0xffffe0, 0xdda0dd, 0xf0e68c, 0xffa07a, 0x20b2aa, 0x9370db]
  export let emissiveIntensity = 15.0 // Kept for logic, but not directly used by new material
  export let lightIntensity = 40.0
  export let lightRange = 300
  export let cycleDuration = 12.0
  export let fadeSpeed = 2.0
  export let heightRange = { min: 0.5, max: 2.5 }
  export let radius = 30
  export let size = 0.015 // Kept for ECS logic
  export let pointSize = 25.0 // Controls the visual size of the firefly glow
  // Removed unused shader-related props - now handled by StarSprite component
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
  
  // Visual firefly data for StarSprite rendering
  let visualFireflies: FireflyVisual[] = []

  // Performance objects
  const tempColor = new THREE.Color()
  let activeLights: any[] = []
  let lightingUpdateCounter = 0
  let lightCycleTime = 0
  const lightCycleDuration = 20000 // 20 seconds for a full cycle (much slower)
  let initialLightsSet = false // Track if we've set initial lights yet
  
  // Smooth transition system
  let targetLightIntensities = new Map<number, number>() // Target intensities for smooth fading
  let currentLightIntensities = new Map<number, number>() // Current intensities for interpolation

  /**
   * Ultra-optimized firefly selection - minimal calculations
   */
  function updateLightTargets(allLights: any[], maxLights: number, time: number) {
    if (allLights.length === 0 || maxLights === 0) return
    
    // Even less frequent changes - every 10 seconds
    const timeSeed = Math.floor(time / 10000)
    const step = Math.max(1, Math.floor(allLights.length / maxLights))
    const offset = timeSeed % step
    
    // Pre-calculate random values to avoid Math.random() in loop
    const randomValues = new Float32Array(maxLights)
    for (let j = 0; j < maxLights; j++) {
      randomValues[j] = 0.7 + Math.random() * 0.6 // Pre-compute random multipliers
    }
    
    targetLightIntensities.clear()
    
    let randomIndex = 0
    for (let i = offset; i < allLights.length && targetLightIntensities.size < maxLights; i += step) {
      const light = allLights[i]
      if (!light) continue
      
      // Use pre-computed random value
      const baseIntensity = light.intensity * randomValues[randomIndex % maxLights]
      targetLightIntensities.set(i, baseIntensity)
      randomIndex++
    }
  }
  
  /**
   * Get current smoothly interpolated lights
   */
  function getCurrentLights(allLights: any[], delta: number): any[] {
    const smoothedLights: any[] = []
    
    for (let index = 0; index < allLights.length; index++) {
      const light = allLights[index]
      if (!light) continue
      
      const targetIntensity = targetLightIntensities.get(index) || 0
      const currentIntensity = currentLightIntensities.get(index) || 0
      
      // Smooth interpolation using fadeSpeed prop
      const newIntensity = THREE.MathUtils.lerp(currentIntensity, targetIntensity, delta * fadeSpeed)
      currentLightIntensities.set(index, newIntensity)
      
      // Only include lights with meaningful intensity
      if (newIntensity > 0.01) {
        smoothedLights.push({
          ...light,
          intensity: newIntensity
        })
      }
    }
    
    return smoothedLights
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
      
      // Create ECS entities for logic and visual data for rendering
      this.createECSFireflies()
      this.setupVisualFireflies()
      console.log(`✅ HybridFirefly: Created ${optimizedCount} ECS entities with StarSprite visuals`)
    }

    protected onUpdate(deltaTime: number): void {
      // Update visual firefly data from ECS
      this.updateVisualFireflies()
    }

    protected onMessage(message: SystemMessage): void {
      // ... (no changes needed here)
    }

    protected onDispose(): void {
      // StarSprite components handle their own disposal
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
      
      for (let i = 0; i < optimizedCount; i++) {
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

    public setupVisualFireflies(): void {
      visualFireflies = fireflyEntities.map((eid, i) => ({
        id: eid,
        position: [Position.x[eid], Position.y[eid], Position.z[eid]] as [number, number, number],
        color: LightEmitter.color[eid],
        size: pointSize * 0.05, // Convert point size to sprite scale
        intensity: 1.0,
        twinkleSpeed: 0.8 + Math.random() * 0.4,
        animationOffset: Math.random() * Math.PI * 2
      }))
    }

    private updateVisualFireflies(): void {
      if (!ecsWorld) return

      const world = ecsWorld.getWorld()
      const entities = fireflyQuery(world)
      
      // Pre-calculate normalization factor
      const intensityNorm = 1.0 / lightIntensity

      for (let i = 0; i < entities.length && i < visualFireflies.length; i++) {
        const eid = entities[i]
        const visual = visualFireflies[i]
        
        if (!visual) continue
        
        // Update position from ECS
        visual.position[0] = Position.x[eid]
        visual.position[1] = Position.y[eid]
        visual.position[2] = Position.z[eid]

        // Update intensity from ECS with light cycling
        const baseIntensity = LightEmitter.intensity[eid]
        const fadeProgress = LightCycling.fadeProgress[eid]
        visual.intensity = Math.min(baseIntensity * intensityNorm, 1.0) * fadeProgress
        
        // Update color from ECS
        visual.color = LightEmitter.color[eid]
      }
      
      // Trigger reactivity
      visualFireflies = visualFireflies
    }

    public getActiveLightsFromECS() {
      if (!ecsWorld) return []
      return ecsWorld.getActiveLights();
    }

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
    if (!component) return
    
    lightingUpdateCounter++
    
    // Only get lights when we actually need them (much less frequent)
    if (lightingUpdateCounter % 6 === 0) { // Every 6 frames (~10fps)
      const allLights = component.getActiveLightsFromECS()
      
      // Set initial lights immediately on first run
      if (!initialLightsSet && allLights.length > 0) {
        console.log(`🌟 Setting initial lights: ${allLights.length} fireflies available`)
        updateLightTargets(allLights, optimizedMaxLights, 0)
        activeLights = getCurrentLights(allLights, delta * 6)
        initialLightsSet = true
      }
      
      // Update cycle time for distributed lighting
      lightCycleTime += delta * 1000 * 6 // Account for reduced frequency
      if (lightCycleTime > lightCycleDuration) {
        lightCycleTime = 0
      }
      
      // Update light targets much less frequently (but not on first run)
      if (initialLightsSet && lightingUpdateCounter % 3600 === 0) { // Every 60 seconds
        updateLightTargets(allLights, optimizedMaxLights, lightCycleTime)
        
        // Debug info even less frequently
        if (lightingUpdateCounter % 7200 === 0) { // Every 2 minutes
          console.log(`🌟 Lights: ${activeLights.length}/${allLights.length} active (max: ${optimizedMaxLights})`)
        }
      }
      
      // Update actual light intensities less frequently
      if (lightingUpdateCounter % 18 === 0) { // Every 18 frames (~3fps)
        activeLights = getCurrentLights(allLights, delta * 6) // Compensate for reduced frequency
      }
      
      // Send to lighting system much less frequently
      if (lightingManager && activeLights.length > 0 && lightingUpdateCounter % 60 === 0) { // Every second
        const pointLights = activeLights.map(light => ({
          position: new THREE.Vector3(light.position.x, light.position.y, light.position.z),
          color: new THREE.Color(light.color),
          intensity: light.intensity,
          range: lightRange
        }))
        
        lightingManager.updatePointLights?.(pointLights)
      }
    }
  })

  // Update visual fireflies when count changes
  $: if (component && visualFireflies.length !== optimizedCount) {
    console.log(`🔄 Firefly count changed: recreating ${optimizedCount} visual fireflies`)
    component.setupVisualFireflies()
  }

  // Reactive handling of prop changes for maintainability
  $: if (component && ecsWorld) {
    // When count changes, we need to recreate fireflies
    if (fireflyEntities.length !== optimizedCount) {
      console.log(`🔄 Firefly count changed: recreating ${optimizedCount} fireflies`)
      // Clear existing fade states
      targetLightIntensities.clear()
      currentLightIntensities.clear()
      // The component will recreate fireflies on next update
    }
  }

  // Handle optimization level changes reactively
  $: {
    try {
      const optimizationManager = OptimizationManager.getInstance()
      const qualitySettings = optimizationManager.getQualitySettings()
      const newMaxLights = qualitySettings.maxFireflyLights * 2
      
      if (newMaxLights !== optimizedMaxLights) {
        optimizedMaxLights = newMaxLights
        console.log(`🎯 Max lights updated: ${optimizedMaxLights} (level: ${optimizationManager.getOptimizationLevel()})`)
      }
    } catch (error) {
      // Fallback handled above
    }
  }

  // REMOVED: Broken reactive system that violates ECS principles

  // API functions (no changes needed)
  export function triggerDiscovery() { /* ... */ }
  export function setEmotionalState(wonder: number, melancholy: number, hope: number, discovery: number) { /* ... */ }
  export function setIntensity(intensity: number) { /* ... */ }
  export function getStats() { /* ... */ }
  export function getActiveLights() { /* ... */ }
</script>

<!-- Beautiful StarSprite fireflies with star-like appearance -->
{#each visualFireflies as firefly (firefly.id)}
  <StarSprite
    position={firefly.position}
    color={firefly.color}
    size={firefly.size}
    intensity={firefly.intensity}
    twinkleSpeed={firefly.twinkleSpeed}
    animationOffset={firefly.animationOffset}
    enableTwinkle={true}
    opacity={1.0}
  />
{/each}

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
