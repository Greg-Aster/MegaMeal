<!--
  Ocean System Component - Refactored
  Features:
  - Data-driven configuration from level JSON.
  - Dynamic rising water effect.
  - 3D wave animation via vertex shader.
  - Procedural canvas texture integrated with fragment shader for rich visuals.
-->
<script lang="ts">
import { T, useTask } from '@threlte/core'
import { onMount, onDestroy } from 'svelte'
import * as THREE from 'three'
import { OptimizationManager, OptimizationLevel } from '../../engine/optimization/OptimizationManager'

// --- PROPS (from level.json - PHASE 2: Full data-driven configuration) ---
export let size = { width: 2000, height: 2000 }
export let segments = { width: 64, height: 64 }
export let color = 0x006994
export let opacity = 0.95
export let metalness = 0.02
export let roughness = 0.1
export let enableAnimation = true
export let animationSpeed = 1.0
export let enableReflection = true
export let enableRefraction = true
export let enableLOD = true
export let maxDetailDistance = 500

// Configuration for the rising water effect
export let dynamics: {
  enableRising: boolean
  initialLevel: number
  targetLevel: number
  riseRate: number
} | undefined = undefined

// Device-aware optimization using OptimizationManager
let deviceOptimizedSettings = {
  size: size,
  segments: segments,
  textureSize: 1024,
  enableReflections: enableReflection,
  enableRefractions: enableRefraction,
  ambientIntensity: 0.4,
  directionalIntensity: 0.5,
  waveLayers: 4, // Number of wave calculation layers
  enableComplexShaders: true
}

// Initialize optimization settings
if (typeof window !== 'undefined') {
  try {
    const optimizationManager = OptimizationManager.getInstance()
    const qualitySettings = optimizationManager.getQualitySettings()
    const deviceCapabilities = optimizationManager.getDeviceCapabilities()
    const optimizationLevel = optimizationManager.getOptimizationLevel()
    
    // Apply quality-based ocean settings
    switch (optimizationLevel) {
      case OptimizationLevel.ULTRA_LOW:
        deviceOptimizedSettings = {
          size: { width: Math.min(size.width, 1000), height: Math.min(size.height, 1000) },
          segments: { width: 8, height: 8 }, // Very low geometry complexity
          textureSize: 256,
          enableReflections: false,
          enableRefractions: false,
          ambientIntensity: 0.6,
          directionalIntensity: 0.4,
          waveLayers: 2, // Minimal wave layers
          enableComplexShaders: false
        }
        break
      case OptimizationLevel.LOW:
        deviceOptimizedSettings = {
          size: { width: Math.min(size.width, 1500), height: Math.min(size.height, 1500) },
          segments: { width: 16, height: 16 }, // Low geometry complexity
          textureSize: 256,
          enableReflections: qualitySettings.enableReflections,
          enableRefractions: qualitySettings.enableRefractions,
          ambientIntensity: 0.5,
          directionalIntensity: 0.6,
          waveLayers: 2, // Reduced wave layers
          enableComplexShaders: false
        }
        break
      case OptimizationLevel.MEDIUM:
        deviceOptimizedSettings = {
          size: { width: Math.min(size.width, 2000), height: Math.min(size.height, 2000) },
          segments: { width: 32, height: 32 }, // Medium geometry complexity
          textureSize: 512,
          enableReflections: qualitySettings.enableReflections,
          enableRefractions: qualitySettings.enableRefractions,
          ambientIntensity: 0.4,
          directionalIntensity: 0.5,
          waveLayers: 3, // Moderate wave layers
          enableComplexShaders: true
        }
        break
      case OptimizationLevel.HIGH:
        deviceOptimizedSettings = {
          size: size,
          segments: { width: 48, height: 48 }, // Higher geometry complexity
          textureSize: 1024,
          enableReflections: qualitySettings.enableReflections,
          enableRefractions: qualitySettings.enableRefractions,
          ambientIntensity: 0.4,
          directionalIntensity: 0.5,
          waveLayers: 4, // Full wave layers
          enableComplexShaders: true
        }
        break
      case OptimizationLevel.ULTRA:
        deviceOptimizedSettings = {
          size: size,
          segments: segments, // Full geometry complexity
          textureSize: 2048,
          enableReflections: qualitySettings.enableReflections,
          enableRefractions: qualitySettings.enableRefractions,
          ambientIntensity: 0.4,
          directionalIntensity: 0.5,
          waveLayers: 4, // All wave layers
          enableComplexShaders: true
        }
        break
    }
    
    console.log(`🌊 Ocean: Using optimization level ${optimizationLevel}:`, {
      segments: deviceOptimizedSettings.segments,
      textureSize: deviceOptimizedSettings.textureSize,
      reflections: deviceOptimizedSettings.enableReflections,
      refractions: deviceOptimizedSettings.enableRefractions,
      waveLayers: deviceOptimizedSettings.waveLayers
    })
  } catch (error) {
    console.warn('⚠️ Ocean: OptimizationManager not available, using mobile fallback:', error)
    // Fallback to simple mobile detection if OptimizationManager fails
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (isMobile) {
      deviceOptimizedSettings = {
        size: { width: Math.min(size.width, 1500), height: Math.min(size.height, 1500) },
        segments: { width: 16, height: 16 },
        textureSize: 256,
        enableReflections: false,
        enableRefractions: false,
        ambientIntensity: 0.5,
        directionalIntensity: 0.6,
        waveLayers: 2,
        enableComplexShaders: false
      }
    }
  }
}

// Ocean data
let oceanGeometry: THREE.PlaneGeometry
let oceanMaterial: THREE.ShaderMaterial
let oceanMesh: THREE.Mesh

// Animation state
let animationTime = 0
let originalVertices: Float32Array

// Reactive state for the water level
let waterLevel = dynamics?.initialLevel ?? 0

// Device-aware vertex shader with LOD-based wave complexity
function createVertexShader(waveLayers: number, enableComplexShaders: boolean): string {
  if (!enableComplexShaders || waveLayers <= 2) {
    // Simplified shader for low-end devices
    return `
      uniform float uTime;
      uniform float uAnimationSpeed;
      
      varying vec2 vUv;
      varying float vWaveHeight;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        
        // Simplified wave system for performance
        float waveDisplacement = 0.0;
        waveDisplacement += sin(pos.x * 0.001 + pos.y * 0.0005 + uTime * 0.1) * 0.1;
        waveDisplacement += cos(pos.x * 0.004 + pos.y * 0.003 + uTime * 0.15) * 0.05;
        
        pos.z = waveDisplacement;
        vWaveHeight = waveDisplacement;
        
        // Simplified normal calculation
        vNormal = normal;
        vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `
  }
  
  // Full complexity shader for higher-end devices
  return `
    uniform float uTime;
    uniform float uAnimationSpeed;
    
    varying vec2 vUv;
    varying float vWaveHeight;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Multi-layered wave system (${waveLayers} layers)
      float waveDisplacement = 0.0;
      
      // Large ocean swells (always included)
      waveDisplacement += sin(pos.x * 0.001 + pos.y * 0.0005 + uTime * 0.1) * 0.15;
      waveDisplacement += cos(pos.x * 0.0008 - pos.y * 0.001 + uTime * 0.06) * 0.08;
      
      // Medium waves (included for waveLayers >= 3)
      ${waveLayers >= 3 ? `
      waveDisplacement += sin(pos.x * 0.004 + pos.y * 0.003 + uTime * 0.2) * 0.1;
      waveDisplacement += cos(pos.x * 0.005 - pos.y * 0.004 + uTime * 0.15) * 0.05;
      ` : ''}
      
      // Small ripples (included for waveLayers >= 4)
      ${waveLayers >= 4 ? `
      waveDisplacement += sin(pos.x * 0.02 + pos.y * 0.015 + uTime * 0.4) * 0.02;
      waveDisplacement += cos(pos.x * 0.025 - pos.y * 0.02 + uTime * 0.3) * 0.015;
      ` : ''}
      
      pos.z = waveDisplacement;
      vWaveHeight = waveDisplacement;
      
      // Calculate normals for lighting
      float epsilon = 0.1;
      float dWaveDx = (sin((pos.x + epsilon) * 0.001 + pos.y * 0.0005 + uTime * 0.1) * 0.15 - waveDisplacement) / epsilon;
      float dWaveDy = (sin(pos.x * 0.001 + (pos.y + epsilon) * 0.0005 + uTime * 0.1) * 0.15 - waveDisplacement) / epsilon;
      
      vec3 tangentX = vec3(1.0, 0.0, dWaveDx);
      vec3 tangentY = vec3(0.0, 1.0, dWaveDy);
      vec3 calculatedNormal = normalize(cross(tangentX, tangentY));
      
      vNormal = normalMatrix * calculatedNormal;
      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `
}

// AUTHENTIC fragment shader for realistic water appearance (from OceanSystem.ts)
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform sampler2D uTexture;
  uniform vec3 uAmbientColor;
  uniform float uAmbientIntensity;
  uniform vec3 uDirectionalLightColor;
  uniform float uDirectionalLightIntensity;
  uniform vec3 uDirectionalLightDirection;
  
  varying vec2 vUv;
  varying float vWaveHeight;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  void main() {
    // Base water color from authentic ocean system
    vec3 waterColor = uColor;
    vec3 texColor = texture2D(uTexture, vUv).rgb;
    
    // AUTHENTIC texture blending (60% procedural, 40% base color)
    waterColor = mix(waterColor, texColor, 0.6);

    // Calculate lighting
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(-uDirectionalLightDirection);
    
    // Ambient lighting
    vec3 ambient = uAmbientColor * uAmbientIntensity;
    
    // Directional lighting (Lambert shading)
    float NdotL = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = uDirectionalLightColor * uDirectionalLightIntensity * NdotL;
    
    // Apply lighting to water color
    vec3 lighting = ambient + diffuse;
    waterColor = waterColor * lighting;

    // AUTHENTIC wave-based depth variation
    float waveInfluence = vWaveHeight * 0.5 + 0.5; // Normalize to 0-1
    waterColor = mix(waterColor * 0.7, waterColor * 1.3, waveInfluence);
    
    // AUTHENTIC foam generation on wave peaks
    float foamThreshold = 0.1;
    float foamSoftness = 0.15;
    float foam = smoothstep(foamThreshold, foamSoftness, vWaveHeight);
    vec3 foamColor = vec3(0.9, 0.95, 1.0) * lighting;
    waterColor = mix(waterColor, foamColor, foam * 0.3);
    
    // AUTHENTIC surface reflection shimmer (reduced intensity to not overpower lighting)
    float shimmer = sin(vUv.x * 50.0 + uTime * 2.0) * sin(vUv.y * 50.0 + uTime * 1.5) * 0.05;
    waterColor += vec3(shimmer * 0.1, shimmer * 0.15, shimmer * 0.2);
    
    // AUTHENTIC depth-based opacity variation
    float depthOpacity = uOpacity + (vWaveHeight * 0.1);
    depthOpacity = clamp(depthOpacity, 0.0, 1.0);
    
    // Final color with authentic opacity
    gl_FragColor = vec4(waterColor, depthOpacity);
  }
`

// Shader uniforms
$: uniforms = {
  uTime: { value: animationTime },
  uAnimationSpeed: { value: animationSpeed },
  uColor: { value: new THREE.Color(color) },
  uOpacity: { value: opacity },
  uTexture: { value: null as THREE.CanvasTexture | null },
  uAmbientColor: { value: new THREE.Color(0x404060) },
  uAmbientIntensity: { value: deviceOptimizedSettings.ambientIntensity },
  uDirectionalLightColor: { value: new THREE.Color(0x8bb3ff) },
  uDirectionalLightIntensity: { value: deviceOptimizedSettings.directionalIntensity },
  uDirectionalLightDirection: { value: new THREE.Vector3(100, 200, 50).normalize() }
}

onMount(() => {
  createOcean()
})

onDestroy(() => {
  if (oceanGeometry) oceanGeometry.dispose()
  if (oceanMaterial) oceanMaterial.dispose()
})

function createOcean() {
  // Create geometry with device-optimized settings
  oceanGeometry = new THREE.PlaneGeometry(
    deviceOptimizedSettings.size.width,
    deviceOptimizedSettings.size.height,
    deviceOptimizedSettings.segments.width,
    deviceOptimizedSettings.segments.height
  )

  // Store original vertices for reference
  originalVertices = new Float32Array(oceanGeometry.attributes.position.array)

  // Generate and assign the procedural texture
  uniforms.uTexture.value = createWaterTexture()

  // Create shader material with device-optimized shaders
  oceanMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: createVertexShader(deviceOptimizedSettings.waveLayers, deviceOptimizedSettings.enableComplexShaders),
    fragmentShader: fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    fog: true,
  })
  console.log('🌊 Ocean: Initializing with procedural textures and 3D wave animation...')
  // Ocean created successfully
}

// Procedural texture creation (migrated from OceanSystem.ts)
function createWaterTexture(): THREE.CanvasTexture {
  const size = deviceOptimizedSettings.textureSize
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Multi-layered noise function for realistic water
  const waveNoise = (x: number, y: number) => {
    let value = 0
    // Large ocean swells
    value += Math.sin(x * 0.02 + y * 0.01) * 0.4
    value += Math.cos(x * 0.015 - y * 0.02) * 0.3
    // Medium waves
    value += Math.sin(x * 0.05 + y * 0.08) * 0.2
    value += Math.cos(x * 0.08 - y * 0.05) * 0.15
    // Small ripples
    value += Math.sin(x * 0.15 + y * 0.12) * 0.08
    value += Math.cos(x * 0.18 - y * 0.15) * 0.06
    return (value + 1) / 2 // Normalize to 0-1 range
  }

  // Generate water texture
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const wave = waveNoise(x, y)
      
      // Deep ocean blues with wave variation
      const blueBase = 20
      const greenBase = 50
      const blue = Math.floor(blueBase + wave * 120)
      const green = Math.floor(greenBase + wave * 100)
      const red = Math.floor(10 + wave * 30)
      
      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(15, 15)
  
  return texture
}

// Main animation loop
useTask((delta) => {
  if (!enableAnimation || !oceanMaterial) return

  // --- Rising Water Logic ---
  if (dynamics?.enableRising && waterLevel < dynamics.targetLevel) {
    waterLevel = Math.min(
      waterLevel + dynamics.riseRate * delta,
      dynamics.targetLevel
    )
  }

  // Update animation time
  animationTime += delta * animationSpeed

  // Update shader uniforms
  oceanMaterial.uniforms.uTime.value = animationTime
  oceanMaterial.uniforms.uAnimationSpeed.value = animationSpeed
  oceanMaterial.uniforms.uColor.value.setHex(color)
  oceanMaterial.uniforms.uOpacity.value = opacity

  // Subtle opacity variation for depth simulation
  const baseOpacity = opacity
  const opacityVariation = Math.sin(animationTime * 0.08) * 0.02
  oceanMaterial.uniforms.uOpacity.value = Math.max(0, Math.min(1, baseOpacity + opacityVariation))
})

// Reactive updates
$: if (oceanMaterial) {
  oceanMaterial.uniforms.uColor.value.setHex(color)
  oceanMaterial.uniforms.uOpacity.value = opacity
  oceanMaterial.uniforms.uAnimationSpeed.value = animationSpeed
}
</script>

<!-- Ocean mesh with shader-based wave animation -->
{#if oceanGeometry && oceanMaterial}
  <T.Mesh 
    bind:ref={oceanMesh}
    geometry={oceanGeometry}
    material={oceanMaterial}
    position.y={waterLevel}
    rotation={[-Math.PI / 2, 0, 0]}
    receiveShadow={true}
    castShadow={false}
    name="ocean_surface"
  />
  
  <!-- No physics collider - water should be passable -->
{/if}

<style>
/* No styles needed */
</style>