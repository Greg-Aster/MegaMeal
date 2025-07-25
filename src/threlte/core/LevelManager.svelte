<!--
  Industry-Standard Level Manager
  
  This component provides the infrastructure for any level to work with
  modular components. Drop this into any level and it handles all the
  cross-system communication automatically.
-->
<script lang="ts">
  import { onMount, onDestroy, setContext } from 'svelte'
  import { useTask } from '@threlte/core'
  import { SystemRegistry, LightingManager, type LevelContext } from './LevelSystem'
  import { ECSWorldManager } from './ECSIntegration'

  // Export the registry so components can register themselves
  export let registry: SystemRegistry = new SystemRegistry()
  
  // Initialize lighting manager
  const lighting = new LightingManager(registry)
  
  // Initialize ECS world manager
  const ecsWorld = new ECSWorldManager(registry)
  
  // Create level context that components can use
  let levelContext: LevelContext
  
  // Performance monitoring
  let lastFrameTime = performance.now()
  let frameCount = 0
  
  // Set up context immediately - we don't need the Threlte stores for the basic functionality
  levelContext = {
    scene: null, // Will be populated when needed by individual components
    camera: null,
    renderer: null,
    eventBus: new EventTarget(),
    registry,
    lighting,
    ecsWorld
  }
  
  // Make context available to child components
  setContext('levelContext', levelContext)
  setContext('systemRegistry', registry)
  setContext('lightingManager', lighting)
  setContext('ecsWorld', ecsWorld)

  onMount(() => {
    console.log('🏗️ Level Manager: Initializing...')
    console.log('✅ Level Manager: Ready')
  })
  
  onDestroy(() => {
    console.log('🧹 Level Manager: Cleaning up...')
    registry.dispose()
  })
  
  // Main update loop for all registered components
  useTask((delta) => {
    if (!levelContext) return
    
    frameCount++
    
    // Update ECS world first (for performance-critical entities)
    ecsWorld.update(delta)
    
    // Update all registered components (high-level systems)
    for (const component of registry['components'].values()) {
      component.update(delta)
    }
    
    // Performance monitoring
    if (frameCount % 60 === 0) {
      const currentTime = performance.now()
      const frameTime = (currentTime - lastFrameTime) / 60
      
      if (frameTime > 20) {
        registry.sendMessage({
          type: 'performance_warning' as any,
          source: 'level-manager',
          data: { frameTime, recommendation: 'reduce_quality' },
          timestamp: Date.now(),
          priority: 'high'
        })
      }
      
      lastFrameTime = currentTime
    }
  })
  
  // Expose methods for external use
  export function getRegistry() {
    return registry
  }
  
  export function getLightingManager() {
    return lighting
  }
</script>

<!-- Level content goes in the slot -->
<slot {registry} {lighting} {levelContext} />

<style>
  /* No styles needed */
</style>