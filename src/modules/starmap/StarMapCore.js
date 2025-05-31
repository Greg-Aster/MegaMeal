// src/modules/starmap/StarMapCore.js
// Core Three.js scene management and rendering

export class StarMapCore {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      skyboxImageUrl: "/assets/hdri/sky_wip2.webp",
      isMobile: false,
      ...options
    };
    
    // Core Three.js objects
    this.THREE = null;
    this.OrbitControls = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = null;
    this.mouse = null;
    
    // Groups
    this.starsGroup = null;
    this.gridGroup = null;
    
    // State
    this.initialized = false;
    this.animationId = null;
    
    this.init = this.init.bind(this);
    this.animate = this.animate.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
  }

  async init() {
    if (this.initialized) return;

    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container with ID #${this.containerId} not found.`);
    }

    try {
      await this.loadThreeJS();
      this.setupScene(container);
      this.setupControls();
      this.setupEventListeners();
      this.animate();
      
      this.initialized = true;
      console.log('[StarMapCore] Initialization complete');
      
      // Hide loading message
      const loadingEl = container.querySelector('.starmap-loading-message');
      if (loadingEl) loadingEl.style.display = 'none';
      
    } catch (error) {
      console.error('[StarMapCore] Initialization error:', error);
      throw error;
    }
  }

  async loadThreeJS() {
    // Load Three.js if not already loaded
    if (!window.THREE) {
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
      this.THREE = window.THREE;
    } else {
      this.THREE = window.THREE;
    }

    if (!this.THREE) {
      throw new Error("Three.js failed to load");
    }

    // Load OrbitControls
    if (!this.THREE.OrbitControls) {
      await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');
      this.OrbitControls = this.THREE.OrbitControls;
    } else {
      this.OrbitControls = this.THREE.OrbitControls;
    }

    if (!this.OrbitControls) {
      throw new Error("OrbitControls failed to load");
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      let existingScript = document.querySelector(`script[src="${src}"]`);
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
  }

  setupScene(container) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    if (width === 0 || height === 0) {
      console.warn(`[StarMapCore] Container dimensions are zero (W: ${width}, H: ${height}).`);
    }

    // Scene
    this.scene = new this.THREE.Scene();
    
    // Camera
    this.camera = new this.THREE.PerspectiveCamera(60, width / Math.max(1, height), 0.1, 2000);
    this.camera.position.set(0, -150, 120);

    // Renderer
    this.renderer = new this.THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, Math.max(1, height));
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(this.renderer.domElement);

    // Raycaster for interactions
    this.raycaster = new this.THREE.Raycaster();
    this.mouse = new this.THREE.Vector2();

    // Create groups
    this.starsGroup = new this.THREE.Group();
    this.scene.add(this.starsGroup);
    
    this.gridGroup = new this.THREE.Group();
    this.scene.add(this.gridGroup);

    // Load skybox
    this.loadSkybox();
    
    // Create grid
    this.createGrid();
  }

  loadSkybox() {
    const textureLoader = new this.THREE.TextureLoader();
    const skyTexture = textureLoader.load(
      this.options.skyboxImageUrl,
      () => console.log('[StarMapCore] Skybox texture loaded.'),
      undefined,
      (err) => console.error('[StarMapCore] Error loading skybox texture:', err)
    );
    
    skyTexture.mapping = this.THREE.EquirectangularReflectionMapping;
    const skyMaterial = new this.THREE.MeshBasicMaterial({ 
      map: skyTexture, 
      side: this.THREE.BackSide, 
      depthWrite: false 
    });
    
    const skyGeometry = new this.THREE.SphereGeometry(1000, 60, 40);
    const skyMesh = new this.THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(skyMesh);
  }

  createGrid() {
    if (!this.gridGroup || !this.THREE) return;
    
    this.gridGroup.clear();
    const gridMaterial = new this.THREE.LineBasicMaterial({ 
      color: 0x224466, 
      transparent: true, 
      opacity: 0.05 
    });
    const gridRadius = 940;
    
    // Meridian lines
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
      const lineGeometry = new this.THREE.BufferGeometry().setFromPoints(points);
      const line = new this.THREE.Line(lineGeometry, gridMaterial);
      this.gridGroup.add(line);
    }
    
    // Parallel lines
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
      points.push(points[0]); // Close the circle
      
      const lineGeometry = new this.THREE.BufferGeometry().setFromPoints(points);
      const line = new this.THREE.Line(lineGeometry, gridMaterial);
      this.gridGroup.add(line);
    }
  }

  setupControls() {
    this.controls = new this.OrbitControls(this.camera, this.renderer.domElement);
    
    Object.assign(this.controls, {
      enableDamping: true,
      dampingFactor: 0.25,
      rotateSpeed: -0.15,
      enablePan: false,
      enableZoom: true,
      minDistance: 50,
      maxDistance: 900,
      minPolarAngle: this.THREE.MathUtils.degToRad(120),
      maxPolarAngle: this.THREE.MathUtils.degToRad(170),
      autoRotate: true,
      autoRotateSpeed: 0.05
    });
    
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    // Disable touch controls on mobile
    if (this.options.isMobile) {
      this.controls.enableRotate = false;
      this.controls.enableZoom = false;
      this.controls.enablePan = false;
      console.log('[StarMapCore] Mobile controls disabled');
    }
  }

  setupEventListeners() {
    const container = document.getElementById(this.containerId);
    
    // FOV zoom (desktop only)
    if (!this.options.isMobile) {
      this.renderer.domElement.addEventListener('wheel', (event) => {
        event.preventDefault();
        const minFov = 15;
        const maxFov = 45;
        const fovStep = 2;
        
        if (event.deltaY < 0) {
          this.camera.fov = Math.max(minFov, this.camera.fov - fovStep);
        } else {
          this.camera.fov = Math.min(maxFov, this.camera.fov + fovStep);
        }
        this.camera.updateProjectionMatrix();
      }, { passive: false });
    }

    // Window resize
    window.addEventListener('resize', this.onWindowResize);
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate);
    
    if (!this.initialized || !this.controls || !this.renderer || !this.scene || !this.camera) {
      return;
    }
    
    try {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      
      // Emit custom event for external listeners
      this.emit('frame', { 
        camera: this.camera, 
        scene: this.scene, 
        renderer: this.renderer 
      });
      
    } catch (error) {
      console.error('[StarMapCore] Error in animate loop:', error);
    }
  }

  onWindowResize() {
    const container = document.getElementById(this.containerId);
    if (!container || !this.camera || !this.renderer) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    if (width === 0 || height === 0) {
      console.warn("[StarMapCore] onWindowResize detected zero dimensions. Skipping resize.");
      return;
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Event emitter pattern for loose coupling
  emit(eventName, data) {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.dispatchEvent(new CustomEvent(`starmap:${eventName}`, {
        detail: data,
        bubbles: true,
        composed: true
      }));
    }
  }

  // API Methods
  resetView() {
    if (this.controls && this.camera) {
      this.controls.reset();
      this.camera.fov = 60;
      this.camera.updateProjectionMatrix();
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(0, -150, 120);
      this.controls.update();
    }
  }

  panUp(amount = 0.1) {
    if (this.camera) {
      this.camera.rotation.x += amount;
    }
  }

  panDown(amount = 0.1) {
    if (this.camera) {
      this.camera.rotation.x -= amount;
    }
  }

  panLeft(amount = 0.1) {
    if (this.camera) {
      this.camera.rotation.y += amount;
    }
  }

  panRight(amount = 0.1) {
    if (this.camera) {
      this.camera.rotation.y -= amount;
    }
  }

  zoomIn(amount = 3) {
    if (this.camera) {
      this.camera.fov = Math.max(15, this.camera.fov - amount);
      this.camera.updateProjectionMatrix();
    }
  }

  zoomOut(amount = 3) {
    if (this.camera) {
      this.camera.fov = Math.min(75, this.camera.fov + amount);
      this.camera.updateProjectionMatrix();
    }
  }

  toggleAutoRotate() {
    if (this.controls) {
      this.controls.autoRotate = !this.controls.autoRotate;
      return this.controls.autoRotate;
    }
    return false;
  }

  centerView() {
    if (this.controls && this.camera) {
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(0, -150, 120);
      this.controls.update();
    }
  }

  // Getters
  get isInitialized() {
    return this.initialized;
  }

  // Cleanup
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    window.removeEventListener('resize', this.onWindowResize);
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    this.initialized = false;
    console.log('[StarMapCore] Disposed');
  }
}