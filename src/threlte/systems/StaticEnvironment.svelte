<!--
  Reusable Static Environment Component
  Loads GLTF models and makes them solid for any level
-->
<script lang="ts">
  import { T } from '@threlte/core'
  import { RigidBody, Collider } from '@threlte/rapier'
  import { onMount, createEventDispatcher } from 'svelte'
  import * as THREE from 'three'
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
  import { fixGLTFMaterials, fixMaterialDepthIssues } from '../utils/materialUtils'
  
  const dispatch = createEventDispatcher()
  
  // Props
  export let url: string
  export let scale: number = 0.1
  export let position: [number, number, number] = [0, 0, 0]
  
  // Environment state
  let environmentModel: THREE.Group
  let environmentMesh: THREE.Mesh | undefined
  let loaded = false
  let meshes: THREE.Mesh[] = []
  
  onMount(() => {
    loadEnvironment()
  })
  
  function optimizeMaterialForDynamicLighting(material: THREE.Material) {
    // Enable fog and proper lighting response
    material.fog = true
    
    // If it's a MeshStandardMaterial (most common)
    if (material instanceof THREE.MeshStandardMaterial) {
      // Reduce metalness for better light response (unless it should be metallic)
      if (material.metalness === undefined || material.metalness > 0.8) {
        material.metalness = Math.min(material.metalness || 0, 0.2)
      }
      
      // Increase roughness slightly for more realistic light scattering
      material.roughness = Math.max(material.roughness || 0, 0.3)
      
      // Enhance normal map effect if present
      if (material.normalMap && material.normalScale) {
        material.normalScale.multiplyScalar(1.2) // Enhance surface detail for better light interaction
      }
      
      // Ensure proper light response
      material.needsUpdate = true
    }
    
    // If it's a MeshPhongMaterial
    else if (material instanceof THREE.MeshPhongMaterial) {
      // Reduce shininess for softer light response
      material.shininess = Math.min(material.shininess || 30, 30)
      
      // Ensure specular isn't too bright
      if (material.specular instanceof THREE.Color) {
        material.specular.multiplyScalar(0.5)
      }
      
      material.needsUpdate = true
    }
    
    // For basic materials, convert to standard material for better lighting
    else if (material instanceof THREE.MeshBasicMaterial) {
      console.log('🔄 Converting MeshBasicMaterial to MeshStandardMaterial for better lighting')
      // Note: We can't replace the material here, but we can log it for awareness
    }
    
    console.log(`✨ Optimized material: ${material.constructor.name} (metalness: ${(material as any).metalness}, roughness: ${(material as any).roughness})`)
  }

  function loadEnvironment() {
    console.log('Loading environment:', url)
    
    const loader = new GLTFLoader()
    
    loader.load(
      url,
      // Success callback
      (gltf) => {
        environmentModel = gltf.scene
        environmentModel.position.set(...position)
        environmentModel.scale.set(scale, scale, scale)
        
        // Extract all meshes for rendering and physics
        meshes = []
        
        environmentModel.traverse((child: any) => {
          if (child.isMesh) {
            // Calculate world coordinates for proper physics placement
            child.updateMatrixWorld(true)
            
            const worldPosition = new THREE.Vector3()
            const worldQuaternion = new THREE.Quaternion()
            const worldScale = new THREE.Vector3()
            child.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale)
            
            // Store world transform data with the mesh
            child.worldPosition = worldPosition
            child.worldQuaternion = worldQuaternion 
            child.worldScale = worldScale
            
            if (!environmentMesh) environmentMesh = child
            meshes.push(child)
            
            child.receiveShadow = true
            child.castShadow = true
            
            // FIX: Optimize materials for dynamic lighting
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat: any) => optimizeMaterialForDynamicLighting(mat))
              } else {
                optimizeMaterialForDynamicLighting(child.material)
              }
            }
            
            // Stop animations for static environment
            if (child.animations) {
              child.animations = []
            }
          }
        })
        
        console.log(`✅ Environment loaded: ${meshes.length} meshes`)
        
        loaded = true
        
        // Notify parent that environment is ready
        dispatch('loaded', {
          model: environmentModel,
          mesh: environmentMesh
        })
      },
      // Progress callback
      undefined,
      // Error callback
      (error) => {
        console.error('❌ Failed to load environment:', error)
        
        // Notify parent of error
        dispatch('error', {
          error: error,
          url: url
        })
      }
    )
  }
  </script>
  
  <!-- Environment Model - Render each mesh individually -->
  {#if loaded && meshes.length > 0}
    <T.Group position={position} scale={[scale, scale, scale]}>
      {#each meshes as mesh}
        <T.Mesh
          geometry={mesh.geometry}
          material={mesh.material}
          position={[mesh.position.x, mesh.position.y, mesh.position.z]}
          rotation={[mesh.rotation.x, mesh.rotation.y, mesh.rotation.z]}
          scale={[mesh.scale.x, mesh.scale.y, mesh.scale.z]}
        />
      {/each}
    </T.Group>
  {/if}
  
  <!-- Physics Colliders - Single RigidBody with world-positioned Colliders -->
  {#if loaded && meshes.length > 0}
    <RigidBody type="fixed">
      {#each meshes as mesh, index}
        {#if mesh.geometry && mesh.geometry.attributes.position && mesh.worldPosition}
          <Collider 
            shape="trimesh" 
            args={[
              mesh.geometry.attributes.position.array,
              mesh.geometry.index ? mesh.geometry.index.array : undefined
            ]}
            position={[
              mesh.worldPosition.x,
              mesh.worldPosition.y,
              mesh.worldPosition.z
            ]}
            rotation={[
              mesh.worldQuaternion.x,
              mesh.worldQuaternion.y,
              mesh.worldQuaternion.z,
              mesh.worldQuaternion.w
            ]}
            friction={0.7}
            restitution={0.1}
          />
        {:else}
          <!-- Skipping mesh with invalid geometry -->
        {/if}
      {/each}
    </RigidBody>
  {/if}