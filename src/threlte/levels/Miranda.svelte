<!-- 
  Miranda Level Component
  Threlte version of the Miranda spaceship incident investigation level
-->
<script lang="ts">
import { T, useTask } from '@threlte/core'
import { GLTF, Text, HTML } from '@threlte/extras'
import { RigidBody, Collider } from '@threlte/rapier'
import { onMount, createEventDispatcher } from 'svelte'
import * as THREE from 'three'

const dispatch = createEventDispatcher()

// Miranda level configuration
let mirandaShipModel: THREE.Group
let debrisField: Array<{position: [number, number, number], rotation: [number, number, number], scale: number, type: string}> = []
let isLoaded = false

// Interactive elements
let terminalRef: THREE.Mesh
let debrisAnalyzerRef: THREE.Mesh

// Debris types and materials
const debrisTypes = ['hull_fragment', 'engine_part', 'life_pod', 'console_piece', 'structural_beam']
const debrisColors = ['#444444', '#666666', '#883333', '#336633', '#333366']

onMount(() => {
  console.log('🚀 Loading Miranda Incident level with Threlte')
  generateDebrisField()
})

function generateDebrisField() {
  // Generate scattered debris field
  debrisField = Array.from({ length: 50 }, (_, i) => ({
    position: [
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 100
    ] as [number, number, number],
    rotation: [
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    ] as [number, number, number],
    scale: Math.random() * 2 + 0.5,
    type: debrisTypes[Math.floor(Math.random() * debrisTypes.length)]
  }))
}

function onShipLoad() {
  isLoaded = true
  console.log('✅ Miranda ship model loaded')
}

function onDebrisClick(debris: any, index: number) {
  console.log('🔍 Debris analyzed:', debris.type)
  dispatch('debrisAnalyzed', {
    type: debris.type,
    index,
    message: `Analyzing ${debris.type}... This fragment shows signs of temporal distortion.`
  })
}

function onTerminalClick() {
  console.log('💻 Ship terminal accessed')
  dispatch('terminalAccessed', {
    type: 'terminal',
    message: 'Accessing ship logs... Warning: Temporal anomalies detected in final entries.'
  })
}

function onDebrisAnalyzerClick() {
  console.log('🔬 Debris analyzer activated')
  dispatch('analyzerActivated', {
    type: 'analyzer',
    message: 'Debris analyzer online. Scanning for Perfect Mary recipe components...'
  })
}

// Animate debris slowly rotating
useTask((delta) => {
  // Subtle rotation animation for debris
  // This would be implemented with actual debris refs in a real scenario
})
</script>

<!-- Miranda Investigation Scene -->
<T.Group name="miranda_incident">
  
  <!-- Background starfield -->
  <T.Group name="background">
    {#each Array(300) as _, i}
      <T.Mesh position={[
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 500
      ]}>
        <T.SphereGeometry args={[0.05, 4, 4]} />
        <T.MeshBasicMaterial color="#ffffff" />
      </T.Mesh>
    {/each}
  </T.Group>

  <!-- Main Miranda Ship Wreckage -->
  <T.Group name="miranda_ship" position={[0, 0, 0]}>
    {#if false}
      <!-- TODO: Replace with actual GLTF model -->
      <GLTF 
        url="/models/miranda_ship.gltf" 
        on:load={onShipLoad}
        bind:gltf={mirandaShipModel}
      />
    {/if}
    
    <!-- Temporary ship hull geometry -->
    <T.Group position={[0, 0, 0]} rotation={[0.2, 0.3, 0]}>
      <!-- Main hull -->
      <T.Mesh position={[0, 0, 0]}>
        <T.CylinderGeometry args={[3, 2, 20, 8]} />
        <T.MeshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
      </T.Mesh>
      
      <!-- Bridge section -->
      <T.Mesh position={[0, 2, 8]}>
        <T.BoxGeometry args={[4, 2, 3]} />
        <T.MeshStandardMaterial color="#444444" metalness={0.7} roughness={0.4} />
      </T.Mesh>
      
      <!-- Engine section (damaged) -->
      <T.Mesh position={[0, 0, -12]} rotation={[0, 0, 0.3]}>
        <T.ConeGeometry args={[2, 8, 6]} />
        <T.MeshStandardMaterial color="#662222" metalness={0.6} roughness={0.5} />
      </T.Mesh>
    </T.Group>
  </T.Group>

  <!-- Debris Field -->
  <T.Group name="debris_field">
    {#each debrisField as debris, i}
      <T.Mesh 
        position={debris.position}
        rotation={debris.rotation}
        scale={[debris.scale, debris.scale, debris.scale]}
        userData={{ 
          id: `debris_${i}`, 
          interactable: true, 
          type: 'debris',
          debrisType: debris.type 
        }}
        on:click={(event) => onDebrisClick(debris, i)}
      >
        <!-- Randomized debris geometry -->
        {#if debris.type === 'hull_fragment'}
          <T.BoxGeometry args={[1, 0.2, 2]} />
        {:else if debris.type === 'engine_part'}
          <T.CylinderGeometry args={[0.5, 0.3, 1, 6]} />
        {:else if debris.type === 'life_pod'}
          <T.SphereGeometry args={[0.8, 8, 6]} />
        {:else if debris.type === 'console_piece'}
          <T.BoxGeometry args={[0.6, 0.4, 0.2]} />
        {:else}
          <T.BoxGeometry args={[0.5, 1.5, 0.3]} />
        {/if}
        
        <T.MeshStandardMaterial 
          color={debrisColors[debrisTypes.indexOf(debris.type)]} 
          metalness={0.6} 
          roughness={0.7} 
        />
      </T.Mesh>
    {/each}
  </T.Group>

  <!-- Interactive Investigation Equipment -->
  <T.Group name="investigation_equipment">
    <!-- Ship Terminal -->
    <T.Mesh 
      bind:ref={terminalRef}
      position={[2, 1, 6]}
      userData={{ id: 'ship_terminal', interactable: true, type: 'terminal' }}
      on:click={onTerminalClick}
    >
      <T.BoxGeometry args={[1, 1.5, 0.3]} />
      <T.MeshStandardMaterial color="#112233" emissive="#001122" />
    </T.Mesh>
    
    <!-- Debris Analyzer -->
    <T.Mesh 
      bind:ref={debrisAnalyzerRef}
      position={[-3, 1, 4]}
      userData={{ id: 'debris_analyzer', interactable: true, type: 'analyzer' }}
      on:click={onDebrisAnalyzerClick}
    >
      <T.CylinderGeometry args={[0.5, 0.5, 2, 8]} />
      <T.MeshStandardMaterial color="#223311" emissive="#112200" />
    </T.Mesh>
    
    <!-- Data Collection Pod -->
    <T.Mesh 
      position={[0, 1, 12]}
      userData={{ id: 'data_pod', interactable: true, type: 'data' }}
    >
      <T.SphereGeometry args={[0.8, 12, 8]} />
      <T.MeshStandardMaterial color="#332211" emissive="#221100" />
    </T.Mesh>
  </T.Group>

  <!-- Physics colliders -->
  <RigidBody type="fixed">
    <!-- Ship hull collider -->
    <Collider shape="cylinder" args={[10, 3]} position={[0, 0, 0]} />
    
    <!-- Debris colliders -->
    {#each debrisField as debris, i}
      <Collider 
        shape="cuboid" 
        args={[debris.scale * 0.5, debris.scale * 0.5, debris.scale * 0.5]} 
        position={debris.position} 
      />
    {/each}
  </RigidBody>

  <!-- Atmospheric Lighting -->
  <T.Group name="lighting">
    <!-- Ambient space lighting -->
    <T.AmbientLight intensity={0.2} color="#202040" />
    
    <!-- Emergency lighting from ship -->
    <T.PointLight 
      position={[2, 2, 6]} 
      intensity={1.5} 
      color="#ff4444"
      distance={15}
      decay={2}
      castShadow
    />
    
    <!-- Analyzer equipment lighting -->
    <T.PointLight 
      position={[-3, 2, 4]} 
      intensity={1.0} 
      color="#44ff44"
      distance={10}
      decay={2}
    />
    
    <!-- Distant sun -->
    <T.DirectionalLight 
      position={[50, 30, 50]} 
      intensity={0.8} 
      color="#ffffff"
      castShadow
      shadow.mapSize.width={1024}
      shadow.mapSize.height={1024}
    />
  </T.Group>

  <!-- Investigation UI Elements -->
  <Text
    text="Miranda Incident Investigation Site"
    position={[0, 8, 0]}
    fontSize={1.5}
    color="#ff6666"
    anchorX="center"
    anchorY="middle"
  />
  
  <Text
    text="Temporal Anomaly Detected"
    position={[0, 6, 0]}
    fontSize={0.8}
    color="#ffaa66"
    anchorX="center"
    anchorY="middle"
  />
</T.Group>