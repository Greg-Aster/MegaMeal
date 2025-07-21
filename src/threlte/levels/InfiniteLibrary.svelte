<!-- 
  Infinite Library Level Component - Performance Optimized
  Threlte version using instancing for maximum performance
-->
<script lang="ts">
import { T, useTask } from '@threlte/core'
import { GLTF, Text, HTML, InstancedMesh } from '@threlte/extras'
import { RigidBody, Collider } from '@threlte/rapier'
import { onMount, createEventDispatcher, onDestroy } from 'svelte'
import * as THREE from 'three'

const dispatch = createEventDispatcher()

// Library level configuration
let libraryModel: THREE.Group
let isLoaded = false

// Instanced objects for performance
let bookshelfInstancedMesh: THREE.InstancedMesh
let bookInstancedMesh: THREE.InstancedMesh
let floatingBookInstancedMesh: THREE.InstancedMesh
let knowledgeNodeInstancedMesh: THREE.InstancedMesh

// Instance data arrays
let bookshelfInstances: Array<{position: [number, number, number], rotation: [number, number, number]}> = []
let bookInstances: Array<{position: [number, number, number], rotation: [number, number, number]}> = []
let floatingBookInstances: Array<{position: [number, number, number], rotation: [number, number, number], baseY: number}> = []
let knowledgeNodeInstances: Array<{position: [number, number, number], rotation: [number, number, number]}> = []

// Animation
let animationTime = 0

// Knowledge topics
const knowledgeTopics = [
  'Temporal Mechanics', 'Perfect Mary Recipe', 'Singularity Theory', 
  'Cosmic Horror', 'Timeline Navigation', 'Multiversal Physics',
  'Quantum Cooking', 'Reality Manipulation', 'Time Paradoxes'
]

const timelineNames = [
  'Alpha Timeline', 'Beta Convergence', 'Gamma Divergence', 
  'Delta Reality', 'Epsilon Void', 'Zeta Nexus'
]

onMount(() => {
  console.log('📚 Loading Infinite Library level with Threlte (Performance Optimized)')
  generateInstancedObjects()
  setupAnimationLoop()
})

function generateInstancedObjects() {
  // Generate bookshelf instances
  const rows = 8
  const cols = 8
  const spacing = 4
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = (col - cols/2) * spacing
      const z = (row - rows/2) * spacing
      const height = 3 + Math.random() * 2
      
      bookshelfInstances.push({
        position: [x, height/2, z],
        rotation: [0, Math.random() * Math.PI * 2, 0]
      })
      
      // Generate books for this shelf
      const bookCount = Math.floor(5 + Math.random() * 15)
      for (let b = 0; b < bookCount; b++) {
        const bookX = x + (Math.random() - 0.5) * 2
        const bookY = height + Math.random() * 0.5
        const bookZ = z + (Math.random() - 0.5) * 0.8
        
        bookInstances.push({
          position: [bookX, bookY, bookZ],
          rotation: [0, Math.random() * Math.PI * 2, 0]
        })
      }
    }
  }
  
  // Generate floating book instances
  for (let i = 0; i < 50; i++) {
    const angle = (i / 50) * Math.PI * 2
    const radius = 15 + Math.random() * 20
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const y = 3 + Math.random() * 8
    
    floatingBookInstances.push({
      position: [x, y, z],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
      baseY: y
    })
  }
  
  // Generate knowledge node instances
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const radius = 25
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    
    knowledgeNodeInstances.push({
      position: [x, 4, z],
      rotation: [0, angle, 0]
    })
  }
  
  console.log(`✨ Generated instances: ${bookshelfInstances.length} bookshelves, ${bookInstances.length} books, ${floatingBookInstances.length} floating books, ${knowledgeNodeInstances.length} knowledge nodes`)
}

function setupAnimationLoop() {
  // Direct manipulation animation for floating books
  const animateFloatingBooks = () => {
    if (!floatingBookInstancedMesh) return
    
    animationTime += 0.016 // ~60fps
    
    for (let i = 0; i < floatingBookInstances.length; i++) {
      const instance = floatingBookInstances[i]
      const matrix = new THREE.Matrix4()
      
      // Gentle bobbing animation
      const bobOffset = Math.sin(animationTime * 2 + i * 0.5) * 0.3
      const rotationOffset = animationTime * 0.5 + i * 0.1
      
      matrix.setPosition(
        instance.position[0],
        instance.baseY + bobOffset,
        instance.position[2]
      )
      matrix.multiply(new THREE.Matrix4().makeRotationY(rotationOffset))
      
      floatingBookInstancedMesh.setMatrixAt(i, matrix)
    }
    
    floatingBookInstancedMesh.instanceMatrix.needsUpdate = true
  }
  
  // Use useTask for the animation loop
  useTask(animateFloatingBooks)
}

// Interaction handlers
function handleBookshelfExamine(position: [number, number, number]) {
  console.log('📖 Examining bookshelf at:', position)
  dispatch('bookshelfExamined', { position })
}

function handleKnowledgeAccess(topic: string) {
  console.log('🧠 Accessing knowledge:', topic)
  dispatch('knowledgeAccessed', { topic })
}

function handleBookCapture(position: [number, number, number]) {
  console.log('📚 Capturing floating book at:', position)
  dispatch('bookCaptured', { position })
}

function handlePortalAccess(timeline: string) {
  console.log('🌀 Accessing portal to:', timeline)
  dispatch('portalAccessed', { timeline })
}

function handleLibrarianContact() {
  console.log('🧙‍♂️ Contacting the Librarian')
  dispatch('librarianContacted', {})
}

onDestroy(() => {
  console.log('🧹 Cleaning up Infinite Library')
})
</script>

<!-- Infinite Library Scene -->
<T.Group>
  <!-- Main Library Floor -->
  <T.Mesh position={[0, 0, 0]}>
    <T.PlaneGeometry args={[100, 100]} />
    <T.MeshStandardMaterial color="#2a2a2a" />
  </T.Mesh>
  
  <!-- Instanced Bookshelves -->
  <InstancedMesh 
    bind:ref={bookshelfInstancedMesh}
    count={bookshelfInstances.length}
    material={new THREE.MeshStandardMaterial({ color: '#654321' })}
    geometry={new THREE.BoxGeometry(3, 4, 0.5)}
    instances={bookshelfInstances}
  />
  
  <!-- Instanced Books -->
  <InstancedMesh 
    bind:ref={bookInstancedMesh}
    count={bookInstances.length}
    material={new THREE.MeshStandardMaterial({ color: '#8B4513' })}
    geometry={new THREE.BoxGeometry(0.2, 0.3, 0.1)}
    instances={bookInstances}
  />
  
  <!-- Instanced Floating Books -->
  <InstancedMesh 
    bind:ref={floatingBookInstancedMesh}
    count={floatingBookInstances.length}
    material={new THREE.MeshStandardMaterial({ 
      color: '#4169E1', 
      emissive: '#191970',
      emissiveIntensity: 0.2 
    })}
    geometry={new THREE.BoxGeometry(0.3, 0.4, 0.15)}
    instances={floatingBookInstances}
  />
  
  <!-- Instanced Knowledge Nodes -->
  <InstancedMesh 
    bind:ref={knowledgeNodeInstancedMesh}
    count={knowledgeNodeInstances.length}
    material={new THREE.MeshStandardMaterial({ 
      color: '#FFD700', 
      emissive: '#FFA500',
      emissiveIntensity: 0.5 
    })}
    geometry={new THREE.SphereGeometry(0.8, 16, 16)}
    instances={knowledgeNodeInstances}
  />
  
  <!-- Static Portal Rings (few enough to not need instancing) -->
  {#each timelineNames as timeline, i}
    {@const angle = (i / timelineNames.length) * Math.PI * 2}
    {@const radius = 35}
    {@const x = Math.cos(angle) * radius}
    {@const z = Math.sin(angle) * radius}
    
    <T.Group position={[x, 6, z]}>
      <!-- Portal Ring -->
      <T.Mesh>
        <T.TorusGeometry args={[3, 0.3, 8, 16]} />
        <T.MeshStandardMaterial 
          color={i < 2 ? '#8844ff' : '#444444'}
          emissive={i < 2 ? '#4422aa' : '#000000'}
          emissiveIntensity={i < 2 ? 0.3 : 0}
        />
      </T.Mesh>
      
      <!-- Portal Label -->
      <Text
        text={timeline}
        position={[0, -1, 0]}
        fontSize={0.6}
        color={i < 2 ? '#ccaaff' : '#888888'}
        anchorX="center"
        anchorY="middle"
      />
    </T.Group>
  {/each}
  
  <!-- Ambient Library Lighting -->
  <T.AmbientLight intensity={0.4} color="#ffffcc" />
  
  <!-- Mystical overhead lighting -->
  <T.PointLight 
    position={[0, 12, 0]}
    intensity={1.2}
    color="#8844ff"
    distance={50}
    castShadow
  />
  
  <!-- Candle lighting (fewer lights for performance) -->
  {#each [0, 1, 2, 3] as i}
    {@const angle = (i / 4) * Math.PI * 2}
    {@const radius = 20}
    {@const x = Math.cos(angle) * radius}
    {@const z = Math.sin(angle) * radius}
    
    <T.PointLight 
      position={[x, 3, z]}
      intensity={0.5}
      color="#ffaa44"
      distance={8}
    />
  {/each}
</T.Group>

<!-- Library UI Elements -->
<Text
  text="The Infinite Library"
  position={[0, 6, 0]}
  fontSize={2}
  color="#ccaaff"
  anchorX="center"
  anchorY="middle"
/>

<Text
  text="Repository of All Timelines"
  position={[0, 4.5, 0]}
  fontSize={0.8}
  color="#aacccc"
  anchorX="center"
  anchorY="middle"
/>

<!-- Interactive elements with click handlers -->
{#each knowledgeNodeInstances.slice(0, 3) as node, i}
  <T.Mesh 
    position={node.position}
    on:click={() => handleKnowledgeAccess(knowledgeTopics[i])}
  >
    <T.SphereGeometry args={[1.2, 16, 16]} />
    <T.MeshBasicMaterial transparent opacity={0} />
  </T.Mesh>
{/each}

<!-- Librarian Contact Point -->
<T.Mesh 
  position={[0, 2, 0]}
  on:click={handleLibrarianContact}
>
  <T.CylinderGeometry args={[2, 2, 0.1, 16]} />
  <T.MeshBasicMaterial transparent opacity={0} />
</T.Mesh>