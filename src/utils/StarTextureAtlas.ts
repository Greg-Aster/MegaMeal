import * as THREE from 'three'

/**
 * Star Texture Atlas Generator - TIER 2 Performance Optimization
 *
 * Creates a 4x4 sprite sheet with 16 frames of star twinkle animation.
 * This replaces expensive per-frame texture regeneration with lightweight UV animation.
 */

export interface StarAtlasFrame {
  u: number
  v: number
  width: number
  height: number
}

export class StarTextureAtlas {
  private atlas: THREE.Texture | null = null
  private frames: StarAtlasFrame[] = []
  private readonly ATLAS_SIZE = 512 // Total atlas texture size
  private readonly FRAME_SIZE = 128 // Each frame is 128x128 (4x4 grid)
  private readonly GRID_SIZE = 4 // 4x4 grid = 16 frames

  /**
   * Generate the 4x4 sprite sheet with 16 frames of star animation
   */
  public generateAtlas(): THREE.Texture {
    if (this.atlas) {
      return this.atlas
    }

    console.log('🎨 Generating star texture atlas (4x4 sprite sheet)...')

    // Create canvas for atlas generation
    const canvas = document.createElement('canvas')
    canvas.width = this.ATLAS_SIZE
    canvas.height = this.ATLAS_SIZE
    const ctx = canvas.getContext('2d')!

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, this.ATLAS_SIZE, this.ATLAS_SIZE)

    // Generate 16 frames of star animation
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        const frameIndex = row * this.GRID_SIZE + col
        const x = col * this.FRAME_SIZE
        const y = row * this.FRAME_SIZE

        // Generate this frame
        this.generateStarFrame(ctx, x, y, frameIndex)

        // Store frame UV coordinates for animation
        this.frames.push({
          u: col / this.GRID_SIZE,
          v: row / this.GRID_SIZE,
          width: 1 / this.GRID_SIZE,
          height: 1 / this.GRID_SIZE,
        })
      }
    }

    // Create THREE.js texture from canvas
    this.atlas = new THREE.CanvasTexture(canvas)
    this.atlas.magFilter = THREE.LinearFilter
    this.atlas.minFilter = THREE.LinearMipMapLinearFilter
    this.atlas.wrapS = THREE.ClampToEdgeWrapping
    this.atlas.wrapT = THREE.ClampToEdgeWrapping
    this.atlas.generateMipmaps = true

    console.log('✅ Star texture atlas generated successfully')
    return this.atlas
  }

  /**
   * Generate a single frame of star animation
   */
  private generateStarFrame(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    offsetY: number,
    frameIndex: number,
  ): void {
    const centerX = offsetX + this.FRAME_SIZE / 2
    const centerY = offsetY + this.FRAME_SIZE / 2

    // Animation parameters based on frame index
    const animationPhase = (frameIndex / 15) * Math.PI * 2 // 0 to 2π
    const twinkleIntensity = (Math.sin(animationPhase) + 1) / 2 // 0 to 1
    const scaleMultiplier = 0.7 + twinkleIntensity * 0.3 // 0.7 to 1.0

    // Star core parameters
    const coreRadius = 8 * scaleMultiplier
    const glowRadius = 24 * scaleMultiplier
    const brightness = 0.6 + twinkleIntensity * 0.4 // 0.6 to 1.0

    // Create radial gradient for star glow with much reduced opacity
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      glowRadius,
    )

    // Significantly reduce halo opacity to prevent fuzzy orb appearance
    gradient.addColorStop(0, `rgba(255, 255, 255, ${brightness})`)
    gradient.addColorStop(0.3, `rgba(255, 255, 255, ${brightness * 0.4})`)
    gradient.addColorStop(0.6, `rgba(255, 255, 255, ${brightness * 0.15})`)
    gradient.addColorStop(0.8, `rgba(255, 255, 255, ${brightness * 0.05})`)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    // Draw star glow
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2)
    ctx.fill()

    // Draw bright star core
    const coreGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      coreRadius,
    )
    coreGradient.addColorStop(0, `rgba(255, 255, 255, ${brightness})`)
    coreGradient.addColorStop(0.7, `rgba(255, 255, 255, ${brightness * 0.9})`)
    coreGradient.addColorStop(1, `rgba(255, 255, 255, ${brightness * 0.3})`)

    ctx.fillStyle = coreGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2)
    ctx.fill()

    // Add star spikes for brighter frames
    if (twinkleIntensity > 0.5) {
      this.drawStarSpikes(
        ctx,
        centerX,
        centerY,
        coreRadius * 1.5,
        brightness * twinkleIntensity,
      )
    }
  }

  /**
   * Draw star spikes (cross pattern)
   */
  private drawStarSpikes(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    length: number,
    opacity: number,
  ): void {
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    // Horizontal spike
    ctx.beginPath()
    ctx.moveTo(centerX - length, centerY)
    ctx.lineTo(centerX + length, centerY)
    ctx.stroke()

    // Vertical spike
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - length)
    ctx.lineTo(centerX, centerY + length)
    ctx.stroke()
  }

  /**
   * Get UV coordinates for a specific frame
   */
  public getFrameUV(frameIndex: number): StarAtlasFrame {
    const clampedIndex = Math.max(0, Math.min(15, Math.floor(frameIndex)))
    return this.frames[clampedIndex]
  }

  /**
   * Get frame index for animation time
   */
  public getFrameForTime(time: number, animationSpeed = 1.0): number {
    // Slow down the animation significantly - complete cycle every 8 seconds
    const cycleTime = time * animationSpeed * 0.125 // Much slower animation
    return Math.floor(cycleTime * 16) % 16
  }

  /**
   * Get the generated atlas texture
   */
  public getAtlasTexture(): THREE.Texture | null {
    return this.atlas
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.atlas) {
      this.atlas.dispose()
      this.atlas = null
    }
    this.frames = []
  }
}

// Global instance for sharing between StarMapView and StarNavigationSystem
let globalStarAtlas: StarTextureAtlas | null = null

/**
 * Get shared star texture atlas instance
 */
export function getSharedStarAtlas(): StarTextureAtlas {
  if (!globalStarAtlas) {
    globalStarAtlas = new StarTextureAtlas()
  }
  return globalStarAtlas
}

/**
 * Dispose of shared atlas (for cleanup)
 */
export function disposeSharedStarAtlas(): void {
  if (globalStarAtlas) {
    globalStarAtlas.dispose()
    globalStarAtlas = null
  }
}
