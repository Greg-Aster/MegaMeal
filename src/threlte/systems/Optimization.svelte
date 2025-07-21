<!-- 
  Threlte Optimization Component - Threlte Native Implementation
  Replaces legacy OptimizationManager.ts with modern Threlte approaches
-->
<script lang="ts">
import { useTask, useThrelte } from '@threlte/core'
import { onMount } from 'svelte'

const { scene, camera, renderer } = useThrelte()

// Threlte-native optimization settings
let isOptimizationEnabled = true
let lastOptimizationTime = 0
const optimizationInterval = 1000 // Run optimization checks every 1 second

onMount(() => {
  console.log('🎛️ Threlte-native optimization system initialized')
  
  // In Threlte, most optimizations are handled automatically:
  // - Frustum culling: Built into Three.js/Threlte rendering
  // - LOD system: Handled by LOD.svelte component  
  // - Instance culling: Built into InstancedMesh
  // - Performance monitoring: Handled by Performance.svelte
})

// Lightweight optimization updates (much less frequent than legacy system)
useTask((delta, elapsed) => {
  if (!isOptimizationEnabled) return
  
  // Only run optimization checks occasionally, not every frame
  if (elapsed - lastOptimizationTime > optimizationInterval) {
    lastOptimizationTime = elapsed
    
    // Threlte handles most optimizations automatically, but we can add custom logic here
    // For example: dynamic quality adjustment based on performance
    if (renderer && scene) {
      // Custom optimization logic can go here if needed
      // Most optimization is now handled by dedicated Threlte components:
      // - Performance.svelte for quality management
      // - LOD.svelte for level-of-detail
      // - InstancedMesh for efficient rendering
    }
  }
})

// Export control functions
export function enableOptimization() {
  isOptimizationEnabled = true
  console.log('🎛️ Threlte optimization enabled')
}

export function disableOptimization() {
  isOptimizationEnabled = false
  console.log('🎛️ Threlte optimization disabled')
}
</script>

<!-- No visual output - this is a system component -->