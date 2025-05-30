// src/components/timeline/starmap/StarMapCore.client.ts
import type { TimelineEvent } from '../../../services/TimelineService.client';
import { 
  hashCode,
  getStarColor, 
  getStarType, 
  getSizeFactor, 
  getAnimationDuration,
  getScreenPosition,
  calculateCardPosition
} from './StarMapUtils';
import { 
  eraColorMap,
  constellationConfig, 
  constellationPatterns,
  connectionPatterns 
} from './StarMapConfig';
import { 
  createAdvancedStarTexture, 
  createOrbitalRingTexture,
  drawStar 
} from './StarMapTextures.client';

export interface StarMapOptions {
  useEraColors?: boolean;
  skyboxImageUrl?: string;
  floatingCardId?: string;
}

export class StarMapCore {
  private THREE: any;
  private OrbitControls: any;
  private scene: any;
  private camera: any;
  private renderer: any;
  private controls: any;
  private gridGroup: any;
  private starsGroup: any;
  private container: HTMLElement;
  private floatingCard: HTMLElement | null = null;
  private raycaster: any;
  private mouse: any;
  
  private initialized = false;
  private events: TimelineEvent[];
  private selectedEvent: TimelineEvent | null = null;
  private starSprites = new Map<string, any>();
  private orbitalRings = new Map<string, any[]>();
  private animationStartTime = Date.now();
  
  private options: StarMapOptions;
  private containerId: string;

  constructor(containerId: string, events: TimelineEvent[], options: StarMapOptions = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId)!;
    this.events = events;
    this.options = {
      useEraColors: false,
      skyboxImageUrl: '/assets/hdri/sky_wip.webp',
      floatingCardId: `${containerId}-floating-card`,
      ...options
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.loadThreeJS();
      this.initScene();
      this.createGrid();
      this.createOrUpdateStars();
      this.setupEventListeners();
      this.animate();
      
      this.initialized = true;
      console.log('StarMapCore: Initialization complete');
      
      const loadingMessage = this.container.querySelector('.starmap-loading-message');
      if (loadingMessage) {
        (loadingMessage as HTMLElement).style.display = 'none';
      }
    } catch (error) {
      console.error('StarMapCore: Initialization failed', error);
      throw error;
    }
  }

  private async loadThreeJS(): Promise<void> {
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if (src.includes('three.min.js') && (window as any).THREE) {
          this.THREE = (window as any).THREE;
          resolve();
          return;
        }
        if (src.includes('OrbitControls.js') && (window as any).THREE?.OrbitControls) {
          this.OrbitControls = (window as any).THREE.OrbitControls;
          resolve();
          return;
        }
        
        // Check for existing script
        let existingScript = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
        if (existingScript) {
          if (existingScript.dataset.loaded === 'true') {
            resolve();
            return;
          }
          if (existingScript.dataset.error === 'true') {
            reject(new Error(`Previously failed: ${src}`));
            return;
          }
          existingScript.addEventListener('load', () => {
            existingScript.dataset.loaded = 'true';
            resolve();
          });
          existingScript.addEventListener('error', (e) => {
            existingScript.dataset.error = 'true';
            reject(e);
          });
          return;
        }

        // Load new script
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          script.dataset.loaded = 'true';
          resolve();
        };
        script.onerror = (e) => {
          script.dataset.error = 'true';
          reject(new Error(`Failed to load script: ${src}`));
        };
        document.head.appendChild(script);
      });
    };

    // Load Three.js
    if (!(window as any).THREE) {
      console.log('StarMapCore: Loading Three.js r128...');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
      this.THREE = (window as any).THREE;
    } else {
      this.THREE = (window as any).THREE;
    }

    if (!this.THREE) {
      throw new Error("Three.js failed to load");
    }

    // Load OrbitControls
    if (!this.THREE.OrbitControls) {
      console.log('StarMapCore: Loading OrbitControls...');
      await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');
      this.OrbitControls = this.THREE.OrbitControls;
    } else {
      this.OrbitControls = this.THREE.OrbitControls;
    }

    if (!this.OrbitControls) {
      throw new Error("OrbitControls failed to load");
    }
  }

  private initScene(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    if (width === 0 || height === 0) {
      console.warn(`StarMapCore: Container dimensions are zero (W: ${width}, H: ${height}).`);
    }

    // Scene setup
    this.scene = new this.THREE.Scene();
    
    // Camera setup
    this.camera = new this.THREE.PerspectiveCamera(60, width / Math.max(1, height), 0.1, 2000);
    this.camera.position.set(0, -260, 150);

    // Renderer setup
    this.renderer = new this.THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, Math.max(1, height));
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Raycaster for interaction
    this.raycaster = new this.THREE.Raycaster();
    this.mouse = new this.THREE.Vector2();

    // Load skybox
    const textureLoader = new this.THREE.TextureLoader();
    const skyTexture = textureLoader.load(
      this.options.skyboxImageUrl!,
      () => console.log('StarMapCore: Skybox loaded'),
      undefined,
      (err) => console.error('StarMapCore: Error loading skybox', err)
    );
    skyTexture.mapping = this.THREE.EquirectangularReflectionMapping;
    const skyMaterial = new this.THREE.MeshBasicMaterial({ 
      map: skyTexture, 
      side: this.THREE.BackSide, 
      depthWrite: false 
    });
    this.scene.add(new this.THREE.Mesh(
      new this.THREE.SphereGeometry(1000, 60, 40), 
      skyMaterial
    ));

    // Create groups
    this.starsGroup = new this.THREE.Group();
    this.scene.add(this.starsGroup);
    
    this.gridGroup = new this.THREE.Group();
    this.scene.add(this.gridGroup);

    // Setup controls
    this.controls = new this.OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, {
      enableDamping: true,
      dampingFactor: 0.25,
      rotateSpeed: 0.15,
      enablePan: false,
      enableZoom: false,
      minPolarAngle: this.THREE.MathUtils.degToRad(120),
      maxPolarAngle: this.THREE.MathUtils.degToRad(170),
      autoRotate: true,
      autoRotateSpeed: 0.05
    });
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    // Get floating card element
    if (this.options.floatingCardId) {
      this.floatingCard = document.getElementById(this.options.floatingCardId);
    }
  }

  private createGrid(): void {
    if (!this.gridGroup || !this.THREE) return;
    
    this.gridGroup.clear();
    const gridMaterial = new this.THREE.LineBasicMaterial({ 
      color: 0x224466, 
      transparent: true, 
      opacity: 0.05 
    });
    const gridRadius = 940;
    
    // Vertical lines (meridians)
    for (let i = 0; i < 12; i++) {
      const phi = (i / 12) * Math.PI * 2;
      const points = [];
      for (let j = 0; j <= 50; j++) {
        points.push(new this.THREE.Vector3().setFromSphericalCoords(
          gridRadius, 
          (j / 50) * Math.PI, 
          phi
        ));
      }
      this.gridGroup.add(new this.THREE.Line(
        new this.THREE.BufferGeometry().setFromPoints(points), 
        gridMaterial
      ));
    }
    
    // Horizontal lines (parallels)
    for (let i = -2; i <= 2; i++) {
      const elevationAngleDeg = i * 30;
      const polarAngleRad = Math.PI / 2 - this.THREE.MathUtils.degToRad(elevationAngleDeg);
      
      if (polarAngleRad < 0.01 || polarAngleRad > Math.PI - 0.01) continue;
      
      const points = [];
      for (let j = 0; j <= 60; j++) {
        points.push(new this.THREE.Vector3().setFromSphericalCoords(
          gridRadius, 
          polarAngleRad, 
          (j / 60) * Math.PI * 2
        ));
      }
      points.push(points[0]);
      this.gridGroup.add(new this.THREE.Line(
        new this.THREE.BufferGeometry().setFromPoints(points), 
        gridMaterial
      ));
    }
  }

  private createOrUpdateStars(eventsToDisplay: TimelineEvent[] = this.events): void {
    if (!this.starsGroup || !this.THREE) {
      console.warn('StarMapCore: createOrUpdateStars called before initialization.');
      return;
    }

    // Clear existing
    while (this.starsGroup.children.length > 0) {
      this.starsGroup.remove(this.starsGroup.children[0]);
    }
    this.starSprites.clear();
    this.orbitalRings.clear();
    
    // Group events by era
    const eventsByEra: Record<string, TimelineEvent[]> = {};
    
    eventsToDisplay.forEach(event => {
      const era = event.era || 'unknown';
      
      if (!constellationConfig[era]) {
        console.warn(`Event "${event.title}" has unknown era "${era}"`);
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

    // Create constellations
    Object.entries(eventsByEra).forEach(([era, eraEvents]) => {
      const config = constellationConfig[era];
      if (!config) return;

      const pattern = constellationPatterns[config.pattern] || constellationPatterns.scattered;
      
      eraEvents.forEach((event, eventIndex) => {
        this.createStar(event, era, eventIndex, pattern, config);
      });
    });
    
    console.log(`StarMapCore: Created ${eventsToDisplay.length} stars in ${Object.keys(eventsByEra).length} constellations`);
    
    // Create constellation lines
    this.createConstellationLines(eventsByEra);
  }

  private createStar(
    event: TimelineEvent, 
    era: string, 
    eventIndex: number, 
    pattern: any[], 
    config: any
  ): void {
    try {
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

      const uniqueStarId = `${event.slug}-${event.year}-${eventIndex}`;
      const mainColor = getStarColor(uniqueStarId, event.era, this.options.useEraColors);
      const starType = getStarType(uniqueStarId, event.isKeyEvent || false);
      
      // Create star texture
      const starTexture = createAdvancedStarTexture(
        this.THREE,
        mainColor, 
        starType, 
        event.isKeyEvent || false, 
        false, 
        false, 
        this.animationStartTime
      );
      
      const spriteMaterial = new this.THREE.SpriteMaterial({ 
        map: starTexture, 
        transparent: true,
        alphaTest: 0.01,
        blending: this.THREE.AdditiveBlending
      });
      
      const sprite = new this.THREE.Sprite(spriteMaterial);
      
      // Position
      const radius = 995;
      sprite.position.setFromSphericalCoords(radius, polarAngleRad, azimuthRad);
      
      // Scale
      const baseScale = event.isKeyEvent ? 44 : 32;
      const scaleVariation = 0.8 + (Math.random() * 0.4);
      sprite.scale.setScalar(baseScale * scaleVariation);
      
      // Store data
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
      this.starSprites.set(event.slug, sprite);
      
      // Create orbital rings
      const rings = this.createOrbitalRingsForStar(sprite, sprite.userData);
      rings.forEach(ring => this.starsGroup.add(ring));
      this.orbitalRings.set(event.slug, rings);
      
    } catch (error) {
      console.error(`Error creating star for event "${event.title}":`, error);
    }
  }

  private createOrbitalRingsForStar(starSprite: any, eventData: any): any[] {
    const rings = [];
    const color = eventData.mainColor;
    
    // Base ring
    const baseRingTexture = createOrbitalRingTexture(this.THREE, color, 'base');
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
      parentStar: eventData.slug,
      animationPhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.0005
    };
    rings.push(baseRing);
    
    // Initialization ring
    if (!this.orbitalRings.has(eventData.slug)) {
      const initRingTexture = createOrbitalRingTexture(this.THREE, color, 'init');
      const initRingMaterial = new this.THREE.SpriteMaterial({ 
        map: initRingTexture, 
        transparent: true,
        opacity: 0.9,
        blending: this.THREE.AdditiveBlending
      });
      const initRing = new this.THREE.Sprite(initRingMaterial);
      initRing.position.copy(starSprite.position);
      initRing.scale.setScalar(starSprite.scale.x * 0.2);
      initRing.userData = {
        type: 'init',
        parentStar: eventData.slug,
        startTime: Date.now(),
        duration: 3000,
        scaleStart: starSprite.scale.x * 0.2,
        scaleEnd: starSprite.scale.x * 5
      };
      rings.push(initRing);
    }
    
    return rings;
  }

  private createConstellationLines(eventsByEra: Record<string, TimelineEvent[]>): void {
    Object.entries(eventsByEra).forEach(([era, eraEvents]) => {
      if (eraEvents.length < 2) return;
      
      const config = constellationConfig[era];
      if (!config) return;
      
      const connections = connectionPatterns[config.pattern] || connectionPatterns.scattered;
      const linePositions = [];
      
      connections.forEach(([startIdx, endIdx]) => {
        if (startIdx < eraEvents.length && endIdx < eraEvents.length) {
          const startSprite = this.starSprites.get(eraEvents[startIdx].slug);
          const endSprite = this.starSprites.get(eraEvents[endIdx].slug);
          
          if (startSprite && endSprite) {
            linePositions.push(startSprite.position.clone());
            linePositions.push(endSprite.position.clone());
          }
        }
      });
      
      if (linePositions.length > 0) {
        const lineGeometry = new this.THREE.BufferGeometry().setFromPoints(linePositions);
        const lineMaterial = new this.THREE.LineDashedMaterial({ 
          color: eraColorMap[era] || '#6366f1',
          transparent: true,
          opacity: 0.2,
          linewidth: 2,
          dashSize: 3,
          gapSize: 2
        });
        
        const constellationLine = new this.THREE.LineSegments(lineGeometry, lineMaterial);
        constellationLine.computeLineDistances();
        this.starsGroup.add(constellationLine);
      }
    });
  }

  private updateStarAnimations(): void {
    const currentTime = Date.now();
    
    this.starSprites.forEach((sprite, slug) => {
      const userData = sprite.userData;
      if (!userData) return;
      
      const timeSinceCreation = currentTime - userData.animationStartTime;
      
      if (currentTime - userData.lastUpdateTime > 150) {
        const newTexture = createAdvancedStarTexture(
          this.THREE,
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
    
    this.updateOrbitalRings();
  }

  private updateOrbitalRings(): void {
    const currentTime = Date.now();
    
    this.orbitalRings.forEach((rings, starSlug) => {
      rings.forEach((ring, index) => {
        const userData = ring.userData;
        
        if (userData.type === 'base') {
          userData.animationPhase += userData.rotationSpeed;
          ring.rotation.z = userData.animationPhase;
          const pulse = 0.1 + Math.sin(currentTime * 0.001 + userData.animationPhase) * 0.05;
          ring.material.opacity = pulse;
          
        } else if (userData.type === 'selected') {
          userData.animationPhase += userData.rotationSpeed;
          ring.rotation.z = userData.animationPhase;
          const pulsePhase = Math.sin(currentTime * userData.pulseSpeed + userData.animationPhase);
          const scale = userData.scaleBase * (0.9 + pulsePhase * 0.3);
          ring.scale.setScalar(scale);
          const opacity = 0.3 + Math.abs(pulsePhase) * 0.5;
          ring.material.opacity = opacity;
          
        } else if (userData.type === 'init') {
          const elapsed = currentTime - userData.startTime;
          const progress = Math.min(elapsed / userData.duration, 1);
          
          if (progress >= 1) {
            if (ring.parent) ring.parent.remove(ring);
            rings.splice(index, 1);
            return;
          }
          
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const scale = userData.scaleStart + (userData.scaleEnd - userData.scaleStart) * easeOut;
          ring.scale.setScalar(scale);
          ring.material.opacity = 0.9 * (1 - progress);
        }
      });
    });
  }

  private setupEventListeners(): void {
    // FOV Zoom
    const minFov = 15;
    const maxFov = 45;
    const fovStep = 2;

    this.renderer.domElement.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        this.camera.fov = Math.max(minFov, this.camera.fov - fovStep);
      } else {
        this.camera.fov = Math.min(maxFov, this.camera.fov + fovStep);
      }
      this.camera.updateProjectionMatrix();
    }, { passive: false });

    // Mouse interaction
    let currentHoveredSprite: any = null;
    
    const onMouseMove = (event: MouseEvent) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.starsGroup.children);

      if (intersects.length > 0 && intersects[0].object !== currentHoveredSprite) {
        if (currentHoveredSprite) {
          this.handleStarHover(currentHoveredSprite, false);
        }
        
        currentHoveredSprite = intersects[0].object;
        if (currentHoveredSprite.userData.uniqueId) {
          this.handleStarHover(currentHoveredSprite, true);
          this.container.style.cursor = 'pointer';
        } else {
          currentHoveredSprite = null;
          this.container.style.cursor = 'default';
        }
      } else if (intersects.length === 0 && currentHoveredSprite) {
        this.handleStarHover(currentHoveredSprite, false);
        currentHoveredSprite = null;
        this.container.style.cursor = 'default';
      }
    };

    const onMouseClick = (event: MouseEvent) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.starsGroup.children);

      if (intersects.length > 0 && intersects[0].object.userData.uniqueId) {
        this.handleStarClick(intersects[0].object);
      } else {
        if (this.selectedEvent) {
          const spriteToDeselect = this.starSprites.get(this.selectedEvent.slug);
          if (spriteToDeselect) {
            spriteToDeselect.userData.isSelected = false;
            if (spriteToDeselect.material) spriteToDeselect.material.opacity = 1.0;
            this.updateOrbitalRingsForStar(spriteToDeselect, spriteToDeselect.userData);
          }
        }
        this.renderCard(null, null);
      }
    };

    this.container.addEventListener('mousemove', onMouseMove);
    this.container.addEventListener('click', onMouseClick);
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private handleStarClick(intersectedSprite: any): void {
    const eventData = intersectedSprite.userData;
    
    this.starSprites.forEach((sprite, slug) => {
      const wasSelected = sprite.userData.isSelected;
      sprite.userData.isSelected = sprite === intersectedSprite;
      sprite.userData.isHovered = false;
      
      if (sprite.material && sprite.material.opacity !== undefined) {
        sprite.material.opacity = sprite === intersectedSprite ? 1.0 : 0.7;
      }
      
      if (wasSelected !== sprite.userData.isSelected) {
        this.updateOrbitalRingsForStar(sprite, sprite.userData);
      }
    });
    
    if (this.selectedEvent && this.selectedEvent.slug === eventData.slug) {
      this.renderCard(null, null);
      this.starSprites.forEach((sprite, slug) => {
        sprite.userData.isSelected = false;
        if (sprite.material && sprite.material.opacity !== undefined) sprite.material.opacity = 1.0;
        this.updateOrbitalRingsForStar(sprite, sprite.userData);
      });
    } else {
      const screenPosition = getScreenPosition(intersectedSprite, this.camera, this.container);
      this.renderCard(eventData, screenPosition);
      
      this.container.dispatchEvent(new CustomEvent('starmap:selectstar', {
        detail: { 
          slug: eventData.slug, 
          eventData: eventData,
          screenPosition: screenPosition
        },
        bubbles: true,
        composed: true
      }));
    }
  }

  private handleStarHover(intersectedSprite: any, isHovering: boolean): void {
    if (intersectedSprite && intersectedSprite.userData) {
      intersectedSprite.userData.isHovered = isHovering;
    }
  }

  private updateOrbitalRingsForStar(starSprite: any, eventData: any): void {
    const currentRings = this.orbitalRings.get(eventData.slug) || [];
    
    currentRings.forEach((ring, index) => {
      if (ring.userData.type === 'selected') {
        if (ring.parent) ring.parent.remove(ring);
        currentRings.splice(index, 1);
      }
    });
    
    if (eventData.isSelected) {
      for (let i = 0; i < 2; i++) {
        const selectedRingTexture = createOrbitalRingTexture(this.THREE, eventData.mainColor, 'selected');
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
          parentStar: eventData.slug,
          animationPhase: Math.random() * Math.PI * 2 + i * Math.PI,
          rotationSpeed: 0.001 * (i + 1),
          pulseSpeed: 0.002,
          scaleBase: starSprite.scale.x * (2.5 + i * 0.5)
        };
        currentRings.push(selectedRing);
        this.starsGroup.add(selectedRing);
      }
    }
    
    this.orbitalRings.set(eventData.slug, currentRings);
  }

  private renderCard(eventData: TimelineEvent | null, screenPosition: any): void {
    if (!this.floatingCard) return;

    if (!eventData || !screenPosition || !screenPosition.isInFront) {
      this.floatingCard.style.opacity = '0';
      this.floatingCard.style.pointerEvents = 'none';
      this.floatingCard.innerHTML = '';
      this.selectedEvent = null;
      return;
    }

    const rect = this.container.getBoundingClientRect();
    const { x: cardX, y: cardY, positionClass } = calculateCardPosition(
      screenPosition.x, 
      screenPosition.y, 
      rect
    );

    const cardHTML = `
      <div class="timeline-card card-base absolute z-30 ${positionClass} bg-[var(--card-bg)] backdrop-blur-sm shadow-lg w-[200px] p-3">
        <div class="font-bold text-75 text-sm mb-1 card-title">${eventData.title}</div>
        <div class="text-50 text-xs line-clamp-2 card-description">${eventData.description || ''}</div>
        <a href="/posts/${eventData.slug}/#post-container" class="timeline-link text-[0.65rem] mt-1 inline-block py-0.5 px-1.5 rounded-full bg-[oklch(0.9_0.05_var(--hue))/0.1] dark:bg-[oklch(0.3_0.05_var(--hue))/0.2] text-[oklch(0.4_0.05_var(--hue))] dark:text-[oklch(0.9_0.05_var(--hue))]">View Event &rarr;</a>
        <div class="card-pointer absolute bg-inherit"></div>
      </div>
    `;
    
    this.floatingCard.innerHTML = cardHTML;
    this.floatingCard.style.left = `${cardX}px`;
    this.floatingCard.style.top = `${cardY}px`;
    this.floatingCard.style.opacity = '1';
    this.floatingCard.style.pointerEvents = 'auto';
    
    this.selectedEvent = eventData;
  }

  private updateCardPosition(): void {
    if (!this.selectedEvent || !this.floatingCard || this.floatingCard.style.opacity === '0') return;
    
    const selectedSprite = this.starSprites.get(this.selectedEvent.slug);
    if (selectedSprite) {
      const screenPosData = getScreenPosition(selectedSprite, this.camera, this.container);
      
      if (screenPosData.isInFront) {
        const cardWidth = this.floatingCard.offsetWidth || 200;
        const cardHeight = this.floatingCard.offsetHeight || 100;
        const margin = 20;

        let xPos = screenPosData.x;
        let yPos = screenPosData.y;

        let finalX = xPos - cardWidth / 2;
        let finalY = yPos - cardHeight - margin;

        const containerRect = this.container.getBoundingClientRect();

        if (finalX < margin) finalX = xPos + margin;
        else if (finalX + cardWidth > containerRect.width - margin) finalX = xPos - cardWidth - margin;
        
        if (finalY < margin) finalY = yPos + margin;
        
        this.floatingCard.style.left = `${finalX}px`;
        this.floatingCard.style.top = `${finalY}px`;
        this.floatingCard.style.opacity = '1';
      } else {
        this.renderCard(null, null);
      }
    } else {
      this.renderCard(null, null);
    }
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    if (!this.initialized || !this.controls || !this.renderer || !this.scene || !this.camera) return;
    
    try {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.updateCardPosition();
      
      const currentTime = Date.now();
      if (currentTime % 150 < 16) {
        this.updateStarAnimations();
      }
    } catch (e) {
      console.error('StarMapCore: Error in animate loop:', e);
    }
  }

  private onWindowResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    if (width === 0 || height === 0) {
      console.warn("StarMapCore: onWindowResize detected zero dimensions. Skipping resize.");
      return;
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Public API
  updateEvents(newEvents: TimelineEvent[]): void {
    this.events = newEvents;
    if (this.initialized) {
      this.createOrUpdateStars(this.events);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  resetView(): void {
    if (this.controls) {
      this.controls.reset();
      this.camera.fov = 60;
      this.camera.updateProjectionMatrix();
    }
  }

  getConstellationInfo(): any {
    const eventsByEra: Record<string, TimelineEvent[]> = {};
    this.events.forEach(event => {
      const era = event.era || 'unknown';
      if (!eventsByEra[era]) eventsByEra[era] = [];
      eventsByEra[era].push(event);
    });
    return {
      constellations: Object.keys(eventsByEra).map(era => ({
        era,
        events: eventsByEra[era].length,
        config: constellationConfig[era],
        color: eraColorMap[era]
      }))
    };
  }
}