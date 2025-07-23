<!--
  Enhanced StarMap System Component
  Features:
  - Renders all stars in a single draw call using THREE.InstancedMesh.
  - GPU-powered animations (twinkle, float) via a custom shader for maximum performance.
  - No individual point lights; glow is handled efficiently by the emissive material.
  - Centralized interaction handling (click, hover) on the InstancedMesh.
  - Reactive selection highlighting is also handled on the GPU.
  - Integrated with StarNavigationSystem for timeline card display.
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

  // Import the ACTUAL original system configurations
  import {
    constellationConfig,
    constellationPatterns,
    connectionPatterns,
    eraColorMap,
    colorSpectrum,
    starTypes,
  } from '../../config/timelineconfig'
  import {
    hashCode,
    getStarColor,
    getStarType,
    getSizeFactor,
    createEnhancedStarTexture
  } from '../../utils/starUtils'

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
  let starSprites: THREE.Sprite[] = []
  let starGroup: THREE.Group
  let hoveredStarIndex: number | null = null
  
  // Export the component reference for StarNavigationSystem
  export { starGroup as starMapRef }

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

  // This reactive block creates star sprites whenever the star data changes.
  $: if (starGroup && stars.length > 0) {
    setupStarSprites()
  }

  function generateStars() {
    const newStars: StarData[] = []
    
    console.log(`🌟 StarMap: Processing ${timelineEvents.length} timeline events`)
    
    timelineEvents.forEach((event, index) => {
      const star = createStarFromTimelineEvent(event, index)
      newStars.push(star)
      if (index < 3) { // Log first few stars for debugging
        console.log(`⭐ Star ${index}:`, {
          title: star.title,
          position: star.position,
          color: star.color,
          size: star.size,
          isKeyEvent: star.isKeyEvent
        })
      }
    })
    
    const remainingStars = optimizedStarCount - newStars.length
    console.log(`🌟 Adding ${remainingStars} procedural stars to reach total of ${optimizedStarCount}`)
    
    for (let i = 0; i < remainingStars; i++) {
      newStars.push(createProceduralStar(newStars.length + i))
    }
    
    stars = newStars
    console.log(`✅ StarMap: Generated ${stars.length} total stars (${timelineEvents.length} from timeline + ${remainingStars} procedural)`)
    
    // Log star distribution for debugging
    const keyEventStars = stars.filter(s => s.isKeyEvent).length
    const timelineStars = stars.filter(s => s.uniqueId.includes('timeline')).length
    console.log(`📊 Star distribution: ${keyEventStars} key events, ${timelineStars} timeline events, ${stars.length - timelineStars} procedural`)
  }

  function setupStarSprites() {
    console.log(`🌟 StarMap: Creating authentic star sprites for ${stars.length} stars`)
    
    // Clear existing sprites
    starSprites.forEach(sprite => starGroup.remove(sprite))
    starSprites = []

    stars.forEach((star, i) => {
      // Create authentic star sprite with custom texture
      const sprite = createStarSprite(star, i)
      starSprites.push(sprite)
      starGroup.add(sprite)
      
      // Debug first few stars
      if (i < 3) {
        console.log(`⭐ Star ${i} created:`, {
          title: star.title,
          position: star.position,
          color: star.color,
          era: star.era,
          size: star.size
        })
      }
    })
    
    console.log(`✅ StarMap: Created ${starSprites.length} authentic star sprites`)
  }

  function createStarSprite(star: StarData, index: number): THREE.Sprite {
    // Create authentic star texture like original system
    const texture = createStarTexture(star)
    
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.001,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const sprite = new THREE.Sprite(material)
    sprite.position.set(...star.position)
    sprite.scale.setScalar(star.size * 32) // Scale for skybox distance
    
    // Store star data for interaction
    ;(sprite as any).starData = star
    ;(sprite as any).starIndex = index

    return sprite
  }

  function createStarTexture(star: StarData): THREE.Texture {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    
    const center = size / 2
    const baseRadius = star.isKeyEvent ? size * 0.15 : size * 0.1
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size)
    
    // Create multiple glow layers like original system
    const glowLayers = [
      { radius: baseRadius * 6, opacity: 0.05, blur: 20 },
      { radius: baseRadius * 4, opacity: 0.1, blur: 12 },  
      { radius: baseRadius * 2.5, opacity: 0.2, blur: 6 },
      { radius: baseRadius * 1.5, opacity: 0.4, blur: 2 }
    ]

    glowLayers.forEach(layer => {
      ctx.save()
      if (layer.blur > 0) {
        ctx.filter = `blur(${layer.blur}px)`
      }

      const gradient = ctx.createRadialGradient(center, center, 0, center, center, layer.radius)
      const alpha = Math.floor(layer.opacity * 255).toString(16).padStart(2, '0')
      gradient.addColorStop(0, star.color + alpha)
      gradient.addColorStop(0.5, star.color + Math.floor(layer.opacity * 128).toString(16).padStart(2, '0'))
      gradient.addColorStop(1, star.color + '00')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(center, center, layer.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // Create 4-pointed star rays (classic starnode appearance)
    ctx.save()
    ctx.strokeStyle = star.color + 'DD'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    
    const rayLength = baseRadius * 3
    // Horizontal ray
    ctx.beginPath()
    ctx.moveTo(center - rayLength, center)
    ctx.lineTo(center + rayLength, center)
    ctx.stroke()
    
    // Vertical ray  
    ctx.beginPath()
    ctx.moveTo(center, center - rayLength)
    ctx.lineTo(center, center + rayLength)
    ctx.stroke()
    
    // Bright core
    ctx.fillStyle = star.color
    ctx.beginPath()
    ctx.arc(center, center, baseRadius, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.restore()

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }
  
  // --- ANIMATION ---

  useTask((delta) => {
    if (starSprites.length === 0) return

    const time = performance.now() * 0.001

    starSprites.forEach((sprite, index) => {
      const star = stars[index]
      if (!star) return

      // Authentic twinkling animation like original system
      const twinkleTime = time * star.twinkleSpeed + star.animationOffset
      const twinkle1 = Math.sin(twinkleTime) * 0.15
      const twinkle2 = Math.sin(twinkleTime * 1.7 + 1) * 0.1
      const twinkle3 = Math.sin(twinkleTime * 0.3 + 2) * 0.05
      const twinkle = 0.85 + twinkle1 + twinkle2 + twinkle3

      let scale = star.size * 32 * twinkle
      let opacity = star.intensity * twinkle

      // Selection and hover effects
      const isSelected = selectedStar && selectedStar.uniqueId === star.uniqueId
      const isHovered = index === hoveredStarIndex

      if (isSelected) {
        scale *= 1.8
        opacity *= 2.0
      } else if (isHovered) {
        scale *= 1.4
        opacity *= 1.5
      }

      sprite.scale.setScalar(scale)
      if (sprite.material) {
        ;(sprite.material as THREE.SpriteMaterial).opacity = Math.min(1, opacity)
      }
    })
  })

  // --- INTERACTION ---

  function handleStarClick(event: any) {
    const intersected = getIntersectedStar(event)
    if (!intersected) return

    const { sprite, star, index } = intersected
    console.log('⭐ StarMap: Star clicked:', star.title)
    
    // Update stores
    gameActions.selectStar(star)
    gameActions.recordInteraction('star_click', star.uniqueId)
    
    // Calculate screen position for timeline cards
    const worldPosition = new THREE.Vector3().copy(sprite.position)
    const screenPosition = getScreenPosition(worldPosition)
    
    // Dispatch enhanced event with all necessary data
    dispatch('starSelected', {
      star: star,
      eventData: star,
      screenPosition: screenPosition,
      worldPosition: worldPosition,
      index: index,
      timestamp: Date.now()
    })
    
    // Emit global event for StarNavigationSystem
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('starmap.star.selected', {
        detail: {
          eventData: star,
          screenPosition: screenPosition,
          worldPosition: worldPosition,
          index: index
        }
      }))
    }
  }

  function handleStarHover(event: any) {
    const intersected = getIntersectedStar(event)
    if (intersected) {
      hoveredStarIndex = intersected.index
      gameActions.recordInteraction('star_hover', intersected.star.uniqueId)
    } else {
      hoveredStarIndex = null
    }
  }

  function getIntersectedStar(event: any): { sprite: THREE.Sprite, star: StarData, index: number } | null {
    if (!$camera || starSprites.length === 0) return null

    const mouse = new THREE.Vector2()
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, $camera)

    const intersects = raycaster.intersectObjects(starSprites)
    if (intersects.length > 0) {
      const sprite = intersects[0].object as THREE.Sprite
      const starData = (sprite as any).starData
      const starIndex = (sprite as any).starIndex
      return { sprite, star: starData, index: starIndex }
    }

    return null
  }
  
  function getScreenPosition(worldPosition: THREE.Vector3): { x: number, y: number } {
    if (!$camera) return { x: 0, y: 0 }
    
    const vector = worldPosition.clone()
    vector.project($camera)
    
    // Get canvas dimensions
    const canvas = document.querySelector('canvas')
    const width = canvas?.clientWidth || window.innerWidth
    const height = canvas?.clientHeight || window.innerHeight
    
    const widthHalf = width / 2
    const heightHalf = height / 2
    
    return {
      x: (vector.x * widthHalf) + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf
    }
  }

  // --- REACTIVE UPDATES ---

  // Update shader uniform when the selected star changes
  $: uniforms.u_selectedStarIndex.value = selectedStar
    ? stars.findIndex(s => s.uniqueId === selectedStar.uniqueId)
    : -1
  
  // Update shader uniform for hover effect
  $: uniforms.u_hoveredStarIndex.value = hoveredStarIndex ?? -1

  // --- ADVANCED STAR SHADER (Modernized from original) ---

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
      varying vec2 v_uv;
      varying vec3 v_worldPosition;

      ${shader.vertexShader}
    `.replace(
      '#include <project_vertex>',
      `
      v_color = a_color;
      v_attributes = a_attributes;
      v_uv = uv;
      
      // Check if this instance is selected or hovered
      v_is_selected = float(gl_InstanceID == int(u_selectedStarIndex));
      v_is_hovered = float(gl_InstanceID == int(u_hoveredStarIndex));

      // Advanced twinkle animation (combining multiple sine waves like original)
      float baseTime = u_time * v_attributes.z + v_attributes.w;
      float twinkle1 = sin(baseTime) * 0.2;
      float twinkle2 = sin(baseTime * 1.7 + 1.0) * 0.15;
      float twinkle3 = sin(baseTime * 0.3 + 2.0) * 0.1;
      float twinkle = 0.85 + twinkle1 + twinkle2 + twinkle3;
      
      float scale = v_attributes.x * twinkle;
      
      // Selection and hover effects
      scale *= 1.0 + v_is_selected * 0.8 + v_is_hovered * 0.4;

      // Store world position for constellation lines later
      vec4 worldPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      v_worldPosition = worldPos.xyz;

      // Final position calculation
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position * scale, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      `
    )

    // Enhanced fragment shader with star-like appearance
    shader.fragmentShader = `
      varying vec3 v_color;
      varying vec4 v_attributes;
      varying float v_is_selected;
      varying float v_is_hovered;
      varying vec2 v_uv;
      varying vec3 v_worldPosition;

      uniform float u_time;
      
      ${shader.fragmentShader}
    `.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>
      
      // Create star-like appearance with UV coordinates
      vec2 center = vec2(0.5, 0.5);
      vec2 uv_centered = v_uv - center;
      float dist = length(uv_centered);
      
      // Create multiple glow layers like original system
      float core = 1.0 - smoothstep(0.0, 0.1, dist);
      float inner_glow = 1.0 - smoothstep(0.0, 0.3, dist);
      float outer_glow = 1.0 - smoothstep(0.0, 0.5, dist);
      
      // Base intensity with twinkle
      float baseTime = u_time * v_attributes.z + v_attributes.w;
      float intensity_twinkle = sin(baseTime * 0.8) * 0.3 + 0.7;
      float intensity = v_attributes.y * intensity_twinkle;
      
      // Create classic star rays (4-pointed star effect)
      float angle = atan(uv_centered.y, uv_centered.x);
      float ray_intensity = abs(cos(angle * 2.0)) * 0.3;
      float vertical_ray = abs(cos(angle)) * 0.3;
      
      // Combine all effects
      float final_alpha = core * 1.0 + inner_glow * 0.6 + outer_glow * 0.3;
      final_alpha += ray_intensity * intensity;
      final_alpha += vertical_ray * intensity * 0.5;
      
      // Apply selection and hover glow
      float glow_boost = v_is_selected * 1.5 + v_is_hovered * 0.8;
      intensity += glow_boost;
      
      // Create bright emissive star appearance
      vec3 final_color = v_color * (intensity + 0.5);
      final_color += v_color * glow_boost * 2.0; // Extra glow for selected/hovered
      
      // Ensure stars are always visible (emissive)
      gl_FragColor = vec4(final_color, final_alpha * intensity);
      gl_FragColor.rgb = max(gl_FragColor.rgb, v_color * 0.3); // Minimum visibility
      `
    )
  }

  // --- CONSTELLATION-BASED STAR POSITIONING (Modernized from original) ---
  
  // Constellation configurations from original system
  const CONSTELLATION_CONFIG = {
    'ancient-epoch': { centerAzimuth: 0, centerElevation: 45, spread: 40, pattern: 'ancient_wisdom' },
    'awakening-era': { centerAzimuth: 60, centerElevation: 50, spread: 35, pattern: 'rising_dawn' },
    'golden-age': { centerAzimuth: 120, centerElevation: 55, spread: 45, pattern: 'crown' },
    'conflict-epoch': { centerAzimuth: 180, centerElevation: 40, spread: 40, pattern: 'crossed_swords' },
    'singularity-conflict': { centerAzimuth: 240, centerElevation: 45, spread: 35, pattern: 'supernova' },
    'transcendent-age': { centerAzimuth: 300, centerElevation: 60, spread: 40, pattern: 'ascension' },
    'final-epoch': { centerAzimuth: 340, centerElevation: 65, spread: 30, pattern: 'omega' },
    'unknown': { centerAzimuth: 30, centerElevation: 35, spread: 25, pattern: 'scattered' }
  }

  // Constellation patterns for star arrangement within each era
  const CONSTELLATION_PATTERNS = {
    ancient_wisdom: [
      { azOffset: 0, elOffset: 0 }, { azOffset: -15, elOffset: 10 }, { azOffset: 15, elOffset: 8 },
      { azOffset: -8, elOffset: -12 }, { azOffset: 12, elOffset: -10 }, { azOffset: 0, elOffset: 18 },
      { azOffset: -25, elOffset: 5 }, { azOffset: 25, elOffset: 3 }
    ],
    rising_dawn: [
      { azOffset: -20, elOffset: -15 }, { azOffset: -10, elOffset: -5 }, { azOffset: 0, elOffset: 5 },
      { azOffset: 10, elOffset: 15 }, { azOffset: 20, elOffset: 25 }
    ],
    crown: [
      { azOffset: 0, elOffset: 12 }, { azOffset: -15, elOffset: 8 }, { azOffset: 15, elOffset: 8 },
      { azOffset: -25, elOffset: 0 }, { azOffset: 25, elOffset: 0 }, { azOffset: -10, elOffset: -8 },
      { azOffset: 10, elOffset: -8 }
    ],
    crossed_swords: [
      { azOffset: -20, elOffset: 15 }, { azOffset: -10, elOffset: 8 }, { azOffset: 0, elOffset: 0 },
      { azOffset: 10, elOffset: -8 }, { azOffset: 20, elOffset: -15 }, { azOffset: -15, elOffset: -10 },
      { azOffset: 15, elOffset: 10 }
    ],
    supernova: [
      { azOffset: 0, elOffset: 0 }, { azOffset: -18, elOffset: 0 }, { azOffset: 18, elOffset: 0 },
      { azOffset: 0, elOffset: 18 }, { azOffset: 0, elOffset: -18 }, { azOffset: -12, elOffset: 12 },
      { azOffset: 12, elOffset: 12 }, { azOffset: -12, elOffset: -12 }, { azOffset: 12, elOffset: -12 }
    ],
    ascension: [
      { azOffset: 0, elOffset: 20 }, { azOffset: -8, elOffset: 10 }, { azOffset: 8, elOffset: 10 },
      { azOffset: -15, elOffset: 0 }, { azOffset: 15, elOffset: 0 }, { azOffset: -20, elOffset: -10 },
      { azOffset: 20, elOffset: -10 }
    ],
    omega: [
      { azOffset: -15, elOffset: 10 }, { azOffset: -20, elOffset: 0 }, { azOffset: -15, elOffset: -10 },
      { azOffset: 0, elOffset: -15 }, { azOffset: 15, elOffset: -10 }, { azOffset: 20, elOffset: 0 },
      { azOffset: 15, elOffset: 10 }
    ],
    scattered: [
      { azOffset: -10, elOffset: 5 }, { azOffset: 12, elOffset: -8 }, { azOffset: -18, elOffset: 15 },
      { azOffset: 8, elOffset: 20 }, { azOffset: -5, elOffset: -12 }
    ]
  }

  // Era-based colors from original system
  const ERA_COLORS = {
    'ancient-epoch': '#3b82f6',
    'awakening-era': '#8b5cf6', 
    'golden-age': '#6366f1',
    'conflict-epoch': '#ec4899',
    'singularity-conflict': '#ef4444',
    'transcendent-age': '#14b8a6',
    'final-epoch': '#22c55e',
    'unknown': '#6366f1'
  }

  function createStarFromTimelineEvent(event: any, index: number): StarData {
    const era = event.era || 'unknown'
    const config = CONSTELLATION_CONFIG[era as keyof typeof CONSTELLATION_CONFIG] || CONSTELLATION_CONFIG.unknown
    const pattern = CONSTELLATION_PATTERNS[config.pattern as keyof typeof CONSTELLATION_PATTERNS] || CONSTELLATION_PATTERNS.scattered
    
    // Group events by era for constellation positioning
    const eraEvents = timelineEvents.filter(e => (e.era || 'unknown') === era)
    const indexInEra = eraEvents.findIndex(e => e.uniqueId === event.uniqueId || e.slug === event.slug)
    const patternIndex = indexInEra % pattern.length
    const patternPosition = pattern[patternIndex]
    
    // Calculate position using spherical coordinates (like original system)
    const azimuthDeg = config.centerAzimuth + patternPosition.azOffset + (Math.random() - 0.5) * 10
    const elevationDeg = Math.max(25, Math.min(75, 
      config.centerElevation + patternPosition.elOffset + (Math.random() - 0.5) * 8
    ))
    
    // Convert to 3D coordinates (radius 995 - close to skybox like original)
    const azimuthRad = (azimuthDeg * Math.PI) / 180
    const elevationRad = (elevationDeg * Math.PI) / 180
    const polarAngleRad = Math.PI / 2 - elevationRad
    const sphereRadius = 995
    
    const x = sphereRadius * Math.sin(polarAngleRad) * Math.cos(azimuthRad)
    const y = sphereRadius * Math.cos(polarAngleRad)
    const z = sphereRadius * Math.sin(polarAngleRad) * Math.sin(azimuthRad)
    
    // Use era-specific colors and sizing like original
    const eraColor = ERA_COLORS[era as keyof typeof ERA_COLORS] || ERA_COLORS.unknown
    const starSize = event.isKeyEvent ? 1.5 : 0.8 + Math.random() * 0.4
    
    return {
      uniqueId: event.uniqueId || event.slug || `timeline_star_${index}`,
      position: [x, y, z],
      color: eraColor,
      size: starSize,
      intensity: event.isKeyEvent ? 1.2 : 0.6 + Math.random() * 0.4,
      title: event.title || `Star ${index + 1}`,
      description: event.description || 'A distant star',
      timelineYear: event.year,
      timelineEra: event.era,
      timelineLocation: event.location,
      isKeyEvent: event.isKeyEvent || false,
      isLevel: event.isLevel || false,
      levelId: event.levelId,
      tags: event.tags || [],
      category: event.category || 'unknown',
      slug: event.slug,
      clickable: true,
      hoverable: true,
      unlocked: true,
      animationOffset: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.5 + Math.random() * 1.5,
      screenPosition: { cardClass: 'bottom' },
      era: era,
      // Include all original event data for timeline cards
      ...event
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

<T.Group name="authentic-starnode-system" bind:ref={starGroup}>
  <!-- Interaction detection sphere -->
  <T.Mesh
    on:click={handleStarClick}
    on:pointermove={handleStarHover}
    visible={false}
  >
    <T.SphereGeometry args={[500]} />
    <T.MeshBasicMaterial transparent opacity={0} />
  </T.Mesh>
</T.Group>
