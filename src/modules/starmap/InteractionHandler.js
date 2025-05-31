// src/modules/starmap/InteractionHandler.js
// Handles mouse and touch interactions with the starmap

export class InteractionHandler {
  constructor(starMapCore, starManager, options = {}) {
    this.core = starMapCore;
    this.starManager = starManager;
    this.options = {
      isMobile: false,
      floatingCardId: null,
      ...options
    };
    
    // Interaction state
    this.currentHoveredSprite = null;
    this.selectedEvent = null;
    this.floatingCard = null;
    
    // Bind methods
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseClick = this.onMouseClick.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    
    this.init();
  }

  init() {
    const container = document.getElementById(this.core.containerId);
    if (!container) {
      console.error('[InteractionHandler] Container not found');
      return;
    }

    // Setup floating card reference
    if (this.options.floatingCardId) {
      this.floatingCard = document.getElementById(this.options.floatingCardId);
    }

    // Setup event listeners based on device type
    if (!this.options.isMobile) {
      // Desktop: Mouse interactions
      container.addEventListener('mousemove', this.onMouseMove);
      container.addEventListener('click', this.onMouseClick);
    } else {
      // Mobile: Touch interactions only for star selection
      container.addEventListener('touchend', this.onTouchEnd);
      console.log('[InteractionHandler] Mobile touch interactions enabled');
    }

    // Listen to star manager events
    container.addEventListener('starmap:star-selected', this.handleStarSelected.bind(this));
    container.addEventListener('starmap:star-deselected', this.handleStarDeselected.bind(this));
  }

  // === MOUSE INTERACTIONS (DESKTOP) ===
  onMouseMove(event) {
    if (this.options.isMobile) return;

    const container = document.getElementById(this.core.containerId);
    const rect = container.getBoundingClientRect();
    
    this.core.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.core.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.core.raycaster.setFromCamera(this.core.mouse, this.core.camera);
    const intersects = this.core.raycaster.intersectObjects(this.core.starsGroup.children);

    this.handleHoverInteractions(intersects, container);
  }

  onMouseClick(event) {
    if (this.options.isMobile) return;

    const container = document.getElementById(this.core.containerId);
    const rect = container.getBoundingClientRect();
    
    this.core.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.core.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.core.raycaster.setFromCamera(this.core.mouse, this.core.camera);
    const starSpriteArray = this.starManager.getAllStars();
    const intersects = this.core.raycaster.intersectObjects(starSpriteArray);

    this.handleClickInteractions(intersects);
  }

  // === TOUCH INTERACTIONS (MOBILE) ===
  onTouchEnd(event) {
    if (!this.options.isMobile) return;

    event.preventDefault();

    if (!event.changedTouches || event.changedTouches.length === 0) {
      return;
    }

    const touch = event.changedTouches[0];
    const container = document.getElementById(this.core.containerId);
    const rect = container.getBoundingClientRect();
    
    this.core.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    this.core.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.core.raycaster.setFromCamera(this.core.mouse, this.core.camera);
    const starSpriteArray = this.starManager.getAllStars();
    const intersects = this.core.raycaster.intersectObjects(starSpriteArray);
    
    this.handleClickInteractions(intersects);
  }

  // === INTERACTION HANDLERS ===
  handleHoverInteractions(intersects, container) {
    if (intersects.length > 0 && intersects[0].object !== this.currentHoveredSprite) {
      // Unhover previous sprite
      if (this.currentHoveredSprite) {
        this.starManager.handleStarHover(this.currentHoveredSprite, false);
      }
      
      // Hover new sprite
      this.currentHoveredSprite = intersects[0].object;
      if (this.currentHoveredSprite.userData && this.currentHoveredSprite.userData.uniqueId) {
        this.starManager.handleStarHover(this.currentHoveredSprite, true);
        container.style.cursor = 'pointer';
      } else {
        this.currentHoveredSprite = null;
        container.style.cursor = 'default';
      }
    } else if (intersects.length === 0 && this.currentHoveredSprite) {
      // Unhover when no intersections
      this.starManager.handleStarHover(this.currentHoveredSprite, false);
      this.currentHoveredSprite = null;
      container.style.cursor = 'default';
    }
  }

  handleClickInteractions(intersects) {
    if (intersects.length > 0 && intersects[0].object.userData && intersects[0].object.userData.uniqueId) {
      // Star was clicked
      this.starManager.handleStarClick(intersects[0].object);
    } else {
      // Empty space clicked - deselect current star
      this.deselectCurrentStar();
    }
  }

  deselectCurrentStar() {
    if (this.selectedEvent) {
      const spriteIdToGet = this.selectedEvent.uniqueId || this.selectedEvent.slug;
      const spriteToDeselect = this.starManager.getStarByUniqueId(spriteIdToGet);
      
      if (spriteToDeselect) {
        spriteToDeselect.userData.isSelected = false;
        if (spriteToDeselect.material) {
          spriteToDeselect.material.opacity = 1.0;
        }
        this.starManager.updateOrbitalRingsForStar(spriteToDeselect, spriteToDeselect.userData);
      }
    }
    this.renderCard(null);
  }

  // === STAR SELECTION HANDLERS ===
  handleStarSelected(event) {
    const { eventData, sprite } = event.detail;
    this.selectedEvent = eventData;
    
    const screenPosition = this.getScreenPosition(sprite);
    this.renderCard(eventData, screenPosition);
    
    // Update card position during camera movement
    this.setupCardTracking();
  }

  handleStarDeselected(event) {
    this.selectedEvent = null;
    this.renderCard(null);
  }

  // === CARD RENDERING ===
  renderCard(eventData, screenPosition = null) {
    if (!this.floatingCard) return;

    // Hide card if no event data or screen position
    if (!eventData || !screenPosition || !screenPosition.isInFront) {
      this.floatingCard.style.opacity = '0';
      this.floatingCard.style.pointerEvents = 'none';
      this.floatingCard.innerHTML = '';
      this.selectedEvent = null;
      return;
    }

    const container = document.getElementById(this.core.containerId);
    const rect = container.getBoundingClientRect();
    const { x: eventX, y: eventY } = screenPosition;

    // Card positioning configuration
    const cardWidth = 200;
    const cardHeight = 100;
    const edgeMargin = 10;
    const offsetX = -35;
    const offsetY = -35;

    let cardX = eventX + offsetX;
    let cardY = eventY + offsetY;

    // Edge detection and adjustment
    if (cardX + cardWidth > rect.width - edgeMargin) {
      cardX = rect.width - cardWidth - edgeMargin;
    }
    if (cardX < edgeMargin) {
      cardX = edgeMargin;
    }
    if (cardY + cardHeight > rect.height - edgeMargin) {
      cardY = rect.height - cardHeight - edgeMargin;
    }
    if (cardY < edgeMargin) {
      cardY = edgeMargin;
    }

    // Determine pointer position class
    let positionClass = this.calculateCardPointerPosition(eventX, eventY, cardX, cardY, cardWidth, cardHeight);

    const cardHTML = this.generateCardHTML(eventData, positionClass);
    
    this.floatingCard.innerHTML = cardHTML;
    this.floatingCard.style.left = `${cardX}px`;
    this.floatingCard.style.top = `${cardY}px`;
    this.floatingCard.style.opacity = '1';
    this.floatingCard.style.pointerEvents = 'auto';
  }

  calculateCardPointerPosition(eventX, eventY, cardX, cardY, cardWidth, cardHeight) {
    const cardCenterX = cardX + cardWidth / 2;
    const cardCenterY = cardY + cardHeight / 2;

    const deltaX = eventX - cardCenterX;
    const deltaY = eventY - cardCenterY;

    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      return (deltaX > 0) ? 'timeline-card-left' : 'timeline-card-right';
    } else {
      return (deltaY > 0) ? 'timeline-card-top' : 'timeline-card-bottom';
    }
  }

  generateCardHTML(eventData, positionClass) {
    return `
      <div class="timeline-card card-base absolute z-30 ${positionClass} bg-[var(--card-bg)] backdrop-blur-sm shadow-lg w-[200px] p-3">
        <div class="font-bold text-75 text-sm mb-1 card-title">${eventData.title}</div>
        <div class="text-50 text-xs line-clamp-2 card-description">${eventData.description || ''}</div>
        <a href="/posts/${eventData.slug}/#post-container" class="timeline-link text-[0.65rem] mt-1 inline-block py-0.5 px-1.5 rounded-full bg-[oklch(0.9_0.05_var(--hue))/0.1] dark:bg-[oklch(0.3_0.05_var(--hue))/0.2] text-[oklch(0.4_0.05_var(--hue))] dark:text-[oklch(0.9_0.05_var(--hue))]">View Event &rarr;</a>
        <div class="card-pointer absolute bg-inherit"></div>
      </div>
    `;
  }

  // === CARD TRACKING ===
  setupCardTracking() {
    // Listen to frame updates to keep card in sync with camera movement
    const container = document.getElementById(this.core.containerId);
    container.addEventListener('starmap:frame', this.updateCardPosition.bind(this));
  }

  updateCardPosition() {
    if (!this.selectedEvent || !this.floatingCard || this.floatingCard.style.opacity === '0') {
      return;
    }
    
    const spriteIdToGet = this.selectedEvent.uniqueId || this.selectedEvent.slug;
    const selectedSprite = this.starManager.getStarByUniqueId(spriteIdToGet);

    if (selectedSprite) {
      const screenPosData = this.getScreenPosition(selectedSprite);
      
      if (screenPosData.isInFront) {
        // Update card position
        const cardWidth = this.floatingCard.offsetWidth || 200; 
        const cardHeight = this.floatingCard.offsetHeight || 100;
        const margin = 20;

        let xPos = screenPosData.x;
        let yPos = screenPosData.y;

        let finalX = xPos + margin;
        let finalY = yPos - (cardHeight / 2);

        const containerRect = document.getElementById(this.core.containerId).getBoundingClientRect();

        if (finalX < margin) {
          finalX = xPos + margin;
        } else if (finalX + cardWidth > containerRect.width - margin) {
          finalX = xPos - cardWidth - margin;
        }
        
        if (finalY < margin) {
          finalY = yPos + margin;
        }
        
        this.floatingCard.style.left = `${finalX}px`;
        this.floatingCard.style.top = `${finalY}px`;
        this.floatingCard.style.opacity = '1';
      } else {
        // Star is behind camera, hide card
        this.renderCard(null);
      }
    } else {
      // Selected sprite no longer exists, hide card
      this.renderCard(null);
    }
  }

  // === UTILITY METHODS ===
  getScreenPosition(object3D) {
    const container = document.getElementById(this.core.containerId);
    const vector = new this.core.THREE.Vector3();
    
    vector.setFromMatrixPosition(object3D.matrixWorld);
    vector.project(this.core.camera);
    
    const widthHalf = container.clientWidth / 2;
    const heightHalf = container.clientHeight / 2;
    
    return {
      x: (vector.x * widthHalf) + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf,
      isInFront: vector.z < 1
    };
  }

  // === PUBLIC API ===
  setMobileMode(isMobile) {
    if (this.options.isMobile === isMobile) return;
    
    this.options.isMobile = isMobile;
    this.dispose();
    this.init();
  }

  getCurrentSelection() {
    return this.selectedEvent;
  }

  clearSelection() {
    this.deselectCurrentStar();
  }

  // === CLEANUP ===
  dispose() {
    const container = document.getElementById(this.core.containerId);
    if (container) {
      container.removeEventListener('mousemove', this.onMouseMove);
      container.removeEventListener('click', this.onMouseClick);
      container.removeEventListener('touchend', this.onTouchEnd);
      container.removeEventListener('starmap:frame', this.updateCardPosition);
      container.removeEventListener('starmap:star-selected', this.handleStarSelected);
      container.removeEventListener('starmap:star-deselected', this.handleStarDeselected);
    }
    
    if (this.floatingCard) {
      this.floatingCard.style.opacity = '0';
      this.floatingCard.innerHTML = '';
    }
    
    console.log('[InteractionHandler] Disposed');
  }
}