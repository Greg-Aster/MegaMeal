// /src/game/StarControls.ts
// Camera controls and interaction system for Star Observatory
// Based on the controls from StarMapView.astro

export class StarControls {
  private THREE: any;
  private camera: any;
  private domElement: HTMLElement;
  private controls: any;
  private raycaster: any;
  private mouse: any;
  
  // State
  private isInitialized = false;
  private currentHoveredObject: any = null;
  private onViewChangeCallback?: () => void;
  private onStarClickCallback?: (starData: any) => void;

  // Mobile detection (will be set during initialization)
  private isMobile = false;

  constructor(THREE: any, camera: any, domElement: HTMLElement) {
    this.THREE = THREE;
    this.camera = camera;
    this.domElement = domElement;
  }

  public initialize(): void {
    if (this.isInitialized) {
      console.warn('StarControls already initialized');
      return;
    }

    this.setupCamera();
    this.setupOrbitControls();
    this.setupRaycaster();
    this.setupEventListeners();
    
    this.isInitialized = true;
  }

  private setupCamera(): void {
    // Set initial camera position for good view of stars
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);
  }

  private setupOrbitControls(): void {
    if (!this.THREE.OrbitControls) {
      console.error('OrbitControls not available');
      return;
    }

    this.controls = new this.THREE.OrbitControls(this.camera, this.domElement);
    
    // Configure controls based on StarMapView settings
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

    // Add view change callback
    this.controls.addEventListener('change', () => {
      this.onViewChangeCallback?.();
    });
  }

  private setupRaycaster(): void {
    this.raycaster = new this.THREE.Raycaster();
    this.mouse = new this.THREE.Vector2();
  }

  private setupEventListeners(): void {
    // FOV Zoom with mouse wheel
    this.setupFOVZoom();
    
    // Mouse/touch interaction
    if (this.isMobile) {
      this.setupTouchEvents();
    } else {
      this.setupMouseEvents();
    }

    // Window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private setupFOVZoom(): void {
    const minFov = 15;
    const maxFov = 45;
    const fovStep = 2;

    this.domElement.addEventListener('wheel', (event) => {
      event.preventDefault();
      
      if (event.deltaY < 0) {
        this.camera.fov = Math.max(minFov, this.camera.fov - fovStep);
      } else {
        this.camera.fov = Math.min(maxFov, this.camera.fov + fovStep);
      }
      
      this.camera.updateProjectionMatrix();
    }, { passive: false });
  }

  private setupMouseEvents(): void {
    this.domElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.domElement.addEventListener('click', this.handleMouseClick.bind(this));
  }

  private setupTouchEvents(): void {
    this.domElement.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private handleMouseMove(event: MouseEvent): void {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.updateHover();
  }

  private handleMouseClick(event: MouseEvent): void {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.handleClick();
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    if (!event.changedTouches || event.changedTouches.length === 0) {
      return;
    }

    const touch = event.changedTouches[0];
    const rect = this.domElement.getBoundingClientRect();
    
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

    this.handleClick();
  }

  private updateHover(): void {
    // This will be called by the main game to check for hover interactions
    // The actual intersection logic will be handled by StarVisuals
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }

  private handleClick(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    // Click handling will be delegated to StarVisuals
  }

  private handleResize(): void {
    if (!this.camera || !this.domElement) return;
    
    const width = this.domElement.clientWidth;
    const height = this.domElement.clientHeight;
    
    if (width === 0 || height === 0) {
      console.warn('StarControls: Resize detected zero dimensions');
      return;
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  // Public methods
  public update(): void {
    if (!this.isInitialized || !this.controls) return;
    
    try {
      this.controls.update();
    } catch (error) {
      console.error('Error updating controls:', error);
    }
  }

  public resetView(): void {
    if (!this.controls) return;
    
    this.controls.reset();
    this.camera.fov = 60;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, -150, 120);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  public getMousePosition(): { x: number; y: number } {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  public getRaycaster(): any {
    return this.raycaster;
  }

  public getScreenPosition(object3D: any): { x: number; y: number; isInFront: boolean } {
    const vector = new this.THREE.Vector3();
    
    vector.setFromMatrixPosition(object3D.matrixWorld);
    vector.project(this.camera);
    
    const widthHalf = this.domElement.clientWidth / 2;
    const heightHalf = this.domElement.clientHeight / 2;
    
    return {
      x: (vector.x * widthHalf) + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf,
      isInFront: vector.z < 1
    };
  }

  public setAutoRotate(enabled: boolean): void {
    if (this.controls) {
      this.controls.autoRotate = enabled;
    }
  }

  public getCamera(): any {
    return this.camera;
  }

  public getControls(): any {
    return this.controls;
  }

  // Event callbacks
  public onViewChange(callback: () => void): void {
    this.onViewChangeCallback = callback;
  }

  public onStarClick(callback: (starData: any) => void): void {
    this.onStarClickCallback = callback;
  }

  // Interaction helpers
  public checkIntersections(objects: any[]): any[] {
    if (!this.raycaster) return [];
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(objects);
  }

  public updateCursor(isHovering: boolean): void {
    this.domElement.style.cursor = isHovering ? 'pointer' : 'default';
  }

  public dispose(): void {
    console.log('🧹 Disposing StarControls...');
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
    }
    
    // Clear references
    this.controls = null;
    this.raycaster = null;
    this.mouse = null;
    this.currentHoveredObject = null;
    this.onViewChangeCallback = undefined;
    this.onStarClickCallback = undefined;
    
    this.isInitialized = false;
    console.log('✅ StarControls disposed');
  }
}