<!-- 
  Observatory Level Component
  Threlte version of the observatory level with enhanced interactivity
-->
<script lang="ts">
import { T, useTask } from '@threlte/core'
import { Text } from '@threlte/extras'
import { RigidBody, Collider } from '@threlte/rapier'
import { onMount, createEventDispatcher } from 'svelte'
import * as THREE from 'three'

// Import the new Threlte systems
import FireflySystem from '../systems/FireflySystem.svelte'
import Ocean from '../systems/Ocean.svelte'
import StarMap from '../systems/StarMap.svelte'
import Skybox from '../systems/Skybox.svelte'
import StaticEnvironment from '../systems/StaticEnvironment.svelte'

// Import the level configuration JSON
import config from '../../game/levels/observatory.json'

const dispatch = createEventDispatcher()

// Props
export let timelineEvents: any[] = []

// Level loading state
export let onLevelReady: (() => void) | undefined = undefined

// Observatory configuration
let observatoryModel: THREE.Group
let isLoaded = false

// Removed unused interactive elements

// Environment loading state
let environmentReady = false

// Mobile detection for optimization
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
)

// Terrain height function for dynamic systems
function getHeightAt(x: number, z: number): number {
  // Static approximation - real terrain heights come from GLTF model
  return -5
}

onMount(() => {
  console.log('🔭 Observatory level loading')
})

// Handle environment loading success
function handleEnvironmentLoaded(event: CustomEvent) {
  environmentReady = true
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
    <!-- Main directional light (matching original configuration) -->
    <T.DirectionalLight 
      position={[100, 200, 50]} 
      intensity={isMobile ? 0.6 : 0.5}
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
    
    <!-- Fill light for balanced illumination -->
    <T.DirectionalLight 
      position={[-50, 100, -30]} 
      intensity={isMobile ? 0.3 : 0.25}
      color="#6a7db3"
    />
    
    <!-- Ambient light (matching original configuration) -->
    <T.AmbientLight 
      intensity={isMobile ? 2.0: 1.0} 
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
  
  <!-- Firefly System with instanced rendering and camera-aware culling -->
  <FireflySystem 
    count={80}
    maxLights={isMobile ? 0 : 8}
    colors={[0x87ceeb, 0x98fb98, 0xffffe0, 0xdda0dd, 0xf0e68c, 0xffa07a, 0x20b2aa, 0x9370db]}
    emissiveIntensity={15.0}
    lightIntensity={15.0}
    lightRange={80}
    cycleDuration={12.0}
    fadeSpeed={0.3}
    heightRange={{ min: 0.5, max: 2.5 }}
    radius={180}
    size={0.015}
    movement={{
      speed: 0.2,
      wanderSpeed: 0.004,
      wanderRadius: 4,
      floatAmplitude: { x: 1.5, y: 0.5, z: 1.5 },
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