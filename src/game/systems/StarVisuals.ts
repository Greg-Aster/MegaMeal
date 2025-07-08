// /src/game/StarVisuals.ts
// Star generation and visual effects system for Star Observatory
// Based on the advanced star rendering from StarMapView.astro

import type { TimelineEvent } from '../../services/TimelineService.client';

// Extended interface for game-specific star data
export interface StarData extends TimelineEvent {
  uniqueId?: string;
  mainColor?: string;
  starType?: string;
}

export class StarVisuals {
  private THREE: any;
  private scene: any;
  private starsGroup: any;
  private starSprites = new Map<string, any>();
  private orbitalRings = new Map<string, any[]>();
  
  // State
  private isInitialized = false;
  private selectedStar: any = null;
  private hoveredStar: any = null;
  private animationStartTime = Date.now();
  
  // Callbacks
  private onStarSelectedCallback?: (starData: StarData) => void;
  
  // Visual configuration
  private readonly eraColorMap = {
    'ancient-epoch': '#3b82f6',
    'awakening-era': '#8b5cf6',
    'golden-age': '#6366f1',
    'conflict-epoch': '#ec4899',
    'singularity-conflict': '#ef4444',
    'transcendent-age': '#14b8a6',
    'final-epoch': '#22c55e',
    'unknown': '#6366f1'
  };

  private readonly colorSpectrum = [
    '#ef4444', '#f43f5e', '#f97316', '#f59e0b', '#eab308', '#facc15',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  ];

  private readonly starTypes = ['point', 'classic', 'sparkle', 'refraction', 'halo', 'subtle'];

  // Constellation configuration
  private readonly constellationConfig = {
    'ancient-epoch': { centerAzimuth: 0, centerElevation: 45, spread: 40, pattern: 'ancient_wisdom' },
    'awakening-era': { centerAzimuth: 60, centerElevation: 50, spread: 35, pattern: 'rising_dawn' },
    'golden-age': { centerAzimuth: 120, centerElevation: 55, spread: 45, pattern: 'crown' },
    'conflict-epoch': { centerAzimuth: 180, centerElevation: 40, spread: 40, pattern: 'crossed_swords' },
    'singularity-conflict': { centerAzimuth: 240, centerElevation: 45, spread: 35, pattern: 'supernova' },
    'transcendent-age': { centerAzimuth: 300, centerElevation: 60, spread: 40, pattern: 'ascension' },
    'final-epoch': { centerAzimuth: 340, centerElevation: 65, spread: 30, pattern: 'omega' },
    'wip': { centerAzimuth: 90, centerElevation: 30, spread: 20, pattern: 'scattered' },
    'neo-sensoria': { centerAzimuth: 150, centerElevation: 70, spread: 35, pattern: 'crown' },
    'the-dark-between': { centerAzimuth: 270, centerElevation: 25, spread: 30, pattern: 'scattered' },
    'preservation-era': { centerAzimuth: 210, centerElevation: 50, spread: 40, pattern: 'ascension' },
    'unknown': { centerAzimuth: 30, centerElevation: 35, spread: 25, pattern: 'scattered' }
  };

  private readonly constellationPatterns = {
    ancient_wisdom: [ { azOffset: 0, elOffset: 0 }, { azOffset: -15, elOffset: 10 }, { azOffset: 15, elOffset: 8 }, { azOffset: -8, elOffset: -12 }, { azOffset: 12, elOffset: -10 }, { azOffset: 0, elOffset: 20 }, { azOffset: -20, elOffset: -5 }, { azOffset: 25, elOffset: -8 } ],
    rising_dawn: [ { azOffset: -10, elOffset: -15 }, { azOffset: 0, elOffset: 0 }, { azOffset: 10, elOffset: 15 }, { azOffset: -5, elOffset: 8 }, { azOffset: 5, elOffset: 8 }, { azOffset: 15, elOffset: 25 }, { azOffset: -15, elOffset: 20 } ],
    crown: [ { azOffset: 0, elOffset: 15 }, { azOffset: -12, elOffset: 8 }, { azOffset: 12, elOffset: 8 }, { azOffset: -6, elOffset: 0 }, { azOffset: 6, elOffset: 0 }, { azOffset: -20, elOffset: -5 }, { azOffset: 20, elOffset: -5 }, { azOffset: 0, elOffset: -10 } ],
    crossed_swords: [ { azOffset: -15, elOffset: 15 }, { azOffset: 15, elOffset: -15 }, { azOffset: 15, elOffset: 15 }, { azOffset: -15, elOffset: -15 }, { azOffset: 0, elOffset: 0 }, { azOffset: -25, elOffset: 10 }, { azOffset: 25, elOffset: -10 } ],
    supernova: [ { azOffset: 0, elOffset: 0 }, { azOffset: 0, elOffset: 20 }, { azOffset: 17, elOffset: 10 }, { azOffset: 20, elOffset: 0 }, { azOffset: 17, elOffset: -10 }, { azOffset: 0, elOffset: -20 }, { azOffset: -17, elOffset: -10 }, { azOffset: -20, elOffset: 0 }, { azOffset: -17, elOffset: 10 } ],
    ascension: [ { azOffset: 0, elOffset: 25 }, { azOffset: -8, elOffset: 15 }, { azOffset: 8, elOffset: 15 }, { azOffset: -15, elOffset: 5 }, { azOffset: 15, elOffset: 5 }, { azOffset: -20, elOffset: -10 }, { azOffset: 20, elOffset: -10 }, { azOffset: 0, elOffset: -5 } ],
    omega: [ { azOffset: -10, elOffset: 10 }, { azOffset: 10, elOffset: 10 }, { azOffset: -15, elOffset: 0 }, { azOffset: 15, elOffset: 0 }, { azOffset: -8, elOffset: -10 }, { azOffset: 8, elOffset: -10 }, { azOffset: 0, elOffset: 5 } ],
    scattered: [ { azOffset: 5, elOffset: 8 }, { azOffset: -12, elOffset: -5 }, { azOffset: 18, elOffset: 12 }, { azOffset: -8, elOffset: 15 }, { azOffset: 10, elOffset: -10 }, { azOffset: -15, elOffset: 3 } ]
  };

  // Timeline data from the real service
  private timelineEvents: StarData[] = [];
  private isDataLoaded = false;

  constructor(THREE: any, scene: any) {
    this.THREE = THREE;
    this.scene = scene;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('StarVisuals already initialized');
      return;
    }

    this.setupStarsGroup();
    await this.loadTimelineData();
    await this.createStars();
    
    this.isInitialized = true;
  }

  private setupStarsGroup(): void {
    this.starsGroup = new this.THREE.Group();
    this.scene.add(this.starsGroup);
  }

  public setTimelineEvents(events: StarData[]): void {
    if (Array.isArray(events) && events.length > 0) {
      this.timelineEvents = events;
      this.isDataLoaded = true;
      console.log(`Set ${this.timelineEvents.length} timeline events from external source`);
    } else {
      console.warn('Invalid timeline events provided, using fallback data');
      this.setFallbackData();
    }
  }

  private setFallbackData(): void {
    this.timelineEvents = [
      { slug: 'first-light', title: 'First Light', year: 1, description: 'The dawn of a new era begins here in the depths of space.', era: 'awakening-era', isKeyEvent: true },
      { slug: 'golden-age-start', title: 'Golden Age Begins', year: 1000, description: 'A millennium of prosperity unfolds across the stars.', era: 'golden-age', isKeyEvent: false },
      { slug: 'great-discovery', title: 'The Great Discovery', year: 2500, description: 'A momentous scientific breakthrough changes everything.', era: 'golden-age', isKeyEvent: true },
      { slug: 'temporal-rift', title: 'Temporal Rift', year: 3200, description: 'Time itself begins to fracture.', era: 'conflict-epoch', isKeyEvent: false },
      { slug: 'singularity', title: 'The Singularity', year: 4500, description: 'A pivotal moment where reality bends.', era: 'singularity-conflict', isKeyEvent: true },
      { slug: 'consciousness-emergence', title: 'Consciousness Emerges', year: 5800, description: 'New forms of awareness arise.', era: 'transcendent-age', isKeyEvent: false },
      { slug: 'transcendence', title: 'Transcendence', year: 7000, description: 'Beyond the physical realm we ascend.', era: 'transcendent-age', isKeyEvent: true },
      { slug: 'cosmic-harmony', title: 'Cosmic Harmony', year: 8500, description: 'All things find their balance.', era: 'transcendent-age', isKeyEvent: false },
      { slug: 'final-words', title: 'The Final Message', year: 9999, description: 'An echo from the end of time itself.', era: 'final-epoch', isKeyEvent: true }
    ];
    this.isDataLoaded = true;
  }

  private async loadTimelineData(): Promise<void> {
    if (this.isDataLoaded) {
      return;
    }

    console.log('No timeline events set, using fallback data');
    this.setFallbackData();
  }

  private async createStars(): Promise<void> {
    if (!this.starsGroup || !this.THREE) {
      console.warn('StarVisuals: createStars called before initialization.');
      return;
    }

    // Clear existing stars and orbital rings
    while (this.starsGroup.children.length > 0) {
      this.starsGroup.remove(this.starsGroup.children[0]);
    }
    this.starSprites.clear();
    this.orbitalRings.clear();
    
    // Group events by era
    const eventsByEra: { [key: string]: StarData[] } = {};
    const unassignedEvents: StarData[] = [];
    
    this.timelineEvents.forEach(event => {
      const era = event.era || 'unknown';
      
      if (!this.constellationConfig[era as keyof typeof this.constellationConfig]) {
        console.warn(`Event "${event.title}" has era "${era}" but no constellation config exists. Adding to 'unknown'.`);
        unassignedEvents.push(event);
        if (!eventsByEra['unknown']) {
          eventsByEra['unknown'] = [];
        }
        eventsByEra['unknown'].push(event);
        return;
      }
      
      if (!eventsByEra[era]) {
        eventsByEra[era] = [];
      }
      eventsByEra[era].push(event);
    });

    console.log(`Starmap: Processing ${Object.keys(eventsByEra).length} eras with ${this.timelineEvents.length} total events`);

    let starCount = 0;
    // Create constellations for each era
    Object.entries(eventsByEra).forEach(([era, eraEvents]) => {
      const config = this.constellationConfig[era as keyof typeof this.constellationConfig];
      if (!config) {
        console.error(`No constellation config for era: ${era}`);
        return;
      }

      const pattern = this.constellationPatterns[config.pattern as keyof typeof this.constellationPatterns] || this.constellationPatterns.scattered;
      
      eraEvents.forEach((event, eventIndex) => {
        try {
          // Get position within constellation pattern
          const patternIndex = eventIndex % pattern.length;
          const patternPosition = pattern[patternIndex];
          
          // Add some variation for events beyond the pattern length
          const extraVariation = eventIndex >= pattern.length ? 
            { azOffset: (Math.random() - 0.5) * 30, elOffset: (Math.random() - 0.5) * 20 } : 
            { azOffset: 0, elOffset: 0 };

          // Calculate final position
          const azimuthDeg = config.centerAzimuth + patternPosition.azOffset + extraVariation.azOffset;
          const elevationDeg = Math.max(30, Math.min(80, config.centerElevation + patternPosition.elOffset + extraVariation.elOffset));
          
          const azimuthRad = (azimuthDeg * Math.PI) / 180;
          const elevationRad = (elevationDeg * Math.PI) / 180;
          const polarAngleRad = Math.PI/2 - elevationRad;

          const uniqueStarId = `${event.slug}-${event.year}-${eventIndex}`;
          const mainColor = this.getStarColor(uniqueStarId, event.era);
          const starType = this.getStarType(uniqueStarId, event.isKeyEvent);
          
          // Create advanced star sprite texture with initial state
          const starTexture = this.createAdvancedStarTexture(mainColor, starType, event.isKeyEvent, false, false, this.animationStartTime);
          const spriteMaterial = new this.THREE.SpriteMaterial({ 
            map: starTexture, 
            transparent: true,
            alphaTest: 0.01,
            blending: this.THREE.AdditiveBlending
          });
          
          const sprite = new this.THREE.Sprite(spriteMaterial);
          
          // Position very close to skybox for realistic night sky parallax
          const radius = 990; // Just slightly inside skybox (1000) for perfect sync
          sprite.position.setFromSphericalCoords(radius, polarAngleRad, azimuthRad);
          
          // Scale based on importance and add slight variation (larger for interaction at distance)
          const baseScale = event.isKeyEvent ? 35 : 20; // Larger scale for better interaction at skybox distance
          const scaleVariation = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2 multiplier
          sprite.scale.setScalar(baseScale * scaleVariation);
          
          // Store event data and animation state on the sprite for interaction
          sprite.userData = {
            ...event,
            mainColor,
            starType,
            uniqueId: uniqueStarId,
            era: era,
            constellationPosition: patternPosition,
            isSelected: false,
            isHovered: false,
            animationStartTime: Date.now(),
            lastUpdateTime: Date.now()
          };
          
          this.starsGroup.add(sprite);
          this.starSprites.set(sprite.userData.uniqueId, sprite);
          starCount++;
          
          // Create orbital rings for this star
          const rings = this.createOrbitalRingsForStar(sprite, sprite.userData);
          rings.forEach(ring => this.starsGroup.add(ring));
          this.orbitalRings.set(event.slug, rings);
        } catch (error) {
          console.error(`Error creating star for event "${event.title}":`, error);
        }
      });
    });
    
    console.log(`Starmap: Created ${starCount} stars across ${Object.keys(eventsByEra).length} eras`);
    
    // Create constellation connecting lines
    this.createConstellationLines(eventsByEra);
  }

  private createConstellation(era: string, events: StarData[]): void {
    const config = this.constellationConfig[era as keyof typeof this.constellationConfig];
    if (!config) {
      console.error(`No constellation config for era: ${era}`);
      return;
    }

    const pattern = this.constellationPatterns[config.pattern as keyof typeof this.constellationPatterns] || this.constellationPatterns.scattered;
    
    events.forEach((event, eventIndex) => {
      try {
        // Get position within constellation pattern
        const patternIndex = eventIndex % pattern.length;
        const patternPosition = pattern[patternIndex];
        
        // Add variation for events beyond pattern length
        const extraVariation = eventIndex >= pattern.length ? 
          { azOffset: (Math.random() - 0.5) * 30, elOffset: (Math.random() - 0.5) * 20 } : 
          { azOffset: 0, elOffset: 0 };

        // Calculate final position
        const azimuthDeg = config.centerAzimuth + patternPosition.azOffset + extraVariation.azOffset;
        const elevationDeg = Math.max(30, Math.min(80, config.centerElevation + patternPosition.elOffset + extraVariation.elOffset));
        
        const azimuthRad = (azimuthDeg * Math.PI) / 180;
        const elevationRad = (elevationDeg * Math.PI) / 180;
        const polarAngleRad = Math.PI/2 - elevationRad;

        // Create star
        const star = this.createStar(event, eventIndex, azimuthRad, polarAngleRad);
        this.starsGroup.add(star);
        
      } catch (error) {
        console.error(`Error creating star for event "${event.title}":`, error);
      }
    });
  }

  private createStar(event: StarData, index: number, azimuthRad: number, polarAngleRad: number): any {
    const uniqueStarId = `${event.slug}-${event.year}-${index}`;
    const mainColor = this.getStarColor(uniqueStarId, event.era);
    const starType = this.getStarType(uniqueStarId, event.isKeyEvent);
    
    // Create advanced star texture
    const starTexture = this.createAdvancedStarTexture(mainColor, starType, event.isKeyEvent, false, false, this.animationStartTime);
    const spriteMaterial = new this.THREE.SpriteMaterial({ 
      map: starTexture, 
      transparent: true,
      alphaTest: 0.01,
      blending: this.THREE.AdditiveBlending
    });
    
    const sprite = new this.THREE.Sprite(spriteMaterial);
    
    // Position very close to skybox for realistic night sky parallax
    const radius = 990; // Just slightly inside skybox (1000) for perfect sync
    sprite.position.setFromSphericalCoords(radius, polarAngleRad, azimuthRad);
    
    // Scale based on importance (larger for interaction at distance)
    const baseScale = event.isKeyEvent ? 35 : 20;
    const scaleVariation = 0.8 + (Math.random() * 0.4);
    sprite.scale.setScalar(baseScale * scaleVariation);
    
    // Store event data
    sprite.userData = {
      ...event,
      mainColor,
      starType,
      uniqueId: uniqueStarId,
      era: event.era,
      isSelected: false,
      isHovered: false,
      animationStartTime: Date.now(),
      lastUpdateTime: Date.now()
    };
    
    this.starSprites.set(uniqueStarId, sprite);
    
    return sprite;
  }

  // Create connecting lines between stars in the same constellation
  private createConstellationLines(eventsByEra: { [key: string]: StarData[] }): void {
    Object.entries(eventsByEra).forEach(([era, eraEvents]) => {
      if (eraEvents.length < 2) return;
      
      const config = this.constellationConfig[era as keyof typeof this.constellationConfig];
      if (!config) {
        console.warn(`No constellation config found for era: ${era}`);
        return;
      }
      
      // Define constellation connection patterns for each type
      const connectionPatterns: { [key: string]: number[][] } = {
        ancient_wisdom: [[0,1], [0,2], [1,5], [2,5], [0,3], [0,4]], // Star formation
        rising_dawn: [[0,1], [1,2], [1,3], [1,4], [2,5], [2,6]], // Rising pattern
        crown: [[0,1], [0,2], [1,3], [2,4], [3,7], [4,7], [5,6]], // Crown shape
        crossed_swords: [[0,1], [2,3]], // Simpler X pattern for 4 stars
        supernova: [[0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [0,7], [0,8]], // Radial
        ascension: [[0,1], [0,2], [1,3], [2,4], [3,5], [4,6], [7,1], [7,2]], // Ascending
        omega: [[0,1], [2,3], [4,5], [0,6], [1,6], [2,4], [3,5]], // Omega shape
        scattered: [[0,1], [1,2], [2,3]] // Simple connections
      };
      
      const connections = connectionPatterns[config.pattern] || connectionPatterns.scattered;
      const linePositions: any[] = [];
      
      connections.forEach(([startIdx, endIdx]) => {
        if (startIdx < eraEvents.length && endIdx < eraEvents.length) {
          const startEventData = eraEvents[startIdx];
          const endEventData = eraEvents[endIdx];
          
          // Construct unique IDs to fetch sprites
          const startUniqueId = `${startEventData.slug}-${startEventData.year}-${startIdx}`;
          const endUniqueId = `${endEventData.slug}-${endEventData.year}-${endIdx}`;
          
          const startSprite = this.starSprites.get(startUniqueId);
          const endSprite = this.starSprites.get(endUniqueId);
          
          if (startSprite && endSprite) {
            linePositions.push(startSprite.position.clone());
            linePositions.push(endSprite.position.clone());
          }
        }
      });
      
      if (linePositions.length > 0) {
        const lineGeometry = new this.THREE.BufferGeometry().setFromPoints(linePositions);
        
        // Create dashed line material for better constellation visibility
        const lineMaterial = new this.THREE.LineDashedMaterial({ 
          color: this.eraColorMap[era as keyof typeof this.eraColorMap] || '#6366f1',
          transparent: true,
          opacity: 0.2,
          linewidth: 2,
          dashSize: 3,
          gapSize: 2
        });
        
        const constellationLine = new this.THREE.LineSegments(lineGeometry, lineMaterial);
        constellationLine.computeLineDistances(); // Required for dashed lines
        this.starsGroup.add(constellationLine);
      }
    });
  }

  // Utility functions from StarMapView
  private hashCode(str: string): number {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private getStarColor(id: string, era: string): string {
    if (era && this.eraColorMap[era as keyof typeof this.eraColorMap]) {
      return this.eraColorMap[era as keyof typeof this.eraColorMap];
    }
    const hash = this.hashCode(id);
    return this.colorSpectrum[hash % this.colorSpectrum.length];
  }

  private getStarType(id: string, keyEvent: boolean): string {
    const hash = this.hashCode(id);
    if (keyEvent) {
      return ['classic', 'sparkle', 'refraction', 'halo'][hash % 4];
    }
    return this.starTypes[hash % this.starTypes.length];
  }

  private getSizeFactor(keyEvent: boolean): number {
    return keyEvent ? 1.2 : 0.85 + (Math.random() * 0.3);
  }

  // Advanced star texture creation (simplified from StarMapView)
  private createAdvancedStarTexture(color: string, starType: string, isKeyEvent = false, isSelected = false, isHovered = false, animationTime = 0, size = 512): any {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    const center = size / 2;
    const baseRadius = isKeyEvent ? size * 0.04 : size * 0.03;
    const sizeFactor = this.getSizeFactor(isKeyEvent);
    const finalRadius = baseRadius * sizeFactor;
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Animation calculations
    const glowPhase = (Math.sin(animationTime * 0.0008) + 1) / 2;
    const shimmerPhase = (Math.sin(animationTime * 0.001) + 1) / 2;
    
    // Multi-layer glow
    const glowLayers = [
      { radius: finalRadius * 20, opacity: 0.02 + glowPhase * 0.01, blur: 30 },
      { radius: finalRadius * 15, opacity: 0.04 + glowPhase * 0.02, blur: 25 },
      { radius: finalRadius * 12, opacity: 0.06 + glowPhase * 0.03, blur: 20 },
      { radius: finalRadius * 8, opacity: 0.1 + glowPhase * 0.05, blur: 15 },
      { radius: finalRadius * 5, opacity: 0.15 + glowPhase * 0.08, blur: 10 },
      { radius: finalRadius * 3, opacity: 0.25 + glowPhase * 0.1, blur: 5 },
    ];
    
    // Color shifting
    const hueShift = Math.sin(animationTime * 0.0004) * 20;
    const brightness = 1 + Math.sin(animationTime * 0.0006) * 0.15;
    
    glowLayers.forEach((layer, index) => {
      ctx.save();
      ctx.filter = `blur(${layer.blur}px) hue-rotate(${hueShift * (index + 1) / glowLayers.length}deg) brightness(${brightness})`;
      
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, layer.radius);
      const alpha = Math.floor(layer.opacity * 255).toString(16).padStart(2, '0');
      gradient.addColorStop(0, color + alpha);
      gradient.addColorStop(0.5, color + Math.floor(layer.opacity * 100).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, color + '00');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(center, center, layer.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    
    // Main star core
    ctx.save();
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
        break;
        
      case 'refraction':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(center, center, finalRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add cross lines
        const opacity = 0.2 + Math.sin(animationTime * 0.0025) * 0.4;
        ctx.strokeStyle = color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center - finalRadius * 4, center);
        ctx.lineTo(center + finalRadius * 4, center);
        ctx.moveTo(center, center - finalRadius * 4);
        ctx.lineTo(center, center + finalRadius * 4);
        ctx.stroke();
        break;
        
      case 'halo':
        const breathingPhase = Math.sin(animationTime * 0.0015);
        const haloRings = [
          { radius: finalRadius * (1.2 + breathingPhase * 0.2), opacity: 1 },
          { radius: finalRadius * (2 + breathingPhase * 0.3), opacity: 0.6 },
          { radius: finalRadius * (2.8 + breathingPhase * 0.4), opacity: 0.3 }
        ];
        
        haloRings.forEach(ring => {
          const ringOpacity = ring.opacity * (0.4 + breathingPhase * 0.2);
          ctx.fillStyle = color + Math.floor(ringOpacity * 255).toString(16).padStart(2, '0');
          ctx.beginPath();
          ctx.arc(center, center, ring.radius, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
        
      default: // subtle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(center, center, finalRadius * 1.1, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    
    ctx.restore();
    
    return new this.THREE.CanvasTexture(canvas);
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string): void {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      const x1 = cx + Math.cos(rot) * outerRadius;
      const y1 = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x1, y1);
      rot += step;
      
      const x2 = cx + Math.cos(rot) * innerRadius;
      const y2 = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x2, y2);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Interaction methods
  public checkIntersections(raycaster: any): any[] {
    if (!this.starsGroup) return [];
    
    const starArray = Array.from(this.starSprites.values());
    return raycaster.intersectObjects(starArray);
  }

  public handleStarClick(intersectedStar: any): void {
    if (!intersectedStar) {
      // Clicked empty space - deselect current star
      if (this.selectedStar) {
        this.selectedStar.userData.isSelected = false;
        this.updateOrbitalRingsForStar(this.selectedStar, this.selectedStar.userData);
        this.selectedStar = null;
        this.onStarSelectedCallback?.(null);
      }
      return;
    }

    const starData = intersectedStar.userData;
    
    // Deselect previous star
    if (this.selectedStar && this.selectedStar !== intersectedStar) {
      this.selectedStar.userData.isSelected = false;
      this.updateOrbitalRingsForStar(this.selectedStar, this.selectedStar.userData);
    }
    
    // Toggle selection
    if (this.selectedStar === intersectedStar) {
      // Deselect
      intersectedStar.userData.isSelected = false;
      this.updateOrbitalRingsForStar(intersectedStar, starData);
      this.selectedStar = null;
      this.onStarSelectedCallback?.(null);
    } else {
      // Select new star
      intersectedStar.userData.isSelected = true;
      this.updateOrbitalRingsForStar(intersectedStar, starData);
      this.selectedStar = intersectedStar;
      this.onStarSelectedCallback?.(starData);
    }
  }

  public handleStarHover(intersectedStar: any | null, isHovering: boolean): void {
    // Clear previous hover
    if (this.hoveredStar && this.hoveredStar !== intersectedStar) {
      this.hoveredStar.userData.isHovered = false;
    }
    
    // Set new hover
    if (intersectedStar && isHovering) {
      intersectedStar.userData.isHovered = true;
      this.hoveredStar = intersectedStar;
    } else {
      this.hoveredStar = null;
    }
  }

  // Update methods
  public update(): void {
    if (!this.isInitialized) return;
    
    this.updateStarAnimations();
    this.updateOrbitalRings();
  }

  private updateStarAnimations(): void {
    const currentTime = Date.now();
    
    // Update star animations less frequently for performance
    if (currentTime % 150 < 16) {
      this.starSprites.forEach((sprite) => {
        const userData = sprite.userData;
        if (!userData) return;
        
        const timeSinceCreation = currentTime - userData.animationStartTime;
        
        // Update texture less frequently
        if (currentTime - userData.lastUpdateTime > 150) {
          const newTexture = this.createAdvancedStarTexture(
            userData.mainColor,
            userData.starType,
            userData.isKeyEvent,
            userData.isSelected,
            userData.isHovered,
            timeSinceCreation
          );
          
          if (sprite.material && sprite.material.map) {
            sprite.material.map.dispose();
            sprite.material.map = newTexture;
            sprite.material.needsUpdate = true;
          }
          
          userData.lastUpdateTime = currentTime;
        }
      });
    }
  }

  // Getters
  public getStarSprites(): Map<string, any> {
    return this.starSprites;
  }

  public getSelectedStar(): any {
    return this.selectedStar;
  }

  public getStarsGroup(): any {
    return this.starsGroup;
  }

  public getTimelineEvents(): StarData[] {
    return this.timelineEvents;
  }

  public isTimelineDataLoaded(): boolean {
    return this.isDataLoaded;
  }

  // Event callbacks
  public onStarSelected(callback: (starData: StarData | null) => void): void {
    this.onStarSelectedCallback = callback;
  }

  // Cleanup
  private clearStars(): void {
    if (this.starsGroup) {
      while (this.starsGroup.children.length > 0) {
        this.starsGroup.remove(this.starsGroup.children[0]);
      }
    }
    this.starSprites.clear();
    this.orbitalRings.clear();
  }

  // Create orbital rings for a star (from StarMapView)
  private createOrbitalRingsForStar(starSprite: any, eventData: any): any[] {
    const rings = [];
    const color = eventData.mainColor;
    
    // Base orbital ring (always present, very subtle)
    const baseRingTexture = this.createOrbitalRingTexture(color, 'base');
    const baseRingMaterial = new this.THREE.SpriteMaterial({ 
      map: baseRingTexture, 
      transparent: true,
      opacity: 0.1,
      blending: this.THREE.AdditiveBlending
    });
    const baseRing = new this.THREE.Sprite(baseRingMaterial);
    baseRing.position.copy(starSprite.position);
    baseRing.scale.setScalar(starSprite.scale.x * 1.5);
    baseRing.userData = {
      type: 'base',
      parentStar: eventData.uniqueId,
      animationPhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.0005
    };
    rings.push(baseRing);
    
    // Selected rings (shown when star is selected)
    if (eventData.isSelected) {
      for (let i = 0; i < 2; i++) {
        const selectedRingTexture = this.createOrbitalRingTexture(color, 'selected');
        const selectedRingMaterial = new this.THREE.SpriteMaterial({ 
          map: selectedRingTexture, 
          transparent: true,
          opacity: 0.8,
          blending: this.THREE.AdditiveBlending
        });
        const selectedRing = new this.THREE.Sprite(selectedRingMaterial);
        selectedRing.position.copy(starSprite.position);
        selectedRing.scale.setScalar(starSprite.scale.x * (2.5 + i * 0.5));
        selectedRing.userData = {
          type: 'selected',
          parentStar: eventData.uniqueId,
          animationPhase: Math.random() * Math.PI * 2 + i * Math.PI,
          rotationSpeed: 0.001 * (i + 1),
          pulseSpeed: 0.002,
          scaleBase: starSprite.scale.x * (2.5 + i * 0.5)
        };
        rings.push(selectedRing);
      }
    }
    
    return rings;
  }

  // Orbital ring methods (from StarMapView)
  private createOrbitalRingTexture(color: string, ringType = 'base', size = 256): any {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    const center = size / 2;
    const outerRadius = size * 0.45;
    const innerRadius = size * 0.35;
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Create ring gradient
    const gradient = ctx.createRadialGradient(center, center, innerRadius, center, center, outerRadius);
    
    if (ringType === 'selected') {
      gradient.addColorStop(0, color + '00');
      gradient.addColorStop(0.3, color + '80');
      gradient.addColorStop(0.7, color + 'CC');
      gradient.addColorStop(1, color + '00');
    } else { // base
      gradient.addColorStop(0, color + '00');
      gradient.addColorStop(0.4, color + '20');
      gradient.addColorStop(0.6, color + '40');
      gradient.addColorStop(1, color + '00');
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
    ctx.arc(center, center, innerRadius, 0, Math.PI * 2, true); // Cut out center
    ctx.fill();
    
    return new this.THREE.CanvasTexture(canvas);
  }

  private updateOrbitalRingsForStar(starSprite: any, eventData: any): void {
    let existingRings = this.orbitalRings.get(eventData.uniqueId) || [];
    let ringsToKeep: any[] = [];

    // Remove selected rings
    existingRings.forEach(ring => {
      if (ring.userData.type === 'selected') {
        if (ring.parent) {
          ring.parent.remove(ring);
        }
      } else {
        ringsToKeep.push(ring);
      }
    });
    
    // If the star is now selected, add new 'selected' rings
    if (eventData.isSelected) {
      for (let i = 0; i < 2; i++) {
        const selectedRingTexture = this.createOrbitalRingTexture(eventData.mainColor, 'selected');
        const selectedRingMaterial = new this.THREE.SpriteMaterial({
          map: selectedRingTexture,
          transparent: true,
          opacity: 0.8,
          blending: this.THREE.AdditiveBlending
        });
        const selectedRing = new this.THREE.Sprite(selectedRingMaterial);
        selectedRing.position.copy(starSprite.position);
        selectedRing.scale.setScalar(starSprite.scale.x * (2.5 + i * 0.5));
        selectedRing.userData = {
          type: 'selected',
          parentStar: eventData.uniqueId,
          animationPhase: Math.random() * Math.PI * 2 + i * Math.PI,
          rotationSpeed: 0.001 * (i + 1),
          pulseSpeed: 0.002,
          scaleBase: starSprite.scale.x * (2.5 + i * 0.5)
        };
        ringsToKeep.push(selectedRing);
        this.starsGroup.add(selectedRing);
      }
    }
    
    this.orbitalRings.set(eventData.uniqueId, ringsToKeep);
  }

  private updateOrbitalRings(): void {
    const currentTime = Date.now();
    
    this.orbitalRings.forEach((rings) => {
      rings.forEach((ring) => {
        const userData = ring.userData;
        
        if (userData.type === 'selected') {
          // Expanding pulse animation
          userData.animationPhase += userData.rotationSpeed;
          ring.rotation.z = userData.animationPhase;
          
          const pulsePhase = Math.sin(currentTime * userData.pulseSpeed + userData.animationPhase);
          const scale = userData.scaleBase * (0.9 + pulsePhase * 0.3);
          ring.scale.setScalar(scale);
          
          const opacity = 0.3 + Math.abs(pulsePhase) * 0.5;
          ring.material.opacity = opacity;
        }
      });
    });
  }

  public dispose(): void {
    this.clearStars();
    
    if (this.starsGroup && this.scene) {
      this.scene.remove(this.starsGroup);
    }
    
    // Clear references
    this.selectedStar = null;
    this.hoveredStar = null;
    this.onStarSelectedCallback = undefined;
    
    this.isInitialized = false;
  }
}