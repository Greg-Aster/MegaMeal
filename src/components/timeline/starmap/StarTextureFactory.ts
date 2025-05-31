// src/components/timeline/starmap/StarTextureFactory.ts
// Handles all star texture generation and visual effects

import type * as THREE from 'three';
import type { 
  StarType, 
  RingType, 
  GlowLayer, 
  OrbitalRingDefinition,
  TextureFactoryOptions 
} from '../../../types/starmap';

export class StarTextureFactory {
  private readonly textureCache = new Map<string, THREE.Texture>(); // Cache for performance
  private readonly canvasPool: HTMLCanvasElement[] = []; // Canvas pool for memory efficiency
  private readonly options: Required<TextureFactoryOptions>;

  constructor(options: TextureFactoryOptions = {}) {
    this.options = {
      cacheSize: 100,
      canvasPoolSize: 10,
      ...options
    };
  }

  // === CANVAS MANAGEMENT ===
  private getCanvas(size = 512): HTMLCanvasElement {
    const cachedCanvas = this.canvasPool.find(c => c.width === size && c.height === size);
    if (cachedCanvas) {
      const index = this.canvasPool.indexOf(cachedCanvas);
      this.canvasPool.splice(index, 1);
      return cachedCanvas;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
  }

  private returnCanvas(canvas: HTMLCanvasElement): void {
    // Clear canvas and return to pool
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    if (this.canvasPool.length < this.options.canvasPoolSize) {
      this.canvasPool.push(canvas);
    }
  }

  // === UTILITY FUNCTIONS ===
  public getSizeFactor(isKeyEvent: boolean): number {
    return isKeyEvent ? 1.2 : 0.85 + (Math.random() * 0.3);
  }

  // === ORBITAL RING TEXTURES ===
  public createOrbitalRingTexture(color: string, ringType: RingType = 'base', size = 256): THREE.Texture {
    const cacheKey = `ring_${color}_${ringType}_${size}`;
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    const canvas = this.getCanvas(size);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to get 2D context from canvas');
    }
    
    const center = size / 2;
    const outerRadius = size * 0.45;
    const innerRadius = size * 0.35;
    
    ctx.clearRect(0, 0, size, size);
    
    // Create ring gradient based on type
    const gradient = ctx.createRadialGradient(center, center, innerRadius, center, center, outerRadius);
    
    switch (ringType) {
      case 'selected':
        gradient.addColorStop(0, color + '00');
        gradient.addColorStop(0.3, color + '80');
        gradient.addColorStop(0.7, color + 'CC');
        gradient.addColorStop(1, color + '00');
        break;
        
      case 'init':
        gradient.addColorStop(0, color + '00');
        gradient.addColorStop(0.2, color + 'AA');
        gradient.addColorStop(0.8, color + 'DD');
        gradient.addColorStop(1, color + '00');
        break;
        
      default: // 'base'
        gradient.addColorStop(0, color + '00');
        gradient.addColorStop(0.4, color + '20');
        gradient.addColorStop(0.6, color + '40');
        gradient.addColorStop(1, color + '00');
        break;
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
    ctx.arc(center, center, innerRadius, 0, Math.PI * 2, true); // Cut out center
    ctx.fill();
    
    // Create Three.js texture (assuming THREE is available globally)
    const texture = new THREE.CanvasTexture(canvas);
    
    // Cache the texture
    if (this.textureCache.size < this.options.cacheSize) {
      this.textureCache.set(cacheKey, texture);
    }
    
    // Return canvas to pool
    this.returnCanvas(canvas);
    
    return texture;
  }

  // === ADVANCED STAR TEXTURES ===
  public createAdvancedStarTexture(
    color: string, 
    starType: StarType, 
    isKeyEvent = false, 
    isSelected = false, 
    isHovered = false, 
    animationTime = 0, 
    size = 512
  ): THREE.Texture {
    // For frequently changing textures (animations), don't cache
    const shouldCache = !isSelected && !isHovered && (animationTime % 1000 < 50);
    const cacheKey = shouldCache ? `star_${color}_${starType}_${isKeyEvent}_${Math.floor(animationTime / 1000)}` : null;
    
    if (cacheKey && this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    const canvas = this.getCanvas(size);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to get 2D context from canvas');
    }
    
    const center = size / 2;
    const baseRadius = isKeyEvent ? size * 0.04 : size * 0.03;
    const sizeFactor = this.getSizeFactor(isKeyEvent);
    const finalRadius = baseRadius * sizeFactor;
    
    ctx.clearRect(0, 0, size, size);
    
    // Animation calculations (slower for performance)
    const glowPhase = (Math.sin(animationTime * 0.0008) + 1) / 2;
    const shimmerPhase = (Math.sin(animationTime * 0.001) + 1) / 2;
    const orbitalPhase = animationTime * 0.0004;
    const raysRotation = animationTime * 0.0003;
    
    // Render star layers
    this.renderBackingPlate(ctx, center, finalRadius, isSelected, isHovered);
    this.renderMultiLayerGlow(ctx, center, finalRadius, color, glowPhase, animationTime);
    this.renderLightRays(ctx, center, finalRadius, color, raysRotation, isKeyEvent, isSelected, isHovered, animationTime);
    this.renderOrbitalRings(ctx, center, finalRadius, color, orbitalPhase, isSelected, isHovered);
    this.renderStarShape(ctx, center, finalRadius, color, starType, shimmerPhase, animationTime);
    this.renderKeyEventGlow(ctx, center, finalRadius, color, animationTime, isKeyEvent);
    
    // Create Three.js texture
    const texture = new THREE.CanvasTexture(canvas);
    
    // Cache if appropriate
    if (cacheKey && this.textureCache.size < this.options.cacheSize) {
      this.textureCache.set(cacheKey, texture);
    }
    
    // Return canvas to pool
    this.returnCanvas(canvas);
    
    return texture;
  }

  // === STAR RENDERING LAYERS ===
  private renderBackingPlate(
    ctx: CanvasRenderingContext2D, 
    center: number, 
    finalRadius: number, 
    isSelected: boolean, 
    isHovered: boolean
  ): void {
    const backingRadius = finalRadius * 4;
    const backingGradient = ctx.createRadialGradient(center, center, 0, center, center, backingRadius);
    const backingOpacity = isSelected ? 0.95 : (isHovered ? 0.9 : 0.7);
    
    backingGradient.addColorStop(0, `rgba(0,0,0,${backingOpacity})`);
    backingGradient.addColorStop(0.7, `rgba(0,0,0,${backingOpacity * 0.6})`);
    backingGradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = backingGradient;
    ctx.beginPath();
    ctx.arc(center, center, backingRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderMultiLayerGlow(
    ctx: CanvasRenderingContext2D, 
    center: number, 
    finalRadius: number, 
    color: string, 
    glowPhase: number, 
    animationTime: number
  ): void {
    const glowLayers: GlowLayer[] = [
      { radius: finalRadius * 20, opacity: 0.02 + glowPhase * 0.01, blur: 30 },
      { radius: finalRadius * 15, opacity: 0.04 + glowPhase * 0.02, blur: 25 },
      { radius: finalRadius * 12, opacity: 0.06 + glowPhase * 0.03, blur: 20 },
      { radius: finalRadius * 8, opacity: 0.1 + glowPhase * 0.05, blur: 15 },
      { radius: finalRadius * 5, opacity: 0.15 + glowPhase * 0.08, blur: 10 },
      { radius: finalRadius * 3, opacity: 0.25 + glowPhase * 0.1, blur: 5 },
    ];
    
    const hueShift = Math.sin(animationTime * 0.0004) * 20;
    const brightness = 1 + Math.sin(animationTime * 0.0006) * 0.15;
    
    glowLayers.forEach((layer, index) => {
      ctx.save();
      ctx.filter = `blur(${layer.blur}px) hue-rotate(${hueShift * (index + 1) / glowLayers.length}deg) brightness(${brightness})`;
      
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, layer.radius);
      const alpha = Math.floor(layer.opacity * 255).toString(16).padStart(2, '0');
      gradient.addColorStop(0, color + alpha);
      gradient.addColorStop(0.2, color + Math.floor(layer.opacity * 180).toString(16).padStart(2, '0'));
      gradient.addColorStop(0.5, color + Math.floor(layer.opacity * 100).toString(16).padStart(2, '0'));
      gradient.addColorStop(0.8, color + Math.floor(layer.opacity * 40).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, color + '00');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(center, center, layer.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private renderLightRays(
    ctx: CanvasRenderingContext2D, 
    center: number, 
    finalRadius: number, 
    color: string, 
    raysRotation: number, 
    isKeyEvent: boolean, 
    isSelected: boolean, 
    isHovered: boolean, 
    animationTime: number
  ): void {
    if (!isKeyEvent && !isSelected && !isHovered) return;
    
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(raysRotation);
    ctx.translate(-center, -center);
    
    const raysRadius = finalRadius * 10;
    const raysOpacity = isSelected ? 0.3 : (isHovered ? 0.18 : (isKeyEvent ? 0.2 : 0.15));
    
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayLength = raysRadius * (0.8 + Math.sin(animationTime * 0.003 + i) * 0.2);
      
      ctx.strokeStyle = color + Math.floor(raysOpacity * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(
        center + Math.cos(angle) * rayLength,
        center + Math.sin(angle) * rayLength
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderOrbitalRings(
    ctx: CanvasRenderingContext2D, 
    center: number, 
    finalRadius: number, 
    color: string, 
    orbitalPhase: number, 
    isSelected: boolean, 
    isHovered: boolean
  ): void {
    if (!isSelected && !isHovered) return;
    
    const orbitalRingsDef: OrbitalRingDefinition[] = isSelected ? [
      { radius: finalRadius * 8, opacity: 0.8, speed: 1, width: 2 },
      { radius: finalRadius * 6.5, opacity: 0.6, speed: -0.7, width: 1.5 },
    ] : [
      { radius: finalRadius * 6, opacity: 0.4, speed: 0.8, width: 1 },
    ];
    
    orbitalRingsDef.forEach((ring, index) => {
      ctx.save();
      const ringPhase = orbitalPhase * ring.speed + index * Math.PI;
      const ringOpacity = ring.opacity * (0.7 + Math.sin(ringPhase * 2) * 0.3);
      const ringRadius = ring.radius * (0.9 + Math.sin(ringPhase * 1.5) * 0.1);
      
      ctx.strokeStyle = color + Math.floor(ringOpacity * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = ring.width;
      ctx.setLineDash([3, 2]);
      ctx.lineDashOffset = ringPhase * 10;
      ctx.beginPath();
      ctx.arc(center, center, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  private renderStarShape(
    ctx: CanvasRenderingContext2D, 
    center: number, 
    finalRadius: number, 
    color: string, 
    starType: StarType, 
    shimmerPhase: number, 
    animationTime: number
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    
    const shimmerBrightness = 1 + shimmerPhase * 0.3;
    ctx.filter = `brightness(${shimmerBrightness}) drop-shadow(0 0 ${finalRadius * 0.5}px ${color})`;
    
    switch (starType) {
      case 'point':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(center, center, finalRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'classic':
        this.drawStar(ctx, center, center, 5, finalRadius * 2, finalRadius * 1, color);
        break;
        
      case 'sparkle':
        this.drawStar(ctx, center, center, 4, finalRadius * 1.8, finalRadius * 0.8, color);
        this.drawSparkleLines(ctx, center, finalRadius, color, shimmerPhase);
        break;
        
      case 'refraction':
        this.drawRefractionStar(ctx, center, finalRadius, color, animationTime);
        break;
        
      case 'halo':
        this.drawHaloStar(ctx, center, finalRadius, color, animationTime);
        break;
        
      default: // 'subtle'
        this.drawSubtleStar(ctx, center, finalRadius, color, shimmerPhase);
        break;
    }
    
    ctx.restore();
  }

  private renderKeyEventGlow(
    ctx: CanvasRenderingContext2D, 
    center: number, 
    finalRadius: number, 
    color: string, 
    animationTime: number, 
    isKeyEvent: boolean
  ): void {
    if (!isKeyEvent) return;
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const pulsePhase = Math.sin(animationTime * 0.002);
    const glowRadius = finalRadius * (2.5 + pulsePhase * 0.7);
    const glowOpacity = 0.4 + pulsePhase * 0.2;
    
    const centerGlow = ctx.createRadialGradient(center, center, 0, center, center, glowRadius);
    centerGlow.addColorStop(0, color);
    centerGlow.addColorStop(0.3, color + Math.floor(glowOpacity * 255).toString(16).padStart(2, '0'));
    centerGlow.addColorStop(1, color + '00');
    ctx.fillStyle = centerGlow;
    ctx.beginPath();
    ctx.arc(center, center, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // === STAR SHAPE DRAWING METHODS ===
  private drawStar(
    ctx: CanvasRenderingContext2D, 
    cx: number, 
    cy: number, 
    spikes: number, 
    outerRadius: number, 
    innerRadius: number, 
    color: string
  ): void {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  private drawSparkleLines(
    ctx: CanvasRenderingContext2D, 
    center: number, 
    finalRadius: number, 
    color: string, 
    shimmerPhase: number
  ): void {
    const crossOpacity = 0.4 + shimmerPhase * 0.6;
    ctx.strokeStyle = color + Math.floor(crossOpacity * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center - finalRadius * 3, center);
    ctx.lineTo(center + finalRadius * 3, center);
    ctx.moveTo(center, center - finalRadius * 3);
    ctx.lineTo(center, center + finalRadius * 3);
    ctx.stroke();
  }

  private drawRefractionStar(
    ctx: CanvasRenderingContext2D, 
    center: number, 
    finalRadius: number, 
    color: string, 
    animationTime: number
  ): void {
    // Central core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(center, center, finalRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Animated refraction lines
    const refractionOpacity = 0.2 + Math.sin(animationTime * 0.0025) * 0.4;
    ctx.strokeStyle = color + Math.floor(refractionOpacity * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center - finalRadius * 4, center);
    ctx.lineTo(center + finalRadius * 4, center);
    ctx.moveTo(center, center - finalRadius * 4);
    ctx.lineTo(center, center + finalRadius * 4);
    ctx.stroke();
    
    // Diagonal refraction lines
    const diagOpacity = refractionOpacity * 0.6;
    ctx.strokeStyle = color + Math.floor(diagOpacity * 255).toString(16).padStart(2, '0');
    ctx.beginPath();
    ctx.moveTo(center - finalRadius * 2.8, center - finalRadius * 2.8);
    ctx.lineTo(center + finalRadius * 2.8, center + finalRadius * 2.8);
    ctx.moveTo(center - finalRadius * 2.8, center + finalRadius * 2.8);
    ctx.lineTo(center + finalRadius * 2.8, center - finalRadius * 2.8);
    ctx.stroke();
  }

  private drawHaloStar(
    ctx: CanvasRenderingContext2D, 
    center: number, 
    finalRadius: number, 
    color: string, 
    animationTime: number
  ): void {
    const breathingPhase = Math.sin(animationTime * 0.0015);
    const haloRings = [
      { radius: finalRadius * (1.2 + breathingPhase * 0.2), opacity: 1 },
      { radius: finalRadius * (2 + breathingPhase * 0.3), opacity: 0.6 },
      { radius: finalRadius * (2.8 + breathingPhase * 0.4), opacity: 0.3 },
      { radius: finalRadius * (3.6 + breathingPhase * 0.5), opacity: 0.15 }
    ];
    
    haloRings.forEach(ring => {
      const ringOpacity = ring.opacity * (0.4 + breathingPhase * 0.2);
      ctx.fillStyle = color + Math.floor(ringOpacity * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(center, center, ring.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawSubtleStar(
    ctx: CanvasRenderingContext2D, 
    center: number, 
    finalRadius: number, 
    color: string, 
    shimmerPhase: number
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(center, center, finalRadius * 1.1, 0, Math.PI * 2);
    ctx.fill();
    
    const subtleOpacity = 0.6 + shimmerPhase * 0.4;
    ctx.strokeStyle = color + Math.floor(subtleOpacity * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(center - finalRadius * 2.5, center);
    ctx.lineTo(center + finalRadius * 2.5, center);
    ctx.moveTo(center, center - finalRadius * 2.5);
    ctx.lineTo(center, center + finalRadius * 2.5);
    ctx.stroke();
  }

  // === CLEANUP ===
  public clearCache(): void {
    this.textureCache.forEach(texture => {
      if (texture.dispose) texture.dispose();
    });
    this.textureCache.clear();
  }

  public dispose(): void {
    this.clearCache();
    this.canvasPool.length = 0;
    console.log('[StarTextureFactory] Disposed');
  }
}