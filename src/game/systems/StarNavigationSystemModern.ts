import * as THREE from 'three';
import { BaseLevelGenerator, type LevelGeneratorDependencies } from '../interfaces/ILevelGenerator';
import { InteractionType } from '../../engine/interfaces/InteractableObject';
import { 
  constellationConfig, 
  constellationPatterns, 
  connectionPatterns, 
  eraColorMap, 
  colorSpectrum, 
  starTypes 
} from '../../config/timelineconfig';
import { getSharedStarAtlas } from '../../utils/StarTextureAtlas';

// Load star map config asynchronously (kept for compatibility)
const loadStarMapConfig = async () => {
  // Configuration is now embedded above for better performance
  return true;
};

// Advanced star texture utilities
const hashCode = (str: string): number => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getSizeFactor = (keyEvent: boolean): number => {
  return keyEvent ? 1.2 : 0.85 + (Math.random() * 0.3);
};

const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string) => {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
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
  ctx.fill();
};


const getStarColor = (id: string, currentEra?: string, shouldUseEraColors?: boolean): string => {
  if (shouldUseEraColors && currentEra && eraColorMap[currentEra]) {
    return eraColorMap[currentEra];
  }
  const hash = hashCode(id);
  return colorSpectrum[hash % colorSpectrum.length];
};

const getStarType = (id: string, keyEvent: boolean): string => {
  const hash = hashCode(id);
  if (keyEvent) {
    return ['classic', 'sparkle', 'refraction', 'halo'][hash % 4];
  }
  return starTypes[hash % starTypes.length];
};

// Advanced star texture creation function
const loadStarTexture = async (THREE: any, era: string, eventId: string, isKeyEvent: boolean = false) => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const center = size / 2;
  const color = getStarColor(eventId, era, true);
  const starType = getStarType(eventId, isKeyEvent);
  const baseRadius = isKeyEvent ? size * 0.04 : size * 0.03;
  const sizeFactor = getSizeFactor(isKeyEvent);
  const finalRadius = baseRadius * sizeFactor;
  
  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  
  // Animation calculations
  const time = Date.now() + hashCode(eventId);
  const glowPhase = (Math.sin(time * 0.0002) + 1) / 2;
  const shimmerPhase = (Math.sin(time * 0.0003) + 1) / 2;
  
  // Multi-layer glow
  const glowLayers = [
    { radius: finalRadius * 6.0, opacity: 0.10 + glowPhase * 0.05, blur: 30 },
    { radius: finalRadius * 4.5, opacity: 0.15 + glowPhase * 0.06, blur: 25 },
    { radius: finalRadius * 3.5, opacity: 0.20 + glowPhase * 0.08, blur: 20 },
    { radius: finalRadius * 2.5, opacity: 0.30 + glowPhase * 0.10, blur: 15 },
    { radius: finalRadius * 1.8, opacity: 0.50 + glowPhase * 0.15, blur: 10 },
    { radius: finalRadius * 1.2, opacity: 0.80 + glowPhase * 0.20, blur: 5 },
  ];
  
  const hueShift = Math.sin(time * 0.00015) * 20;
  const brightness = 1 + Math.sin(time * 0.00025) * 0.15;
  
  glowLayers.forEach((layer, index) => {
    ctx.save();
    ctx.filter = `blur(${layer.blur}px) hue-rotate(${hueShift * (index / glowLayers.length)}deg) brightness(${brightness})`;
    
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
  
  // Light rays for key events
  if (isKeyEvent) {
    ctx.save();
    const raysRadius = finalRadius * 10;
    const rayCount = 12;
    
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + (hashCode(eventId) % 100 / 100) * Math.PI;
      const twinkleTime = time * 0.0008 + i * 0.5 + (hashCode(eventId) % 100);
      const rayLength = raysRadius * (0.7 + Math.sin(twinkleTime) * 0.3);
      const rayOpacity = 0.2 * (0.5 + (Math.sin(twinkleTime * 1.5) + 1) / 2 * 0.5);

      ctx.strokeStyle = color + Math.floor(rayOpacity * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 1.5 + Math.sin(twinkleTime * 0.7) * 1;
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
  
  // Main star shape
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
      drawStar(ctx, center, center, 5, finalRadius * 2, finalRadius * 1, color);
      break;
      
    case 'sparkle':
      drawStar(ctx, center, center, 4, finalRadius * 1.8, finalRadius * 0.8, color);
      break;
      
    case 'refraction':
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(center, center, finalRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'halo':
      ctx.strokeStyle = color;
      ctx.lineWidth = finalRadius * 0.3;
      ctx.beginPath();
      ctx.arc(center, center, finalRadius * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(center, center, finalRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    default: // subtle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(center, center, finalRadius, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  
  ctx.restore();
  
  return new THREE.CanvasTexture(canvas);
};
import type { StarData } from '../state/GameState';

/**
 * Handles star navigation and interaction for the Observatory
 * Now uses standardized interface and is self-sufficient via event bus
 */
export class StarNavigationSystemModern extends BaseLevelGenerator {
  // Star system
  private starGroup: THREE.Group | null = null;
  private starSprites: Map<string, THREE.Sprite> = new Map();
  private timelineEvents: any[] = [];
  
  // TIER 2: Texture Atlas System
  private starTextureAtlas: any = null;
  private starAtlasTexture: THREE.Texture | null = null;
  
  // Selection state
  private selectedStar: StarData | null = null;
  private hoveredStarSprite: THREE.Sprite | null = null;
  private onStarSelectedCallback?: (star: StarData | null) => void;
  
  // Optimization
  private isMobile: boolean = false;
  private optimizationLevel: string;
  
  // Configuration - matching original StarVisuals
  private readonly starDistance = 990; // Just slightly inside skybox (1000) for perfect sync
  private readonly starSize = 20; // Base size for regular stars
  private readonly constellationLineOpacity = 0.05; // Control the opacity of constellation lines here
  
  // Event handlers that need to be stored for proper cleanup
  private handleUIClearAll: () => void;
  
  constructor(dependencies: LevelGeneratorDependencies) {
    super(dependencies);
    
    if (!dependencies.engine) {
      throw new Error('StarNavigationSystemModern requires engine dependency');
    }
    
    const optimizationManager = dependencies.engine.getOptimizationManager();
    this.isMobile = optimizationManager?.getDeviceCapabilities()?.isMobile || false;
    this.optimizationLevel = optimizationManager?.getOptimizationLevel() || 'high';
    
    // Set up event handlers
    this.handleUIClearAll = this.clearSelection.bind(this);
    
    console.log('⭐ StarNavigationSystemModern created with standardized interface');
  }
  
  public async initialize(config?: any): Promise<void> {
    try {
      console.log('⭐ Initializing Star Navigation System...');
      console.log(`   - Optimization Level: ${this.optimizationLevel} (isMobile: ${this.isMobile})`);
      
      // Load star map configuration
      await loadStarMapConfig();
      
      // TIER 2: Initialize shared texture atlas
      try {
        this.starTextureAtlas = getSharedStarAtlas();
        this.starAtlasTexture = this.starTextureAtlas.generateAtlas();
        console.log('⭐ StarNavigationSystem: Texture atlas initialized');
      } catch (error) {
        console.warn('⭐ StarNavigationSystem: Failed to initialize texture atlas, falling back to individual textures:', error);
      }
      
      // Set up simple event listeners (only background clicks)
      this.setupEventListeners();
      
      // Get timeline events from GameStateManager (already loaded by GameManager from Astro)
      // Listen for game state changes to detect when timeline events are loaded
      this.dependencies.eventBus.on('game.state.changed', (data: any) => {
        if (data.newState && data.newState.timelineEvents) {
          const newEvents = data.newState.timelineEvents;
          if (newEvents.length > 0 && newEvents.length !== this.timelineEvents.length) {
            this.timelineEvents = newEvents;
            console.log(`⭐ Received ${this.timelineEvents.length} timeline events from GameStateManager`);
            // Recreate stars when timeline events are available
            this.recreateStarSystem();
          }
        }
      });
      
      // Timeline events will be loaded asynchronously by GameManager
      console.log('⭐ StarNavigationSystem waiting for timeline events from GameStateManager...');
      
      await this.createStarSystem();
      await this.setupInteractions();
      
      // Set up mouse interaction for star clicking
      this.setupMouseInteraction();
      
      console.log('✅ Star Navigation System initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Star Navigation System:', error);
      throw error;
    }
  }
  
  public update(deltaTime: number, camera?: THREE.Camera): void {
    try {
      // Update star animations and effects
      this.updateStarEffects(deltaTime);
      
      // Update selection highlight
      this.updateSelectionHighlight(deltaTime);
    } catch (error) {
      console.warn('StarNavigationSystem update error:', error);
    }
  }
  
  public dispose(): void {
    // Clean up event listeners
    this.dependencies.eventBus.off('ui.clear_all', this.handleUIClearAll);
    
    // Clean up three.js objects
    if (this.starGroup) {
      this.dependencies.levelGroup.remove(this.starGroup);
      this.starGroup = null;
    }
    
    this.starSprites.clear();
    
    console.log('🧹 StarNavigationSystemModern disposed');
  }
  
  // Simple event listeners - only for background clicks
  private setupEventListeners(): void {
    console.log('⭐ Setting up StarNavigationSystem event listeners...');
    
    // Listen for UI clear events
    this.dependencies.eventBus.on('ui.clear_all', this.handleUIClearAll);
    
    // Listen for background clicks to dismiss timeline cards
    this.dependencies.eventBus.on('interaction.background.click', () => {
      if (this.selectedStar) {
        // Emit deselection event
        this.dependencies.eventBus.emit('starmap.star.deselected', {
          eventData: this.selectedStar
        });
        
        this.selectedStar = null;
        this.onStarSelectedCallback?.(null);
        console.log('⭐ Star deselected via background click');
      }
    });
  }
  
  
  public onStarSelected(callback: (star: StarData | null) => void): void {
    this.onStarSelectedCallback = callback;
  }
  
  private clearSelection(): void {
    this.selectedStar = null;
    this.hoveredStarSprite = null;
    this.onStarSelectedCallback?.(null);
  }
  
  private async createStarSystem(): Promise<void> {
    this.starGroup = new this.dependencies.THREE.Group();
    this.starGroup.name = 'StarNavigationSystem';
    
    // Create stars based on timeline events
    await this.createStars();
    
    // Create constellation lines
    await this.createConstellationLines();
    
    this.dependencies.levelGroup.add(this.starGroup);
    console.log('⭐ Star system created');
  }
  
  private async recreateStarSystem(): Promise<void> {
    // Clear existing star system
    if (this.starGroup) {
      this.dependencies.levelGroup.remove(this.starGroup);
      this.starSprites.clear();
    }
    
    // Recreate with new timeline events
    await this.createStarSystem();
    await this.setupInteractions();
    
    console.log('⭐ Star system recreated with new timeline events');
  }
  
  private async createStars(): Promise<void> {
    // Group events by era for constellation-based positioning
    const eventsByEra: Record<string, any[]> = {};
    // Use ALL timeline events, not just key events, to create a complete star map
    const starEvents = this.timelineEvents;
    
    starEvents.forEach(event => {
      const era = event.era || 'unknown';
      if (!eventsByEra[era]) {
        eventsByEra[era] = [];
      }
      eventsByEra[era].push(event);
    });
    
    // Create stars using constellation positioning
    for (const [era, eraEvents] of Object.entries(eventsByEra)) {
      await this.createConstellationForEra(era, eraEvents);
    }
    
    console.log(`⭐ Created ${starEvents.length} stars in ${Object.keys(eventsByEra).length} constellations`);
  }
  
  private async createConstellationForEra(era: string, eraEvents: any[]): Promise<void> {
    const config = constellationConfig[era as keyof typeof constellationConfig];
    if (!config) {
      console.error(`No constellation config for era: ${era}`);
      return;
    }

    const pattern = constellationPatterns[config.pattern as keyof typeof constellationPatterns] || constellationPatterns.scattered;
    
    for (let eventIndex = 0; eventIndex < eraEvents.length; eventIndex++) {
      const event = eraEvents[eventIndex];
      
      // Get position within constellation pattern
      const patternIndex = eventIndex % pattern.length;
      const patternPosition = pattern[patternIndex];
      
      // Add some variation for events beyond the pattern length
      const extraVariation = eventIndex >= pattern.length ? 
        { azOffset: (Math.random() - 0.5) * 30, elOffset: (Math.random() - 0.5) * 20 } : 
        { azOffset: 0, elOffset: 0 };

      // Calculate final position using spherical coordinates
      const azimuthDeg = config.centerAzimuth + patternPosition.azOffset + extraVariation.azOffset;
      const elevationDeg = Math.max(30, Math.min(80, config.centerElevation + patternPosition.elOffset + extraVariation.elOffset));
      
      const azimuthRad = (azimuthDeg * Math.PI) / 180;
      const elevationRad = (elevationDeg * Math.PI) / 180;
      const polarAngleRad = Math.PI/2 - elevationRad;

      await this.createStarAtPosition(event, azimuthRad, polarAngleRad, era, eventIndex);
    }
  }
  
  private async createStarAtPosition(event: any, azimuthRad: number, polarAngleRad: number, era: string, eventIndex: number): Promise<void> {
    try {
      // Create unique star ID
      const uniqueStarId = `${event.slug || event.id}-${event.year}-${eventIndex}`;
      
      // TIER 2: Use shared texture atlas instead of individual texture generation
      let starTexture = this.starAtlasTexture;
      if (!starTexture) {
        // Fallback to individual texture generation if atlas not available
        starTexture = await loadStarTexture(
          this.dependencies.THREE,
          event.era || 'unknown',
          uniqueStarId,
          event.isKeyEvent || false
        );
      }
      
      // Get star color for tinting when using atlas
      const starColor = getStarColor(uniqueStarId, event.era, true);
      
      // Add brightness/saturation variance within constellation color theme
      let finalColor: any = starColor;
      if (this.starAtlasTexture) {
        const color = new this.dependencies.THREE.Color(starColor);
        const hash = hashCode(uniqueStarId);
        // Keep same hue but vary brightness and saturation for constellation unity
        const brightnessVariation = ((hash % 60) - 30) * 0.004; // ±0.12 brightness variation
        const saturationVariation = ((hash % 40) - 20) * 0.005; // ±0.1 saturation variation
        color.offsetHSL(0, saturationVariation, brightnessVariation); // No hue change
        finalColor = color;
      }
      
      const starMaterial = new this.dependencies.THREE.SpriteMaterial({
        map: starTexture,
        transparent: true,
        alphaTest: 0.01,
        blending: this.dependencies.THREE.AdditiveBlending,
        // Apply star color as tint when using atlas
        color: this.starAtlasTexture ? finalColor : 0xffffff
      });
      
      // Set initial UV coordinates for first frame if using atlas
      if (this.starAtlasTexture && this.starTextureAtlas && starMaterial.map) {
        const initialFrame = this.starTextureAtlas.getFrameUV(0);
        starMaterial.map.repeat.set(initialFrame.width, initialFrame.height);
        starMaterial.map.offset.set(initialFrame.u, initialFrame.v);
      }
      
      const star = new this.dependencies.THREE.Sprite(starMaterial);
      
      // Position star using proper spherical coordinates
      const radius = 995; // Slightly inside the skybox to avoid z-fighting
      star.position.setFromSphericalCoords(radius, polarAngleRad, azimuthRad);
      
      // Scale based on importance and add variation
      const baseScale = event.isKeyEvent ? 44 : 32;
      const scaleVariation = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2 multiplier
      star.scale.setScalar(baseScale * scaleVariation);
      
      // Store comprehensive event data for interaction
      const hash = hashCode(uniqueStarId);
      star.userData = {
        eventData: event,
        starId: uniqueStarId,
        era: era,
        isInteractable: true,
        isSelected: false,
        isHovered: false,
        animationStartTime: Date.now(),
        lastUpdateTime: Date.now(),
        // Add unique animation offset to stagger animations
        animationOffset: (hash % 1000) / 1000.0 // 0.0 to 1.0 offset
      };
      
      this.starSprites.set(uniqueStarId, star);
      this.starGroup?.add(star);
      
    } catch (error) {
      console.warn(`Failed to create star for event ${event.id}:`, error);
    }
  }
  
  // Legacy method - now unused but kept for compatibility
  private async createStar(event: any): Promise<void> {
    // This method is no longer used - stars are created via createConstellationForEra
    console.warn('createStar called - this should not happen with the new architecture');
  }
  
  private async createConstellationLines(): Promise<void> {
    // Create constellation connection lines using proper patterns with era-specific colors and dashed style
    
    // Group stars by era for constellation patterns
    const starsByEra: Record<string, THREE.Sprite[]> = {};
    this.starSprites.forEach((star, starId) => {
      const era = star.userData.era || 'unknown';
      if (!starsByEra[era]) {
        starsByEra[era] = [];
      }
      starsByEra[era].push(star);
    });
    
    let totalConnections = 0;
    
    // Create connections using defined constellation patterns - separate lines for each era
    try {
      Object.entries(starsByEra).forEach(([era, stars]) => {
        if (stars.length < 2) return;
        
        const config = constellationConfig[era as keyof typeof constellationConfig];
        if (!config) return;
        
        const connections = connectionPatterns[config.pattern as keyof typeof connectionPatterns] || connectionPatterns.scattered;
        const positions: number[] = [];
        
        // Create connections based on the pattern
        connections.forEach(([fromIndex, toIndex]) => {
          const star1 = stars[fromIndex];
          const star2 = stars[toIndex];
          
          if (star1 && star2) {
            positions.push(
              star1.position.x, star1.position.y, star1.position.z,
              star2.position.x, star2.position.y, star2.position.z
            );
          }
        });
        
        // If we have more stars than the pattern accounts for, connect them simply
        if (stars.length > connections.length) {
          for (let i = connections.length; i < stars.length - 1; i++) {
            const star1 = stars[i];
            const star2 = stars[i + 1];
            
            if (star1 && star2) {
              positions.push(
                star1.position.x, star1.position.y, star1.position.z,
                star2.position.x, star2.position.y, star2.position.z
              );
            }
          }
        }
        
        // Create era-specific dashed lines
        if (positions.length > 0) {
          const lineGeometry = new this.dependencies.THREE.BufferGeometry();
          lineGeometry.setAttribute('position', new this.dependencies.THREE.Float32BufferAttribute(positions, 3));
          
          // Get era color from centralized config with fallback
          const eraColor = eraColorMap[era] || '#6366f1';
          
          // Create LineDashedMaterial with era-specific color and dashed properties
          const lineMaterial = new this.dependencies.THREE.LineDashedMaterial({
            color: eraColor,
            transparent: true,
            opacity: 0.2, // Slightly higher than original for better visibility
            linewidth: 2,
            dashSize: 3,
            gapSize: 2
          });
          
          const constellationLine = new this.dependencies.THREE.LineSegments(lineGeometry, lineMaterial);
          
          // CRITICAL: Enable the dashing effect - this is required for LineDashedMaterial to work
          constellationLine.computeLineDistances();
          
          this.starGroup?.add(constellationLine);
          
          totalConnections += positions.length / 6;
          console.log(`⭐ Created ${positions.length / 6} constellation lines for era "${era}" with color ${eraColor}`);
        }
      });
    } catch (error) {
      console.warn('Error creating constellation lines:', error);
    }
    
    if (totalConnections > 0) {
      console.log(`⭐ Total constellation lines created: ${totalConnections} connections using proper patterns and era colors`);
    } else {
      console.log('⭐ No constellation lines to create');
    }
  }
  
  private async setupInteractions(): Promise<void> {
    // Register stars for interaction
    this.starSprites.forEach((star, starId) => {
      this.dependencies.interactionSystem.registerInteractable({
        id: `star-${starId}`,
        mesh: star,
        interactionRadius: this.starSize * 2,
        isInteractable: true,
        interactionType: InteractionType.CLICK,
        onInteract: (interactionData) => {
          this.handleStarClick(star, star.userData);
        },
        getInteractionPrompt: () => 'Click to view timeline event',
        getInteractionData: () => ({
          id: `star-${starId}`,
          name: star.userData.eventData?.title || 'Star',
          description: star.userData.eventData?.description || 'Timeline event',
          interactionType: InteractionType.CLICK,
          interactionRadius: this.starSize * 2,
          isInteractable: true,
          tags: ['star', 'timeline'],
          userData: star.userData
        })
      });
    });
    
    console.log('⭐ Star interactions set up');
  }
  
  private handleStarClick(star: THREE.Sprite, data: any): void {
    const eventData = data.eventData;
    
    if (eventData) {
      // Create complete star data package including uniqueId for GameReducer
      const completeStarData = {
        ...eventData,
        uniqueId: data.starId // Include the uniqueId that was generated when the star was created
      };
      
      this.selectedStar = completeStarData;
      this.onStarSelectedCallback?.(completeStarData);
      
      // Get screen position for timeline card placement
      const screenPosition = this.getScreenPosition(star);
      
      // Emit event for other systems with screen position
      this.dependencies.eventBus.emit('starmap.star.selected', {
        eventData: completeStarData,
        position: star.position,
        screenPosition: screenPosition,
        method: 'click'
      });
      
      console.log('⭐ Star selected:', completeStarData.title);
    }
  }
  
  private updateStarsWithTimelineData(): void {
    // Update existing stars when timeline data changes
    this.starSprites.forEach((star, starId) => {
      const eventData = this.timelineEvents.find(e => (e.id || e.uniqueId) === starId);
      if (eventData) {
        star.userData.eventData = eventData;
      }
    });
  }
  
  private updateStarEffects(deltaTime: number): void {
    // Only update if we have stars
    if (!this.starSprites || this.starSprites.size === 0) {
      return;
    }
    
    // TIER 2: Use texture atlas UV animation if available
    if (this.starTextureAtlas && this.starAtlasTexture) {
      const currentTime = Date.now();
      
      this.starSprites.forEach((star, starId) => {
        try {
          const userData = star.userData;
          if (!userData || !star.material) return;

          // Calculate animation frame with staggered timing for each star
          const baseTime = currentTime * 0.001; // Convert to seconds
          const animationSpeed = userData.eventData?.isKeyEvent ? 1.2 : 0.8; // Key events twinkle faster
          const staggerOffset = userData.animationOffset || 0; // Unique offset per star
          const adjustedTime = baseTime + (staggerOffset * 8); // Spread animations across 8 second range
          
          // Get current frame (0-15) from texture atlas
          const frameIndex = this.starTextureAtlas.getFrameForTime(adjustedTime, animationSpeed);
          const frameUV = this.starTextureAtlas.getFrameUV(frameIndex);

          // Update UV coordinates (no texture regeneration - just offset changes)
          if (star.material.map && star.material.map.repeat && star.material.map.offset) {
            star.material.map.repeat.set(frameUV.width, frameUV.height);
            star.material.map.offset.set(frameUV.u, frameUV.v);
            star.material.map.needsUpdate = true;
          }
        } catch (error) {
          console.warn('Error updating star atlas animation:', error);
        }
      });
    } else {
      // Fallback to opacity-based twinkling if atlas not available
      const time = Date.now() * 0.001;
      
      this.starSprites.forEach((star, starId) => {
        try {
          // Subtle twinkling effect - use safe starId access
          const idLength = typeof starId === 'string' ? starId.length : 1;
          const twinkle = Math.sin(time * 2 + idLength) * 0.1 + 0.9;
          if (star && star.material) {
            star.material.opacity = twinkle;
          }
        } catch (error) {
          console.warn('Error updating star effect:', error);
        }
      });
    }
  }
  
  private updateSelectionHighlight(deltaTime: number): void {
    // Update selection highlight effects
    if (this.selectedStar) {
      const selectedSprite = this.starSprites.get((this.selectedStar as any).id || (this.selectedStar as any).uniqueId);
      if (selectedSprite) {
        const time = Date.now() * 0.001;
        const pulse = Math.sin(time * 4) * 0.2 + 1.2;
        selectedSprite.scale.setScalar(this.starSize * pulse);
      }
    }
  }
  
  /**
   * Get screen position of 3D object for timeline card placement
   */
  private getScreenPosition(object3D: THREE.Object3D): { x: number; y: number; isInFront: boolean } {
    const container = this.dependencies.gameContainer;
    const camera = this.dependencies.camera;
    const vector = new this.dependencies.THREE.Vector3();
    
    vector.setFromMatrixPosition(object3D.matrixWorld);
    vector.project(camera);
    
    const widthHalf = container.clientWidth / 2;
    const heightHalf = container.clientHeight / 2;
    
    return {
      x: (vector.x * widthHalf) + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf,
      isInFront: vector.z < 1 // Check if object is in front of camera
    };
  }
  
  /**
   * Setup mouse interaction for star selection
   */
  private setupMouseInteraction(): void {
    // Mouse interaction for star selection is handled through the InteractionSystem
    // Background clicks are handled through the event bus in setupEventListeners()
    console.log('⭐ Mouse interaction setup complete');
  }
}