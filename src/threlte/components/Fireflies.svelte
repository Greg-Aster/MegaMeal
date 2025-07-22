<!--
  Fireflies Component

  This component demonstrates a highly performant method for creating a "bloom" or "glow"
  effect on a large number of particles without using expensive post-processing.

  How it works:
  1. A BufferGeometry is created with random positions for each firefly.
  2. A custom ShaderMaterial is used instead of the standard PointsMaterial.
  3. The Vertex Shader positions the points and can add subtle animation (like bobbing).
  4. The Fragment Shader is the key: for each pixel of each point, it calculates the
     distance from the point's center (`gl_PointCoord`). It then uses this distance
     to create a radial gradient, making the point look like a soft, glowing orb.
-->
<script lang="ts">
    import { T, useTask } from '@threlte/core'
    import { onMount } from 'svelte'
    import * as THREE from 'three'
  
    // --- PROPS ---
    /** The number of fireflies to create */
    export let count = 200
    /** The base color of the firefly glow */
    export let color = '#ffec85'
    /** The size of each firefly point */
    export let size = 50
    /** The radius of the area in which fireflies are scattered */
    export let radius = 10
  
    // --- STATE ---
    let fireflyGeometry: THREE.BufferGeometry
    let fireflyMaterial: THREE.ShaderMaterial
    let animationTime = 0
  
    // --- SHADERS ---
  
    const vertexShader = `
      uniform float uTime;
      uniform float uSize;
      attribute float aScale;
  
      void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  
        // Add a simple bobbing animation using sine waves
        modelPosition.y += sin(modelPosition.x + uTime) * aScale * 0.2;
        modelPosition.x += cos(modelPosition.y + uTime) * aScale * 0.1;
  
        vec4 viewPosition = viewMatrix * modelPosition;
        gl_Position = projectionMatrix * viewPosition;
  
        // Set the size of the point
        gl_PointSize = uSize * aScale;
        // Size attenuation based on distance from camera
        gl_PointSize *= (1.0 / -viewPosition.z);
      }
    `
  
    const fragmentShader = `
      uniform vec3 uColor;
  
      void main() {
        // gl_PointCoord gives us the coordinate within the point primitive (from 0.0 to 1.0).
        // We calculate the distance from the center (0.5, 0.5).
        float dist = distance(gl_PointCoord, vec2(0.5));
  
        // Use smoothstep to create a soft, faded edge.
        // The glow is fully opaque inside a radius of 0.05,
        // and fades to fully transparent by a radius of 0.4.
        float opacity = 1.0 - smoothstep(0.05, 0.4, dist);
  
        // Set the final color, multiplying by the calculated opacity.
        gl_FragColor = vec4(uColor, opacity);
      }
    `
    
    // --- UNIFORMS (Reactive) ---
    $: uniforms = {
      uTime: { value: animationTime },
      uSize: { value: size },
      uColor: { value: new THREE.Color(color) }
    }
  
    // --- SETUP ---
    onMount(() => {
      fireflyGeometry = new THREE.BufferGeometry()
      const positions = new Float32Array(count * 3)
      const scales = new Float32Array(count)
  
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        // Scatter points randomly within a sphere
        const spherical = new THREE.Spherical(
          radius * (0.5 + Math.random() * 0.5),
          Math.random() * Math.PI,
          Math.random() * Math.PI * 2
        )
        const pos = new THREE.Vector3().setFromSpherical(spherical)
        
        positions[i3] = pos.x
        positions[i3 + 1] = pos.y
        positions[i3 + 2] = pos.z
        
        // Give each firefly a slightly different size and animation scale
        scales[i] = Math.random() * 0.5 + 0.5
      }
  
      fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      fireflyGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
  
      fireflyMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        // Additive blending creates a brighter glow where fireflies overlap
        blending: THREE.AdditiveBlending,
        // Important: Disable depth writing so particles don't clip each other
        depthWrite: false
      })
    })
  
    // --- ANIMATION ---
    useTask((delta) => {
      animationTime += delta * 0.5
      if (fireflyMaterial) {
        fireflyMaterial.uniforms.uTime.value = animationTime
      }
    })
  
    // --- REACTIVE UPDATES ---
    $: if (fireflyMaterial) {
      fireflyMaterial.uniforms.uColor.value.set(color)
      fireflyMaterial.uniforms.uSize.value = size
    }
  </script>
  
  {#if fireflyGeometry && fireflyMaterial}
    <T.Points 
      geometry={fireflyGeometry} 
      material={fireflyMaterial} 
      name="fireflies" 
    />
  {/if}
  