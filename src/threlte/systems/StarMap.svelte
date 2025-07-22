<!--
  Optimized StarMap System Component
  Features:
  - Renders all stars in a single draw call using THREE.InstancedMesh.
  - GPU-powered animations (twinkle, float) via a custom shader for maximum performance.
  - No individual point lights; glow is handled efficiently by the emissive material.
  - Centralized interaction handling (click, hover) on the InstancedMesh.
  - Reactive selection highlighting is also handled on the GPU.
-->
<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import { onMount, createEventDispatcher } from 'svelte'
  import * as THREE from 'three'
  import {
    selectedStarStore,
    gameActions,
    type StarData
  } from '../stores/gameStateStore'

  const dispatch = createEventDispatcher()
  const { camera } = useThrelte()

  // --- PROPS ---
  export let timelineEvents: any[] = []
  export let starCount = 41
  export let heightRange = { min: 50, max: 200 }
  export let radius = 400

  // --- CONFIG ---
  const starColors = ['#ffffff', '#ffddaa', '#aaddff', '#ffaadd', '#aaffaa', '#ffaaff', '#aaffff']
  const starSizes = [0.3, 0.5, 0.8, 1.0, 1.2]
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  $: optimizedStarCount = isMobile ? Math.min(starCount, 100) : starCount

  // --- STATE ---
  let stars: StarData[] = []
  let instancedMeshRef: THREE.InstancedMesh
  let hoveredStarIndex: number | null = null
  
  // A dummy object for calculating matrix transformations efficiently
  const dummy = new THREE.Object3D()
  const tempColor = new THREE.Color()

  // --- STORES ---
  $: selectedStar = $selectedStarStore

  // --- SHADER UNIFORMS ---
  // These are variables we can pass from our JS to the GPU shader.
  const uniforms = {
    u_time: { value: 0 },
    u_selectedStarIndex: { value: -1 }, // -1 means no star is selected
    u_hoveredStarIndex: { value: -1 },
    u_cameraPosition: { value: new THREE.Vector3() }
  }

  // --- LIFECYCLE & DATA GENERATION ---

  onMount(() => {
    console.log('✨ Optimized StarMap: Initializing with Instancing...')
    generateStars()
  })

  // This reactive block re-calculates instance attributes whenever the star data changes.
  $: if (instancedMeshRef && stars.length > 0) {
    setupInstancedMesh()
  }

  function generateStars() {
    const newStars: StarData[] = []
    timelineEvents.forEach((event, index) => {
      newStars.push(createStarFromTimelineEvent(event, index))
    })
    const remainingStars = optimizedStarCount - newStars.length
    for (let i = 0; i < remainingStars; i++) {
      newStars.push(createProceduralStar(newStars.length + i))
    }
    stars = newStars
    console.log(`✅ Optimized StarMap: Generated ${stars.length} stars`)
  }

  function setupInstancedMesh() {
    // These arrays will hold the unique data for each star.
    const matrices = new Float32Array(stars.length * 16)
    const colors = new Float32Array(stars.length * 3)
    const attributes = new Float32Array(stars.length * 4) // size, intensity, twinkleSpeed, animationOffset

    stars.forEach((star, i) => {
      // 1. Position, Rotation, Scale (Matrix)
      dummy.position.set(...star.position)
      dummy.scale.setScalar(star.size)
      dummy.updateMatrix()
      dummy.matrix.toArray(matrices, i * 16)

      // 2. Color
      tempColor.set(star.color)
      tempColor.toArray(colors, i * 3)

      // 3. Custom Attributes for Shader
      attributes[i * 4 + 0] = star.size
      attributes[i * 4 + 1] = star.intensity
      attributes[i * 4 + 2] = star.twinkleSpeed
      attributes[i * 4 + 3] = star.animationOffset
    })

    // 4. Set the attributes on the instanced mesh geometry
    instancedMeshRef.instanceMatrix = new THREE.InstancedBufferAttribute(matrices, 16)
    instancedMeshRef.geometry.setAttribute('a_color', new THREE.InstancedBufferAttribute(colors, 3))
    instancedMeshRef.geometry.setAttribute('a_attributes', new THREE.InstancedBufferAttribute(attributes, 4))
    
    instancedMeshRef.instanceMatrix.needsUpdate = true
    instancedMeshRef.count = stars.length
  }
  
  // --- ANIMATION ---

  useTask((delta) => {
    // We only need to update the time uniform. The GPU handles the rest.
    uniforms.u_time.value += delta
    if ($camera) {
      uniforms.u_cameraPosition.value.copy($camera.position)
    }
  })

  // --- INTERACTION ---

  function handleInteraction(event: any, type: 'click' | 'hover' | 'unhover') {
    const instanceId = event.detail.instanceId
    
    if (type === 'click' && instanceId !== undefined) {
      const star = stars[instanceId]
      if (!star) return

      console.log('⭐ Star clicked:', star.title)
      gameActions.selectStar(star)
      gameActions.recordInteraction('star_click', star.uniqueId)
      dispatch('starSelected', {
        star: star,
        eventData: star,
        screenPosition: event.detail.intersection?.point || star.position
      })
    } else if (type === 'hover' && instanceId !== undefined) {
      if (hoveredStarIndex === instanceId) return
      hoveredStarIndex = instanceId
      const star = stars[instanceId]
      if (star) gameActions.recordInteraction('star_hover', star.uniqueId)
    } else if (type === 'unhover') {
      hoveredStarIndex = null
    }
  }

  // --- REACTIVE UPDATES ---

  // Update shader uniform when the selected star changes
  $: uniforms.u_selectedStarIndex.value = selectedStar
    ? stars.findIndex(s => s.uniqueId === selectedStar.uniqueId)
    : -1
  
  // Update shader uniform for hover effect
  $: uniforms.u_hoveredStarIndex.value = hoveredStarIndex ?? -1

  // --- SHADER MODIFICATION ---

  const onBeforeCompile = (shader: THREE.Shader) => {
    // Add our custom uniforms and attributes to the shader
    shader.uniforms.u_time = uniforms.u_time
    shader.uniforms.u_selectedStarIndex = uniforms.u_selectedStarIndex
    shader.uniforms.u_hoveredStarIndex = uniforms.u_hoveredStarIndex
    shader.uniforms.u_cameraPosition = uniforms.u_cameraPosition

    // Inject code into the vertex shader
    shader.vertexShader = `
      attribute vec3 a_color;
      attribute vec4 a_attributes; // size, intensity, twinkleSpeed, animationOffset
      
      varying vec3 v_color;
      varying vec4 v_attributes;
      varying float v_is_selected;
      varying float v_is_hovered;

      ${shader.vertexShader}
    `.replace(
      '#include <project_vertex>',
      `
      v_color = a_color;
      v_attributes = a_attributes;
      
      // Check if this instance is selected or hovered
      v_is_selected = float(gl_InstanceID == int(u_selectedStarIndex));
      v_is_hovered = float(gl_InstanceID == int(u_hoveredStarIndex));

      // Twinkle animation (subtle size pulse)
      float twinkle = sin(u_time * v_attributes.z + v_attributes.w) * 0.15 + 0.85;
      float scale = v_attributes.x * twinkle;
      
      // Hover and selection scaling
      scale *= 1.0 + v_is_selected * 0.5 + v_is_hovered * 0.25;

      // Final position calculation
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position * scale, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      `
    )

    // Inject code into the fragment shader
    shader.fragmentShader = `
      varying vec3 v_color;
      varying vec4 v_attributes;
      varying float v_is_selected;
      varying float v_is_hovered;

      uniform float u_time;
      
      ${shader.fragmentShader}
    `.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>
      
      // Base intensity
      float intensity = v_attributes.y;

      // Twinkle animation (brightness)
      float twinkle = sin(u_time * v_attributes.z * 0.8 + v_attributes.w * 2.0) * 0.4 + 0.6;
      intensity *= twinkle;

      // Apply selection and hover glow
      float glow = intensity + v_is_selected * 2.0 + v_is_hovered * 1.0;

      // Final color with emissive glow
      gl_FragColor = vec4(gl_FragColor.rgb * v_color, gl_FragColor.a);
      gl_FragColor.rgb += v_color * glow;
      `
    )
  }

  // --- STAR DATA FUNCTIONS (Unchanged) ---
  function createStarFromTimelineEvent(event: any, index: number): StarData {
    const angle = (index / timelineEvents.length) * Math.PI * 2
    const radiusVariation = event.isKeyEvent ? radius * 0.6 : radius * 0.8 + Math.random() * radius * 0.4
    const x = Math.cos(angle) * radiusVariation
    const z = Math.sin(angle) * radiusVariation
    const y = heightRange.min + (event.isKeyEvent ? 0.8 : Math.random()) * (heightRange.max - heightRange.min)
    return {
      uniqueId: event.id || `timeline_star_${index}`, position: [x, y, z],
      color: event.isKeyEvent ? '#ffaa00' : starColors[Math.floor(Math.random() * starColors.length)],
      size: event.isKeyEvent ? starSizes[4] : starSizes[Math.floor(Math.random() * starSizes.length)],
      intensity: event.isKeyEvent ? 0.8 : 0.2 + Math.random() * 0.4,
      title: event.title || `Star ${index + 1}`, description: event.description || 'A distant star',
      timelineYear: event.year, timelineEra: event.era, timelineLocation: event.location,
      isKeyEvent: event.isKeyEvent || false, isLevel: event.isLevel || false, levelId: event.levelId,
      tags: event.tags || [], category: event.category || 'unknown', slug: event.slug,
      clickable: true, hoverable: true, unlocked: true,
      animationOffset: Math.random() * Math.PI * 2, twinkleSpeed: 0.5 + Math.random() * 1.5,
      screenPosition: { cardClass: 'bottom' }
    }
  }
  function createProceduralStar(index: number): StarData {
    const angle = Math.random() * Math.PI * 2
    const radiusPos = Math.random() * radius
    const x = Math.cos(angle) * radiusPos
    const z = Math.sin(angle) * radiusPos
    const y = heightRange.min + Math.random() * (heightRange.max - heightRange.min)
    return {
      uniqueId: `procedural_star_${index}`, position: [x, y, z],
      color: starColors[Math.floor(Math.random() * starColors.length)],
      size: starSizes[Math.floor(Math.random() * starSizes.length)],
      intensity: 0.1 + Math.random() * 0.3,
      title: `Star ${index + 1}`, description: 'A distant star',
      timelineYear: 2000 + Math.floor(Math.random() * 1000), timelineEra: 'Unknown Era', timelineLocation: 'Deep Space',
      isKeyEvent: false, isLevel: false, levelId: null, tags: ['procedural'], category: 'background', slug: `star-${index}`,
      clickable: true, hoverable: true, unlocked: true,
      animationOffset: Math.random() * Math.PI * 2, twinkleSpeed: 0.5 + Math.random() * 1.5,
      screenPosition: { cardClass: 'bottom' }
    }
  }
</script>

<T.Group name="starmap-instanced">
  {#if stars.length > 0}
    <T.InstancedMesh
      bind:ref={instancedMeshRef}
      args={[undefined, undefined, optimizedStarCount]}
      on:click={(e) => handleInteraction(e, 'click')}
      on:pointermove={(e) => handleInteraction(e, 'hover')}
      on:pointerleave={(e) => handleInteraction(e, 'unhover')}
    >
      <!-- A single, simple geometry for all stars. The size is controlled in the shader. -->
      <T.SphereGeometry args={[1, 8, 6]} />
      
      <!-- A single material for all stars. onBeforeCompile injects our custom GPU logic. -->
      <T.MeshStandardMaterial
        transparent={true}
        toneMapped={false}
        fog={false}
        on:beforecompile={onBeforeCompile}
      />
    </T.InstancedMesh>
  {/if}
</T.Group>
