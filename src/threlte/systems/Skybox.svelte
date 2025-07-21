<!--
  Reusable Skybox Component
  Handles skybox loading with fallback for any level
-->
<script lang="ts">
import { T } from '@threlte/core'
import { onMount } from 'svelte'
import * as THREE from 'three'

// Props
export let imageUrl: string = '/assets/hdri/skywip4.webp'

// Skybox state
let skyboxMesh: THREE.Mesh
let skyboxLoaded = false

onMount(() => {
  loadSkybox()
})

function loadSkybox() {
  const textureLoader = new THREE.TextureLoader()
  
  textureLoader.load(
    imageUrl,
    (skyTexture) => {
      // Configure texture for equirectangular mapping
      skyTexture.mapping = THREE.EquirectangularReflectionMapping
      skyTexture.colorSpace = THREE.SRGBColorSpace
      skyTexture.flipY = false

      // Create skybox material
      const skyMaterial = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: true,
      })

      // Create skybox mesh
      const skyGeometry = new THREE.SphereGeometry(1000, 60, 40)
      skyboxMesh = new THREE.Mesh(skyGeometry, skyMaterial)
      skyboxMesh.rotation.x = Math.PI

      skyboxLoaded = true
      console.log('✅ Skybox loaded successfully:', imageUrl)
    },
    (progress) => {
      console.log('Skybox loading progress:', Math.round((progress.loaded / progress.total) * 100) + '%')
    },
    (error) => {
      console.error('Failed to load skybox texture:', error)
      createFallbackSkybox()
    }
  )
}

function createFallbackSkybox() {
  console.log('Creating fallback skybox...')

  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  // Create gradient from dark blue to black
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#000510')
  gradient.addColorStop(0.5, '#000208')
  gradient.addColorStop(1, '#000000')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Add subtle stars
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const size = Math.random() * 2

    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // Create texture and material
  const fallbackTexture = new THREE.CanvasTexture(canvas)
  fallbackTexture.mapping = THREE.EquirectangularReflectionMapping

  const skyMaterial = new THREE.MeshBasicMaterial({
    map: fallbackTexture,
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: true,
  })

  const skyGeometry = new THREE.SphereGeometry(1000, 60, 40)
  skyboxMesh = new THREE.Mesh(skyGeometry, skyMaterial)
  skyboxMesh.rotation.x = Math.PI

  skyboxLoaded = true
  console.log('✅ Fallback skybox created')
}
</script>

<!-- Skybox Mesh -->
{#if skyboxLoaded && skyboxMesh}
  <T.Mesh 
    geometry={skyboxMesh.geometry} 
    material={skyboxMesh.material}
    rotation={[Math.PI, 0, 0]}
  />
{/if}