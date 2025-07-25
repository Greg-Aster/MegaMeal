<!--
  Nature Pack Vegetation Component
  
  A practical implementation that loads and places vegetation assets
  from the nature pack using your existing terrain system and LOD system.
-->
<script lang="ts">
  import { onMount, createEventDispatcher, getContext } from 'svelte'
  import { T, useLoader } from '@threlte/core'
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
  import * as THREE from 'three'
  import { fixGLTFMaterials, fixVegetationMaterial } from '../utils/materialUtils'

  const dispatch = createEventDispatcher()

  // Props
  export let getHeightAt: (x: number, z: number) => number
  export let count = 100
  export let radius = 150
  export let density = 0.8
  export let enableLOD = true
  export let maxRenderDistance = 200

  // Get the existing LOD system context (if available)
  let lodSystem: any = null
  try {
    // This might not exist if LOD system isn't in context
    lodSystem = getContext('lodSystem')
  } catch (e) {
    console.log('🎯 LOD system context not available, will use window events')
  }

  // Vegetation distribution weights (higher = more likely to spawn)
  export let vegetationWeights = {
    trees: 0.4,      // 40% trees
    bushes: 0.35,    // 35% bushes  
    grass: 0.2,      // 20% grass
    flowers: 0.05    // 5% flowers
  }

  // Asset paths relative to your nature pack
  const ASSETS = {
    trees: {
      birch: [
        '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/BirchTree_1.gltf',
        '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/BirchTree_2.gltf'
      ],
      maple: [
        '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/MapleTree_1.gltf',
        '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/MapleTree_2.gltf'
      ],
      dead: [
        '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/DeadTree_1.gltf',
        '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/DeadTree_2.gltf'
      ]
    },
    bushes: [
      '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/Bush.gltf',
      '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/Bush_Large.gltf',
      '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/Bush_Small.gltf'
    ],
    grass: [
      '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/Grass_Large.gltf',
      '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/Grass_Small.gltf'
    ],
    flowers: [
      '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/Flower_1_Clump.gltf',
      '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/Flower_2_Clump.gltf'
    ]
  }

  // State
  let vegetationInstances: Array<{
    type: 'tree' | 'bush' | 'grass' | 'flower'
    subtype: string
    assetPath: string
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
    distanceFromCenter: number
  }> = []
  
  let isGenerating = false
  let isReady = false
  let registeredLODObjects: string[] = []

  onMount(async () => {
    console.log('🌱 Generating nature pack vegetation...')
    await generateVegetation()
  })

  /**
   * Register vegetation mesh with existing LOD system
   */
  function registerWithLODSystem(mesh: THREE.Mesh, id: string) {
    if (!enableLOD) return

    // Use the existing LOD system's event-based registration
    const lodEvent = new CustomEvent('threlte:registerLOD', {
      detail: {
        id: `vegetation-${id}`,
        mesh: mesh,
        levels: [
          { distance: 0, visible: true, quality: 'ultra' },      // 0-15m: full detail
          { distance: 15, visible: true, quality: 'high' },     // 15-40m: high detail  
          { distance: 40, visible: true, quality: 'medium' },   // 40-80m: medium detail
          { distance: 80, visible: true, quality: 'low' },      // 80-150m: low detail
          { distance: 150, visible: false, quality: 'ultra_low' } // 150m+: culled
        ]
      }
    })

    if (typeof window !== 'undefined') {
      window.dispatchEvent(lodEvent)
      registeredLODObjects.push(`vegetation-${id}`)
      console.log(`🎯 Registered vegetation ${id} with existing LOD system`)
    }
  }

  /**
   * Unregister vegetation from LOD system
   */
  function unregisterFromLODSystem(id: string) {
    const lodEvent = new CustomEvent('threlte:unregisterLOD', {
      detail: { id: `vegetation-${id}` }
    })

    if (typeof window !== 'undefined') {
      window.dispatchEvent(lodEvent)
      registeredLODObjects = registeredLODObjects.filter(objId => objId !== `vegetation-${id}`)
      console.log(`🎯 Unregistered vegetation ${id} from LOD system`)
    }
  }

  /**
   * Generate vegetation instances using biome-based distribution
   */
  async function generateVegetation() {
    isGenerating = true
    vegetationInstances = []

    for (let i = 0; i < count; i++) {
      // Generate random position with realistic distribution
      const angle = Math.random() * Math.PI * 2
      const distance = Math.sqrt(Math.random()) * radius * density
      const x = Math.cos(angle) * distance
      const z = Math.sin(angle) * distance

      // Get terrain height
      const groundHeight = getHeightAt(x, z)
      
      // Skip areas that are underwater or too steep
      if (groundHeight < -3) continue

      // Determine vegetation type based on distance from center (biome simulation)
      const vegetationType = selectVegetationType(distance, groundHeight)
      if (!vegetationType) continue

      // Generate random rotation and scale
      const rotationY = Math.random() * Math.PI * 2
      const scaleVariation = 0.7 + Math.random() * 0.6 // 70% to 130% scale
      
      vegetationInstances.push({
        type: vegetationType.type,
        subtype: vegetationType.subtype,
        assetPath: vegetationType.assetPath,
        position: [x, groundHeight, z],
        rotation: [0, rotationY, 0],
        scale: [scaleVariation, scaleVariation, scaleVariation],
        distanceFromCenter: distance
      })
    }

    console.log(`🌱 Generated ${vegetationInstances.length} vegetation instances`)
    isGenerating = false
    isReady = true
    
    dispatch('vegetationReady', {
      count: vegetationInstances.length,
      types: getTypeDistribution()
    })
  }

  /**
   * Select vegetation type based on environmental factors
   */
  function selectVegetationType(distance: number, height: number): {
    type: 'tree' | 'bush' | 'grass' | 'flower'
    subtype: string
    assetPath: string
  } | null {
    
    // Create biome zones based on distance from center
    if (distance < 40) {
      // Inner zone - lush vegetation
      const rand = Math.random()
      if (rand < 0.5) {
        // Living trees
        const treeType = Math.random() < 0.6 ? 'birch' : 'maple'
        const variant = Math.floor(Math.random() * ASSETS.trees[treeType].length)
        return {
          type: 'tree',
          subtype: treeType,
          assetPath: ASSETS.trees[treeType][variant]
        }
      } else if (rand < 0.8) {
        // Bushes
        const variant = Math.floor(Math.random() * ASSETS.bushes.length)
        return {
          type: 'bush',
          subtype: 'bush',
          assetPath: ASSETS.bushes[variant]
        }
      } else {
        // Flowers
        const variant = Math.floor(Math.random() * ASSETS.flowers.length)
        return {
          type: 'flower',
          subtype: 'flower',
          assetPath: ASSETS.flowers[variant]
        }
      }
    } else if (distance < 100) {
      // Middle zone - mixed vegetation
      const rand = Math.random()
      if (rand < 0.3) {
        // Some trees (mix of living and dead)
        const treeTypes = ['birch', 'maple', 'dead']
        const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)]
        const variant = Math.floor(Math.random() * ASSETS.trees[treeType].length)
        return {
          type: 'tree',
          subtype: treeType,
          assetPath: ASSETS.trees[treeType][variant]
        }
      } else if (rand < 0.7) {
        // More bushes
        const variant = Math.floor(Math.random() * ASSETS.bushes.length)
        return {
          type: 'bush',
          subtype: 'bush',
          assetPath: ASSETS.bushes[variant]
        }
      } else {
        // Grass
        const variant = Math.floor(Math.random() * ASSETS.grass.length)
        return {
          type: 'grass',
          subtype: 'grass',
          assetPath: ASSETS.grass[variant]
        }
      }
    } else {
      // Outer zone - sparse, hardy vegetation
      const rand = Math.random()
      if (rand < 0.2) {
        // Mostly dead trees
        const variant = Math.floor(Math.random() * ASSETS.trees.dead.length)
        return {
          type: 'tree',
          subtype: 'dead',
          assetPath: ASSETS.trees.dead[variant]
        }
      } else if (rand < 0.5) {
        // Small bushes
        const variant = Math.floor(Math.random() * ASSETS.bushes.length)
        return {
          type: 'bush',
          subtype: 'bush',
          assetPath: ASSETS.bushes[variant]
        }
      } else {
        // Grass
        const variant = Math.floor(Math.random() * ASSETS.grass.length)
        return {
          type: 'grass',
          subtype: 'grass',
          assetPath: ASSETS.grass[variant]
        }
      }
    }
    
    return null
  }

  /**
   * Get distribution of vegetation types for stats
   */
  function getTypeDistribution() {
    const dist = { trees: 0, bushes: 0, grass: 0, flowers: 0 }
    vegetationInstances.forEach(instance => {
      if (instance.type === 'tree') dist.trees++
      else if (instance.type === 'bush') dist.bushes++
      else if (instance.type === 'grass') dist.grass++
      else if (instance.type === 'flower') dist.flowers++
    })
    return dist
  }

  /**
   * Update player position for potential LOD calculations
   */
  export function updatePlayerPosition(position: [number, number, number]) {
    // Could implement LOD visibility here based on distance
    // For now, we'll keep it simple
  }

  /**
   * Get vegetation statistics
   */
  export function getStats() {
    return {
      totalInstances: vegetationInstances.length,
      typeDistribution: getTypeDistribution(),
      lodRegisteredObjects: registeredLODObjects.length,
      isReady,
      isGenerating
    }
  }

  /**
   * Handle mesh loaded and register with LOD system
   */
  function handleMeshLoaded(mesh: THREE.Mesh, instanceId: string) {
    // Apply global material fixes to prevent depth/alpha issues
    if (mesh) {
      if (mesh.material) {
        // Fix single material
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(fixVegetationMaterial)
        } else {
          mesh.material = fixVegetationMaterial(mesh.material)
        }
      }
      
      // Also fix any child meshes
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map(fixVegetationMaterial)
          } else {
            child.material = fixVegetationMaterial(child.material)
          }
        }
      })
    }
    
    if (mesh && enableLOD) {
      // Wait a frame for the mesh to be properly added to scene
      setTimeout(() => {
        registerWithLODSystem(mesh, instanceId)
      }, 100)
    }
  }

  /**
   * Handle GLTF scene loaded and apply fixes
   */
  function handleGLTFLoaded(gltf: any, instanceId: string) {
    // Apply global material fixes to entire GLTF scene
    fixGLTFMaterials(gltf)
    
    return gltf
  }

  // Cleanup LOD registrations on destroy
  import { onDestroy } from 'svelte'
  
  onDestroy(() => {
    console.log(`🧹 Cleaning up ${registeredLODObjects.length} vegetation LOD objects`)
    
    // Unregister all LOD objects
    registeredLODObjects.forEach(id => {
      const lodEvent = new CustomEvent('threlte:unregisterLOD', {
        detail: { id }
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(lodEvent)
      }
    })
    
    registeredLODObjects = []
  })
</script>

<!-- Vegetation Rendering -->
<T.Group name="nature-pack-vegetation">
  
  {#if isReady}
    
    <!-- Trees -->
    <T.Group name="trees">
      {#each vegetationInstances.filter(v => v.type === 'tree') as tree, i}
        <T.Group 
          position={tree.position}
          rotation={tree.rotation} 
          scale={tree.scale}
        >
          {#await useLoader(GLTFLoader).load(tree.assetPath) then gltf}
            <T 
              is={handleGLTFLoaded(gltf, `tree-${i}`).scene} 
              on:create={(e) => handleMeshLoaded(e.detail, `tree-${i}`)}
            />
          {:catch error}
            <!-- Fallback simple tree -->
            <T.Group>
              <!-- Tree trunk -->
              <T.Mesh 
                position={[0, 1, 0]}
                on:create={(e) => handleMeshLoaded(e.detail, `tree-fallback-${i}`)}
              >
                <T.CylinderGeometry args={[0.1, 0.15, 2]} />
                <T.MeshLambertMaterial color="#8B4513" />
              </T.Mesh>
              <!-- Tree canopy -->
              <T.Mesh position={[0, 2.5, 0]}>
                <T.SphereGeometry args={[1.2]} />
                <T.MeshLambertMaterial color={tree.subtype === 'dead' ? '#654321' : '#228B22'} />
              </T.Mesh>
            </T.Group>
          {/await}
        </T.Group>
      {/each}
    </T.Group>

    <!-- Bushes -->
    <T.Group name="bushes">
      {#each vegetationInstances.filter(v => v.type === 'bush') as bush, i}
        <T.Group 
          position={bush.position}
          rotation={bush.rotation}
          scale={bush.scale}
        >
          {#await useLoader(GLTFLoader).load(bush.assetPath) then gltf}
            <T 
              is={handleGLTFLoaded(gltf, `bush-${i}`).scene} 
              on:create={(e) => handleMeshLoaded(e.detail, `bush-${i}`)}
            />
          {:catch error}
            <!-- Fallback simple bush -->
            <T.Mesh 
              position={[0, 0.3, 0]}
              on:create={(e) => handleMeshLoaded(e.detail, `bush-fallback-${i}`)}
            >
              <T.SphereGeometry args={[0.6, 8, 6]} />
              <T.MeshLambertMaterial color="#32CD32" />
            </T.Mesh>
          {/await}
        </T.Group>
      {/each}
    </T.Group>

    <!-- Grass -->
    <T.Group name="grass">
      {#each vegetationInstances.filter(v => v.type === 'grass') as grass, i}
        <T.Group 
          position={grass.position}
          rotation={grass.rotation}
          scale={grass.scale}
        >
          {#await useLoader(GLTFLoader).load(grass.assetPath) then gltf}
            <T 
              is={handleGLTFLoaded(gltf, `grass-${i}`).scene} 
              on:create={(e) => handleMeshLoaded(e.detail, `grass-${i}`)}
            />
          {:catch error}
            <!-- Fallback simple grass -->
            <T.Mesh 
              position={[0, 0.1, 0]}
              on:create={(e) => handleMeshLoaded(e.detail, `grass-fallback-${i}`)}
            >
              <T.PlaneGeometry args={[0.3, 0.6]} />
              <T.MeshLambertMaterial color="#7CFC00" side={THREE.DoubleSide} />
            </T.Mesh>
          {/await}
        </T.Group>
      {/each}
    </T.Group>

    <!-- Flowers -->
    <T.Group name="flowers">
      {#each vegetationInstances.filter(v => v.type === 'flower') as flower, i}
        <T.Group 
          position={flower.position}
          rotation={flower.rotation}
          scale={flower.scale}
        >
          {#await useLoader(GLTFLoader).load(flower.assetPath) then gltf}
            <T 
              is={handleGLTFLoaded(gltf, `flower-${i}`).scene} 
              on:create={(e) => handleMeshLoaded(e.detail, `flower-${i}`)}
            />
          {:catch error}
            <!-- Fallback simple flower -->
            <T.Group>
              <!-- Stem -->
              <T.Mesh position={[0, 0.15, 0]}>
                <T.CylinderGeometry args={[0.01, 0.01, 0.3]} />
                <T.MeshLambertMaterial color="#228B22" />
              </T.Mesh>
              <!-- Flower -->
              <T.Mesh 
                position={[0, 0.3, 0]}
                on:create={(e) => handleMeshLoaded(e.detail, `flower-fallback-${i}`)}
              >
                <T.SphereGeometry args={[0.05]} />
                <T.MeshLambertMaterial color="#FF69B4" />
              </T.Mesh>
            </T.Group>
          {/await}
        </T.Group>
      {/each}
    </T.Group>

  {:else if isGenerating}
    <!-- Loading indicator -->
    <T.Group name="generating">
      <T.Mesh position={[0, 2, 0]}>
        <T.SphereGeometry args={[0.5]} />
        <T.MeshBasicMaterial color="#90EE90" transparent opacity={0.7} />
      </T.Mesh>
    </T.Group>
  {/if}

</T.Group>

<style>
  /* No styles needed */
</style>