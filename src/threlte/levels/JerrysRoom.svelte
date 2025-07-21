<!-- 
  Jerry's Room Level Component
  Threlte version of the mysterious dark room with screen
-->
<script lang="ts">
import { T, useTask } from '@threlte/core'
import { GLTF, Text, HTML } from '@threlte/extras'
import { RigidBody, Collider } from '@threlte/rapier'
import { onMount, createEventDispatcher } from 'svelte'
import * as THREE from 'three'

const dispatch = createEventDispatcher()

// Jerry's room configuration
let roomModel: THREE.Group
let isLoaded = false

// Interactive elements
let screenRef: THREE.Mesh
let computerRef: THREE.Mesh
let chairRef: THREE.Mesh

// Screen content
let screenActive = false
let screenContent = "SYSTEM IDLE"
let screenMessages = [
  "SYSTEM IDLE",
  "CONNECTING...",
  "ACCESS GRANTED",
  "TIMELINE DATA LOADING...",
  "ERROR: TEMPORAL PARADOX DETECTED",
  "JERRY STATUS: UNKNOWN",
  "CONTINUE? Y/N"
]
let currentMessageIndex = 0

// Room atmosphere
let animationTime = 0
let screenFlicker = false

onMount(() => {
  console.log('🖥️ Loading Jerry\'s Room level with Threlte')
})

function onModelLoad() {
  isLoaded = true
  console.log('✅ Jerry\'s room model loaded')
}

function onScreenClick() {
  console.log('🖥️ Screen activated')
  screenActive = !screenActive
  
  if (screenActive) {
    cycleScreenMessage()
  }
  
  dispatch('screenInteracted', {
    type: 'screen',
    active: screenActive,
    message: screenActive ? 'The screen flickers to life...' : 'The screen goes dark.'
  })
}

function cycleScreenMessage() {
  if (!screenActive) return
  
  currentMessageIndex = (currentMessageIndex + 1) % screenMessages.length
  screenContent = screenMessages[currentMessageIndex]
  
  // Continue cycling every 3 seconds
  setTimeout(() => {
    if (screenActive) cycleScreenMessage()
  }, 3000)
}

function onComputerClick() {
  console.log('💻 Computer accessed')
  dispatch('computerAccessed', {
    type: 'computer',
    message: 'The computer hums quietly. Multiple processes are running in the background.'
  })
}

function onChairClick() {
  console.log('🪑 Chair examined')
  dispatch('chairExamined', {
    type: 'chair',
    message: 'The chair is worn from long use. Someone has been sitting here for hours... or years.'
  })
}

function onDeskClick() {
  console.log('🏢 Desk searched')
  dispatch('deskSearched', {
    type: 'desk',
    message: 'Papers scattered on the desk show timeline calculations and temporal equations.'
  })
}

function onDoorClick() {
  console.log('🚪 Door examined')
  dispatch('doorExamined', {
    type: 'door',
    message: 'The door is locked from the inside. Why would Jerry lock himself in?'
  })
}

// Room animations
useTask((delta) => {
  animationTime += delta
  
  // Screen flicker effect
  if (screenActive && Math.random() < 0.05) {
    screenFlicker = !screenFlicker
  }
})
</script>

<!-- Jerry's Room Scene -->
<T.Group name="jerrys_room">

  <!-- Room Structure -->
  <T.Group name="room_structure">
    <!-- Floor -->
    <T.Mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <T.PlaneGeometry args={[8, 10]} />
      <T.MeshStandardMaterial color="#1a1a1a" />
    </T.Mesh>
    
    <!-- Walls -->
    <!-- Back wall -->
    <T.Mesh position={[0, 1.5, -5]} rotation={[0, 0, 0]}>
      <T.PlaneGeometry args={[8, 3]} />
      <T.MeshStandardMaterial color="#222222" />
    </T.Mesh>
    
    <!-- Left wall -->
    <T.Mesh position={[-4, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
      <T.PlaneGeometry args={[10, 3]} />
      <T.MeshStandardMaterial color="#222222" />
    </T.Mesh>
    
    <!-- Right wall -->
    <T.Mesh position={[4, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <T.PlaneGeometry args={[10, 3]} />
      <T.MeshStandardMaterial color="#222222" />
    </T.Mesh>
    
    <!-- Front wall with door -->
    <T.Mesh position={[0, 1.5, 5]} rotation={[0, Math.PI, 0]}>
      <T.PlaneGeometry args={[8, 3]} />
      <T.MeshStandardMaterial color="#222222" />
    </T.Mesh>
    
    <!-- Ceiling -->
    <T.Mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <T.PlaneGeometry args={[8, 10]} />
      <T.MeshStandardMaterial color="#111111" />
    </T.Mesh>
  </T.Group>

  <!-- Main Furniture -->
  <T.Group name="furniture">
    <!-- Desk -->
    <T.Mesh 
      position={[0, 0.4, -3]}
      userData={{ id: 'desk', interactable: true, type: 'desk' }}
      on:click={onDeskClick}
    >
      <T.BoxGeometry args={[3, 0.8, 1.5]} />
      <T.MeshStandardMaterial color="#3a2a1a" />
    </T.Mesh>
    
    <!-- Chair -->
    <T.Mesh 
      bind:ref={chairRef}
      position={[0, 0.5, -1.5]}
      userData={{ id: 'chair', interactable: true, type: 'chair' }}
      on:click={onChairClick}
    >
      <T.BoxGeometry args={[0.8, 1, 0.8]} />
      <T.MeshStandardMaterial color="#2a2a2a" />
    </T.Mesh>
    
    <!-- Chair back -->
    <T.Mesh position={[0, 1.2, -1.9]}>
      <T.BoxGeometry args={[0.8, 0.8, 0.1]} />
      <T.MeshStandardMaterial color="#2a2a2a" />
    </T.Mesh>
  </T.Group>

  <!-- Computer Setup -->
  <T.Group name="computer_setup">
    <!-- Main Computer Tower -->
    <T.Mesh 
      bind:ref={computerRef}
      position={[1.2, 0.8, -3]}
      userData={{ id: 'computer', interactable: true, type: 'computer' }}
      on:click={onComputerClick}
    >
      <T.BoxGeometry args={[0.4, 0.6, 0.8]} />
      <T.MeshStandardMaterial color="#1a1a1a" />
    </T.Mesh>
    
    <!-- Monitor Screen -->
    <T.Mesh 
      bind:ref={screenRef}
      position={[0, 1.2, -3.6]}
      userData={{ id: 'screen', interactable: true, type: 'screen' }}
      on:click={onScreenClick}
    >
      <T.BoxGeometry args={[1.5, 1, 0.2]} />
      <T.MeshStandardMaterial color="#000000" />
    </T.Mesh>
    
    <!-- Screen Display -->
    <T.Mesh position={[0, 1.2, -3.51]}>
      <T.PlaneGeometry args={[1.3, 0.8]} />
      <T.MeshStandardMaterial 
        color={screenActive ? (screenFlicker ? "#002200" : "#004400") : "#001100"}
        emissive={screenActive ? (screenFlicker ? "#002200" : "#004400") : "#000000"}
      />
    </T.Mesh>
    
    <!-- Keyboard -->
    <T.Mesh position={[0, 0.82, -2.5]}>
      <T.BoxGeometry args={[1, 0.04, 0.4]} />
      <T.MeshStandardMaterial color="#222222" />
    </T.Mesh>
    
    <!-- Mouse -->
    <T.Mesh position={[0.8, 0.82, -2.5]}>
      <T.BoxGeometry args={[0.15, 0.04, 0.2]} />
      <T.MeshStandardMaterial color="#333333" />
    </T.Mesh>
  </T.Group>

  <!-- Room Details -->
  <T.Group name="room_details">
    <!-- Door -->
    <T.Mesh 
      position={[2, 1, 4.9]}
      userData={{ id: 'door', interactable: true, type: 'door' }}
      on:click={onDoorClick}
    >
      <T.BoxGeometry args={[1.5, 2, 0.2]} />
      <T.MeshStandardMaterial color="#3a2a1a" />
    </T.Mesh>
    
    <!-- Door handle -->
    <T.Mesh position={[2.6, 1, 4.8]}>
      <T.CylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
      <T.MeshStandardMaterial color="#888888" metalness={0.9} />
    </T.Mesh>
    
    <!-- Trash bin -->
    <T.Mesh position={[-2, 0.3, -2]}>
      <T.CylinderGeometry args={[0.3, 0.25, 0.6, 8]} />
      <T.MeshStandardMaterial color="#333333" />
    </T.Mesh>
    
    <!-- Power cables -->
    <T.Mesh position={[1.5, 0.1, -3.5]}>
      <T.CylinderGeometry args={[0.02, 0.02, 2, 8]} />
      <T.MeshStandardMaterial color="#000000" />
    </T.Mesh>
  </T.Group>

  <!-- Papers and Documents -->
  <T.Group name="documents">
    <!-- Papers on desk -->
    {#each Array(5) as _, i}
      <T.Mesh position={[
        -0.8 + i * 0.3,
        0.81,
        -3 + (Math.random() - 0.5) * 0.5
      ]} rotation={[0, Math.random() * 0.5, 0]}>
        <T.PlaneGeometry args={[0.2, 0.3]} />
        <T.MeshStandardMaterial color="#cccccc" />
      </T.Mesh>
    {/each}
    
    <!-- Open notebook -->
    <T.Mesh position={[-1, 0.81, -2.5]} rotation={[0, 0.3, 0]}>
      <T.PlaneGeometry args={[0.4, 0.3]} />
      <T.MeshStandardMaterial color="#ffffcc" />
    </T.Mesh>
  </T.Group>

  <!-- Physics colliders -->
  <RigidBody type="fixed">
    <!-- Floor collider -->
    <Collider shape="cuboid" args={[4, 0.1, 5]} position={[0, 0, 0]} />
    
    <!-- Wall colliders -->
    <Collider shape="cuboid" args={[4, 1.5, 0.1]} position={[0, 1.5, -5]} />
    <Collider shape="cuboid" args={[0.1, 1.5, 5]} position={[-4, 1.5, 0]} />
    <Collider shape="cuboid" args={[0.1, 1.5, 5]} position={[4, 1.5, 0]} />
    <Collider shape="cuboid" args={[4, 1.5, 0.1]} position={[0, 1.5, 5]} />
    
    <!-- Furniture colliders -->
    <Collider shape="cuboid" args={[1.5, 0.4, 0.75]} position={[0, 0.4, -3]} />
    <Collider shape="cuboid" args={[0.4, 0.5, 0.4]} position={[0, 0.5, -1.5]} />
    <Collider shape="cuboid" args={[0.2, 0.3, 0.4]} position={[1.2, 0.8, -3]} />
  </RigidBody>

  <!-- Lighting -->
  <T.Group name="lighting">
    <!-- Very dim ambient lighting -->
    <T.AmbientLight intensity={0.05} color="#111133" />
    
    <!-- Screen glow -->
    {#if screenActive}
      <T.PointLight 
        position={[0, 1.2, -3.3]}
        intensity={screenFlicker ? 0.3 : 0.5}
        color="#44ff44"
        distance={4}
      />
    {/if}
    
    <!-- Computer power LED -->
    <T.PointLight 
      position={[1.2, 1.1, -3]}
      intensity={0.1}
      color="#ff4444"
      distance={2}
    />
    
    <!-- Ceiling light (off) -->
    <T.Mesh position={[0, 2.8, 0]}>
      <T.CylinderGeometry args={[0.3, 0.3, 0.2, 8]} />
      <T.MeshStandardMaterial color="#333333" />
    </T.Mesh>
  </T.Group>

  <!-- Screen Text Display -->
  {#if screenActive}
    <Text
      text={screenContent}
      position={[0, 1.2, -3.4]}
      fontSize={0.15}
      color="#44ff44"
      anchorX="center"
      anchorY="middle"
    />
  {/if}

  <!-- Room Title -->
  <Text
    text="Jerry's Room"
    position={[0, 2.5, -4.5]}
    fontSize={0.5}
    color="#666666"
    anchorX="center"
    anchorY="middle"
  />
  
  <Text
    text="Something is watching..."
    position={[0, 2.2, -4.5]}
    fontSize={0.2}
    color="#444444"
    anchorX="center"
    anchorY="middle"
  />
</T.Group>