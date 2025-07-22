import type * as THREE from 'three'
import type { Engine } from '../../engine/core/Engine'
import { GameObject } from '../../engine/core/GameObject'
import type { OptimizationLevel } from '../../engine/optimization/OptimizationManager'
import { ResourceManager } from '../../engine/utils/ResourceManager'

/**
 * Handles atmospheric effects for the Star Observatory
 * Manages fireflies, cosmic dust, nebulae, and grid effects
 */
export class AtmosphericEffects extends GameObject {
  private scene: THREE.Scene
  private levelGroup: THREE.Group
  private THREE: any
  private engine: Engine

  // Effects
  private fireflies: THREE.Points | null = null
  private cosmicDust: THREE.Points | null = null
  private gridGroup: THREE.Group | null = null

  // Animation data
  private animationTime = 0
  private originalFireflyPositions: Float32Array | null = null

  // Optimization
  private isMobile = false
  private optimizationLevel: OptimizationLevel

  // Configuration
  private gridRadius = 940
  private fireflyCount = 80
  private cosmicDustCount = 500

  constructor(
    THREE: any,
    engine: Engine,
    scene: THREE.Scene,
    levelGroup: THREE.Group,
  ) {
    super()
    this.THREE = THREE
    this.engine = engine
    this.scene = scene
    this.levelGroup = levelGroup

    const optimizationManager = this.engine.getOptimizationManager()
    this.isMobile =
      optimizationManager.getDeviceCapabilities()?.isMobile || false
    this.optimizationLevel = optimizationManager.getOptimizationLevel()

    if (this.isMobile) {
      this.fireflyCount = 25
      this.cosmicDustCount = 150
    }
  }

  public async initialize(): Promise<void> {
    this.validateNotDisposed()

    if (this.isInitialized) {
      console.warn('AtmosphericEffects already initialized')
      return
    }

    try {
      console.log('✨ Initializing Atmospheric Effects...')
      console.log(
        `   - Optimization Level: ${this.optimizationLevel} (isMobile: ${this.isMobile})`,
      )

      await this.createFireflies()
      await this.createCosmicDust()
      await this.createGrid()
      await this.setupLighting()

      this.markInitialized()
      console.log('✅ Atmospheric Effects initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Atmospheric Effects:', error)
      throw error
    }
  }

  public update(deltaTime: number): void {
    if (!this.isInitialized || !this.isActive) return

    this.animationTime += deltaTime

    // Update firefly animation
    if (this.fireflies) {
      this.animateFireflies()
    }

    // Update grid animation
    if (this.gridGroup) {
      this.animateGrid()
    }

    // Update cosmic dust (if needed)
    if (this.cosmicDust) {
      this.animateCosmicDust()
    }
  }

  private async createFireflies(): Promise<void> {
    console.log('🧚 Creating magical fireflies...')

    const positions = new Float32Array(this.fireflyCount * 3)
    const colors = new Float32Array(this.fireflyCount * 3)
    const sizes = new Float32Array(this.fireflyCount)

    // Create firefly positions around the island
    for (let i = 0; i < this.fireflyCount; i++) {
      const i3 = i * 3

      // Position fireflies randomly around the island
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 180 + 20
      const height = Math.random() * 30 + 5

      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = height
      positions[i3 + 2] = Math.sin(angle) * radius

      // Magical firefly colors
      const colorChoice = Math.random()
      if (colorChoice < 0.6) {
        // Warm firefly glow
        colors[i3] = 1.0
        colors[i3 + 1] = 0.8 + Math.random() * 0.2
        colors[i3 + 2] = 0.3 + Math.random() * 0.2
      } else if (colorChoice < 0.8) {
        // Cool magical glow
        colors[i3] = 0.4 + Math.random() * 0.3
        colors[i3 + 1] = 0.8 + Math.random() * 0.2
        colors[i3 + 2] = 1.0
      } else {
        // Mystical purple/pink
        colors[i3] = 0.8 + Math.random() * 0.2
        colors[i3 + 1] = 0.4 + Math.random() * 0.2
        colors[i3 + 2] = 1.0
      }

      // Varying sizes
      sizes[i] = Math.random() * 0.3 + 0.1
    }

    // Store original positions for animation
    this.originalFireflyPositions = positions.slice()

    const geometry = new this.THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new this.THREE.BufferAttribute(positions, 3),
    )
    geometry.setAttribute('color', new this.THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new this.THREE.BufferAttribute(sizes, 1))

    const material = new this.THREE.PointsMaterial({
      size: 0.8,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: this.THREE.AdditiveBlending,
      map: this.createFireflyTexture(),
    })

    this.fireflies = new this.THREE.Points(geometry, material)
    this.levelGroup.add(this.fireflies)

    console.log(`✅ Created ${this.fireflyCount} magical fireflies`)
  }

  private createFireflyTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!

    // Create soft glowing circle
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)')
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)')
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)

    // Add outer glow
    const outerGlow = ctx.createRadialGradient(32, 32, 20, 32, 32, 45)
    outerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
    outerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = outerGlow
    ctx.fillRect(0, 0, 64, 64)

    return new this.THREE.CanvasTexture(canvas)
  }

  private animateFireflies(): void {
    if (!this.fireflies || !this.originalFireflyPositions) return

    const time = this.animationTime * 0.0003 // Slow movement
    const positions = this.fireflies.geometry.attributes.position.array

    for (let i = 0; i < positions.length; i += 3) {
      const originalX = this.originalFireflyPositions[i]
      const originalY = this.originalFireflyPositions[i + 1]
      const originalZ = this.originalFireflyPositions[i + 2]

      // Gentle floating motion
      positions[i] = originalX + Math.sin(time + i * 0.05) * 3
      positions[i + 1] = originalY + Math.sin(time * 0.3 + i * 0.1) * 2
      positions[i + 2] = originalZ + Math.cos(time * 0.2 + i * 0.08) * 2.5
    }

    this.fireflies.geometry.attributes.position.needsUpdate = true

    // Gentle glow pulsing
    const glowIntensity = 0.7 + Math.sin(time * 8) * 0.3
    this.fireflies.material.opacity = glowIntensity
  }

  private async createCosmicDust(): Promise<void> {
    console.log('🌌 Creating cosmic dust...')

    const positions = new Float32Array(this.cosmicDustCount * 3)

    for (let i = 0; i < this.cosmicDustCount; i++) {
      const i3 = i * 3

      // Random positions in a large sphere
      const radius = 800 + Math.random() * 400
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)
    }

    const geometry = new this.THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new this.THREE.BufferAttribute(positions, 3),
    )

    const material = new this.THREE.PointsMaterial({
      size: 1,
      color: 0x666666,
      transparent: true,
      opacity: 0.1,
      blending: this.THREE.AdditiveBlending,
    })

    this.cosmicDust = new this.THREE.Points(geometry, material)
    this.levelGroup.add(this.cosmicDust)

    console.log(`✅ Created ${this.cosmicDustCount} cosmic dust particles`)
  }

  private animateCosmicDust(): void {
    if (!this.cosmicDust) return

    // Subtle rotation
    this.cosmicDust.rotation.y += 0.0001
  }

  private async createGrid(): Promise<void> {
    console.log('🌐 Creating celestial grid...')

    this.gridGroup = new this.THREE.Group()

    const gridMaterial = new this.THREE.LineBasicMaterial({
      color: 0x224466,
      transparent: true,
      opacity: 0.05,
    })

    // Create longitude lines (vertical meridians)
    for (let i = 0; i < 12; i++) {
      const phi = (i / 12) * Math.PI * 2
      const points = []

      for (let j = 0; j <= 50; j++) {
        const theta = (j / 50) * Math.PI
        points.push(
          new this.THREE.Vector3().setFromSphericalCoords(
            this.gridRadius,
            theta,
            phi,
          ),
        )
      }

      const lineGeometry = new this.THREE.BufferGeometry().setFromPoints(points)
      const line = new this.THREE.Line(lineGeometry, gridMaterial)
      this.gridGroup.add(line)
    }

    // Create latitude lines (horizontal circles)
    for (let i = -2; i <= 2; i++) {
      const elevationAngleDeg = i * 30
      const polarAngleRad =
        Math.PI / 2 - this.THREE.MathUtils.degToRad(elevationAngleDeg)

      if (polarAngleRad < 0.01 || polarAngleRad > Math.PI - 0.01) continue

      const points = []
      for (let j = 0; j <= 60; j++) {
        const azimuthRad = (j / 60) * Math.PI * 2
        points.push(
          new this.THREE.Vector3().setFromSphericalCoords(
            this.gridRadius,
            polarAngleRad,
            azimuthRad,
          ),
        )
      }

      points.push(points[0]) // Close the circle

      const lineGeometry = new this.THREE.BufferGeometry().setFromPoints(points)
      const line = new this.THREE.Line(lineGeometry, gridMaterial)
      this.gridGroup.add(line)
    }

    this.levelGroup.add(this.gridGroup)
    console.log('✅ Celestial grid created')
  }

  private animateGrid(): void {
    if (!this.gridGroup) return

    const time = this.animationTime * 0.0001
    const opacity = 0.03 + Math.sin(time) * 0.02

    this.gridGroup.children.forEach((line: any) => {
      if (line.material) {
        line.material.opacity = Math.max(0, Math.min(1, opacity))
      }
    })
  }

  private async setupLighting(): Promise<void> {
    console.log('💡 Setting up atmospheric lighting...')

    if (this.isMobile) {
      // MOBILE OPTIMIZATION: Simpler lighting for mobile
      const ambientLight = new this.THREE.AmbientLight(0x404060, 0.4)
      this.levelGroup.add(ambientLight)

      const moonlight = new this.THREE.DirectionalLight(0x8888cc, 0.2)
      moonlight.position.set(100, 200, 50)
      moonlight.castShadow = false // Disable shadows on mobile
      this.levelGroup.add(moonlight)
    } else {
      // DESKTOP: Higher quality lighting
      const ambientLight = new this.THREE.AmbientLight(0x202040, 0.2)
      this.levelGroup.add(ambientLight)

      const moonlight = new this.THREE.DirectionalLight(0x6666aa, 0.3)
      moonlight.position.set(100, 200, 50)
      moonlight.castShadow = true // Enable shadows on desktop
      this.levelGroup.add(moonlight)
    }

    console.log('✅ Atmospheric lighting set up')
  }

  /**
   * Create a nebula effect at a specific position
   */
  public createNebulaEffect(
    position: THREE.Vector3,
    color = 0x6366f1,
  ): THREE.Points {
    const particleCount = 100
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      // Random positions around the given position
      positions[i3] = position.x + (Math.random() - 0.5) * 200
      positions[i3 + 1] = position.y + (Math.random() - 0.5) * 200
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * 200

      // Color variation
      const colorObj = new this.THREE.Color(color)
      colors[i3] = colorObj.r * (0.8 + Math.random() * 0.4)
      colors[i3 + 1] = colorObj.g * (0.8 + Math.random() * 0.4)
      colors[i3 + 2] = colorObj.b * (0.8 + Math.random() * 0.4)
    }

    const geometry = new this.THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new this.THREE.BufferAttribute(positions, 3),
    )
    geometry.setAttribute('color', new this.THREE.BufferAttribute(colors, 3))

    const material = new this.THREE.PointsMaterial({
      size: 5,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: this.THREE.AdditiveBlending,
    })

    const nebula = new this.THREE.Points(geometry, material)
    this.levelGroup.add(nebula)

    return nebula
  }

  /**
   * Control grid visibility
   */
  public setGridVisibility(visible: boolean): void {
    if (this.gridGroup) {
      this.gridGroup.visible = visible
    }
  }

  /**
   * Control grid opacity
   */
  public setGridOpacity(opacity: number): void {
    if (this.gridGroup) {
      this.gridGroup.children.forEach((line: any) => {
        if (line.material) {
          line.material.opacity = Math.max(0, Math.min(1, opacity))
        }
      })
    }
  }

  /**
   * Control firefly intensity
   */
  public setFireflyIntensity(intensity: number): void {
    if (this.fireflies) {
      this.fireflies.material.opacity = Math.max(0, Math.min(1, intensity))
    }
  }

  public getFireflies(): THREE.Points | null {
    return this.fireflies
  }

  public getGrid(): THREE.Group | null {
    return this.gridGroup
  }

  public getCosmicDust(): THREE.Points | null {
    return this.cosmicDust
  }

  public dispose(): void {
    if (this.isDisposed) return

    console.log('🧹 Disposing Atmospheric Effects...')

    // Dispose fireflies using ResourceManager
    if (this.fireflies) {
      ResourceManager.disposePoints(this.fireflies)
      this.levelGroup.remove(this.fireflies)
      this.fireflies = null
    }

    // Dispose cosmic dust using ResourceManager
    if (this.cosmicDust) {
      ResourceManager.disposePoints(this.cosmicDust)
      this.levelGroup.remove(this.cosmicDust)
      this.cosmicDust = null
    }

    // Dispose grid using ResourceManager
    if (this.gridGroup) {
      ResourceManager.disposeGroup(this.gridGroup)
      this.levelGroup.remove(this.gridGroup)
      this.gridGroup = null
    }

    // Clear original positions
    this.originalFireflyPositions = null

    this.markDisposed()
    console.log('✅ Atmospheric Effects disposed')
  }
}
