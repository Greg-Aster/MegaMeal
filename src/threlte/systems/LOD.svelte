<!-- 
  Threlte Level of Detail (LOD) System
  Automatic geometry optimization based on distance and performance
-->
<script lang="ts">
import { T, useTask, useThrelte } from '@threlte/core'
import { onMount, onDestroy, createEventDispatcher } from 'svelte'
import { writable } from 'svelte/store'
import * as THREE from 'three'

const dispatch = createEventDispatcher()

// LOD configuration stores
export const lodEnabledStore = writable<boolean>(true)
export const lodDistancesStore = writable<number[]>([10, 25, 50, 100])
export const lodQualityStore = writable<'low' | 'medium' | 'high'>('medium')

let isInitialized = false
let lodObjects: Map<string, LODObject> = new Map()

// Get Threlte context
const { camera, scene } = useThrelte()

// Props
export let enableLOD = true
export let maxDistance = 100
export let updateFrequency = 0.1 // Update every 100ms
export let enableCulling = true

interface LODLevel {
  distance: number
  geometry?: THREE.BufferGeometry
  material?: THREE.Material
  visible: boolean
  quality: 'ultra_low' | 'low' | 'medium' | 'high' | 'ultra'
}

interface LODObject {
  id: string
  mesh: THREE.Mesh
  levels: LODLevel[]
  currentLevel: number
  lastDistance: number
  originalGeometry: THREE.BufferGeometry
  originalMaterial: THREE.Material
}

let lastUpdateTime = 0

onMount(() => {
  console.log('🎯 Initializing Threlte LOD System...')
  
  if (enableLOD) {
    setupLODSystem()
  }
  
  isInitialized = true
  console.log('✅ Threlte LOD System initialized')
})

/**
 * Setup LOD system
 */
function setupLODSystem() {
  // Listen for LOD registration requests
  if (typeof window !== 'undefined') {
    window.addEventListener('threlte:registerLOD', handleLODRegistration)
    window.addEventListener('threlte:unregisterLOD', handleLODUnregistration)
  }
  
  console.log('🎯 LOD system configured with distances:', [10, 25, 50, 100])
}

/**
 * Handle LOD registration
 */
function handleLODRegistration(event: CustomEvent) {
  const { id, mesh, levels } = event.detail
  registerLODObject(id, mesh, levels)
}

/**
 * Handle LOD unregistration
 */
function handleLODUnregistration(event: CustomEvent) {
  const { id } = event.detail
  unregisterLODObject(id)
}

/**
 * Register object for LOD management
 */
export function registerLODObject(id: string, mesh: THREE.Mesh, customLevels?: LODLevel[]) {
  if (!mesh || !mesh.geometry) {
    console.warn(`Cannot register LOD object ${id}: invalid mesh`)
    return
  }
  
  // Generate default LOD levels if not provided
  const levels = customLevels || generateDefaultLODLevels(mesh)
  
  const lodObject: LODObject = {
    id,
    mesh,
    levels,
    currentLevel: 0,
    lastDistance: 0,
    originalGeometry: mesh.geometry.clone(),
    originalMaterial: mesh.material.clone()
  }
  
  lodObjects.set(id, lodObject)
  
  console.log(`🎯 Registered LOD object: ${id} with ${levels.length} levels`)
  dispatch('lodObjectRegistered', { id, levels: levels.length })
}

/**
 * Unregister LOD object
 */
export function unregisterLODObject(id: string) {
  const lodObject = lodObjects.get(id)
  if (lodObject) {
    // Restore original geometry/material
    lodObject.mesh.geometry = lodObject.originalGeometry
    lodObject.mesh.material = lodObject.originalMaterial
    
    lodObjects.delete(id)
    console.log(`🎯 Unregistered LOD object: ${id}`)
    dispatch('lodObjectUnregistered', { id })
  }
}

/**
 * Generate default LOD levels for a mesh
 */
function generateDefaultLODLevels(mesh: THREE.Mesh): LODLevel[] {
  const distances = [10, 25, 50, 100]
  const levels: LODLevel[] = []
  
  // Original quality (closest)
  levels.push({
    distance: 0,
    geometry: mesh.geometry,
    material: mesh.material,
    visible: true,
    quality: 'ultra'
  })
  
  // Generate simplified versions
  for (let i = 0; i < distances.length; i++) {
    const distance = distances[i]
    const quality = ['high', 'medium', 'low', 'ultra_low'][i] as any
    
    levels.push({
      distance,
      geometry: simplifyGeometry(mesh.geometry, 0.8 - i * 0.15), // Reduce detail progressively
      material: mesh.material, // Could also simplify materials
      visible: i < 3, // Hide at furthest distances
      quality
    })
  }
  
  return levels
}

/**
 * Simplify geometry (basic implementation)
 */
function simplifyGeometry(geometry: THREE.BufferGeometry, factor: number): THREE.BufferGeometry {
  // This is a basic implementation - in production you'd want a proper mesh simplification algorithm
  const simplified = geometry.clone()
  
  // Simple vertex reduction by skipping vertices
  if (simplified.attributes.position) {
    const positions = simplified.attributes.position.array
    const newPositions = []
    
    const skip = Math.max(1, Math.floor(1 / factor))
    for (let i = 0; i < positions.length; i += skip * 3) {
      newPositions.push(positions[i], positions[i + 1], positions[i + 2])
    }
    
    simplified.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3))
  }
  
  return simplified
}

/**
 * Update LOD levels based on camera distance
 */
function updateLODLevels() {
  if (!camera || !enableLOD) return
  
  const cameraPosition = camera.position
  
  lodObjects.forEach((lodObject, id) => {
    const mesh = lodObject.mesh
    const distance = cameraPosition.distanceTo(mesh.position)
    
    // Skip if distance hasn't changed significantly
    if (Math.abs(distance - lodObject.lastDistance) < 1) {
      return
    }
    
    lodObject.lastDistance = distance
    
    // Find appropriate LOD level
    let newLevel = 0
    for (let i = lodObject.levels.length - 1; i >= 0; i--) {
      if (distance >= lodObject.levels[i].distance) {
        newLevel = i
        break
      }
    }
    
    // Apply LOD level if changed
    if (newLevel !== lodObject.currentLevel) {
      applyLODLevel(lodObject, newLevel)
      lodObject.currentLevel = newLevel
      
      dispatch('lodLevelChanged', { 
        id, 
        level: newLevel, 
        distance,
        quality: lodObject.levels[newLevel].quality
      })
    }
    
    // Frustum culling
    if (enableCulling && distance > maxDistance) {
      mesh.visible = false
    } else {
      mesh.visible = lodObject.levels[lodObject.currentLevel].visible
    }
  })
}

/**
 * Apply LOD level to mesh
 */
function applyLODLevel(lodObject: LODObject, level: number) {
  const lodLevel = lodObject.levels[level]
  const mesh = lodObject.mesh
  
  // Update geometry
  if (lodLevel.geometry && lodLevel.geometry !== mesh.geometry) {
    mesh.geometry = lodLevel.geometry
  }
  
  // Update material
  if (lodLevel.material && lodLevel.material !== mesh.material) {
    mesh.material = lodLevel.material
  }
  
  // Update visibility
  mesh.visible = lodLevel.visible
}

/**
 * Performance-based LOD adjustment
 */
export function adjustLODForPerformance(targetFPS: number, currentFPS: number) {
  if (currentFPS < targetFPS * 0.8) {
    // Performance is poor, increase LOD aggressiveness
    const newDistances = [5, 15, 30, 60] // Closer LOD switching
    lodDistancesStore.set(newDistances)
    
    // Reduce quality
    lodQualityStore.set('low')
    
    console.log('🎯 LOD adjusted for poor performance:', newDistances)
  } else if (currentFPS > targetFPS * 1.1) {
    // Performance is good, allow higher quality
    const newDistances = [15, 35, 70, 120] // Further LOD switching
    lodDistancesStore.set(newDistances)
    
    // Increase quality
    lodQualityStore.set('high')
    
    console.log('🎯 LOD adjusted for good performance:', newDistances)
  }
}

/**
 * Batch LOD updates for better performance
 */
function batchUpdateLOD() {
  if (!isInitialized || lodObjects.size === 0) return
  
  // Update in batches to spread load
  const batchSize = Math.min(10, lodObjects.size)
  const objectArray = Array.from(lodObjects.values())
  
  for (let i = 0; i < batchSize; i++) {
    const index = (performance.now() / 100 + i) % objectArray.length
    const lodObject = objectArray[Math.floor(index)]
    
    if (lodObject && camera) {
      const distance = camera.position.distanceTo(lodObject.mesh.position)
      
      // Update LOD level
      let newLevel = 0
      for (let j = lodObject.levels.length - 1; j >= 0; j--) {
        if (distance >= lodObject.levels[j].distance) {
          newLevel = j
          break
        }
      }
      
      if (newLevel !== lodObject.currentLevel) {
        applyLODLevel(lodObject, newLevel)
        lodObject.currentLevel = newLevel
      }
    }
  }
}

// Update LOD system
useTask((delta) => {
  if (!enableLOD || !isInitialized) return
  
  // Throttle updates
  lastUpdateTime += delta
  if (lastUpdateTime >= updateFrequency) {
    batchUpdateLOD()
    lastUpdateTime = 0
  }
})

/**
 * Get LOD statistics
 */
export function getLODStats() {
  const stats = {
    registeredObjects: lodObjects.size,
    levels: {},
    averageDistance: 0,
    culledObjects: 0
  }
  
  let totalDistance = 0
  lodObjects.forEach((lodObject) => {
    const level = lodObject.currentLevel
    stats.levels[level] = (stats.levels[level] || 0) + 1
    totalDistance += lodObject.lastDistance
    
    if (!lodObject.mesh.visible) {
      stats.culledObjects++
    }
  })
  
  stats.averageDistance = totalDistance / lodObjects.size || 0
  
  return stats
}

/**
 * Enable/disable LOD system
 */
export function setLODEnabled(enabled: boolean) {
  enableLOD = enabled
  lodEnabledStore.set(enabled)
  
  if (!enabled) {
    // Restore all objects to highest quality
    lodObjects.forEach((lodObject) => {
      applyLODLevel(lodObject, 0)
    })
  }
  
  dispatch('lodEnabledChanged', { enabled })
}

/**
 * Update LOD distances
 */
export function setLODDistances(distances: number[]) {
  lodDistancesStore.set(distances)
  
  // Update all LOD objects with new distances
  lodObjects.forEach((lodObject) => {
    for (let i = 0; i < Math.min(distances.length, lodObject.levels.length); i++) {
      lodObject.levels[i].distance = distances[i]
    }
  })
  
  dispatch('lodDistancesChanged', { distances })
}

onDestroy(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('threlte:registerLOD', handleLODRegistration)
    window.removeEventListener('threlte:unregisterLOD', handleLODUnregistration)
  }
  
  lodObjects.clear()
  console.log('🧹 Threlte LOD System disposed')
})

// Export LOD utilities
export const lodUtils = {
  registerLODObject,
  unregisterLODObject,
  adjustLODForPerformance,
  getLODStats,
  setLODEnabled,
  setLODDistances
}
</script>

<!-- No visual output - this is a system component -->

{#if isInitialized}
  <slot />
{/if}