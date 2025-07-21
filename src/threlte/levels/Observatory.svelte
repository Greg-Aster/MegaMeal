<!-- 
  Observatory Level Component
  Threlte version of the observatory level with enhanced interactivity
-->
<script lang="ts">
import { T, useTask } from '@threlte/core'
import { Text } from '@threlte/extras'
import { RigidBody, Collider } from '@threlte/rapier'
import { onMount, createEventDispatcher } from 'svelte'

// Import the new Threlte systems
import FireflySystem from '../systems/FireflySystem.svelte'
import Ocean from '../systems/Ocean.svelte'
import StarMap from '../systems/StarMap.svelte'
import Skybox from '../systems/Skybox.svelte'
import StaticEnvironment from '../systems/StaticEnvironment.svelte'

// Import the level configuration JSON and optimization
import config from '../../game/levels/observatory.json'
import { OptimizationManager } from '../../engine/optimization/OptimizationManager'

const dispatch = createEventDispatcher()

// Props
export let timelineEvents: any[] = []

// Level loading state
export let onLevelReady: (() => void) | undefined = undefined

// Observatory configuration
// Removed unused variables

// Device-aware optimization using OptimizationManager
let deviceOptimizedSettings = {
  maxLights: 20,
  directionalLightIntensity: { main: 0.5, fill: 0.25 },
  ambientLightIntensity: 1.0
}

// Initialize optimization settings
if (typeof window !== 'undefined') {
  try {
    const optimizationManager = OptimizationManager.getInstance()
    const qualitySettings = optimizationManager.getQualitySettings()
    const deviceCapabilities = optimizationManager.getDeviceCapabilities()
    const optimizationLevel = optimizationManager.getOptimizationLevel()
    
    deviceOptimizedSettings = {
      maxLights: qualitySettings.maxFireflyLights,
      directionalLightIntensity: {
        main: deviceCapabilities?.isMobile ? 0.6 : 0.5,
        fill: deviceCapabilities?.isMobile ? 0.3 : 0.25
      },
      ambientLightIntensity: deviceCapabilities?.isMobile ? 2.0 : 1.0
    }
    
    console.log(`🔭 Observatory: Using optimization level ${optimizationLevel} with ${deviceOptimizedSettings.maxLights} max firefly lights`)
  } catch (error) {
    console.warn('⚠️ Observatory: OptimizationManager not available, using defaults:', error)
    // Keep default values if OptimizationManager fails
  }
}

// Terrain height function for dynamic systems
function getHeightAt(x: number, z: number): number {
  // Calculate terrain height using the same algorithm as the original Three.js system
  const distanceFromCenter = Math.sqrt(x * x + z * z)
  
  // Terrain parameters from observatory.json and ObservatoryEnvironmentSystem.ts
  const terrainParams = {
    hillHeight: 15,
    hillRadius: 100,
    islandRadius: 220,
    baseGroundLevel: -5,
  }
  
  let height = 0
  
  // Central hill
  if (distanceFromCenter < terrainParams.hillRadius) {
    const heightMultiplier = Math.cos(
      (distanceFromCenter / terrainParams.hillRadius) * Math.PI * 0.5,
    )
    height = terrainParams.baseGroundLevel + terrainParams.hillHeight * heightMultiplier * heightMultiplier
  } else {
    height = terrainParams.baseGroundLevel
  }
  
  // Void drop-off
  if (distanceFromCenter >= terrainParams.islandRadius) {
    const voidDistance = distanceFromCenter - terrainParams.islandRadius
    height = terrainParams.baseGroundLevel - Math.pow(voidDistance * 0.1, 2)
  }
  
  return height
}

onMount(() => {
  console.log('🔭 Observatory level loading')
})

// Handle environment loading success
function handleEnvironmentLoaded() {
  console.log('✅ Observatory environment loaded')
  
  if (onLevelReady) {
    onLevelReady()
  }
}

// Handle environment loading error
function handleEnvironmentError(event: CustomEvent) {
  console.log('❌ Environment loading failed:', event.detail)
}

// Star generation now handled by StarMap.svelte component

// All skybox and GLTF loading logic moved to reusable components

// Star interactions now handled by StarMap.svelte component

// Removed unused telescope click handler

// Animation now handled by individual system components
</script>

<!-- Observatory Group -->
<T.Group name="observatory">
  
  <!-- Reusable Skybox Component -->
  <Skybox imageUrl="/assets/hdri/skywip4.webp" />
  
  <!-- Self-Sufficient Static Environment Component -->
  <StaticEnvironment 
    url="/models/levels/observatory-environment.glb"
    scale={1.0}
    on:loaded={handleEnvironmentLoaded}
    on:error={handleEnvironmentError}
  />
  
  <!-- Observatory-Specific Lighting (migrated from ObservatoryEnvironmentSystem.ts) -->
  <T.Group name="observatory-lighting">
    <!-- Main directional light (device-optimized) -->
    <T.DirectionalLight 
      position={[100, 200, 50]} 
      intensity={deviceOptimizedSettings.directionalLightIntensity.main}
      color="#8bb3ff"
      castShadow={true}
      shadow.mapSize.width={2048}
      shadow.mapSize.height={2048}
      shadow.camera.near={0.5}
      shadow.camera.far={500}
      shadow.camera.left={-300}
      shadow.camera.right={300}
      shadow.camera.top={300}
      shadow.camera.bottom={-300}
    />
    
    <!-- Fill light for balanced illumination (device-optimized) -->
    <T.DirectionalLight 
      position={[-50, 100, -30]} 
      intensity={deviceOptimizedSettings.directionalLightIntensity.fill}
      color="#6a7db3"
    />
    
    <!-- Ambient light (device-optimized) -->
    <T.AmbientLight 
      intensity={deviceOptimizedSettings.ambientLightIntensity} 
      color="#404060" 
    />
  </T.Group>
  
  <!-- Modern Dynamic Systems (Phase 2 Components) -->
  
  <!-- Ocean System with 3D wave animation -->
  <Ocean 
    size={config.water.oceanConfig.size}
    color={config.water.oceanConfig.color}
    opacity={config.water.oceanConfig.opacity}
    enableAnimation={config.water.oceanConfig.enableAnimation}
    animationSpeed={config.water.oceanConfig.animationSpeed}
    dynamics={config.water.dynamics}
  />
  
  <!-- Enhanced Firefly System with OptimizationManager device-aware settings -->
  <FireflySystem 
    count={80}
    maxLights={deviceOptimizedSettings.maxLights}
    colors={[0x87ceeb, 0x98fb98, 0xffffe0, 0xdda0dd, 0xf0e68c, 0xffa07a, 0x20b2aa, 0x9370db]}
    emissiveIntensity={25.0}
    lightIntensity={25.0}
    lightRange={120}
    cycleDuration={12.0}
    fadeSpeed={2.0}
    heightRange={{ min: 2.0, max: 8.0 }}
    radius={180}
    size={0.015}
    globalIntensityMultiplier={1.0}
    movement={{
      speed: 0.2,
      wanderSpeed: 0.004,
      wanderRadius: 10,
      floatAmplitude: { x: 1.5, y: 0.5, z: .5 },
      lerpFactor: 1.0,
    }}
    {getHeightAt}
    on:lightCycled={(e) => console.log('🔥 Firefly light cycled:', e.detail)}
  />
  
  <!-- Interactive Star Map with store integration -->
  <StarMap 
    {timelineEvents}
    starCount={200}
    heightRange={{ min: 50, max: 200 }}
    radius={400}
    on:starSelected={(e) => dispatch('starSelected', e.detail)}
  />
  
  <!-- Legacy interactive elements removed -->
</T.Group>