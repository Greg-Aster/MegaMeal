// src/modules/starmap/StarManager.js
// Handles star creation, animation, and constellation management

import { StarTextureFactory } from './StarTextureFactory.js';
import { ConstellationBuilder } from './ConstellationBuilder.js';

export class StarManager {
  constructor(starMapCore, options = {}) {
    this.core = starMapCore;
    this.options = {
      useEraColors: false,
      ...options
    };
    
    // Dependencies
    this.textureFactory = new StarTextureFactory();
    this.constellationBuilder = new ConstellationBuilder();
    
    // Star management
    this.starSprites = new Map(); // uniqueId -> sprite
    this.orbitalRings = new Map(); // uniqueId -> rings array
    this.currentEvents = [];
    
    // Animation
    this.animationStartTime = Date.now();
    this.lastUpdateTime = Date.now();
    
    // Era configuration
    this.eraColorMap = {
      'ancient-epoch': '#3b82f6',
      'awakening-era': '#8b5cf6',
      'golden-age': '#6366f1',
      'conflict-epoch': '#ec4899',
      'singularity-conflict': '#ef4444',
      'transcendent-age': '#14b8a6',
      'final-epoch': '#22c55e',
      'unknown': '#6366f1'
    };

    this.colorSpectrum = [
      '#ef4444', '#f43f5e', '#f97316', '#f59e0b', '#eab308', '#facc15',
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
      '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    ];

    // Bind methods
    this.updateAnimations = this.updateAnimations.bind(this);
    
    // Listen to core events
    this.setupEventListeners();
  }

  setupEventListeners() {
    const container = document.getElementById(this.core.containerId);
    if (container) {
      container.addEventListener('starmap:frame', this.updateAnimations);
    }
  }

  // === UTILITY FUNCTIONS ===
  hashCode(str) {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  getStarColor(id, era) {
    if (this.options.useEraColors && era && this.eraColorMap[era]) {
      return this.eraColorMap[era];
    }
    const hash = this.hashCode(id);
    return this.colorSpectrum[hash % this.colorSpectrum.length];
  }

  getStarType(id, isKeyEvent) {
    const starTypes = ['point', 'classic', 'sparkle', 'refraction', 'halo', 'subtle'];
    const hash = this.hashCode(id);
    if (isKeyEvent) {
      return ['classic', 'sparkle', 'refraction', 'halo'][hash % 4];
    }
    return starTypes[hash % starTypes.length];
  }

  getSizeFactor(isKeyEvent) {
    return isKeyEvent ? 1.2 : 0.85 + (Math.random() * 0.3);
  }

  // === STAR CREATION ===
  createOrUpdateStars(events = []) {
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
      this.core.starsGroup,
      this.core.THREE,
      this.eraColorMap
    );
    
    console.log(`[StarManager] Created constellations for ${Object.keys(eventsByEra).length} eras with ${events.length} total stars`);
  }

  groupEventsByEra(events) {
    const eventsByEra = {};
    
    events.forEach(event => {
      const era = event.era || 'unknown';
      if (!eventsByEra[era]) {
        eventsByEra[era] = [];
      }
      eventsByEra[era].push(event);
    });
    
    return eventsByEra;
  }

  createConstellationForEra(era, eraEvents) {
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

  createStarForEvent(event, eventIndex, era, config, pattern) {
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
      event.isKeyEvent, 
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
    
    // Add to scene and tracking
    this.core.starsGroup.add(sprite);
    this.starSprites.set(uniqueStarId, sprite);
    
    // Create orbital rings
    const rings = this.createOrbitalRingsForStar(sprite, sprite.userData);
    rings.forEach(ring => this.core.starsGroup.add(ring));
    this.orbitalRings.set(event.slug, rings);
  }

  // === ORBITAL RINGS ===
  createOrbitalRingsForStar(starSprite, eventData) {
    const rings = [];
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
      initRing.userData = {
        type: 'init',
        parentStar: eventData.uniqueId,
        startTime: Date.now(),
        duration: 3000, // 3 seconds
        scaleStart: starSprite.scale.x * 0.2,
        scaleEnd: starSprite.scale.x * 5
      };
      rings.push(initRing);
    }
    
    return rings;
  }

  updateOrbitalRingsForStar(starSprite, eventData) {
    let existingRings = this.orbitalRings.get(eventData.uniqueId) || [];
    let ringsToKeep = [];

    // Remove selected rings if star is no longer selected
    existingRings.forEach(ring => {
      if (ring.userData.type === 'selected') {
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
        selectedRing.userData = {
          type: 'selected',
          parentStar: eventData.uniqueId,
          animationPhase: Math.random() * Math.PI * 2 + i * Math.PI,
          rotationSpeed: 0.001 * (i + 1),
          pulseSpeed: 0.002,
          scaleBase: starSprite.scale.x * (2.5 + i * 0.5)
        };
        ringsToKeep.push(selectedRing);
        this.core.starsGroup.add(selectedRing);
      }
    }
    
    this.orbitalRings.set(eventData.uniqueId, ringsToKeep);
  }

  // === ANIMATIONS ===
  updateAnimations() {
    const currentTime = Date.now();
    
    // Update star textures (throttled for performance)
    if (currentTime - this.lastUpdateTime > 150) {
      this.updateStarTextures(currentTime);
      this.lastUpdateTime = currentTime;
    }
    
    // Update orbital rings
    this.updateOrbitalRingsAnimation(currentTime);
  }

  updateStarTextures(currentTime) {
    this.starSprites.forEach((sprite, uniqueId) => {
      const userData = sprite.userData;
      if (!userData) return;
      
      const timeSinceCreation = currentTime - userData.animationStartTime;
      
      // Regenerate texture with current animation state
      if (currentTime - userData.lastUpdateTime > 150) {
        const newTexture = this.textureFactory.createAdvancedStarTexture(
          userData.mainColor,
          userData.starType,
          userData.isKeyEvent,
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

  updateOrbitalRingsAnimation(currentTime) {
    this.orbitalRings.forEach((rings, starSlug) => {
      rings.forEach((ring, index) => {
        const userData = ring.userData;
        
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
          
          const pulsePhase = Math.sin(currentTime * userData.pulseSpeed + userData.animationPhase);
          const scale = userData.scaleBase * (0.9 + pulsePhase * 0.3);
          ring.scale.setScalar(scale);
          
          const opacity = 0.3 + Math.abs(pulsePhase) * 0.5;
          ring.material.opacity = opacity;
          
        } else if (userData.type === 'init') {
          // Expanding initialization effect
          const elapsed = currentTime - userData.startTime;
          const progress = Math.min(elapsed / userData.duration, 1);
          
          if (progress >= 1) {
            // Remove completed init rings
            if (ring.parent) ring.parent.remove(ring);
            rings.splice(index, 1);
            return;
          }
          
          // Expanding scale with easing
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const scale = userData.scaleStart + (userData.scaleEnd - userData.scaleStart) * easeOut;
          ring.scale.setScalar(scale);
          
          // Fading opacity
          ring.material.opacity = 0.9 * (1 - progress);
        }
      });
    });
  }

  // === INTERACTION METHODS ===
  handleStarClick(intersectedSprite) {
    const eventData = intersectedSprite.userData;
    const clickedSpriteId = eventData.uniqueId;

    let previouslySelectedSprite = null;
    if (this.selectedEvent && this.selectedEvent.uniqueId) {
      previouslySelectedSprite = this.starSprites.get(this.selectedEvent.uniqueId);
    }

    // Deselect previously selected star
    if (previouslySelectedSprite && previouslySelectedSprite !== intersectedSprite) {
      previouslySelectedSprite.userData.isSelected = false;
      previouslySelectedSprite.userData.isHovered = false;
      if (previouslySelectedSprite.material) previouslySelectedSprite.material.opacity = 0.7;
      this.updateOrbitalRingsForStar(previouslySelectedSprite, previouslySelectedSprite.userData);
    }

    // Handle current star
    if (this.selectedEvent && this.selectedEvent.uniqueId === clickedSpriteId) {
      // Deselect same star
      intersectedSprite.userData.isSelected = false;
      intersectedSprite.userData.isHovered = false;
      if (intersectedSprite.material) intersectedSprite.material.opacity = 0.7;
      this.updateOrbitalRingsForStar(intersectedSprite, eventData);
      this.selectedEvent = null;
      
      // Emit deselection event
      this.core.emit('star-deselected', { eventData });
    } else {
      // Select new star
      intersectedSprite.userData.isSelected = true;
      intersectedSprite.userData.isHovered = false;
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

  handleStarHover(intersectedSprite, isHovering) {
    if (intersectedSprite && intersectedSprite.userData) {
      intersectedSprite.userData.isHovered = isHovering;
    }
  }

  // === UTILITY METHODS ===
  clearAllStars() {
    // Clear sprites
    while (this.core.starsGroup.children.length > 0) {
      this.core.starsGroup.remove(this.core.starsGroup.children[0]);
    }
    this.starSprites.clear();
    this.orbitalRings.clear();
  }

  getStarByUniqueId(uniqueId) {
    return this.starSprites.get(uniqueId);
  }

  getAllStars() {
    return Array.from(this.starSprites.values());
  }

  getConstellationInfo() {
    const eventsByEra = this.groupEventsByEra(this.currentEvents);
    return {
      constellations: Object.keys(eventsByEra).map(era => ({
        era,
        events: eventsByEra[era].length,
        config: this.constellationBuilder.getConstellationConfig(era),
        color: this.eraColorMap[era]
      }))
    };
  }

  // === PUBLIC API ===
  updateEvents(newEvents) {
    this.createOrUpdateStars(newEvents);
  }

  // === CLEANUP ===
  dispose() {
    this.clearAllStars();
    
    const container = document.getElementById(this.core.containerId);
    if (container) {
      container.removeEventListener('starmap:frame', this.updateAnimations);
    }
    
    console.log('[StarManager] Disposed');
  }
}