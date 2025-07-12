import * as THREE from 'three';
import { GameObject } from '../../engine/core/GameObject';
import type { Engine } from '../../engine/core/Engine';
import type { OptimizationLevel } from '../../engine/optimization/Manager';
import { InteractionSystem } from '../../engine/systems/InteractionSystem';
// Direct mouse interaction - no longer using InteractableObject interface
import { EventBus } from '../../engine/core/EventBus';
import { createAdvancedStarTexture } from '../../components/timeline/.starmap/StarTextures.client.ts';
import {
  constellationConfig,
  constellationPatterns,
  connectionPatterns,
  eraColorMap,
  colorSpectrum,
  starTypes,
} from '../../components/timeline/.starmap/StarMapConfig';
import type { StarData } from '../state/GameState';

/**
 * Handles star navigation and interaction for the Observatory
 * Manages star visuals, selection, and timeline event integration
 */
export class StarNavigationSystem extends GameObject {
  private scene: THREE.Scene;
  private levelGroup: THREE.Group;
  private interactionSystem: InteractionSystem;
  private engine: Engine;
  private eventBus: EventBus;
  private camera: THREE.PerspectiveCamera;
  private gameContainer: HTMLElement;
  private THREE: any;
  
  // Star system
  private starGroup: THREE.Group | null = null;
  private starSprites: Map<string, THREE.Sprite> = new Map();
  private timelineEvents: any[] = [];
  
  // Selection state
  private selectedStar: StarData | null = null;
  private hoveredStarSprite: THREE.Sprite | null = null;
  private onStarSelectedCallback?: (star: StarData | null) => void;
  
  // Optimization
  private isMobile: boolean = false;
  private optimizationLevel: OptimizationLevel;
  
  // Touch state for tap vs drag detection
  // Configuration - matching original StarVisuals
  private readonly starDistance = 990; // Just slightly inside skybox (1000) for perfect sync
  private readonly starSize = 20; // Base size for regular stars
  private readonly constellationLineOpacity = 0.05; // Control the opacity of constellation lines here
  
  // Event handlers that need to be stored for proper cleanup
  private handleUIClearAll: () => void;
  
  // System identification
  public readonly id = 'star-navigation-system';
  
  constructor(
    THREE: any,
    engine: Engine,
    scene: THREE.Scene,
    levelGroup: THREE.Group,
    interactionSystem: InteractionSystem,
    eventBus: EventBus,
    camera: THREE.PerspectiveCamera,
    gameContainer: HTMLElement
  ) {
    super();
    this.THREE = THREE;
    this.engine = engine;
    this.scene = scene;
    this.levelGroup = levelGroup;
    this.interactionSystem = interactionSystem;
    this.eventBus = eventBus;
    this.camera = camera;
    this.gameContainer = gameContainer;

    const optimizationManager = this.engine.getOptimizationManager();
    this.isMobile = optimizationManager.getDeviceCapabilities()?.isMobile || false;
    this.optimizationLevel = optimizationManager.getOptimizationLevel();
  }
  
  public async initialize(): Promise<void> {
    this.validateNotDisposed();
    
    if (this.isInitialized) {
      console.warn('StarNavigationSystem already initialized');
      return;
    }
    
    try {
      console.log('⭐ Initializing Star Navigation System...');
      console.log(`   - Optimization Level: ${this.optimizationLevel} (isMobile: ${this.isMobile})`);
      
      await this.createStarSystem();
      await this.setupInteractions();
      
      this.markInitialized();
      console.log('✅ Star Navigation System initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Star Navigation System:', error);
      throw error;
    }
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized || !this.isActive) return;
    
    // Update star animations
    this.updateStarAnimations();
    
    // Note: We no longer update selectedStar position since we dismiss the card on drag
    // This eliminates the jarring "following" effect that was mentioned
  }
  
  private async createStarSystem(): Promise<void> {
    console.log('🌟 Creating star system...');
    
    this.starGroup = new this.THREE.Group();
    this.levelGroup.add(this.starGroup);
    
    // Create stars from timeline events
    this.createStarsFromEvents();
    
    // Create constellation lines
    this.createConstellationLines();
    
    console.log(`✅ Created ${this.starSprites.size} stars with constellation lines`);
  }
  
  private createStarsFromEvents(): void {
    if (!this.timelineEvents || this.timelineEvents.length === 0) {
      console.log('⭐ No timeline events to create stars from');
      return;
    }

    // Group events by era to use hardcoded constellation patterns
    const eventsByEra: { [key: string]: any[] } = {};
    this.timelineEvents.forEach(event => {
        const era = event.era || event.timelineEra || 'unknown';
        if (!eventsByEra[era]) {
            eventsByEra[era] = [];
        }
        eventsByEra[era].push(event);
    });

    console.log(`⭐ Creating ${this.timelineEvents.length} stars from ${Object.keys(eventsByEra).length} eras`);

    // Create stars for each era using the patterns
    let globalIndex = 0;
    Object.entries(eventsByEra).forEach(([era, eraEvents]) => {
        eraEvents.forEach((event, indexInEra) => {
            this.createStarFromEvent(event, indexInEra, era, globalIndex);
            globalIndex++;
        });
    });
  }
  
  private createStarFromEvent(event: any, indexInEra: number, era: string, globalIndex: number): void {
    // Calculate star position based on hardcoded constellation data
    const position = this.calculateStarPosition(event, indexInEra, era);
    
    // Create star sprite
    const star = this.createStarSprite(event);
    star.position.copy(position);
    
    // Store star data
    const uniqueId = event.uniqueId || event.slug || `star-${globalIndex}`;
    const starType = this.getStarType(uniqueId, event.isKeyEvent);

    star.userData = {
      ...event,
      uniqueId: uniqueId,
      era: era, // Ensure era is stored for constellation lines
      index: globalIndex, // Keep global index for animations
      // New properties for advanced textures
      starType: starType,
      isSelected: false,
      isHovered: false,
      animationStartTime: Date.now(),
      lastUpdateTime: Date.now(),
    };
    
    // Add to collections
    this.starSprites.set(star.userData.uniqueId, star);
    if (this.starGroup) {
      this.starGroup.add(star);
    }
  }
  
  private calculateStarPosition(event: any, indexInEra: number, era: string): THREE.Vector3 {
    const radius = this.starDistance;

    const config = constellationConfig[era as keyof typeof constellationConfig] || constellationConfig.unknown;
    const pattern = constellationPatterns[config.pattern as keyof typeof constellationPatterns] || constellationPatterns.scattered;

    // Get position within constellation pattern, looping if necessary
    const patternIndex = indexInEra % pattern.length;
    const patternPosition = pattern[patternIndex];

    // Add some variation for events beyond the pattern length to avoid perfect overlap
    const extraVariation = indexInEra >= pattern.length
        ? { azOffset: (Math.random() - 0.5) * 10, elOffset: (Math.random() - 0.5) * 10 }
        : { azOffset: 0, elOffset: 0 };

    // Calculate final spherical coordinates
    const azimuthDeg = config.centerAzimuth + patternPosition.azOffset + extraVariation.azOffset;
    const elevationDeg = Math.max(20, Math.min(85, config.centerElevation + patternPosition.elOffset + extraVariation.elOffset)); // Clamp to visible sky

    const azimuthRad = THREE.MathUtils.degToRad(azimuthDeg);
    const polarAngleRad = THREE.MathUtils.degToRad(90 - elevationDeg); // Elevation to polar angle

    const position = new this.THREE.Vector3();
    position.setFromSphericalCoords(radius, polarAngleRad, azimuthRad);
    
    return position;
  }
  
  private createStarSprite(event: any): THREE.Sprite {
    // MOBILE OPTIMIZATION: Use simpler textures for mobile devices
    if (this.isMobile) {
      return this.createSimpleStarSprite(event);
    }

    return this.createAdvancedStarSprite(event);
  }

  private createSimpleStarSprite(event: any): THREE.Sprite {
    const hexColor = this.getStarHexColor(event);
    const material = new this.THREE.SpriteMaterial({
      map: this.createSimpleStarTexture(hexColor),
      blending: this.THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
    });
    const sprite = new this.THREE.Sprite(material);
    const baseScale = event.isKeyEvent ? 30 : 18;
    const scaleVariation = 0.8 + (Math.random() * 0.4);
    sprite.scale.setScalar(baseScale * scaleVariation);
    return sprite;
  }

  private createAdvancedStarSprite(event: any): THREE.Sprite {
    // Get star properties
    const uniqueId = event.uniqueId || event.slug || `star-${event.index}`;
    const starType = this.getStarType(uniqueId, event.isKeyEvent);
    const hexColor = this.getStarHexColor(event);
    const animationSeed = this.hashCode(uniqueId);

    // Create star texture using the advanced generator
    const texture = createAdvancedStarTexture(
      this.THREE,
      hexColor,
      starType,
      event.isKeyEvent,
      false, // isSelected
      false, // isHovered
      0, // animationTime
      256, // size
      animationSeed
    );

    // Create star material
    const material = new this.THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0, // Opacity is now handled by the texture itself
      blending: this.THREE.AdditiveBlending,
      alphaTest: 0.01, // Important for transparent textures
    });

    // Create sprite
    const sprite = new this.THREE.Sprite(material);
    const baseScale = event.isKeyEvent ? 35 : this.starSize; // Larger scale for better interaction at skybox distance
    const scaleVariation = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2 multiplier
    sprite.scale.setScalar(baseScale * scaleVariation);
    
    return sprite;
  }

  private createSimpleStarTexture(hexColor: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(0.3, hexColor);
    gradient.addColorStop(1, 'transparent');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const texture = new this.THREE.CanvasTexture(canvas);
    return texture;
  }
  
  private createConstellationLines(): void {
    console.log('⭐ Creating constellation lines from hardcoded patterns...');
    
    // Group stars by era for constellation formation
    const starsByEra = new Map<string, THREE.Sprite[]>();
    this.starSprites.forEach((star) => {
      const era = star.userData.era || star.userData.timelineEra || 'unknown';
      if (!starsByEra.has(era)) {
        starsByEra.set(era, []);
      }
      // The order matters for connection patterns, so we rely on the insertion order
      // which should match the order they were created in `createStarsFromEvents`.
      starsByEra.get(era)!.push(star);
    });
    
    // Create connecting lines based on hardcoded patterns
    starsByEra.forEach((starsInEra, era) => {
      if (starsInEra.length < 2) return;

      const config = constellationConfig[era as keyof typeof constellationConfig];
      if (!config) return;

      const patternName = config.pattern;
      const connections = connectionPatterns[patternName as keyof typeof connectionPatterns];
      if (!connections) return;

      const linePositions: THREE.Vector3[] = [];
      connections.forEach(([startIndex, endIndex]) => {
          if (startIndex < starsInEra.length && endIndex < starsInEra.length) {
              const startSprite = starsInEra[startIndex];
              const endSprite = starsInEra[endIndex];
              linePositions.push(startSprite.position.clone());
              linePositions.push(endSprite.position.clone());
          }
      });

      if (linePositions.length > 0) {
        const lineGeometry = new this.THREE.BufferGeometry().setFromPoints(linePositions);
        const eraColor = eraColorMap[era as keyof typeof eraColorMap] || '#4a9eff';

        const lineMaterial = new this.THREE.LineDashedMaterial({
          color: new this.THREE.Color(eraColor),
          transparent: true,
          opacity: this.constellationLineOpacity,
          linewidth: 2,
          dashSize: 8,
          gapSize: 4
        });

        const constellationLine = new this.THREE.LineSegments(lineGeometry, lineMaterial);
        constellationLine.computeLineDistances(); // Required for dashed lines

        if (this.starGroup) {
          this.starGroup.add(constellationLine);
        }
      }
    });
    
    console.log(`✅ Created constellation lines for ${starsByEra.size} eras`);
  }
  
  private getStarHexColor(event: any): string {
    if (event.isLevel) return '#FF64FF'; // Magenta for levels

    // Use a wider spectrum of colors for more visual variety
    const uniqueId = event.uniqueId || event.slug || `star-${event.index}`;
    const hash = this.hashCode(uniqueId);

    if (event.isKeyEvent) {
      // Key events can have a special golden-white range for prominence
      const keyEventColors = ['#FFFFFF', '#FFFDE4', '#FFD700'];
      return keyEventColors[hash % keyEventColors.length];
    }

    // Use the full spectrum for regular stars, determined by their unique ID
    return colorSpectrum[hash % colorSpectrum.length];
  }

  private hashCode(str: string): number {
    if (!str) return 0;
    let hexColor: string;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
  }

  private getStarType(id: string, isKeyEvent: boolean): string {
      const hash = this.hashCode(id);
      if (isKeyEvent) {
          return ['classic', 'sparkle', 'refraction', 'halo'][hash % 4];
      }
      return starTypes[hash % starTypes.length];
  }
  
  private updateStarAnimations(): void {
    // MOBILE OPTIMIZATION: Skip expensive texture regeneration on mobile
    if (this.isMobile) {
      // Could add a very simple, cheap animation here if needed, like opacity pulsing.
      return;
    }

    const currentTime = Date.now();
    
    // Throttle updates for performance
    if (currentTime % 100 < 16) { // Update roughly 6 times per second
        this.starSprites.forEach((sprite) => {
            const userData = sprite.userData;
            if (!userData) return;

            // Only update if state has changed or for continuous animation
            const needsUpdate = userData.isSelected || userData.isHovered || (currentTime - userData.lastUpdateTime > 150);

            if (needsUpdate) {
                const timeSinceCreation = currentTime - userData.animationStartTime;
                const hexColor = this.getStarHexColor(userData);
                const animationSeed = this.hashCode(userData.uniqueId);

                const newTexture = createAdvancedStarTexture(
                    this.THREE,
                    hexColor,
                    userData.starType,
                    userData.isKeyEvent,
                    userData.isSelected,
                    userData.isHovered,
                    timeSinceCreation,
                    256, // size
                    animationSeed
                );

                if (sprite.material && sprite.material.map) {
                    sprite.material.map.dispose(); // Dispose old texture
                }
                sprite.material.map = newTexture;
                sprite.material.needsUpdate = true;

                userData.lastUpdateTime = currentTime;
            }
        });
    }
  }
  
  private async setupInteractions(): Promise<void> {
    console.log('🎯 Setting up star interactions...');
    
    // Bind handlers to maintain 'this' context
    this.handleTap = this.handleTap.bind(this);
    this.handleHover = this.handleHover.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleUIClearAll = () => {
      console.log('🧹 StarNavigationSystem: Clearing selected star');
      this.selectStar(null);
    };

    // Subscribe to universal input events from the EventBus
    this.eventBus.on('input:tap', this.handleTap);
    this.eventBus.on('input:hover', this.handleHover);
    this.eventBus.on('input:drag:start', this.handleDragStart);
    
    // Subscribe to cleanup events
    this.eventBus.on('ui.clearAll', this.handleUIClearAll);
    
    console.log('✅ Star interactions set up');
  }
  
  // Direct mouse interaction implementation
  
  private performRaycast(clientX: number, clientY: number): void {
    const raycaster = new this.THREE.Raycaster();
    const mouse = new this.THREE.Vector2();
    
    // Convert mouse coordinates to normalized device coordinates (-1 to +1)
    const rect = this.gameContainer.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, this.camera);
    
    const starSprites = Array.from(this.starSprites.values());
    const intersections = raycaster.intersectObjects(starSprites);
    
    if (intersections.length > 0) {
      const clickedStar = intersections[0].object;
      console.log('⭐ Star interaction:', clickedStar.userData.title);
      this.selectStar(clickedStar.userData);
    } else {
      console.log('🌌 No star interaction');
      this.selectStar(null);
    }
  }
  
  private handleTap({ x, y }: { x: number, y: number }): void {
    this.performRaycast(x, y);
  }

  private handleHover({ x, y }: { x: number, y: number }): void {
    const raycaster = new this.THREE.Raycaster();
    const mouse = new this.THREE.Vector2();
    
    const rect = this.gameContainer.getBoundingClientRect();
    mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, this.camera);
    
    const starSprites = Array.from(this.starSprites.values());
    const intersections = raycaster.intersectObjects(starSprites);
    
    const newHoveredSprite = intersections.length > 0 ? (intersections[0].object as THREE.Sprite) : null;

    if (newHoveredSprite !== this.hoveredStarSprite) {
        // Un-hover the old sprite
        if (this.hoveredStarSprite) {
            this.hoveredStarSprite.userData.isHovered = false;
        }

        // Hover the new sprite
        if (newHoveredSprite) {
            newHoveredSprite.userData.isHovered = true;
            this.gameContainer.style.cursor = 'pointer';
        } else {
            this.gameContainer.style.cursor = 'default';
        }

        this.hoveredStarSprite = newHoveredSprite;
    }
  }

  private handleDragStart(): void {
    // Dismiss the timeline card when user starts dragging to look around
    // This provides better UX since they're clearly not focused on reading the card
    if (this.selectedStar) {
      this.selectStar(null);
    }
  }

  public selectStar(starData: any): void {
    const previouslySelectedStar = this.selectedStar ? this.starSprites.get(this.selectedStar.uniqueId) : null;

    // Deselect previous star
    if (previouslySelectedStar) {
        previouslySelectedStar.userData.isSelected = false;
    }

    if (starData) {
      const star = this.starSprites.get(starData.uniqueId);
      if (star) {
        // Calculate screen position
        const screenPosition = this.getScreenPosition(star);
        
        this.selectedStar = {
          ...starData,
          screenPosition: this.calculateOptimalCardPosition(screenPosition)
        };
        
        // Select new star
        star.userData.isSelected = true;
        console.log('⭐ Star selected:', this.selectedStar?.title);
      }
    } else {
      this.selectedStar = null;
      console.log('🌌 Star deselected');
    }
    
    // Notify callback
    if (this.onStarSelectedCallback) {
      this.onStarSelectedCallback(this.selectedStar);
    }
    
    // Emit event
    this.eventBus.emit('star.selected', { star: this.selectedStar });
  }
  
  private updateSelectedStarPosition(): void {
    if (!this.selectedStar) return;
    
    const star = this.starSprites.get(this.selectedStar.uniqueId);
    if (star) {
      const screenPosition = this.getScreenPosition(star);
      const newCardPosition = this.calculateOptimalCardPosition(screenPosition);
      const oldCardPosition = this.selectedStar.screenPosition || { x: -1, y: -1 };

      // Only update and emit if the position has changed to avoid event spam
      if (
        oldCardPosition.x !== newCardPosition.x ||
        oldCardPosition.y !== newCardPosition.y
      ) {
        // Create a new object to ensure reactivity in UI frameworks like Svelte
        this.selectedStar = {
          ...this.selectedStar,
          screenPosition: newCardPosition,
        };
        this.eventBus.emit('star.selected', { star: this.selectedStar });
      }
    }
  }
  
  private getScreenPosition(star: THREE.Sprite): { x: number; y: number; isInFront: boolean } {
    const vector = new this.THREE.Vector3();
    
    vector.setFromMatrixPosition(star.matrixWorld);
    vector.project(this.camera);
    
    const widthHalf = this.gameContainer.clientWidth / 2;
    const heightHalf = this.gameContainer.clientHeight / 2;
    
    return {
      x: (vector.x * widthHalf) + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf,
      isInFront: vector.z < 1
    };
  }
  
  private calculateOptimalCardPosition(screenPosition: { x: number, y: number, isInFront: boolean }) {
    if (!screenPosition.isInFront) {
      return { x: 100, y: 100, cardClass: 'timeline-card-bottom' };
    }
    
    const rect = this.gameContainer.getBoundingClientRect();
    const cardWidth = 200;
    const cardHeight = 100;
    const margin = 20;
    
    let cardX = screenPosition.x;
    let cardY = screenPosition.y;
    let cardClass = 'timeline-card-bottom';
    
    const spaceRight = rect.width - screenPosition.x;
    const spaceLeft = screenPosition.x;
    const spaceBelow = rect.height - screenPosition.y;
    const spaceAbove = screenPosition.y;
    
    if (spaceBelow >= cardHeight + margin && spaceBelow >= spaceAbove) {
      cardX = screenPosition.x - cardWidth / 2;
      cardY = screenPosition.y + margin;
      cardClass = 'timeline-card-top';
    } else if (spaceAbove >= cardHeight + margin) {
      cardX = screenPosition.x - cardWidth / 2;
      cardY = screenPosition.y - cardHeight - margin;
      cardClass = 'timeline-card-bottom';
    } else if (spaceRight >= cardWidth + margin) {
      cardX = screenPosition.x + margin;
      cardY = screenPosition.y - cardHeight / 2;
      cardClass = 'timeline-card-left';
    } else if (spaceLeft >= cardWidth + margin) {
      cardX = screenPosition.x - cardWidth - margin;
      cardY = screenPosition.y - cardHeight / 2;
      cardClass = 'timeline-card-right';
    }
    
    cardX = Math.max(margin, Math.min(cardX, rect.width - cardWidth - margin));
    cardY = Math.max(margin, Math.min(cardY, rect.height - cardHeight - margin));
    
    return { x: cardX, y: cardY, cardClass };
  }
  
  /**
   * Set timeline events and recreate stars
   */
  public setTimelineEvents(events: any[]): void {
    this.timelineEvents = events;
    
    if (this.isInitialized) {
      // Clear existing stars
      this.clearStars();
      this.createStarsFromEvents();
      this.createConstellationLines();
    }
  }
  
  private clearStars(): void {
    this.starSprites.forEach((star, id) => {
      star.material.dispose();
      if (star.material.map) {
        star.material.map.dispose();
      }
      if (this.starGroup) {
        this.starGroup.remove(star);
      }
    });
    
    // Clear constellation lines
    if (this.starGroup) {
      const linesToRemove = this.starGroup.children.filter(child => child instanceof this.THREE.LineSegments);
      linesToRemove.forEach(line => {
        const lineSegments = line as THREE.LineSegments;
        lineSegments.geometry.dispose();
        (lineSegments.material as THREE.Material).dispose();
        this.starGroup!.remove(line);
      });
    }
    
    this.starSprites.clear();
  }
  
  /**
   * Set star selection callback
   */
  public onStarSelected(callback: (star: StarData | null) => void): void {
    this.onStarSelectedCallback = callback;
  }
  
  /**
   * Get all star sprites
   */
  public getStarSprites(): Map<string, THREE.Sprite> {
    return this.starSprites;
  }
  
  /**
   * Get selected star
   */
  public getSelectedStar(): StarData | null {
    return this.selectedStar;
  }
  
  public dispose(): void {
    if (this.isDisposed) return;
    
    console.log('🧹 Disposing Star Navigation System...');
    
    // Unsubscribe from universal input events
    this.eventBus.off('input:tap', this.handleTap);
    this.eventBus.off('input:hover', this.handleHover);
    this.eventBus.off('input:drag:start', this.handleDragStart);
    
    // Unsubscribe from cleanup events
    this.eventBus.off('ui.clearAll', this.handleUIClearAll);
    
    // Clear stars
    this.clearStars();
    
    // Remove star group
    if (this.starGroup) {
      this.levelGroup.remove(this.starGroup);
      this.starGroup = null;
    }
    
    // Clear selections
    this.selectedStar = null;
    this.onStarSelectedCallback = undefined;
    
    this.markDisposed();
    console.log('✅ Star Navigation System disposed');
  }
}
