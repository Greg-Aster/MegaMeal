<!-- 
  Threlte Physics Component
  Replaces PhysicsWorld.ts with @threlte/rapier
-->
<script lang="ts">
import { World } from '@threlte/rapier'

// Physics configuration (matches existing PhysicsWorld.ts)
export let gravity = [0, -9.81, 0] as [number, number, number]
export let debug = false
</script>

<World {gravity} {debug}>
  <!-- Physics content will be rendered inside this World -->
  <slot />
</World>