// /src/game/StarObservatory.ts
// Environment and location system for Star Observatory
// Based on the skybox and grid system from StarMapView.astro

export class StarObservatory {
  private THREE: any;
  private scene: any;
  private gridGroup: any;
  private physicsWorld: any;
  private starVisuals: any;
  private camera: any;
  private gameContainer: any;
  
  // State
  private isInitialized = false;
  private skyboxMesh: any = null;
  private groundMesh: any = null;
  private selectedStar: any = null;
  private onStarSelectedCallback?: (star: any) => void;
  
  // Configuration
  private readonly skyboxImageUrl = '/assets/hdri/skywip4.webp';
  private readonly gridRadius = 940;

  constructor(THREE: any, scene: any, physicsWorld?: any, camera?: any, gameContainer?: any) {
    this.THREE = THREE;
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.camera = camera;
    this.gameContainer = gameContainer;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('StarObservatory already initialized');
      return;
    }

    await this.loadSkybox();
    this.createGround();
    this.createGrid();
    this.setupLighting();
    
    this.isInitialized = true;
  }

  private async loadSkybox(): Promise<void> {
    return new Promise((resolve, reject) => {
      const textureLoader = new this.THREE.TextureLoader();
      
      textureLoader.load(
        this.skyboxImageUrl,
        (skyTexture) => {
          
          // Configure texture for equirectangular mapping
          skyTexture.mapping = this.THREE.EquirectangularReflectionMapping;
          skyTexture.colorSpace = this.THREE.SRGBColorSpace;
          skyTexture.flipY = false;
          
          // Create skybox material with proper settings for night sky
          const skyMaterial = new this.THREE.MeshBasicMaterial({ 
            map: skyTexture, 
            side: this.THREE.BackSide, 
            depthWrite: false,
            toneMapped: false // Prevent tone mapping for accurate colors
          });
          
          // Create skybox mesh
          const skyGeometry = new this.THREE.SphereGeometry(1000, 60, 40);
          this.skyboxMesh = new this.THREE.Mesh(skyGeometry, skyMaterial);
          
          // Fix 180-degree rotation issue
          this.skyboxMesh.rotation.y = Math.PI;
          
          // Add to scene
          this.scene.add(this.skyboxMesh);
          
          resolve();
        },
        (progress) => {
          // Loading progress (optional)
          console.log('Skybox loading progress:', (progress.loaded / progress.total) * 100 + '%');
        },
        (error) => {
          console.error('Failed to load skybox texture:', error);
          
          // Fallback: create a dark space background
          this.createFallbackSkybox();
          
          // Don't reject, continue with fallback
          resolve();
        }
      );
    });
  }

  private createFallbackSkybox(): void {
    console.log('Creating fallback skybox...');
    
    // Create a dark space-like gradient
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create gradient from dark blue to black
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000510'); // Dark space blue
    gradient.addColorStop(0.5, '#000208'); // Darker
    gradient.addColorStop(1, '#000000'); // Black
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some subtle stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Create texture from canvas
    const fallbackTexture = new this.THREE.CanvasTexture(canvas);
    fallbackTexture.mapping = this.THREE.EquirectangularReflectionMapping;
    
    // Create skybox material
    const skyMaterial = new this.THREE.MeshBasicMaterial({ 
      map: fallbackTexture, 
      side: this.THREE.BackSide, 
      depthWrite: false 
    });
    
    // Create skybox mesh
    const skyGeometry = new this.THREE.SphereGeometry(1000, 60, 40);
    this.skyboxMesh = new this.THREE.Mesh(skyGeometry, skyMaterial);
    
    // Add to scene
    this.scene.add(this.skyboxMesh);
    
    console.log('Fallback skybox created');
  }

  private createGround(): void {
    console.log('Creating observatory ground...');
    
    // Create a large grassy field
    const groundGeometry = new this.THREE.PlaneGeometry(500, 500, 32, 32);
    
    // Create a simple grass texture using canvas if no texture available
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create grass-like texture
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#2d5016'); // Dark green center
    gradient.addColorStop(0.5, '#1a3009'); // Darker green
    gradient.addColorStop(1, '#0d1804'); // Very dark green edges
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some texture variation
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 3 + 1;
      const brightness = Math.random() * 0.3 + 0.1;
      
      ctx.fillStyle = `rgba(${Math.floor(45 + brightness * 20)}, ${Math.floor(80 + brightness * 40)}, ${Math.floor(22 + brightness * 15)}, 0.8)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Create texture from canvas
    const groundTexture = new this.THREE.CanvasTexture(canvas);
    groundTexture.wrapS = this.THREE.RepeatWrapping;
    groundTexture.wrapT = this.THREE.RepeatWrapping;
    groundTexture.repeat.set(4, 4);
    
    // Create ground material - use MeshBasicMaterial for consistent lighting
    const groundMaterial = new this.THREE.MeshBasicMaterial({ 
      map: groundTexture,
      color: 0x556633 // Lighter green so it's visible in low light
    });
    
    // Create ground mesh
    this.groundMesh = new this.THREE.Mesh(groundGeometry, groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.groundMesh.position.y = -5; // Slightly below origin
    this.groundMesh.receiveShadow = true;
    
    // Add physics body for ground if physics world is available
    if (this.physicsWorld) {
      console.log('Adding physics collider for ground...');
      try {
        // Create a box collider for the ground
        const groundCollider = this.physicsWorld.createCollider(
          'cuboid', // Use box shape for ground
          { x: 250, y: 1, z: 250 }, // Half extents (500x2x500 box)
          { x: 0, y: -6, z: 0 } // Position slightly below visual ground
        );
        
        // Mark as static ground
        groundCollider.setBodyType('static');
        
        console.log('Ground physics collider created');
      } catch (error) {
        console.warn('Failed to create ground physics:', error);
      }
    }
    
    // Add to scene
    this.scene.add(this.groundMesh);
    
    console.log('Observatory ground created');
  }

  private createGrid(): void {
    
    this.gridGroup = new this.THREE.Group();
    this.scene.add(this.gridGroup);
    
    // Grid material - very subtle
    const gridMaterial = new this.THREE.LineBasicMaterial({ 
      color: 0x224466, 
      transparent: true, 
      opacity: 0.05 
    });
    
    // Create longitude lines (vertical meridians)
    for (let i = 0; i < 12; i++) {
      const phi = (i / 12) * Math.PI * 2; 
      const points = [];
      
      for (let j = 0; j <= 50; j++) { 
        const theta = (j / 50) * Math.PI;
        points.push(new this.THREE.Vector3().setFromSphericalCoords(this.gridRadius, theta, phi));
      }
      
      const lineGeometry = new this.THREE.BufferGeometry().setFromPoints(points);
      const line = new this.THREE.Line(lineGeometry, gridMaterial);
      this.gridGroup.add(line);
    }
    
    // Create latitude lines (horizontal circles)
    for (let i = -2; i <= 2; i++) { 
      const elevationAngleDeg = i * 30;
      const polarAngleRad = Math.PI / 2 - this.THREE.MathUtils.degToRad(elevationAngleDeg);
      
      // Skip extreme poles
      if (polarAngleRad < 0.01 || polarAngleRad > Math.PI - 0.01) continue;
      
      const points = [];
      for (let j = 0; j <= 60; j++) { 
        const azimuthRad = (j / 60) * Math.PI * 2;
        points.push(new this.THREE.Vector3().setFromSphericalCoords(this.gridRadius, polarAngleRad, azimuthRad));
      }
      
      // Close the circle
      points.push(points[0]); 
      
      const lineGeometry = new this.THREE.BufferGeometry().setFromPoints(points);
      const line = new this.THREE.Line(lineGeometry, gridMaterial);
      this.gridGroup.add(line);
    }
    
  }

  private setupLighting(): void {
    // Slightly more ambient lighting to see the ground
    const ambientLight = new this.THREE.AmbientLight(0x202040, 0.05);
    this.scene.add(ambientLight);
    
    // Stronger moonlight for ground visibility
    const moonlight = new this.THREE.DirectionalLight(0x6666aa, 0.08);
    moonlight.position.set(100, 200, 50);
    moonlight.castShadow = true;
    this.scene.add(moonlight);
  }

  // Environmental effects
  public createNebulaEffect(position: { x: number; y: number; z: number }, color = 0x6366f1): any {
    // Create a subtle nebula-like particle effect
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random positions around the given position
      positions[i3] = position.x + (Math.random() - 0.5) * 200;
      positions[i3 + 1] = position.y + (Math.random() - 0.5) * 200;
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * 200;
      
      // Color variation
      const colorObj = new this.THREE.Color(color);
      colors[i3] = colorObj.r * (0.8 + Math.random() * 0.4);
      colors[i3 + 1] = colorObj.g * (0.8 + Math.random() * 0.4);
      colors[i3 + 2] = colorObj.b * (0.8 + Math.random() * 0.4);
    }
    
    const geometry = new this.THREE.BufferGeometry();
    geometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new this.THREE.BufferAttribute(colors, 3));
    
    const material = new this.THREE.PointsMaterial({
      size: 5,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: this.THREE.AdditiveBlending
    });
    
    const nebula = new this.THREE.Points(geometry, material);
    this.scene.add(nebula);
    
    return nebula;
  }

  public createCosmicDust(): any {
    // Create ambient cosmic dust particles
    const dustCount = 500;
    const positions = new Float32Array(dustCount * 3);
    
    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      
      // Random positions in a large sphere
      const radius = 800 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
    }
    
    const geometry = new this.THREE.BufferGeometry();
    geometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
    
    const material = new this.THREE.PointsMaterial({
      size: 1,
      color: 0x666666,
      transparent: true,
      opacity: 0.1,
      blending: this.THREE.AdditiveBlending
    });
    
    const dust = new this.THREE.Points(geometry, material);
    this.scene.add(dust);
    
    return dust;
  }

  // Observatory features
  public toggleGridVisibility(visible: boolean): void {
    if (this.gridGroup) {
      this.gridGroup.visible = visible;
    }
  }

  public setGridOpacity(opacity: number): void {
    if (this.gridGroup) {
      this.gridGroup.children.forEach((line: any) => {
        if (line.material) {
          line.material.opacity = Math.max(0, Math.min(1, opacity));
        }
      });
    }
  }

  public getSkybox(): any {
    return this.skyboxMesh;
  }

  public getGrid(): any {
    return this.gridGroup;
  }

  // Update method (called each frame)
  public update(): void {
    if (!this.isInitialized) return;
    
    // Subtle grid animation
    if (this.gridGroup) {
      const time = Date.now() * 0.0001;
      const opacity = 0.03 + Math.sin(time) * 0.02;
      this.setGridOpacity(opacity);
    }
  }

  // Star interaction methods
  public setStarVisuals(starVisuals: any): void {
    this.starVisuals = starVisuals;
    this.setupStarInteractions();
  }

  private setupStarInteractions(): void {
    if (!this.starVisuals) return;

    // Star selection events
    this.starVisuals.onStarSelected((starData: any) => {
      console.log('🎯 StarObservatory: Star selection triggered:', starData?.title || 'deselected');
      
      if (starData) {
        const starSprite = this.starVisuals.getStarSprites().get(starData.uniqueId || '');
        
        if (starSprite && this.camera && this.gameContainer) {
          // Calculate screen position
          const screenPosition = this.getScreenPosition(starSprite, this.camera);
          this.selectedStar = {
            ...starData,
            screenPosition: this.calculateOptimalCardPosition(screenPosition, this.gameContainer)
          };
        } else {
          this.selectedStar = starData;
        }
        
        console.log('⭐ StarObservatory: selectedStar set:', this.selectedStar.title);
      } else {
        this.selectedStar = null;
        console.log('🌌 StarObservatory: selectedStar cleared');
      }
      
      // Notify Game.svelte of star selection
      if (this.onStarSelectedCallback) {
        this.onStarSelectedCallback(this.selectedStar);
      }
    });
  }

  public onStarSelected(callback: (star: any) => void): void {
    this.onStarSelectedCallback = callback;
  }

  private getScreenPosition(object3D: any, camera: any): { x: number; y: number; isInFront: boolean } {
    const vector = new this.THREE.Vector3();
    
    vector.setFromMatrixPosition(object3D.matrixWorld);
    vector.project(camera);
    
    const widthHalf = this.gameContainer.clientWidth / 2;
    const heightHalf = this.gameContainer.clientHeight / 2;
    
    return {
      x: (vector.x * widthHalf) + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf,
      isInFront: vector.z < 1
    };
  }

  private calculateOptimalCardPosition(screenPosition: {x: number, y: number, isInFront: boolean}, container: HTMLElement) {
    if (!screenPosition.isInFront || !container) {
      return { x: 100, y: 100, cardClass: 'timeline-card-bottom' };
    }

    const rect = container.getBoundingClientRect();
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

  public getSelectedStar(): any {
    return this.selectedStar;
  }

  // Observatory information
  public getObservatoryInfo(): any {
    return {
      name: 'Star Observatory Alpha',
      description: 'A celestial navigation facility for exploring the timeline of cosmic events',
      coordinates: { x: 0, y: 0, z: 0 },
      viewingRadius: this.gridRadius,
      skyboxLoaded: !!this.skyboxMesh,
      gridLines: this.gridGroup ? this.gridGroup.children.length : 0,
      status: this.isInitialized ? 'OPERATIONAL' : 'INITIALIZING'
    };
  }

  // Cleanup
  public dispose(): void {
    console.log('🧹 Disposing StarObservatory...');
    
    // Dispose skybox
    if (this.skyboxMesh) {
      if (this.skyboxMesh.material.map) {
        this.skyboxMesh.material.map.dispose();
      }
      this.skyboxMesh.material.dispose();
      this.skyboxMesh.geometry.dispose();
      this.scene.remove(this.skyboxMesh);
      this.skyboxMesh = null;
    }
    
    // Dispose ground
    if (this.groundMesh) {
      if (this.groundMesh.material.map) {
        this.groundMesh.material.map.dispose();
      }
      this.groundMesh.material.dispose();
      this.groundMesh.geometry.dispose();
      this.scene.remove(this.groundMesh);
      this.groundMesh = null;
    }
    
    // Dispose grid
    if (this.gridGroup) {
      this.gridGroup.children.forEach((line: any) => {
        if (line.material) line.material.dispose();
        if (line.geometry) line.geometry.dispose();
      });
      this.scene.remove(this.gridGroup);
      this.gridGroup = null;
    }
    
    this.isInitialized = false;
    console.log('✅ StarObservatory disposed');
  }
}