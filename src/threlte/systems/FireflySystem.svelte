<!--
  FireflySystem Component - Modern Threlte Implementation
  Features:
  - Instanced rendering for 80 fireflies in a single operation  
  - Camera-aware culling (revolutionary performance optimization)
  - Smooth fading animation with Threlte useTask
  - Mobile optimization with automatic quality scaling
  - Advanced light cycling with regional distribution
  - Global intensity control and event dispatching
  - Professional material configuration matching Three.js version
-->
<script lang="ts">
import { T, useTask, useThrelte } from '@threlte/core'
import { onMount, onDestroy, createEventDispatcher } from 'svelte'
import * as THREE from 'three'
import { OptimizationManager, OptimizationLevel } from '../../engine/optimization/OptimizationManager'

const dispatch = createEventDispatcher()

// Props
export let count = 80
export let maxLights = 20
export let colors = [0x87ceeb, 0x98fb98, 0xffffe0, 0xdda0dd, 0xf0e68c, 0xffa07a, 0x20b2aa, 0x9370db]
export let emissiveIntensity = 15.0
export let lightIntensity = 15.0
export let lightRange = 80
export let cycleDuration = 12.0
export let fadeSpeed = 0.3
export let heightRange = { min: 0.5, max: 2.5 }
export let radius = 180
export let size = 0.015
export let movement = {
  speed: 0.2,
  wanderSpeed: 0.004,
  wanderRadius: 4,
  floatAmplitude: { x: 1.5, y: 0.5, z: 1.5 },
  lerpFactor: 1.0,
}
export let getHeightAt: ((x: number, z: number) => number) | undefined = undefined

// Advanced control props (matching Three.js version)
export let globalIntensityMultiplier = 1.0

// Device capabilities detection using OptimizationManager
let optimizationManager: OptimizationManager | null = null
let deviceOptimizedMaxLights = maxLights
let optimizationLevel: OptimizationLevel = OptimizationLevel.MEDIUM

// Initialize optimization manager for device-aware settings
if (typeof window !== 'undefined') {
  // Create a temporary renderer context for device detection
  const canvas = document.createElement('canvas')
  const renderer = new THREE.WebGLRenderer({ canvas })
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
  
  try {
    optimizationManager = OptimizationManager.getInstance()
    optimizationManager.initialize(camera, scene, renderer)
    
    const qualitySettings = optimizationManager.getQualitySettings()
    deviceOptimizedMaxLights = qualitySettings.maxFireflyLights
    optimizationLevel = optimizationManager.getOptimizationLevel()
    
    console.log(`🎛️ FireflySystem: Using OptimizationManager settings - Level: ${optimizationLevel}, MaxLights: ${deviceOptimizedMaxLights}`)
    
    // Clean up temporary renderer
    renderer.dispose()
  } catch (error) {
    console.warn('⚠️ FireflySystem: OptimizationManager not available, falling back to mobile detection:', error)
    // Fallback to simple mobile detection if OptimizationManager fails
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    deviceOptimizedMaxLights = isMobile ? 0 : maxLights
  }
}

// Apply device-aware optimizations
$: optimizedCount = deviceOptimizedMaxLights === 0 ? Math.min(count, 30) : count
$: optimizedMaxLights = Math.min(maxLights, deviceOptimizedMaxLights)

// Threlte context
const { camera } = useThrelte()

// Instanced mesh system
let instancedMesh: THREE.InstancedMesh
let geometryRef: THREE.SphereGeometry
let materialRef: THREE.MeshStandardMaterial

// Firefly data arrays for instanced rendering
let fireflyPositions: THREE.Vector3[] = []
let fireflyBasePositions: THREE.Vector3[] = []
let fireflyTargetPositions: THREE.Vector3[] = []
let fireflyLights: (THREE.PointLight | null)[] = []
let fireflyAnimationOffsets: number[] = []
let fireflyLightStates: {
  isActive: boolean
  fadeProgress: number
  cycleTime: number
  color: number
}[] = []

// Reactive position arrays for Svelte template (updated each frame)
let reactivePositions: [number, number, number][] = []

// Animation state
let animationTime = 0
let lightCycleTimer = 0
let initialized = false
let cameraAwareStartDelay = 0.5 // Give initial lights time to be visible

// Matrices for instanced rendering
const tempMatrix = new THREE.Matrix4()
const tempColor = new THREE.Color()

onMount(() => {
  console.log('✨ FireflySystem: Initializing with instanced rendering...')
  console.log(`🎯 Device optimization: Level ${optimizationLevel}, MaxLights: ${deviceOptimizedMaxLights}/${maxLights}`)
  initializeFireflies()
  initialized = true
})

onDestroy(() => {
  console.log('🧹 FireflySystem: Cleaning up...')
  
  // Dispose of lights
  fireflyLights.forEach(light => {
    if (light && light.parent) {
      light.parent.remove(light)
    }
  })
  
  // Clean up geometry and material
  if (geometryRef) geometryRef.dispose()
  if (materialRef) materialRef.dispose()
  
  initialized = false
})

function initializeFireflies() {
  // Initialize data arrays
  fireflyPositions = []
  fireflyBasePositions = []
  fireflyTargetPositions = []
  fireflyLights = []
  fireflyAnimationOffsets = []
  fireflyLightStates = []

  // Create firefly data
  for (let i = 0; i < optimizedCount; i++) {
    // Generate position on floating island
    const angle = Math.random() * Math.PI * 2
    const radiusPos = Math.random() * radius
    const x = Math.cos(angle) * radiusPos
    const z = Math.sin(angle) * radiusPos
    
    // Calculate height using terrain function
    const groundHeight = getHeightAt ? getHeightAt(x, z) : 0
    const y = groundHeight + heightRange.min + Math.random() * (heightRange.max - heightRange.min)
    
    const position = new THREE.Vector3(x, y, z)
    const color = colors[Math.floor(Math.random() * colors.length)]
    
    fireflyPositions.push(position.clone())
    fireflyBasePositions.push(position.clone())
    fireflyTargetPositions.push(position.clone())
    fireflyAnimationOffsets.push(Math.random() * Math.PI * 2)
    
    // Create light for camera-aware culling (but don't add to scene yet)
    let light: THREE.PointLight | null = null
    if (optimizedMaxLights > 0) {
      light = new THREE.PointLight(color, 0, lightRange)
      light.position.copy(position)
      light.name = `firefly_light_${i}`
    }
    fireflyLights.push(light)
    
    // Initialize light state
    fireflyLightStates.push({
      isActive: false,
      fadeProgress: 0,
      cycleTime: Math.random() * cycleDuration,
      color: color
    })
  }

  console.log(`✅ FireflySystem: Created ${optimizedCount} fireflies with ${optimizedMaxLights} max lights (device-optimized from ${maxLights})`)
  
  // Initialize reactive positions array
  reactivePositions = fireflyPositions.map(pos => [pos.x, pos.y, pos.z])
  
  // Initialize light cycling like Three.js version
  initializeLightCycling()
}

function initializeLightCycling() {
  if (optimizedMaxLights === 0) return
  
  // Start with a reasonable number of lights for initial display
  const initialActiveCount = Math.min(Math.floor(optimizedMaxLights * 0.6), fireflyLightStates.length)
  console.log(`🔥 Initializing ${initialActiveCount} firefly lights out of ${fireflyLightStates.length} total fireflies`)

  // Activate lights evenly distributed across all fireflies
  const step = Math.floor(fireflyLightStates.length / initialActiveCount)
  
  for (let i = 0; i < initialActiveCount; i++) {
    const targetIndex = (i * step + Math.floor(Math.random() * Math.min(step, 5))) % fireflyLightStates.length
    const state = fireflyLightStates[targetIndex]

    if (state && !state.isActive) {
      state.isActive = true
      // Start with smooth fade-in instead of instant full brightness
      state.fadeProgress = 0.0
      // Stagger the cycle times dramatically for wave-like lighting changes
      state.cycleTime = (i / initialActiveCount) * cycleDuration * 0.5
      console.log(`✅ Activated firefly light ${targetIndex} with color 0x${state.color.toString(16)}`)
    }
  }
  
  const activeCount = fireflyLightStates.filter(s => s.isActive).length
  console.log(`🌟 Total active lights: ${activeCount}`)
}

// Enhanced camera-aware culling with performance monitoring
let frameCount = 0
let performanceBasedMaxLights = 30 // Start with a reasonable number
let lastFrameTime = performance.now()

// Initialize performance variables after optimizedMaxLights is set
$: if (optimizedMaxLights > 0 && performanceBasedMaxLights !== Math.min(30, optimizedMaxLights)) {
  performanceBasedMaxLights = Math.min(30, optimizedMaxLights) // Start conservative
}

function updateCameraAwareLighting(camera: THREE.Camera) {
  if (!camera || optimizedMaxLights === 0) return

  frameCount++
  
  // Performance monitoring every 60 frames
  if (frameCount % 60 === 0) {
    const currentTime = performance.now()
    const frameTime = (currentTime - lastFrameTime) / 60
    
    // Adjust light count based on frame time
    if (frameTime > 20) { // If frame time > 20ms, reduce lights
      performanceBasedMaxLights = Math.max(10, Math.floor(performanceBasedMaxLights * 0.8))
      console.log(`🎯 Performance: Reducing lights to ${performanceBasedMaxLights} (frame time: ${frameTime.toFixed(1)}ms)`)
    } else if (frameTime < 12 && performanceBasedMaxLights < optimizedMaxLights) { // If frame time < 12ms, increase lights
      performanceBasedMaxLights = Math.min(optimizedMaxLights, Math.floor(performanceBasedMaxLights * 1.1))
      console.log(`🚀 Performance: Increasing lights to ${performanceBasedMaxLights} (frame time: ${frameTime.toFixed(1)}ms)`)
    }
    
    lastFrameTime = currentTime
  }

  // Update camera world matrix to ensure accurate frustum
  camera.updateMatrixWorld(true)

  // Create frustum from camera for view culling
  const frustum = new THREE.Frustum()
  const cameraMatrix = new THREE.Matrix4()
  cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  frustum.setFromProjectionMatrix(cameraMatrix)

  // Find fireflies in view with enhanced priority system
  const inViewFireflies: Array<{ 
    index: number
    distance: number
    priority: number
    inFrustum: boolean
    angleFactor: number
  }> = []
  
  const cameraPosition = camera.position
  const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)

  fireflyPositions.forEach((position, index) => {
    // More generous frustum check - include lights that can influence what's in view
    const lightInfluenceRadius = Math.min(lightRange * 0.3, 25) // Cap influence radius
    const tempSphere = new THREE.Sphere(position, lightInfluenceRadius)
    const inFrustum = frustum.intersectsSphere(tempSphere)
    
    // Also include nearby lights even if not in frustum (for better lighting)
    const distance = cameraPosition.distanceTo(position)
    const isNearby = distance < lightRange * 0.5
    
    if (inFrustum || isNearby) {
      // Calculate angle priority - lights in front of camera get higher priority
      const toFirefly = position.clone().sub(cameraPosition).normalize()
      const angleFactor = Math.max(0.2, (cameraForward.dot(toFirefly) + 1) * 0.5) // Normalize to 0.2-1.0
      
      // Enhanced priority calculation
      const distanceFactor = 1 / (distance * 0.01 + 1) // Normalize distance factor
      const frustumBonus = inFrustum ? 1.5 : 1.0 // Bonus for being in view
      const priority = distanceFactor * angleFactor * frustumBonus
      
      inViewFireflies.push({ index, distance, priority, inFrustum, angleFactor })
    }
  })

  // Sort by priority and limit to performance-based count
  inViewFireflies.sort((a, b) => b.priority - a.priority)
  const selectedFireflies = inViewFireflies.slice(0, performanceBasedMaxLights)
  const activeIndices = new Set(selectedFireflies.map(f => f.index))

  // Update light states based on camera visibility and performance
  let activationCount = 0
  let deactivationCount = 0
  let stateChanged = false
  
  fireflyLightStates.forEach((state, index) => {
    const wasActive = state.isActive
    const shouldBeActive = activeIndices.has(index)
    
    if (wasActive !== shouldBeActive) {
      stateChanged = true
      if (shouldBeActive) {
        activationCount++
        state.isActive = true
        state.cycleTime = 0
        // Start completely faded out for smooth fade-in
        if (state.fadeProgress < 0.1) {
          state.fadeProgress = 0.0
        }
      } else {
        deactivationCount++
        state.isActive = false
        // Keep existing fadeProgress to fade out naturally
      }
    }
  })
  
  // CRITICAL FIX: Trigger Svelte reactivity by reassigning the array
  if (stateChanged) {
    fireflyLightStates = fireflyLightStates
  }
  
  // Debug light changes
  if (frameCount % 180 === 0 && (activationCount > 0 || deactivationCount > 0)) {
    console.log(`💡 Light changes: +${activationCount} activated, -${deactivationCount} deactivated`)
  }

  // Enhanced debug logging
  if (frameCount % 180 === 0) {
    const activeLights = fireflyLightStates.filter(s => s.isActive).length
    const inFrustumCount = selectedFireflies.filter(f => f.inFrustum).length
    const nearbyCount = selectedFireflies.length - inFrustumCount
    
    console.log(`🔥 Camera culling: ${activeLights}/${performanceBasedMaxLights} lights active`)
    console.log(`   📹 In frustum: ${inFrustumCount}, Nearby: ${nearbyCount}, Total candidates: ${inViewFireflies.length}`)
    console.log(`   📍 Camera pos: [${cameraPosition.x.toFixed(1)}, ${cameraPosition.y.toFixed(1)}, ${cameraPosition.z.toFixed(1)}]`)
    
    // Log a few sample priorities for debugging
    if (selectedFireflies.length > 0) {
      const sample = selectedFireflies.slice(0, 3)
      console.log(`   🎯 Sample priorities:`, sample.map(f => `${f.index}:${f.priority.toFixed(2)}`))
    }
  }
}

// Smooth light fading system (enhanced with global intensity multiplier)
function updateLightFading(deltaTime: number) {
  let fadeChanged = false
  
  fireflyLightStates.forEach((state, index) => {
    const light = fireflyLights[index]
    if (!light) return

    // Determine target fade progress
    const targetFadeProgress = state.isActive ? 1.0 : 0.0

    // Smooth interpolation
    const fadeDirection = targetFadeProgress - state.fadeProgress
    if (Math.abs(fadeDirection) > 0.001) {
      fadeChanged = true
      state.fadeProgress += fadeDirection * fadeSpeed * deltaTime
      state.fadeProgress = Math.max(0.0, Math.min(1.0, state.fadeProgress))
    }

    // Apply fade to light intensity with global multiplier
    light.intensity = lightIntensity * state.fadeProgress * globalIntensityMultiplier
  })
  
  // CRITICAL FIX: Trigger Svelte reactivity for fade progress changes
  if (fadeChanged) {
    fireflyLightStates = fireflyLightStates
  }
}

// Update firefly positions with floating animation
function updateFireflyPositions(deltaTime: number) {
  fireflyPositions.forEach((position, index) => {
    const basePos = fireflyBasePositions[index]
    const targetPos = fireflyTargetPositions[index]
    const offset = fireflyAnimationOffsets[index] + animationTime * movement.speed

    // Floating animation
    const floatY = Math.sin(offset) * movement.floatAmplitude.y
    const floatX = Math.cos(offset * 0.7) * movement.floatAmplitude.x
    const floatZ = Math.sin(offset * 0.5) * movement.floatAmplitude.z

    // Wandering behavior
    const wanderX = Math.sin(animationTime * movement.wanderSpeed + index) * movement.wanderRadius
    const wanderZ = Math.cos(animationTime * movement.wanderSpeed + index * 1.3) * movement.wanderRadius

    // Update target position
    targetPos.copy(basePos)
    targetPos.x += floatX + wanderX
    targetPos.y += floatY
    targetPos.z += floatZ + wanderZ

    // Smooth interpolation to target
    position.lerp(targetPos, deltaTime * movement.lerpFactor)

    // Update light position
    const light = fireflyLights[index]
    if (light) {
      light.position.copy(position)
    }
  })
}

// Advanced light cycling system (from Three.js version)
function updateLightCycling(deltaTime: number) {
  // Update each light's cycle time
  fireflyLightStates.forEach(state => {
    state.cycleTime += deltaTime
  })

  // More frequent light cycling for dynamic movement
  if (lightCycleTimer >= cycleDuration / 2) {
    cycleMultipleLights()
    lightCycleTimer = 0
  }
}

function cycleMultipleLights() {
  // Cycle 2-3 lights at once for more dramatic movement
  const cyclesToPerform = Math.min(3, Math.floor(optimizedMaxLights / 4))
  let cyclingChanged = false

  for (let i = 0; i < cyclesToPerform; i++) {
    // Find lights that have been active for a while
    const candidatesForDeactivation = fireflyLightStates
      .map((state, index) => ({ state, index }))
      .filter(({ state }) => state.isActive && state.cycleTime > cycleDuration * 0.3)

    if (candidatesForDeactivation.length > 0) {
      // Deactivate a random active light
      const randomActive = candidatesForDeactivation[Math.floor(Math.random() * candidatesForDeactivation.length)]
      randomActive.state.isActive = false
      cyclingChanged = true

      // Activate a light in a different region for spatial distribution
      if (activateLightInDifferentRegion(randomActive.index)) {
        cyclingChanged = true
      }
      
      // Dispatch event for light cycling
      dispatch('lightCycled', {
        deactivatedIndex: randomActive.index,
        cycleTime: randomActive.state.cycleTime
      })
    }
  }
  
  // CRITICAL FIX: Trigger Svelte reactivity for cycling changes
  if (cyclingChanged) {
    fireflyLightStates = fireflyLightStates
  }
}

function activateLightInDifferentRegion(deactivatedIndex: number): boolean {
  const inactiveLights = fireflyLightStates
    .map((state, index) => ({ state, index }))
    .filter(({ state }) => !state.isActive)
    
  if (inactiveLights.length === 0) return false

  // Try to find a firefly that's spatially distant from the deactivated one
  const deactivatedPos = fireflyPositions[deactivatedIndex]
  let bestCandidate = inactiveLights[0]
  let maxDistance = 0

  inactiveLights.forEach(({ index }) => {
    const distance = deactivatedPos.distanceTo(fireflyPositions[index])
    if (distance > maxDistance) {
      maxDistance = distance
      bestCandidate = { state: fireflyLightStates[index], index }
    }
  })

  // If we found a distant candidate, use it; otherwise pick randomly
  const targetFirefly = maxDistance > radius * 0.3 
    ? bestCandidate 
    : inactiveLights[Math.floor(Math.random() * inactiveLights.length)]

  targetFirefly.state.isActive = true
  targetFirefly.state.cycleTime = 0
  targetFirefly.state.fadeProgress = 0.0 // Start from completely faded out for smooth fade-in
  
  return true // State was changed
}

// Update instance matrices for rendering (enhanced with proper color variations)
function updateInstancedMesh() {
  if (!instancedMesh) return

  fireflyPositions.forEach((position, index) => {
    const state = fireflyLightStates[index]
    
    // Set position matrix
    tempMatrix.setPosition(position)
    instancedMesh.setMatrixAt(index, tempMatrix)

    // Set color based on activity state and global intensity - ensure always visible
    tempColor.setHex(state.color)
    const colorIntensity = (state.fadeProgress * 0.7 + 0.3) * globalIntensityMultiplier // Particles always have slight glow
    tempColor.multiplyScalar(colorIntensity)
    instancedMesh.setColorAt(index, tempColor)
  })

  // Mark for update
  instancedMesh.instanceMatrix.needsUpdate = true
  if (instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true
  }
}

// Main animation loop
useTask((delta) => {
  if (!initialized) return

  animationTime += delta
  lightCycleTimer += delta

  // Update firefly positions
  updateFireflyPositions(delta)

  // Camera-aware lighting (revolutionary optimization) or fallback to cycling
  // But give initial lights time to be visible before camera culling kicks in
  if ($camera && animationTime > cameraAwareStartDelay) {
    updateCameraAwareLighting($camera)
  } else {
    updateLightCycling(delta)
  }
  
  // Debug camera culling status
  if (frameCount % 120 === 0) {
    const cameraActive = $camera && animationTime > cameraAwareStartDelay
    console.log(`📹 Camera culling: ${cameraActive ? 'ACTIVE' : 'INACTIVE'} (time: ${animationTime.toFixed(1)}s, delay: ${cameraAwareStartDelay}s)`)
  }

  // Update light fading
  updateLightFading(delta)

  // Update instanced mesh
  updateInstancedMesh()
  
  // Update reactive positions for Threlte lights (triggers Svelte reactivity)
  reactivePositions = fireflyPositions.map(pos => [pos.x, pos.y, pos.z])
})

// Create geometry and material (enhanced configuration matching Three.js version)
$: {
  if (typeof window !== 'undefined') {
    geometryRef = new THREE.SphereGeometry(size, 8, 6)
    materialRef = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffffff).multiplyScalar(0.1), // Use white base for per-instance coloring
      emissive: new THREE.Color(0xffffff), // White emissive - will be tinted per instance
      emissiveIntensity: emissiveIntensity,
      transparent: true,
      opacity: 0.9, // Higher opacity for visibility
      toneMapped: false, // Critical for proper bloom effect
      fog: false,
      metalness: 0.0,
      roughness: 1.0,
      alphaTest: 0.01,
      side: THREE.DoubleSide,
    })
    
    // System boundary enforcement - claim ownership like Three.js version
    materialRef.userData.optimizationSystemOwner = 'FireflySystem'
  }
}

// API functions for external control (matching Three.js version)
export function setIntensity(intensity: number) {
  globalIntensityMultiplier = Math.max(0, Math.min(1, intensity))
  
  // Update material opacity immediately
  if (materialRef) {
    materialRef.opacity = 0.8 * globalIntensityMultiplier
  }
}

export function getStats() {
  const activeLightCount = fireflyLightStates.filter(state => state.isActive).length
  const totalLightCount = fireflyLights.filter(light => light !== null).length

  return {
    totalFireflies: optimizedCount,
    activeLights: activeLightCount,
    maxLights: optimizedMaxLights,
    totalLights: totalLightCount,
    animationTime: animationTime,
    lightCycleTimer: lightCycleTimer,
  }
}
</script>

<!-- Instanced Mesh for all fireflies (single draw call) -->
{#if geometryRef && materialRef}
  <T.InstancedMesh 
    bind:ref={instancedMesh}
    args={[geometryRef, materialRef, optimizedCount]}
    frustumCulled={false}
  />
{/if}

<!-- Performance-based lighting: Render active lights with frustum culling -->
{#each fireflyLightStates as state, index}
  {#if fireflyLights[index] && optimizedMaxLights > 0 && state?.isActive && state.fadeProgress > 0.1 && reactivePositions[index]}
    <T.PointLight 
      position={reactivePositions[index] || [0, 0, 0]}
      intensity={lightIntensity * state.fadeProgress * globalIntensityMultiplier}
      color={state.color || 0x00ff88}
      distance={lightRange}
      decay={1.2}
      castShadow={false}
    />
  {/if}
{/each}

<style>
/* No styles needed */
</style>