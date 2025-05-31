// src/components/timeline/starmap/StarManager.ts
// Handles star creation, animation, and constellation management

import type * as THREE from 'three';
import type { 
  StarEvent, 
  StarUserData, 
  EventsByEra, 
  EraColorMap,
  StarManagerOptions,
  StarType,
  OrbitalRingUserData,
  ConstellationInfo,
  PatternPosition
} from '../../../types/starmap';

import { StarTextureFactory } from './StarTextureFactory';
import { ConstellationBuilder } from './ConstellationBuilder';
import type { StarMapCore } from './StarMapCore';

export class StarManager {
  private readonly core: StarMapCore;
  private readonly options: Required<StarManagerOptions>;
  
  // Dependencies
  private readonly textureFactory: StarTextureFactory;
  private readonly constellationBuilder: ConstellationBuilder;
  
  // Star management
  private readonly starSprites = new Map<string, THREE.Sprite>();
  private readonly orbitalRings = new Map<string, THREE.Sprite[]>();
  private currentEvents: StarEvent[] = [];
  
  // Animation
  private readonly animationStartTime: number;
  private lastUpdateTime: number;
  
  // Configuration
  private readonly eraColorMap: EraColorMap = {
    'ancient-epoch': '#3b82f6',
    'awakening-era': '#8b5cf6',
    'golden-age': '#6366f1',
    'conflict-epoch': '#ec4899',
    'singularity-conflict': '#ef4444',
    'transcendent-age': '#14b8a6',
    'final-epoch': '#22c55e',
    'unknown': '#6366f1'
  };

  private readonly colorSpectrum: string[] = [
    '#ef4444', '#f43f5e', '#f97316', '#f59e0b', '#eab308', '#facc15',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  ];

  // State tracking
  private selectedEvent: StarEvent | null = null;

  constructor(starMapCore: StarMapCore, options: StarManagerOptions = {}) {
    this.core = starMapCore;
    this.options = {
      useEraColors: false,
      ...options
    };
    
    // Dependencies
    this.textureFactory = new StarTextureFactory();
    this.constellationBuilder = new ConstellationBuilder();
    
    // Animation
    this.animationStartTime = Date.now();
    this.lastUpdateTime = Date.now();
    
    // Bind methods
    this.updateAnimations = this.updateAnimations.bind(this);
    
    // Listen to core events
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const container = document.getElementById(this.core.containerId);
    if (container) {
      container.addEventListener('starmap:frame', this.updateAnimations);
    }
  }

  // === UTILITY FUNCTIONS ===
  private hashCode(str: string): number {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private getStarColor(id: string, era?: string): string {
    if (this.options.useEraColors && era && this.eraColorMap[era]) {
      return this.eraColorMap[era];
    }
    const hash = this.hashCode(id);
    return this.colorSpectrum[hash % this.colorSpectrum.length];
  }

  private getStarType(id: string, isKeyEvent = false): StarType {
    const starTypes: StarType[] = ['point', 'classic', 'sparkle', 'refraction', 'halo', 'subtle'];
    const hash = this.hashCode(id);
    if (isKeyEvent) {
      const keyEventTypes: StarType[] = ['classic', 'sparkle', 'refraction', 'halo'];
      return keyEventTypes[hash % keyEventTypes.length];
    }
    return starTypes[hash % starTypes.length];
  }

  private getSizeFactor(isKeyEvent = false): number {
    return isKeyEvent ? 1.2 : 0.85 + (Math.random() * 0.3);
  }

  // === STAR CREATION ===
  public createOrUpdateStars(events: StarEvent[] = []): void {
    if (!this.core.starsGroup || !this.core.THREE) {
      console.warn('[StarManager] createOrUpdateStars called before core initialization.');
      return;
    }

    this.currentEvents = events;
    
    // Clear existing stars
    this.clearAllStars();
    
    if (events.length === 0) {
      console.warn('[StarManager] No events provided for star creation.');
      return;
    }

    // Group events by era
    const eventsByEra = this.groupEventsByEra(events);
    
    // Create constellations for each era
    Object.entries(eventsByEra).forEach(([era, eraEvents]) => {
      this.createConstellationForEra(era, eraEvents);
    });
    
    // Create constellation connecting lines
    this.constellationBuilder.createConstellationLines(
      eventsByEra, 
      this.starSprites, 
      this.core.starsGroup!,
      this.core.THREE!,
      this.eraColorMap
    );
    
    console.log(`[StarManager] Created constellations for ${Object.keys(eventsByEra).length} eras with ${events.length} total stars`);
  }

  private groupEventsByEra(events: StarEvent[]): EventsByEra {
    const eventsByEra: EventsByEra = {};
    
    events.forEach(event => {
      const era = event.era || 'unknown';
      if (!eventsByEra[era]) {
        eventsByEra[era] = [];
      }
      eventsByEra[era].push(event);
    });
    
    return eventsByEra;
  }

  private createConstellationForEra(era: string, eraEvents: StarEvent[]): void {
    const constellationConfig = this.constellationBuilder.getConstellationConfig(era);
    if (!constellationConfig) {
      console.error(`[StarManager] No constellation config for era: ${era}`);
      return;
    }

    const pattern = this.constellationBuilder.getConstellationPattern(constellationConfig.pattern);
    
    eraEvents.forEach((event, eventIndex) => {
      try {
        this.createStarForEvent(event, eventIndex, era, constellationConfig, pattern);
      } catch (error) {
        console.error(`[StarManager] Error creating star for event "${event.title}":`, error);
      }
    });
  }

  private createStarForEvent(
    event: StarEvent, 
    eventIndex: number, 
    era: string, 
    config: any, 
    pattern: PatternPosition[]
  ): void {
    if (!this.core.THREE || !this.core.starsGroup) return;

    // Calculate position
    const patternIndex = eventIndex % pattern.length;
    const patternPosition = pattern[patternIndex];
    
    const extraVariation = eventIndex >= pattern.length ? 
      { azOffset: (Math.random() - 0.5) * 30, elOffset: (Math.random() - 0.5) * 20 } : 
      { azOffset: 0, elOffset: 0 };

    const azimuthDeg = config.centerAzimuth + patternPosition.azOffset + extraVariation.azOffset;
    const elevationDeg = Math.max(30, Math.min(80, config.centerElevation + patternPosition.elOffset + extraVariation.elOffset));
    
    const azimuthRad = (azimuthDeg * Math.PI) / 180;
    const elevationRad = (elevationDeg * Math.PI) / 180;
    const polarAngleRad = Math.PI/2 - elevationRad;

    // Create star properties
    const uniqueStarId = `${event.slug}-${event.year}-${eventIndex}`;
    const mainColor = this.getStarColor(uniqueStarId, event.era);
    const starType = this.getStarType(uniqueStarId, event.isKeyEvent);
    
    // Create star texture
    const starTexture = this.textureFactory.createAdvancedStarTexture(
      mainColor, 
      starType, 
      event.isKeyEvent || false, 
      false, // isSelected
      false, // isHovered
      this.animationStartTime
    );
    
    // Create sprite
    const spriteMaterial = new this.core.THREE.SpriteMaterial({ 
      map: starTexture, 
      transparent: true,
      alphaTest: 0.01,
      blending: this.core.THREE.AdditiveBlending
    });
    
    const sprite = new this.core.THREE.Sprite(spriteMaterial);
    
    // Position on sphere
    const radius = 995; // Slightly inside the skybox
    sprite.position.setFromSphericalCoords(radius, polarAngleRad, azimuthRad);
    
    // Scale
    const baseScale = event.isKeyEvent ? 44 : 32;
    const scaleVariation = 0.8 + (Math.random() * 0.4);
    sprite.scale.setScalar(baseScale * scaleVariation);
    
    // Store metadata
    const userData: StarUserData = {
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
    sprite.userData = userData;
    
    // Add to scene and tracking
    this.core.starsGroup.add(sprite);
    this.starSprites.set(uniqueStarId, sprite);
    
    // Create orbital rings
    const rings = this.createOrbitalRingsForStar(sprite, userData);
    rings.forEach(ring => this.core.starsGroup!.add(ring));
    this.orbitalRings.set(event.slug, rings);
  }

  // === ORBITAL RINGS ===
  private createOrbitalRingsForStar(starSprite: THREE.Sprite, eventData: StarUserData): THREE.Sprite[] {
    if (!this.core.THREE) return [];

    const rings: THREE.Sprite[] = [];
    const color = eventData.mainColor;
    
    // Base orbital ring (always present, very subtle)
    const baseRingTexture = this.textureFactory.createOrbitalRingTexture(color, 'base');
    const baseRingMaterial = new this.core.THREE.SpriteMaterial({ 
      map: baseRingTexture, 
      transparent: true,
      opacity: 0.1,
      blending: this.core.THREE.AdditiveBlending
    });
    const baseRing = new this.core.THREE.Sprite(baseRingMaterial);
    baseRing.position.copy(starSprite.position);
    baseRing.scale.setScalar(starSprite.scale.x * 1.5);
    
    const baseUserData: OrbitalRingUserData = {
      type: 'base',
      parentStar: eventData.uniqueId,
      animationPhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.0005
    };
    baseRing.userData = baseUserData;
    rings.push(baseRing);
    
    // Selected rings (shown when star is selected)
    if (eventData.isSelected) {
      for (let i = 0; i < 2; i++) {
        const selectedRingTexture = this.textureFactory.createOrbitalRingTexture(color, 'selected');
        const selectedRingMaterial = new this.core.THREE.SpriteMaterial({ 
          map: selectedRingTexture, 
          transparent: true,
          opacity: 0.8,
          blending: this.core.THREE.AdditiveBlending
        });
        const selectedRing = new this.core.THREE.Sprite(selectedRingMaterial);
        selectedRing.position.copy(starSprite.position);
        selectedRing.scale.setScalar(starSprite.scale.x * (2.5 + i * 0.5));
        
        const selectedUserData: OrbitalRingUserData = {
          type: 'selected',
          parentStar: eventData.uniqueId,
          animationPhase: Math.random() * Math.PI * 2 + i * Math.PI,
          rotationSpeed: 0.001 * (i + 1),
          pulseSpeed: 0.002,
          scaleBase: starSprite.scale.x * (2.5 + i * 0.5)
        };
        selectedRing.userData = selectedUserData;
        rings.push(selectedRing);
      }
    }
    
    // Initialization ring (expanding ring effect)
    if (!this.orbitalRings.has(eventData.uniqueId)) {
      const initRingTexture = this.textureFactory.createOrbitalRingTexture(color, 'init');
      const initRingMaterial = new this.core.THREE.SpriteMaterial({
        map: initRingTexture, 
        transparent: true,
        opacity: 0.9,
        blending: this.core.THREE.AdditiveBlending
      });
      const initRing = new this.core.THREE.Sprite(initRingMaterial);
      initRing.position.copy(starSprite.position);
      initRing.scale.setScalar(starSprite.scale.x * 0.2);
      
      const initUserData: OrbitalRingUserData = {
        type: 'init',
        parentStar: eventData.uniqueId,
        animationPhase: 0,
        rotationSpeed: 0,
        startTime: Date.now(),
        duration: 3000, // 3 seconds
        scaleStart: starSprite.scale.x * 0.2,
        scaleEnd: starSprite.scale.x * 5
      };
      initRing.userData = initUserData;
      rings.push(initRing);
    }
    
    return rings;
  }

  public updateOrbitalRingsForStar(starSprite: THREE.Sprite, eventData: StarUserData): void {
    if (!this.core.THREE || !this.core.starsGroup) return;

    let existingRings = this.orbitalRings.get(eventData.uniqueId) || [];
    let ringsToKeep: THREE.Sprite[] = [];

    // Remove selected rings if star is no longer selected
    existingRings.forEach(ring => {
      const userData = ring.userData as OrbitalRingUserData;
      if (userData.type === 'selected') {
        if (ring.parent) {
          ring.parent.remove(ring);
        }
      } else {
        ringsToKeep.push(ring);
      }
    });
    
    // Add new selected rings if star is now selected
    if (eventData.isSelected) {
      for (let i = 0; i < 2; i++) {
        const selectedRingTexture = this.textureFactory.createOrbitalRingTexture(eventData.mainColor, 'selected');
        const selectedRingMaterial = new this.core.THREE.SpriteMaterial({
          map: selectedRingTexture,
          transparent: true,
          opacity: 0.8,
          blending: this.core.THREE.AdditiveBlending
        });
        const selectedRing = new this.core.THREE.Sprite(selectedRingMaterial);
        selectedRing.position.copy(starSprite.position);
        selectedRing.scale.setScalar(starSprite.scale.x * (2.5 + i * 0.5));
        
        const selectedUserData: OrbitalRingUserData = {
          type: 'selected',
          parentStar: eventData.uniqueId,
          animationPhase: Math.random() * Math.PI * 2 + i * Math.PI,
          rotationSpeed: 0.001 * (i + 1),
          pulseSpeed: 0.002,
          scaleBase: starSprite.scale.x * (2.5 + i * 0.5)
        };
        selectedRing.userData = selectedUserData;
        ringsToKeep.push(selectedRing);
        this.core.starsGroup.add(selectedRing);
      }
    }
    
    this.orbitalRings.set(eventData.uniqueId, ringsToKeep);
  }

  // === ANIMATIONS ===
  private updateAnimations(): void {
    const currentTime = Date.now();
    
    // Update star textures (throttled for performance)
    if (currentTime - this.lastUpdateTime > 150) {
      this.updateStarTextures(currentTime);
      this.lastUpdateTime = currentTime;
    }
    
    // Update orbital rings
    this.updateOrbitalRingsAnimation(currentTime);
  }

  private updateStarTextures(currentTime: number): void {
    this.starSprites.forEach((sprite, uniqueId) => {
      const userData = sprite.userData as StarUserData;
      if (!userData) return;
      
      const timeSinceCreation = currentTime - userData.animationStartTime;
      
      // Regenerate texture with current animation state
      if (currentTime - userData.lastUpdateTime > 150) {
        const newTexture = this.textureFactory.createAdvancedStarTexture(
          userData.mainColor,
          userData.starType,
          userData.isKeyEvent || false,
          userData.isSelected,
          userData.isHovered,
          timeSinceCreation
        );
        
        // Update material
        if (sprite.material && sprite.material.map) {
          sprite.material.map.dispose();
          sprite.material.map = newTexture;
          sprite.material.needsUpdate = true;
        }
        
        userData.lastUpdateTime = currentTime;
      }
    });
  }

  private updateOrbitalRingsAnimation(currentTime: number): void {
    this.orbitalRings.forEach((rings, starSlug) => {
      rings.forEach((ring, index) => {
        const userData = ring.userData as OrbitalRingUserData;
        
        if (userData.type === 'base') {
          // Gentle rotation and subtle pulse
          userData.animationPhase += userData.rotationSpeed;
          ring.rotation.z = userData.animationPhase;
          
          const pulse = 0.1 + Math.sin(currentTime * 0.001 + userData.animationPhase) * 0.05;
          ring.material.opacity = pulse;
          
        } else if (userData.type === 'selected') {
          // Expanding pulse animation
          userData.animationPhase += userData.rotationSpeed;
          ring.rotation.z = userData.animationPhase;
          
          const pulsePhase = Math.sin(currentTime * (userData.pulseSpeed || 0.002) + userData.animationPhase);
          const scale = (userData.scaleBase || ring.scale.x) * (0.9 + pulsePhase * 0.3);
          ring.scale.setScalar(scale);
          
          const opacity = 0.3 + Math.abs(pulsePhase) * 0.5;
          ring.material.opacity = opacity;
          
        } else if (userData.type === 'init') {
          // Expanding initialization effect
          const elapsed = currentTime - (userData.startTime || currentTime);
          const progress = Math.min(elapsed / (userData.duration || 3000), 1);
          
          if (progress >= 1) {
            // Remove completed init rings
            if (ring.parent) ring.parent.remove(ring);
            rings.splice(index, 1);
            return;
          }
          
          // Expanding scale with easing
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const scaleStart = userData.scaleStart || ring.scale.x;
          const scaleEnd = userData.scaleEnd || ring.scale.x * 5;
          const scale = scaleStart + (scaleEnd - scaleStart) * easeOut;
          ring.scale.setScalar(scale);
          
          // Fading opacity
          ring.material.opacity = 0.9 * (1 - progress);
        }
      });
    });
  }

  // === INTERACTION METHODS ===
  public handleStarClick(intersectedSprite: THREE.Sprite): void {
    const eventData = intersectedSprite.userData as StarUserData;
    const clickedSpriteId = eventData.uniqueId;

    let previouslySelectedSprite: THREE.Sprite | undefined = undefined;
    if (this.selectedEvent && this.selectedEvent.uniqueId) {
      previouslySelectedSprite = this.starSprites.get(this.selectedEvent.uniqueId);
    }

    // Deselect previously selected star
    if (previouslySelectedSprite && previouslySelectedSprite !== intersectedSprite) {
      const prevUserData = previouslySelectedSprite.userData as StarUserData;
      prevUserData.isSelected = false;
      prevUserData.isHovered = false;
      if (previouslySelectedSprite.material) previouslySelectedSprite.material.opacity = 0.7;
      this.updateOrbitalRingsForStar(previouslySelectedSprite, prevUserData);
    }

    // Handle current star
    if (this.selectedEvent && this.selectedEvent.uniqueId === clickedSpriteId) {
      // Deselect same star
      eventData.isSelected = false;
      eventData.isHovered = false;
      if (intersectedSprite.material) intersectedSprite.material.opacity = 0.7;
      this.updateOrbitalRingsForStar(intersectedSprite, eventData);
      this.selectedEvent = null;
      
      // Emit deselection event
      this.core.emit('star-deselected', { eventData });
    } else {
      // Select new star
      eventData.isSelected = true;
      eventData.isHovered = false;
      if (intersectedSprite.material) intersectedSprite.material.opacity = 1.0;
      this.updateOrbitalRingsForStar(intersectedSprite, eventData);
      this.selectedEvent = eventData;
      
      // Emit selection event
      this.core.emit('star-selected', { 
        eventData, 
        sprite: intersectedSprite 
      });
    }
  }

  public handleStarHover(intersectedSprite: THREE.Sprite, isHovering: boolean): void {
    if (intersectedSprite && intersectedSprite.userData) {
      const userData = intersectedSprite.userData as StarUserData;
      userData.isHovered = isHovering;
    }
  }

  // === UTILITY METHODS ===
  private clearAllStars(): void {
    if (!this.core.starsGroup) return;

    // Clear sprites
    while (this.core.starsGroup.children.length > 0) {
      this.core.starsGroup.remove(this.core.starsGroup.children[0]);
    }
    this.starSprites.clear();
    this.orbitalRings.clear();
  }

  public getStarByUniqueId(uniqueId: string): THREE.Sprite | undefined {
    return this.starSprites.get(uniqueId);
  }

  public getAllStars(): THREE.Sprite[] {
    return Array.from(this.starSprites.values());
  }

  public getConstellationInfo(): ConstellationInfo {
    const eventsByEra = this.groupEventsByEra(this.currentEvents);
    return {
      constellations: Object.keys(eventsByEra).map(era => ({
        era,
        events: eventsByEra[era].length,
        config: this.constellationBuilder.getConstellationConfig(era),
        color: this.eraColorMap[era] || '#6366f1'
      }))
    };
  }

  // === PUBLIC API ===
  public updateEvents(newEvents: StarEvent[]): void {
    this.createOrUpdateStars(newEvents);
  }

  // === CLEANUP ===
  public dispose(): void {
    this.clearAllStars();
    
    const container = document.getElementById(this.core.containerId);
    if (container) {
      container.removeEventListener('starmap:frame', this.updateAnimations);
    }
    
    this.textureFactory.dispose();
    
    console.log('[StarManager] Disposed');
  }
}