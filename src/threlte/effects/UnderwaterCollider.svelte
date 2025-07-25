<!--
  src/threlte/effects/UnderwaterCollider.svelte
  
  Water volume collider for detecting player entry/exit
  Follows MEGAMEAL Threlte architecture with Rapier physics
-->

<script lang="ts">
  import { T } from '@threlte/core'
  import { Collider } from '@threlte/rapier'
  import { createEventDispatcher, onMount } from 'svelte'
  import { underwaterActions } from '../stores/underwaterStore'

  // Props
  export let position: [number, number, number] = [0, 0, 0]
  export let size: [number, number, number] = [10, 5, 10] // width, height, depth
  export let visible = false // Show visual debug representation
  export let waterLevel = 0 // Y position of water surface

  const dispatch = createEventDispatcher()

  let colliderRef: any
  let playerInWater = false

  function handleIntersectionEnter(event: any) {
    const { target } = event.detail
    
    console.log('🌊 Intersection enter detected:', target)
    
    // Check if the colliding object is the player
    if (isPlayer(target)) {
      console.log('🌊 Player entered water volume')
      
      playerInWater = true
      
      // Calculate depth based on player position vs water level
      const playerY = getPlayerYPosition(target)
      const depth = Math.max(0, waterLevel - playerY)
      
      underwaterActions.enterWater(depth)
      dispatch('waterEnter', { depth })
    }
  }

  function handleIntersectionExit(event: any) {
    const { target } = event.detail
    
    console.log('🏖️ Intersection exit detected:', target)
    
    if (isPlayer(target) && playerInWater) {
      console.log('🏖️ Player exited water volume')
      
      playerInWater = false
      underwaterActions.exitWater()
      dispatch('waterExit')
    }
  }

  function isPlayer(collider: any): boolean {
    // Check if the collider belongs to the player
    console.log('🔍 Checking collider:', collider)
    
    // Try multiple ways to identify the player
    const userData = collider?.userData || collider?.parent?.userData || collider?.rigidBody?.userData
    const isPlayerByUserData = userData?.isPlayer === true || userData?.type === 'player'
    
    // Also check if it's a capsule collider (typical for player)
    const isPlayerByCapsule = collider?.shape === 'capsule' || collider?.args?.length === 2
    
    console.log('🔍 Player detection:', { userData, isPlayerByUserData, isPlayerByCapsule })
    
    return isPlayerByUserData || isPlayerByCapsule
  }

  function getPlayerYPosition(collider: any): number {
    // Get the Y position of the player's collider
    const position = collider?.position || collider?.parent?.position || collider?.rigidBody?.translation()
    const y = position?.y || position?.[1] || 0
    console.log('🔍 Player Y position:', y)
    return y
  }

  onMount(() => {
    console.log('🌊 Underwater collider mounted at position:', position)
  })
</script>

<!-- Water Volume Collider -->
<T.Group {position}>
  
  <!-- Invisible collider for water detection -->
  <Collider
    bind:ref={colliderRef}
    shape="cuboid"
    args={[size[0] / 2, size[1] / 2, size[2] / 2]}
    sensor={true}
    on:intersectionenter={handleIntersectionEnter}
    on:intersectionexit={handleIntersectionExit}
  />
  
  <!-- Optional visual debug representation -->
  {#if visible}
    <T.Mesh>
      <T.BoxGeometry args={size} />
      <T.MeshBasicMaterial 
        color="#006994"
        transparent={true}
        opacity={0.3}
        wireframe={true}
      />
    </T.Mesh>
    
    <!-- Water surface indicator -->
    <T.Mesh position={[0, waterLevel - position[1], 0]}>
      <T.PlaneGeometry args={[size[0], size[2]]} />
      <T.MeshBasicMaterial 
        color="#87CEEB"
        transparent={true}
        opacity={0.4}
        side={2}
      />
    </T.Mesh>
  {/if}
  
</T.Group>

<style>
  /* Component styles if needed */
</style>