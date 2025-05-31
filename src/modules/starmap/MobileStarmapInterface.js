// src/modules/starmap/MobileStarmapInterface.js
// Mobile command interface for TimelineBanner integration

export class MobileStarmapInterface {
  constructor(starmapContainerId, options = {}) {
    this.starmapContainerId = starmapContainerId;
    this.options = {
      movementSpeed: 0.1,
      zoomSpeed: 3,
      autoRotateToggleVisualFeedback: true,
      ...options
    };
    
    // State tracking
    this.isAutoRotating = false;
    this.currentFOV = 60;
    this.minFOV = 15;
    this.maxFOV = 75;
    
    // Callbacks for UI updates
    this.onAutoRotateChange = null;
    this.onFOVChange = null;
    this.onViewReset = null;
    
    this.bindMethods();
  }

  bindMethods() {
    const methods = [
      'getStarmapAPI', 'isReady', 'moveUp', 'moveDown', 'moveLeft', 'moveRight',
      'zoomIn', 'zoomOut', 'toggleAutoRotate', 'resetView', 'centerView',
      'getCurrentSelection', 'clearSelection', 'updateEvents', 'getInfo'
    ];
    
    methods.forEach(method => {
      this[method] = this[method].bind(this);
    });
  }

  // === STARMAP ACCESS ===
  getStarmapAPI() {
    return window[`starmap_${this.starmapContainerId}`];
  }

  isReady() {
    const api = this.getStarmapAPI();
    return api && api.isInitialized && api.isInitialized();
  }

  // === MOVEMENT COMMANDS ===
  moveUp() {
    const api = this.getStarmapAPI();
    if (api && api.panUp) {
      api.panUp(this.options.movementSpeed);
      this.emitCommand('move-up', { speed: this.options.movementSpeed });
      return true;
    }
    return false;
  }

  moveDown() {
    const api = this.getStarmapAPI();
    if (api && api.panDown) {
      api.panDown(this.options.movementSpeed);
      this.emitCommand('move-down', { speed: this.options.movementSpeed });
      return true;
    }
    return false;
  }

  moveLeft() {
    const api = this.getStarmapAPI();
    if (api && api.panLeft) {
      api.panLeft(this.options.movementSpeed);
      this.emitCommand('move-left', { speed: this.options.movementSpeed });
      return true;
    }
    return false;
  }

  moveRight() {
    const api = this.getStarmapAPI();
    if (api && api.panRight) {
      api.panRight(this.options.movementSpeed);
      this.emitCommand('move-right', { speed: this.options.movementSpeed });
      return true;
    }
    return false;
  }

  // === ZOOM COMMANDS ===
  zoomIn() {
    const api = this.getStarmapAPI();
    if (api && api.zoomIn) {
      const oldFOV = this.currentFOV;
      api.zoomIn(this.options.zoomSpeed);
      
      // Update tracked FOV (approximate)
      this.currentFOV = Math.max(this.minFOV, this.currentFOV - this.options.zoomSpeed);
      
      this.emitCommand('zoom-in', { 
        oldFOV, 
        newFOV: this.currentFOV,
        zoomLevel: this.getZoomLevel()
      });
      
      if (this.onFOVChange) {
        this.onFOVChange(this.currentFOV, this.getZoomLevel());
      }
      
      return true;
    }
    return false;
  }

  zoomOut() {
    const api = this.getStarmapAPI();
    if (api && api.zoomOut) {
      const oldFOV = this.currentFOV;
      api.zoomOut(this.options.zoomSpeed);
      
      // Update tracked FOV (approximate)
      this.currentFOV = Math.min(this.maxFOV, this.currentFOV + this.options.zoomSpeed);
      
      this.emitCommand('zoom-out', { 
        oldFOV, 
        newFOV: this.currentFOV,
        zoomLevel: this.getZoomLevel()
      });
      
      if (this.onFOVChange) {
        this.onFOVChange(this.currentFOV, this.getZoomLevel());
      }
      
      return true;
    }
    return false;
  }

  // === FEATURE COMMANDS ===
  toggleAutoRotate() {
    const api = this.getStarmapAPI();
    if (api && api.toggleAutoRotate) {
      const newState = api.toggleAutoRotate();
      this.isAutoRotating = newState;
      
      this.emitCommand('toggle-auto-rotate', { 
        autoRotating: this.isAutoRotating 
      });
      
      if (this.onAutoRotateChange) {
        this.onAutoRotateChange(this.isAutoRotating);
      }
      
      return this.isAutoRotating;
    }
    return false;
  }

  resetView() {
    const api = this.getStarmapAPI();
    if (api && api.resetView) {
      api.resetView();
      
      // Reset tracked state
      this.currentFOV = 60;
      this.isAutoRotating = true; // Default state after reset
      
      this.emitCommand('reset-view', { 
        fov: this.currentFOV,
        autoRotating: this.isAutoRotating 
      });
      
      if (this.onViewReset) {
        this.onViewReset();
      }
      
      if (this.onFOVChange) {
        this.onFOVChange(this.currentFOV, this.getZoomLevel());
      }
      
      if (this.onAutoRotateChange) {
        this.onAutoRotateChange(this.isAutoRotating);
      }
      
      return true;
    }
    return false;
  }

  centerView() {
    const api = this.getStarmapAPI();
    if (api && api.centerView) {
      api.centerView();
      this.emitCommand('center-view');
      return true;
    }
    return false;
  }

  // === INTERACTION COMMANDS ===
  getCurrentSelection() {
    const api = this.getStarmapAPI();
    if (api && api.getCurrentSelection) {
      return api.getCurrentSelection();
    }
    return null;
  }

  clearSelection() {
    const api = this.getStarmapAPI();
    if (api && api.clearSelection) {
      api.clearSelection();
      this.emitCommand('clear-selection');
      return true;
    }
    return false;
  }

  // === DATA COMMANDS ===
  updateEvents(newEvents) {
    const api = this.getStarmapAPI();
    if (api && api.updateEvents) {
      api.updateEvents(newEvents);
      this.emitCommand('update-events', { eventCount: newEvents ? newEvents.length : 0 });
      return true;
    }
    return false;
  }

  // === INFO COMMANDS ===
  getInfo() {
    const api = this.getStarmapAPI();
    if (!api) {
      return {
        ready: false,
        error: 'Starmap API not available'
      };
    }

    const info = {
      ready: this.isReady(),
      isMobile: api.isMobile ? api.isMobile() : false,
      isMobilePortrait: api.isMobilePortrait ? api.isMobilePortrait() : false,
      currentFOV: this.currentFOV,
      zoomLevel: this.getZoomLevel(),
      isAutoRotating: this.isAutoRotating,
      currentSelection: this.getCurrentSelection(),
    };

    if (api.getConstellationInfo) {
      info.constellations = api.getConstellationInfo();
    }

    return info;
  }

  getZoomLevel() {
    // Convert FOV to a 0-100 zoom level (inverted, since lower FOV = more zoomed in)
    return Math.round(((this.maxFOV - this.currentFOV) / (this.maxFOV - this.minFOV)) * 100);
  }

  // === BATCH COMMANDS ===
  async executeSequence(commands) {
    const results = [];
    
    for (const command of commands) {
      const { action, params = {} } = command;
      let result = false;
      
      switch (action) {
        case 'moveUp':
          result = this.moveUp();
          break;
        case 'moveDown':
          result = this.moveDown();
          break;
        case 'moveLeft':
          result = this.moveLeft();
          break;
        case 'moveRight':
          result = this.moveRight();
          break;
        case 'zoomIn':
          result = this.zoomIn();
          break;
        case 'zoomOut':
          result = this.zoomOut();
          break;
        case 'toggleAutoRotate':
          result = this.toggleAutoRotate();
          break;
        case 'resetView':
          result = this.resetView();
          break;
        case 'centerView':
          result = this.centerView();
          break;
        case 'clearSelection':
          result = this.clearSelection();
          break;
        case 'wait':
          // For sequenced animations
          await new Promise(resolve => setTimeout(resolve, params.duration || 100));
          result = true;
          break;
        default:
          console.warn(`[MobileStarmapInterface] Unknown command: ${action}`);
          result = false;
      }
      
      results.push({ action, params, success: result });
    }
    
    this.emitCommand('sequence-executed', { commands, results });
    return results;
  }

  // === PRESET COMMANDS ===
  async quickTour() {
    return await this.executeSequence([
      { action: 'resetView' },
      { action: 'wait', params: { duration: 500 } },
      { action: 'moveLeft' },
      { action: 'wait', params: { duration: 300 } },
      { action: 'moveRight' },
      { action: 'moveRight' },
      { action: 'wait', params: { duration: 300 } },
      { action: 'moveUp' },
      { action: 'wait', params: { duration: 300 } },
      { action: 'moveDown' },
      { action: 'moveDown' },
      { action: 'wait', params: { duration: 300 } },
      { action: 'centerView' },
      { action: 'zoomIn' },
      { action: 'wait', params: { duration: 200 } },
      { action: 'zoomIn' },
      { action: 'wait', params: { duration: 500 } },
      { action: 'zoomOut' },
      { action: 'zoomOut' },
      { action: 'toggleAutoRotate' }
    ]);
  }

  async focusMode() {
    return await this.executeSequence([
      { action: 'toggleAutoRotate' }, // Turn off auto-rotate
      { action: 'centerView' },
      { action: 'zoomIn' },
      { action: 'zoomIn' }
    ]);
  }

  async overviewMode() {
    return await this.executeSequence([
      { action: 'resetView' },
      { action: 'zoomOut' },
      { action: 'toggleAutoRotate' } // Turn on auto-rotate
    ]);
  }

  // === EVENT SYSTEM ===
  emitCommand(commandName, data = {}) {
    const container = document.getElementById(this.starmapContainerId);
    if (container) {
      container.dispatchEvent(new CustomEvent(`starmap-mobile:${commandName}`, {
        detail: { ...data, timestamp: Date.now() },
        bubbles: true,
        composed: true
      }));
    }
  }

  // === CALLBACK REGISTRATION ===
  onAutoRotateChanged(callback) {
    this.onAutoRotateChange = callback;
  }

  onFOVChanged(callback) {
    this.onFOVChange = callback;
  }

  onViewResetted(callback) {
    this.onViewReset = callback;
  }

  // === OPTIONS MANAGEMENT ===
  setMovementSpeed(speed) {
    this.options.movementSpeed = Math.max(0.01, Math.min(1, speed));
  }

  setZoomSpeed(speed) {
    this.options.zoomSpeed = Math.max(1, Math.min(10, speed));
  }

  getMovementSpeed() {
    return this.options.movementSpeed;
  }

  getZoomSpeed() {
    return this.options.zoomSpeed;
  }

  // === DEBUGGING ===
  getDebugInfo() {
    return {
      starmapContainerId: this.starmapContainerId,
      options: this.options,
      state: {
        isAutoRotating: this.isAutoRotating,
        currentFOV: this.currentFOV,
        zoomLevel: this.getZoomLevel()
      },
      api: this.getStarmapAPI() ? 'Available' : 'Not Available',
      ready: this.isReady()
    };
  }

  logDebugInfo() {
    console.log('[MobileStarmapInterface] Debug Info:', this.getDebugInfo());
  }
}