<!--
  StaticEnvironment Component
  
  This component encapsulates the logic for loading a GLB model and automatically
  generating static trimesh colliders for it. This is the robust way to create
  level geometry that the player can walk on, preventing the need for manual
  collider creation for each level.
-->
<script lang="ts">
  import { T } from '@threlte/core'
  import { GLTF } from '@threlte/extras'
  import { RigidBody, Collider } from '@threlte/rapier'
  import { createEventDispatcher } from 'svelte'
  import * as THREE from 'three'

  /**
   * The path to the .glb or .gltf file for the level environment.
   */
  export let path: string

  /**
   * Optional friction for the environment surfaces.
   */
  export let friction: number = 0.5

  const dispatch = createEventDispatcher()

  interface TransformedMesh {
    uuid: string;
    geometry: THREE.BufferGeometry;
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
  }

  let transformedMeshes: TransformedMesh[] = []

  function handleLoaded(event: CustomEvent<{ scene: THREE.Group }>) {
    const scene = event.detail.scene
    const foundMeshes: TransformedMesh[] = []
    
    scene.traverse((child) => {
      if (child.isMesh) {
        // Ensure the world matrix is up-to-date to get the final
        // transform of each mesh, even if it's nested.
        child.updateWorldMatrix(true, false)

        const position = new THREE.Vector3()
        const quaternion = new THREE.Quaternion()
        const scale = new THREE.Vector3()
        child.matrixWorld.decompose(position, quaternion, scale)

        // IMPORTANT: The <Collider> component does not have a `scale` prop.
        // We must "bake" the scale into the geometry's vertices before
        // passing it to the collider.
        const scaledGeometry = child.geometry.clone()
        scaledGeometry.applyMatrix4(new THREE.Matrix4().makeScale(scale.x, scale.y, scale.z))

        foundMeshes.push({
          uuid: child.uuid,
          geometry: scaledGeometry,
          position,
          quaternion,
        })
      }
    })
    
    transformedMeshes = foundMeshes
    console.log(`✅ StaticEnvironment: Generated physics for ${transformedMeshes.length} meshes from ${path}`)
    dispatch('loaded')
  }
</script>

<!-- First, render the visual model using Threlte's GLTF component -->
<GLTF url={path} on:load={handleLoaded} />

<!-- 
  Then, create a single "fixed" RigidBody to hold all the colliders.
  Each collider is now positioned and rotated to match its visual mesh.
-->
{#if transformedMeshes.length > 0}
  <RigidBody type="fixed" {friction}>
    {#each transformedMeshes as { uuid, geometry, position, quaternion } (uuid)}
      <Collider
        shape="trimesh"
        args={[geometry.attributes.position.array, geometry.index?.array]}
        position={position}
        rotation={quaternion}
      />
    {/each}
  </RigidBody>
{/if}