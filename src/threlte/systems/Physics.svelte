<!-- 
  Threlte Physics Component
  Replaces PhysicsWorld.ts with @threlte/rapier
-->
<script lang="ts">
import { World } from '@threlte/rapier'
import { createEventDispatcher, onMount } from 'svelte'

const dispatch = createEventDispatcher()

// Physics configuration - updated for @threlte/rapier v3+ API  
// Based on documentation, gravity expects a Position object with x, y, z properties
export let gravity = [0, -9.81, 0] as [number, number, number]
// Note: debug prop is not supported in World component - use with individual components instead

onMount(() => {
  // Give physics world time to initialize
  setTimeout(() => {
    dispatch('physicsReady')
    console.log('⚛️ Physics world ready')
  }, 500)
})
</script>

<World gravity={gravity}>
  <!-- Physics content will be rendered inside this World -->
  <slot />
</World>