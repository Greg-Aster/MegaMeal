<!--
  Ocean System Component - Mobile-Optimized with OptimizationManager
  Features:
  - Device-aware performance optimization using OptimizationManager
  - Simplified shaders for mobile devices  
  - Dynamic geometry and texture resolution based on device capabilities
  - Minimal fragment shader calculations on low-end devices
  - Progressive enhancement for higher-end devices
-->
<script lang="ts">
import { T, useTask } from '@threlte/core'
import { onMount, onDestroy } from 'svelte'
import * as THREE from 'three'
import { OptimizationManager, OptimizationLevel } from '../optimization/OptimizationManager'

// --- PROPS (from level.json) ---
export let size = { width: 2000, height: 2000 }
export let color = 0x006994
export let opacity = 0.95
export let enableAnimation = true
export let animationSpeed = 0.1

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
  segments: { width: 32, height: 32 },
  textureSize: 512,
  enableReflections: false,
  enableRefractions: false,
  ambientIntensity: 0.4,
  directionalIntensity: 0.5,
  waveLayers: 2, // Number of wave calculation layers
  enableComplexShaders: false, // Key mobile optimization
  useSimpleMaterial: false // Ultra-low fallback
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
          segments: { width: 8, height: 8 }, // Very low geometry
          textureSize: 256,
          enableReflections: false,
          enableRefractions: false,
          ambientIntensity: 0.8,
          directionalIntensity: 0.3,
          waveLayers: 1, // Single wave layer
          enableComplexShaders: false,
          useSimpleMaterial: true // Use basic THREE.js material instead of shaders
        }
        break
      case OptimizationLevel.LOW:
        deviceOptimizedSettings = {
          size: { width: Math.min(size.width, 1500), height: Math.min(size.height, 1500) },
          segments: { width: 12, height: 12 }, // Low geometry
          textureSize: 256,
          enableReflections: false,
          enableRefractions: false,
          ambientIntensity: 0.6,
          directionalIntensity: 0.4,
          waveLayers: 2, // Minimal waves
          enableComplexShaders: false, // Ultra-simplified shader
          useSimpleMaterial: false
        }
        break
      case OptimizationLevel.MEDIUM:
        deviceOptimizedSettings = {
          size: { width: Math.min(size.width, 2000), height: Math.min(size.height, 2000) },
          segments: { width: 24, height: 24 }, // Medium geometry
          textureSize: 512,
          enableReflections: false,
          enableRefractions: false,
          ambientIntensity: 0.4,
          directionalIntensity: 0.5,
          waveLayers: 3,
          enableComplexShaders: true, // Enable full shaders
          useSimpleMaterial: false
        }
        break
      case OptimizationLevel.HIGH:
        deviceOptimizedSettings = {
          size: size,
          segments: { width: 32, height: 32 },
          textureSize: 1024,
          enableReflections: qualitySettings.enableReflections,
          enableRefractions: false, // Still disable expensive refractions
          ambientIntensity: 0.4,
          directionalIntensity: 0.5,
          waveLayers: 4,
          enableComplexShaders: true,
          useSimpleMaterial: false
        }
        break
      case OptimizationLevel.ULTRA:
        deviceOptimizedSettings = {
          size: size,
          segments: { width: 64, height: 64 }, // Full geometry
          textureSize: 2048,
          enableReflections: qualitySettings.enableReflections,
          enableRefractions: qualitySettings.enableRefractions, // Only enable on ultra
          ambientIntensity: 0.4,
          directionalIntensity: 0.5,
          waveLayers: 4,
          enableComplexShaders: true,
          useSimpleMaterial: false
        }
        break
    }
    
    console.log(`🌊 Ocean: Using optimization level ${optimizationLevel}:`, {
      segments: deviceOptimizedSettings.segments,
      textureSize: deviceOptimizedSettings.textureSize,
      enableComplexShaders: deviceOptimizedSettings.enableComplexShaders,
      useSimpleMaterial: deviceOptimizedSettings.useSimpleMaterial,
      waveLayers: deviceOptimizedSettings.waveLayers
    })
  } catch (error) {
    console.warn('⚠️ Ocean: OptimizationManager not available, using mobile fallback:', error)
    // Ultra-conservative mobile fallback
    deviceOptimizedSettings = {
      size: { width: Math.min(size.width, 1000), height: Math.min(size.height, 1000) },
      segments: { width: 8, height: 8 },
      textureSize: 256,
      enableReflections: false,
      enableRefractions: false,
      ambientIntensity: 0.8,
      directionalIntensity: 0.3,
      waveLayers: 1,
      enableComplexShaders: false,
      useSimpleMaterial: true
    }
  }
}

// Ocean data
let oceanGeometry: THREE.PlaneGeometry
let oceanMaterial: THREE.Material
let oceanMesh: THREE.Mesh

// Animation state
let animationTime = 0
let originalVertices: Float32Array

// Reactive state for the water level
let waterLevel = dynamics?.initialLevel ?? 0

// Displacement map-based vertex shader (massive performance gain)
function createDisplacementVertexShader(): string {
  return `
    precision mediump float;
    
    uniform mediump float uTime;
    uniform sampler2D uDisplacementMap;
    uniform mediump float uDisplacementScale;
    uniform mediump vec2 uDisplacementOffset;
    
    varying mediump vec2 vUv;
    varying mediump vec3 vNormal;
    varying mediump vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Animate UV coordinates for moving waves (much slower like original)
      vec2 animatedUv = vUv + uDisplacementOffset + vec2(uTime * 0.005, uTime * 0.003);
      
      // Sample displacement map for wave height (single texture lookup!)
      float displacement = texture2D(uDisplacementMap, animatedUv).r;
      pos.z = displacement * uDisplacementScale;
      
      // Use vertex normals (normal map applied in fragment shader)
      vNormal = normalMatrix * normal;
      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `
}

// Advanced displacement + normal map vertex shader for high-end devices
function createAdvancedVertexShader(): string {
  return `
    precision mediump float; // Use consistent precision
    
    uniform mediump float uTime;
    uniform sampler2D uDisplacementMap;
    uniform mediump float uDisplacementScale;
    uniform mediump vec2 uDisplacementOffset;
    
    varying mediump vec2 vUv;
    varying mediump float vWaveHeight;
    varying mediump vec3 vNormal;
    varying mediump vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Animate UV coordinates with multiple layers for complex motion (much slower like original)
      vec2 animatedUv1 = vUv + uDisplacementOffset + vec2(uTime * 0.005, uTime * 0.003);
      vec2 animatedUv2 = vUv * 0.5 + vec2(uTime * -0.004, uTime * 0.006);
      
      // Sample displacement map with multiple layers
      float displacement1 = texture2D(uDisplacementMap, animatedUv1).r;
      float displacement2 = texture2D(uDisplacementMap, animatedUv2).g;
      
      // Combine displacements for complex wave patterns
      float totalDisplacement = (displacement1 * 0.7 + displacement2 * 0.3);
      pos.z = totalDisplacement * uDisplacementScale;
      vWaveHeight = totalDisplacement;
      
      // Use vertex normals (enhanced with normal map in fragment shader)
      vNormal = normalMatrix * normal;
      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `
}

// Mobile-optimized fragment shader with displacement map
function createMobileFragmentShader(): string {
  return `
    precision mediump float;
    
    uniform lowp vec3 uColor;
    uniform lowp float uOpacity;
    uniform lowp float uAmbientIntensity;
    uniform lowp sampler2D uDisplacementMap;
    uniform mediump float uTime;
    
    varying mediump vec2 vUv;
    
    void main() {
      // Simple wave color variation using displacement map (much slower like original)
      vec2 animatedUv = vUv + vec2(uTime * 0.003, uTime * 0.001);
      lowp float waveVariation = texture2D(uDisplacementMap, animatedUv).r;
      
      // Apply wave-based color variation
      lowp vec3 waterColor = uColor * uAmbientIntensity;
      waterColor = mix(waterColor * 0.8, waterColor * 1.2, waveVariation);
      
      gl_FragColor = vec4(waterColor, uOpacity);
    }
  `
}

// Desktop fragment shader with simplified lighting integration
function createDesktopFragmentShader(): string {
  return `
    precision mediump float;
    
    uniform mediump float uTime;
    uniform lowp vec3 uColor;
    uniform lowp float uOpacity;
    uniform lowp sampler2D uTexture;
    uniform lowp sampler2D uDisplacementMap;
    uniform lowp sampler2D uNormalMap;
    uniform lowp vec3 uAmbientColor;
    uniform lowp float uAmbientIntensity;
    uniform lowp vec3 uDirectionalLightColor;
    uniform lowp float uDirectionalLightIntensity;
    uniform mediump vec3 uDirectionalLightDirection;
    
    // Simple point lights for firefly reflections
    uniform lowp vec3 uPointLight1;
    uniform lowp vec3 uPointLightColor1;
    uniform lowp float uPointLightIntensity1;
    uniform lowp vec3 uPointLight2;
    uniform lowp vec3 uPointLightColor2;
    uniform lowp float uPointLightIntensity2;
    uniform lowp vec3 uPointLight3;
    uniform lowp vec3 uPointLightColor3;
    uniform lowp float uPointLightIntensity3;
    
    varying mediump vec2 vUv;
    varying mediump float vWaveHeight;
    varying mediump vec3 vNormal;
    varying mediump vec3 vWorldPosition;
    
    void main() {
      // Animate UVs for moving water patterns (much slower like original)
      vec2 animatedUv = vUv + vec2(uTime * 0.004, uTime * 0.002);
      
      // Sample textures
      lowp vec3 texColor = texture2D(uTexture, animatedUv).rgb;
      lowp vec3 normalMapColor = texture2D(uNormalMap, animatedUv).rgb;
      lowp float displacement = texture2D(uDisplacementMap, animatedUv).r;
      
      // Base water color with texture blending
      lowp vec3 waterColor = mix(uColor, texColor, 0.4);

      // Use normal map for lighting (convert from [0,1] to [-1,1])
      mediump vec3 normal = normalize(normalMapColor * 2.0 - 1.0);
      mediump vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      mediump vec3 lightDir = normalize(-uDirectionalLightDirection);
      
      // Ambient and directional lighting
      lowp vec3 ambient = uAmbientColor * uAmbientIntensity;
      mediump float NdotL = max(dot(normal, lightDir), 0.0);
      lowp vec3 diffuse = uDirectionalLightColor * uDirectionalLightIntensity * NdotL;
      
      // Simple specular reflection
      mediump vec3 halfDir = normalize(lightDir + viewDir);
      mediump float NdotH = max(dot(normal, halfDir), 0.0);
      lowp float spec = pow(NdotH, 64.0) * 0.5;
      lowp vec3 specular = uDirectionalLightColor * spec;
      
      lowp vec3 lighting = ambient + diffuse + specular;
      
      // Add firefly reflections (simplified - 3 point lights max)
      if(uPointLightIntensity1 > 0.0) {
        mediump vec3 pointLightDir = uPointLight1 - vWorldPosition;
        mediump float pointDistance = length(pointLightDir);
        pointLightDir = normalize(pointLightDir);
        mediump float pointAttenuation = 1.0 / (1.0 + 0.1 * pointDistance + 0.01 * pointDistance * pointDistance);
        mediump float pointNdotL = max(dot(normal, pointLightDir), 0.0);
        mediump vec3 pointHalf = normalize(pointLightDir + viewDir);
        mediump float pointSpec = pow(max(dot(normal, pointHalf), 0.0), 32.0) * pointAttenuation;
        lighting += uPointLightColor1 * pointSpec * uPointLightIntensity1 * 0.5;
      }
      
      if(uPointLightIntensity2 > 0.0) {
        mediump vec3 pointLightDir = uPointLight2 - vWorldPosition;
        mediump float pointDistance = length(pointLightDir);
        pointLightDir = normalize(pointLightDir);
        mediump float pointAttenuation = 1.0 / (1.0 + 0.1 * pointDistance + 0.01 * pointDistance * pointDistance);
        mediump float pointNdotL = max(dot(normal, pointLightDir), 0.0);
        mediump vec3 pointHalf = normalize(pointLightDir + viewDir);
        mediump float pointSpec = pow(max(dot(normal, pointHalf), 0.0), 32.0) * pointAttenuation;
        lighting += uPointLightColor2 * pointSpec * uPointLightIntensity2 * 0.5;
      }
      
      if(uPointLightIntensity3 > 0.0) {
        mediump vec3 pointLightDir = uPointLight3 - vWorldPosition;
        mediump float pointDistance = length(pointLightDir);
        pointLightDir = normalize(pointLightDir);
        mediump float pointAttenuation = 1.0 / (1.0 + 0.1 * pointDistance + 0.01 * pointDistance * pointDistance);
        mediump float pointNdotL = max(dot(normal, pointLightDir), 0.0);
        mediump vec3 pointHalf = normalize(pointLightDir + viewDir);
        mediump float pointSpec = pow(max(dot(normal, pointHalf), 0.0), 32.0) * pointAttenuation;
        lighting += uPointLightColor3 * pointSpec * uPointLightIntensity3 * 0.5;
      }
      
      waterColor = waterColor * lighting;

      // Wave-based depth variation using displacement map
      waterColor = mix(waterColor * 0.8, waterColor * 1.2, displacement);
      
      // Subtle shimmer using displacement map
      mediump float shimmer = displacement * 0.05;
      waterColor += vec3(shimmer * 0.08, shimmer * 0.1, shimmer * 0.12);
      
      gl_FragColor = vec4(waterColor, uOpacity);
    }
  `
}

// Simplified shader uniforms compatible with Three.js
$: uniforms = (() => {
  const baseUniforms = {
    uTime: { value: animationTime },
    uColor: { value: new THREE.Color(color) },
    uOpacity: { value: opacity },
    uDisplacementMap: { value: null as THREE.Texture | null },
    uDisplacementScale: { value: deviceOptimizedSettings.enableComplexShaders ? 2.0 : 1.0 },
    uDisplacementOffset: { value: new THREE.Vector2(0, 0) },
    uAmbientIntensity: { value: deviceOptimizedSettings.ambientIntensity }
  }
  
  if (deviceOptimizedSettings.enableComplexShaders) {
    return {
      ...baseUniforms,
      uTexture: { value: null as THREE.CanvasTexture | null },
      uNormalMap: { value: null as THREE.Texture | null },
      uAmbientColor: { value: new THREE.Color(0x404060) },
      uDirectionalLightColor: { value: new THREE.Color(0x8bb3ff) },
      uDirectionalLightIntensity: { value: deviceOptimizedSettings.directionalIntensity },
      uDirectionalLightDirection: { value: new THREE.Vector3(100, 200, 50).normalize() },
      
      // Simple point lights for firefly reflections
      uPointLight1: { value: new THREE.Vector3() },
      uPointLightColor1: { value: new THREE.Color() },
      uPointLightIntensity1: { value: 0 },
      uPointLight2: { value: new THREE.Vector3() },
      uPointLightColor2: { value: new THREE.Color() },
      uPointLightIntensity2: { value: 0 },
      uPointLight3: { value: new THREE.Vector3() },
      uPointLightColor3: { value: new THREE.Color() },
      uPointLightIntensity3: { value: 0 }
    }
  }
  
  return baseUniforms
})()

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
  
  console.log(`🌊 Ocean geometry created: ${deviceOptimizedSettings.segments.width}x${deviceOptimizedSettings.segments.height} segments`)

  // Store original vertices for reference
  originalVertices = new Float32Array(oceanGeometry.attributes.position.array)

  // Create material based on device capabilities
  if (deviceOptimizedSettings.useSimpleMaterial) {
    // Ultra-low: Use standard THREE.js material (massive performance gain)
    oceanMaterial = new THREE.MeshStandardMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      roughness: 0.05, // Very smooth for reflections like original
      metalness: 0.05, // Slightly metallic for water reflections
      fog: true,
      envMapIntensity: 1.5, // Higher reflection intensity like original
    })
    console.log('🌊 Ocean: Using MeshStandardMaterial for ultra-low performance')
  } else {
    // Generate displacement and normal maps
    const textureData = createWaveTextures()
    uniforms.uDisplacementMap.value = textureData.displacementMap
    
    if (deviceOptimizedSettings.enableComplexShaders) {
      uniforms.uTexture.value = textureData.colorTexture
      uniforms.uNormalMap.value = textureData.normalMap
    }

    // Create shader material with displacement maps and lighting
    oceanMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: deviceOptimizedSettings.enableComplexShaders 
        ? createAdvancedVertexShader()
        : createDisplacementVertexShader(),
      fragmentShader: deviceOptimizedSettings.enableComplexShaders 
        ? createDesktopFragmentShader()
        : createMobileFragmentShader(),
      transparent: true,
      side: THREE.DoubleSide,
      fog: true,
      depthWrite: false, // Better mobile performance
      lights: false, // Disable automatic Three.js lighting (we handle it manually)
    })
    
    console.log(`🌊 Ocean: Using ${deviceOptimizedSettings.enableComplexShaders ? 'advanced' : 'mobile'} displacement-based shaders`)
  }
}

// Generate displacement, normal, and color textures (massive performance gain)
function createWaveTextures(): {
  displacementMap: THREE.DataTexture
  normalMap: THREE.DataTexture
  colorTexture: THREE.CanvasTexture
} {
  const size = deviceOptimizedSettings.textureSize
  console.log(`🎨 Creating wave textures at ${size}x${size} resolution`)
  
  // Displacement map data (grayscale heights)
  const displacementData = new Float32Array(size * size)
  
  // Normal map data (RGB for X, Y, Z normals)
  const normalData = new Float32Array(size * size * 3)
  
  // Enhanced noise function with multiple octaves
  const generateWaveHeight = (x: number, y: number) => {
    let height = 0
    const complexity = size >= 512 ? 4 : 3
    
    for (let i = 0; i < complexity; i++) {
      const freq = 0.01 * Math.pow(2, i)
      const amplitude = 0.5 / Math.pow(2, i)
      height += Math.sin(x * freq) * Math.cos(y * freq * 0.7) * amplitude
      height += Math.cos(x * freq * 1.3) * Math.sin(y * freq * 0.9) * amplitude * 0.5
    }
    
    return height * 0.5 + 0.5 // Normalize to [0, 1]
  }
  
  // Calculate normals from height differences
  const calculateNormal = (x: number, y: number, heightMap: number[][]) => {
    const scale = 2.0 // Normal strength
    const left = x > 0 ? heightMap[y][x - 1] : heightMap[y][x]
    const right = x < size - 1 ? heightMap[y][x + 1] : heightMap[y][x]
    const up = y > 0 ? heightMap[y - 1][x] : heightMap[y][x]
    const down = y < size - 1 ? heightMap[y + 1][x] : heightMap[y][x]
    
    const dx = (right - left) * scale
    const dy = (down - up) * scale
    
    // Calculate normal vector
    const length = Math.sqrt(dx * dx + dy * dy + 1)
    return {
      x: -dx / length,
      y: -dy / length,
      z: 1 / length
    }
  }
  
  // Generate height map first
  const heightMap: number[][] = []
  for (let y = 0; y < size; y++) {
    heightMap[y] = []
    for (let x = 0; x < size; x++) {
      const height = generateWaveHeight(x, y)
      heightMap[y][x] = height
      displacementData[y * size + x] = height
    }
  }
  
  // Generate normal map from height map
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const normal = calculateNormal(x, y, heightMap)
      const index = (y * size + x) * 3
      
      // Convert from [-1, 1] to [0, 1] for texture storage
      normalData[index] = normal.x * 0.5 + 0.5     // R channel
      normalData[index + 1] = normal.y * 0.5 + 0.5 // G channel  
      normalData[index + 2] = normal.z * 0.5 + 0.5 // B channel
    }
  }
  
  // Create displacement texture (use compatible format)
  const displacementTextureData = new Uint8Array(size * size * 4) // RGBA format
  for (let i = 0; i < displacementData.length; i++) {
    const value = Math.floor(displacementData[i] * 255)
    displacementTextureData[i * 4] = value     // R
    displacementTextureData[i * 4 + 1] = value // G
    displacementTextureData[i * 4 + 2] = value // B
    displacementTextureData[i * 4 + 3] = 255   // A
  }
  
  const displacementTexture = new THREE.DataTexture(
    displacementTextureData,
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  )
  displacementTexture.wrapS = displacementTexture.wrapT = THREE.RepeatWrapping
  displacementTexture.needsUpdate = true
  
  // Create normal map texture (use compatible format)
  const normalTextureData = new Uint8Array(size * size * 4) // RGBA format
  for (let i = 0; i < normalData.length / 3; i++) {
    normalTextureData[i * 4] = Math.floor(normalData[i * 3] * 255)     // R
    normalTextureData[i * 4 + 1] = Math.floor(normalData[i * 3 + 1] * 255) // G
    normalTextureData[i * 4 + 2] = Math.floor(normalData[i * 3 + 2] * 255) // B
    normalTextureData[i * 4 + 3] = 255                                // A
  }
  
  const normalTexture = new THREE.DataTexture(
    normalTextureData,
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  )
  normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping
  normalTexture.needsUpdate = true
  
  // Create color texture (for visual appeal)
  const colorTexture = createColorTexture(size, heightMap)
  
  // Mobile optimizations
  if (size <= 256) {
    displacementTexture.generateMipmaps = false
    normalTexture.generateMipmaps = false
    colorTexture.generateMipmaps = false
    
    displacementTexture.minFilter = normalTexture.minFilter = colorTexture.minFilter = THREE.LinearFilter
    displacementTexture.magFilter = normalTexture.magFilter = colorTexture.magFilter = THREE.LinearFilter
  }
  
  return {
    displacementMap: displacementTexture,
    normalMap: normalTexture,
    colorTexture: colorTexture
  }
}

// Generate color texture based on wave height
function createColorTexture(size: number, heightMap: number[][]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const height = heightMap[y][x]
      
      // Color based on wave height (deeper = darker)
      const blueBase = 15
      const greenBase = 40
      const blue = Math.floor(blueBase + height * 100)
      const green = Math.floor(greenBase + height * 80)
      const red = Math.floor(5 + height * 25)
      
      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(8, 8)
  
  return texture
}

// Main animation loop (simplified for mobile)
useTask((delta) => {
  if (!enableAnimation || !oceanMaterial) return

  // Rising Water Logic
  if (dynamics?.enableRising && waterLevel < dynamics.targetLevel) {
    waterLevel = Math.min(
      waterLevel + dynamics.riseRate * delta,
      dynamics.targetLevel
    )
  }

  // Update animation time
  animationTime += delta * animationSpeed

  // Update material uniforms (only if using shaders)
  if (!deviceOptimizedSettings.useSimpleMaterial && oceanMaterial instanceof THREE.ShaderMaterial) {
    oceanMaterial.uniforms.uTime.value = animationTime
    oceanMaterial.uniforms.uColor.value.setHex(color)
    oceanMaterial.uniforms.uOpacity.value = opacity
    
    // Animate displacement offset for moving waves (much slower like original)
    const offsetX = Math.sin(animationTime * 0.02) * 0.05
    const offsetY = Math.cos(animationTime * 0.015) * 0.05
    oceanMaterial.uniforms.uDisplacementOffset.value.set(offsetX, offsetY)
    
    // Update lighting uniforms from Threlte scene context
    updateLightingUniforms()
  } else if (deviceOptimizedSettings.useSimpleMaterial && oceanMaterial instanceof THREE.MeshStandardMaterial) {
    // For standard material, animate roughness slightly for wave effect (much slower like original)
    const roughnessVariation = Math.sin(animationTime * 0.1) * 0.02
    oceanMaterial.roughness = 0.05 + roughnessVariation
  }
})

// Function to update lighting uniforms from scene
function updateLightingUniforms() {
  if (!oceanMaterial || !(oceanMaterial instanceof THREE.ShaderMaterial)) return
  if (!deviceOptimizedSettings.enableComplexShaders) return
  
  // This will be called each frame to sync with Observatory and Firefly lighting
  // The actual light data will be populated by the parent Observatory component
  
  // For now, set reasonable defaults that will be overridden
  if (oceanMaterial.uniforms.ambientLightColor) {
    oceanMaterial.uniforms.ambientLightColor.value.setHex(0x404060)
  }
  
  if (oceanMaterial.uniforms.directionalLightColors) {
    oceanMaterial.uniforms.directionalLightColors.value[0].setHex(0x8bb3ff).multiplyScalar(0.5)
    oceanMaterial.uniforms.directionalLightColors.value[1].setHex(0x6a7db3).multiplyScalar(0.4)
  }
}

// Export function for Observatory to update ocean lighting
export function updateOceanLighting(lights: {
  ambient?: THREE.Color,
  directional?: Array<{color: THREE.Color, direction: THREE.Vector3, intensity: number}>,
  points?: Array<{position: THREE.Vector3, color: THREE.Color, distance: number}>
}) {
  if (!oceanMaterial || !(oceanMaterial instanceof THREE.ShaderMaterial)) return
  if (!deviceOptimizedSettings.enableComplexShaders) return
  
  const uniforms = oceanMaterial.uniforms
  
  // Update ambient light
  if (lights.ambient && uniforms.uAmbientColor) {
    uniforms.uAmbientColor.value.copy(lights.ambient)
  }
  
  // Update directional lights (use first one)
  if (lights.directional && lights.directional[0]) {
    const dirLight = lights.directional[0]
    if (uniforms.uDirectionalLightDirection) {
      uniforms.uDirectionalLightDirection.value.copy(dirLight.direction)
    }
    if (uniforms.uDirectionalLightColor) {
      uniforms.uDirectionalLightColor.value.copy(dirLight.color)
    }
    if (uniforms.uDirectionalLightIntensity) {
      uniforms.uDirectionalLightIntensity.value = dirLight.intensity
    }
  }
  
  // Update point lights (fireflies) - use first 3
  if (lights.points) {
    // Reset all point lights
    uniforms.uPointLightIntensity1.value = 0
    uniforms.uPointLightIntensity2.value = 0
    uniforms.uPointLightIntensity3.value = 0
    
    lights.points.slice(0, 3).forEach((light, i) => {
      const positionKey = `uPointLight${i + 1}`
      const colorKey = `uPointLightColor${i + 1}`
      const intensityKey = `uPointLightIntensity${i + 1}`
      
      if (uniforms[positionKey]) {
        uniforms[positionKey].value.copy(light.position)
      }
      if (uniforms[colorKey]) {
        uniforms[colorKey].value.copy(light.color)
      }
      if (uniforms[intensityKey]) {
        uniforms[intensityKey].value = 1.0 // Use normalized intensity
      }
    })
  }
}

// Reactive updates
$: if (oceanMaterial) {
  if (oceanMaterial instanceof THREE.ShaderMaterial) {
    oceanMaterial.uniforms.uColor?.value.setHex(color)
    oceanMaterial.uniforms.uOpacity && (oceanMaterial.uniforms.uOpacity.value = opacity)
  } else if (oceanMaterial instanceof THREE.MeshStandardMaterial) {
    oceanMaterial.color.setHex(color)
    oceanMaterial.opacity = opacity
  }
}
</script>

<!-- Ocean mesh with device-optimized rendering -->
{#if oceanGeometry && oceanMaterial}
  <T.Mesh 
    bind:ref={oceanMesh}
    geometry={oceanGeometry}
    material={oceanMaterial}
    position.y={waterLevel}
    rotation={[-Math.PI / 2, 0, 0]}
    receiveShadow={deviceOptimizedSettings.enableComplexShaders}
    castShadow={false}
    name="ocean_surface"
    frustumCulled={true}
  />
{/if}

<style>
/* No styles needed */
</style>