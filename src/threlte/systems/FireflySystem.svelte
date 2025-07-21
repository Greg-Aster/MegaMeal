<!--
  FireflySystem Component - Modern Threlte Implementation
  Features:
  - Instanced rendering for 80 fireflies in a single operation  
  - Camera-aware culling (revolutionary performance optimization)
  - Smooth fading animation with Threlte useTask
  - Mobile optimization with automatic quality scaling
-->
<script lang="ts">
import { T, useTask, useThrelte } from '@threlte/core'
import { onMount, onDestroy } from 'svelte'
import * as THREE from 'three'

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

// Mobile detection for optimization
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
)

// Apply mobile optimizations and shader uniform limits
$: optimizedCount = isMobile ? Math.min(count, 30) : count
$: optimizedMaxLights = isMobile ? 0 : Math.min(maxLights, 8) // Limit to 8 to prevent shader uniform overflow

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

// Animation state
let animationTime = 0
let lightCycleTimer = 0
let initialized = false

// Matrices for instanced rendering
const tempMatrix = new THREE.Matrix4()
const tempVector = new THREE.Vector3()
const tempColor = new THREE.Color()

onMount(() => {
  console.log('✨ FireflySystem: Initializing with instanced rendering...')
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

  console.log(`✅ FireflySystem: Created ${optimizedCount} fireflies with ${optimizedMaxLights} max lights`)
}

// Camera-aware culling system (revolutionary performance optimization)
function updateCameraAwareLighting(camera: THREE.Camera) {
  if (!camera || optimizedMaxLights === 0) return

  // Create frustum from camera for efficient culling
  const frustum = new THREE.Frustum()
  const cameraMatrix = new THREE.Matrix4()
  cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  frustum.setFromProjectionMatrix(cameraMatrix)

  // Find fireflies in view with distance priority
  const inViewFireflies: Array<{ index: number; distance: number }> = []

  fireflyPositions.forEach((position, index) => {
    // Create a temporary sphere to test against frustum
    const tempSphere = new THREE.Sphere(position, size * 2)
    const inFrustum = frustum.intersectsSphere(tempSphere)

    if (inFrustum) {
      const distance = camera.position.distanceTo(position)
      inViewFireflies.push({ index, distance })
    }
  })

  // Sort by distance and take only the closest ones
  inViewFireflies.sort((a, b) => a.distance - b.distance)
  const activeIndices = new Set(
    inViewFireflies.slice(0, optimizedMaxLights).map(f => f.index)
  )

  // Update light states based on camera visibility
  fireflyLightStates.forEach((state, index) => {
    state.isActive = activeIndices.has(index)
  })
}

// Smooth light fading system
function updateLightFading(deltaTime: number) {
  fireflyLightStates.forEach((state, index) => {
    const light = fireflyLights[index]
    if (!light) return

    // Determine target fade progress
    const targetFadeProgress = state.isActive ? 1.0 : 0.0

    // Smooth interpolation
    const fadeDirection = targetFadeProgress - state.fadeProgress
    if (Math.abs(fadeDirection) > 0.001) {
      state.fadeProgress += fadeDirection * fadeSpeed * deltaTime
      state.fadeProgress = Math.max(0.0, Math.min(1.0, state.fadeProgress))
    }

    // Apply fade to light intensity
    light.intensity = lightIntensity * state.fadeProgress
  })
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

// Update instance matrices for rendering
function updateInstancedMesh() {
  if (!instancedMesh) return

  fireflyPositions.forEach((position, index) => {
    const state = fireflyLightStates[index]
    
    // Set position matrix
    tempMatrix.setPosition(position)
    instancedMesh.setMatrixAt(index, tempMatrix)

    // Set color based on activity state
    tempColor.setHex(state.color)
    tempColor.multiplyScalar(state.fadeProgress * 0.5 + 0.1) // Dim when inactive
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

  // Camera-aware lighting (revolutionary optimization)
  if ($camera) {
    updateCameraAwareLighting($camera)
  }

  // Update light fading
  updateLightFading(delta)

  // Update instanced mesh
  updateInstancedMesh()
})

// Create geometry and material
$: {
  if (typeof window !== 'undefined') {
    geometryRef = new THREE.SphereGeometry(size, 8, 6)
    materialRef = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color(0x00ff88),
      emissiveIntensity: emissiveIntensity,
      transparent: true,
      opacity: 0.8,
      toneMapped: false,
      fog: false,
      metalness: 0.0,
      roughness: 1.0,
    })
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

<!-- Optimized lighting: Only render active lights to prevent shader uniform overflow -->
{#each fireflyLights.slice(0, Math.min(optimizedMaxLights, 8)) as light, index}
  {#if light && optimizedMaxLights > 0 && fireflyLightStates[index]?.isActive}
    <T.PointLight 
      position={light.position.toArray()}
      intensity={light.intensity}
      color={fireflyLightStates[index]?.color || 0x00ff88}
      distance={lightRange}
      decay={2}
    />
  {/if}
{/each}

<style>
/* No styles needed */
</style>