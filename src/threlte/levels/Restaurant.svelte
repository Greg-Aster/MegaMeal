<!-- 
  Restaurant Level Component
  Threlte version of the cosmic horror restaurant backroom level
-->
<script lang="ts">
import { T, useTask } from '@threlte/core'
import { GLTF, Text, HTML } from '@threlte/extras'
import { RigidBody, Collider } from '@threlte/rapier'
import { onMount, createEventDispatcher } from 'svelte'
import * as THREE from 'three'

const dispatch = createEventDispatcher()

// Restaurant level configuration
let restaurantModel: THREE.Group
let kitchenEquipment: Array<{position: [number, number, number], type: string, interactive: boolean}> = []
let isLoaded = false

// Atmospheric elements
let flickeringLights: Array<{position: [number, number, number], intensity: number, flickering: boolean}> = []
let vents: Array<{position: [number, number, number], active: boolean}> = []

// Horror atmosphere elements
let animationTime = 0

onMount(() => {
  console.log('🍔 Loading Restaurant Horror level with Threlte')
  generateKitchenLayout()
  generateAtmosphere()
})

function generateKitchenLayout() {
  // Generate kitchen equipment
  kitchenEquipment = [
    { position: [-3, 0.5, -2], type: 'fryer', interactive: true },
    { position: [3, 0.5, -2], type: 'grill', interactive: true },
    { position: [0, 0.5, -4], type: 'prep_station', interactive: true },
    { position: [-2, 0.5, 2], type: 'freezer', interactive: true },
    { position: [2, 0.5, 2], type: 'dishwasher', interactive: false },
    { position: [0, 0.5, 4], type: 'service_window', interactive: true }
  ]
}

function generateAtmosphere() {
  // Generate flickering lights
  flickeringLights = [
    { position: [0, 3, 0], intensity: 1.0, flickering: true },
    { position: [-3, 3, -2], intensity: 0.8, flickering: false },
    { position: [3, 3, -2], intensity: 0.6, flickering: true },
    { position: [0, 3, -4], intensity: 0.9, flickering: false }
  ]
  
  // Generate air vents
  vents = [
    { position: [0, 4, 0], active: true },
    { position: [-4, 4, -3], active: false },
    { position: [4, 4, -3], active: true },
    { position: [0, 4, 4], active: false }
  ]
}

function onModelLoad() {
  isLoaded = true
  console.log('✅ Restaurant model loaded')
}

function onEquipmentClick(equipment: any) {
  console.log('🔧 Equipment activated:', equipment.type)
  
  const messages = {
    fryer: 'The fryer bubbles ominously... something else has been cooked here.',
    grill: 'Scorch marks on the grill suggest non-food items were prepared.',
    prep_station: 'Strange ingredients scattered on the prep station.',
    freezer: 'The freezer is much colder than it should be... and something moves inside.',
    service_window: 'Orders are still coming through the window... but the restaurant has been closed for years.'
  }
  
  dispatch('equipmentInteracted', {
    type: equipment.type,
    message: messages[equipment.type] || 'You examine the equipment closely.'
  })
}

function onSecretAreaClick() {
  console.log('🕳️ Secret area discovered')
  dispatch('secretDiscovered', {
    type: 'secret_passage',
    message: 'A hidden passage behind the freezer... where does it lead?'
  })
}

// Horror atmosphere animations
useTask((delta) => {
  animationTime += delta
  
  // Flickering light effect would be implemented here
  // This would modify actual light intensities with refs
})
</script>

<!-- Restaurant Horror Scene -->
<T.Group name="restaurant_backroom">

  <!-- Main Kitchen Structure -->
  <T.Group name="kitchen_structure">
    <!-- Floor -->
    <T.Mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <T.PlaneGeometry args={[16, 16]} />
      <T.MeshStandardMaterial color="#2a2a2a" roughness={0.8} />
    </T.Mesh>
    
    <!-- Walls -->
    <T.Mesh position={[0, 2, -8]} rotation={[0, 0, 0]}>
      <T.PlaneGeometry args={[16, 4]} />
      <T.MeshStandardMaterial color="#333333" />
    </T.Mesh>
    
    <T.Mesh position={[-8, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
      <T.PlaneGeometry args={[16, 4]} />
      <T.MeshStandardMaterial color="#333333" />
    </T.Mesh>
    
    <T.Mesh position={[8, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <T.PlaneGeometry args={[16, 4]} />
      <T.MeshStandardMaterial color="#333333" />
    </T.Mesh>
    
    <!-- Ceiling -->
    <T.Mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <T.PlaneGeometry args={[16, 16]} />
      <T.MeshStandardMaterial color="#1a1a1a" />
    </T.Mesh>
  </T.Group>

  <!-- Kitchen Equipment -->
  <T.Group name="kitchen_equipment">
    {#each kitchenEquipment as equipment}
      <T.Mesh 
        position={equipment.position}
        userData={{ 
          id: `equipment_${equipment.type}`, 
          interactable: equipment.interactive, 
          type: 'equipment',
          equipmentType: equipment.type 
        }}
        on:click={() => onEquipmentClick(equipment)}
      >
        <!-- Different geometries for different equipment -->
        {#if equipment.type === 'fryer'}
          <T.BoxGeometry args={[1, 1, 1.5]} />
          <T.MeshStandardMaterial color="#444444" metalness={0.8} />
        {:else if equipment.type === 'grill'}
          <T.BoxGeometry args={[2, 0.3, 1]} />
          <T.MeshStandardMaterial color="#333333" />
        {:else if equipment.type === 'prep_station'}
          <T.BoxGeometry args={[2, 0.8, 1]} />
          <T.MeshStandardMaterial color="#666666" />
        {:else if equipment.type === 'freezer'}
          <T.BoxGeometry args={[1.5, 2, 1]} />
          <T.MeshStandardMaterial color="#cccccc" metalness={0.9} />
        {:else if equipment.type === 'dishwasher'}
          <T.BoxGeometry args={[1, 1, 0.8]} />
          <T.MeshStandardMaterial color="#555555" />
        {:else if equipment.type === 'service_window'}
          <T.BoxGeometry args={[3, 1, 0.2]} />
          <T.MeshStandardMaterial color="#222222" />
        {/if}
      </T.Mesh>
    {/each}
  </T.Group>

  <!-- Secret Areas -->
  <T.Group name="secret_areas">
    <!-- Hidden passage behind freezer -->
    <T.Mesh 
      position={[-2.5, 1, 2]}
      userData={{ id: 'secret_passage', interactable: true, type: 'secret' }}
      on:click={onSecretAreaClick}
    >
      <T.BoxGeometry args={[0.5, 2, 0.1]} />
      <T.MeshStandardMaterial color="#111111" transparent opacity={0.7} />
    </T.Mesh>
    
    <!-- Mysterious drain in floor -->
    <T.Mesh 
      position={[0, 0.01, 0]}
      userData={{ id: 'floor_drain', interactable: true, type: 'drain' }}
    >
      <T.CylinderGeometry args={[0.3, 0.3, 0.1, 8]} />
      <T.MeshStandardMaterial color="#000000" />
    </T.Mesh>
  </T.Group>

  <!-- Air Vents with Particle Effects -->
  <T.Group name="ventilation">
    {#each vents as vent}
      <T.Mesh position={vent.position}>
        <T.BoxGeometry args={[0.8, 0.2, 0.8]} />
        <T.MeshStandardMaterial color="#222222" />
      </T.Mesh>
      
      {#if vent.active}
        <!-- Steam/air particles would go here -->
        <T.PointLight 
          position={vent.position}
          intensity={0.2}
          color="#ffffff"
          distance={3}
        />
      {/if}
    {/each}
  </T.Group>

  <!-- Physics colliders -->
  <RigidBody type="fixed">
    <!-- Floor collider -->
    <Collider shape="cuboid" args={[8, 0.1, 8]} position={[0, 0, 0]} />
    
    <!-- Wall colliders -->
    <Collider shape="cuboid" args={[8, 2, 0.1]} position={[0, 2, -8]} />
    <Collider shape="cuboid" args={[0.1, 2, 8]} position={[-8, 2, 0]} />
    <Collider shape="cuboid" args={[0.1, 2, 8]} position={[8, 2, 0]} />
    
    <!-- Equipment colliders -->
    {#each kitchenEquipment as equipment}
      <Collider 
        shape="cuboid" 
        args={[0.5, 0.5, 0.5]} 
        position={equipment.position} 
      />
    {/each}
  </RigidBody>

  <!-- Horror Atmosphere Lighting -->
  <T.Group name="lighting">
    <!-- Dim ambient lighting -->
    <T.AmbientLight intensity={0.15} color="#661111" />
    
    <!-- Flickering overhead lights -->
    {#each flickeringLights as light}
      <T.PointLight 
        position={light.position}
        intensity={light.intensity * (light.flickering ? 0.7 + Math.sin(animationTime * 10) * 0.3 : 1)}
        color="#ffddaa"
        distance={8}
        decay={2}
        castShadow
      />
    {/each}
    
    <!-- Emergency exit sign -->
    <T.RectAreaLight
      position={[7, 3, 4]}
      rotation={[0, -Math.PI / 2, 0]}
      width={2}
      height={0.5}
      intensity={2}
      color="#ff0000"
    />
    
    <!-- Freezer interior light -->
    <T.PointLight 
      position={[-2, 1.5, 2]}
      intensity={0.8}
      color="#aaccff"
      distance={4}
    />
  </T.Group>

  <!-- Horror UI Elements -->
  <Text
    text="The Hamburgler's Kitchen"
    position={[0, 3.5, -7]}
    fontSize={1}
    color="#ff4444"
    anchorX="center"
    anchorY="middle"
  />
  
  <Text
    text="Something is wrong here..."
    position={[0, 2.8, -7]}
    fontSize={0.5}
    color="#ffaaaa"
    anchorX="center"
    anchorY="middle"
  />
  
  <!-- Health department notice -->
  <Text
    text="HEALTH DEPT. NOTICE: ESTABLISHMENT CLOSED"
    position={[7, 2, 4]}
    rotation={[0, -Math.PI / 2, 0]}
    fontSize={0.3}
    color="#ffffff"
    anchorX="center"
    anchorY="middle"
  />
</T.Group>