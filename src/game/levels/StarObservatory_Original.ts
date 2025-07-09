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
  
  // New visual effects
  private fireflies: any = null;
  private sciFiObjects: any[] = [];
  
  // Water/waterfall elements that need disposal
  private waterfallGroup: any = null;
  private waterPool: any = null;
  
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
    this.createWaterfalls();
    this.createGrid();
    this.setupLighting();
    this.createFireflies();
    
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
          
          // Try different rotation to fix upside-down skybox
          this.skyboxMesh.rotation.x = Math.PI; // Rotate on X axis instead of Y
          
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
    const skyGeometry = new this.THREE.SphereGeometry(100, 60, 40);
    this.skyboxMesh = new this.THREE.Mesh(skyGeometry, skyMaterial);
    
    // Add to scene
    this.scene.add(this.skyboxMesh);
    
    console.log('Fallback skybox created');
  }

  private createGround(): void {
    console.log('Creating floating island with rocky edges and waterfalls...');
    
    // Create a large terrain with high subdivisions for very detailed geometry
    const groundGeometry = new this.THREE.PlaneGeometry(500, 500, 512, 512);
    
    // Island parameters
    const positions = groundGeometry.attributes.position.array;
    const hillHeight = 15; // Maximum height of the central hill
    const hillRadius = 100; // Radius of the hill
    const islandRadius = 220; // Radius of the island (smaller than 250 to leave edge space)
    const edgeHeight = 8; // Height of rocky edges
    const edgeFalloff = 30; // Distance over which edges fade
    const waterfallStart = islandRadius - 10; // Where waterfalls begin
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1]; // Note: in PlaneGeometry, Y and Z are swapped
      
      // Calculate distance from center
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      
      let height = 0;
      
      // Central hill
      if (distanceFromCenter < hillRadius) {
        const heightMultiplier = Math.cos((distanceFromCenter / hillRadius) * Math.PI * 0.5);
        height = hillHeight * heightMultiplier * heightMultiplier; // Square for smoother curve
      }
      
      // Island edges with rocky terrain
      if (distanceFromCenter > islandRadius - edgeFalloff && distanceFromCenter < islandRadius) {
        // Create rocky edge effect
        const edgeProgress = (distanceFromCenter - (islandRadius - edgeFalloff)) / edgeFalloff;
        const rockiness = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 2; // Random rocky texture
        const edgeHeightMultiplier = Math.cos(edgeProgress * Math.PI * 0.5);
        
        const rockHeight = (edgeHeight + rockiness) * edgeHeightMultiplier;
        height = Math.max(height, rockHeight);
      }
      
      // Waterfall area - sharp drop to create cliff effect
      if (distanceFromCenter >= waterfallStart && distanceFromCenter < islandRadius) {
        const waterfallProgress = (distanceFromCenter - waterfallStart) / (islandRadius - waterfallStart);
        // Sudden drop for waterfall effect
        height = height * (1 - waterfallProgress * waterfallProgress);
      }
      
      // Outside island - steep drop into void
      if (distanceFromCenter >= islandRadius) {
        const voidDistance = distanceFromCenter - islandRadius;
        height = -Math.pow(voidDistance * 0.1, 2); // Exponential drop into void
      }
      
      positions[i + 2] = height; // Set the height (Z coordinate in PlaneGeometry)
    }
    
    // Add small bumps and variations to the hill for more natural look
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      
      // Add small random variations for grass texture
      const noise1 = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.3;
      const noise2 = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.1;
      const noise3 = Math.sin(x * 1.0) * Math.cos(z * 1.0) * 0.05;
      
      positions[i + 2] += noise1 + noise2 + noise3;
    }
    
    // Update the geometry
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals(); // Recalculate normals for proper lighting
    
    // Create realistic grass texture with multiple layers
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create base gradient from center (grass) to edges (rock)
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 280);
    gradient.addColorStop(0, '#3d6017'); // Bright green center (grass)
    gradient.addColorStop(0.4, '#2d5016'); // Medium green  
    gradient.addColorStop(0.7, '#4a3c28'); // Brown transition (dirt)
    gradient.addColorStop(0.85, '#5a5a5a'); // Gray rock
    gradient.addColorStop(1, '#2a2a2a'); // Dark rock edges
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add grass texture in center (keeping it simple and working)
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const distFromCenter = Math.sqrt((x - 256) ** 2 + (y - 256) ** 2);
      
      if (distFromCenter < 200) { // Grass area
        const size = Math.random() * 2 + 1;
        const brightness = Math.random() * 0.4 + 0.2;
        ctx.fillStyle = `rgba(${Math.floor(45 + brightness * 30)}, ${Math.floor(90 + brightness * 50)}, ${Math.floor(25 + brightness * 20)}, 0.7)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      } else if (distFromCenter > 220) { // Rock area
        const size = Math.random() * 4 + 2;
        const brightness = Math.random() * 0.3 + 0.1;
        ctx.fillStyle = `rgba(${Math.floor(80 + brightness * 40)}, ${Math.floor(80 + brightness * 40)}, ${Math.floor(80 + brightness * 40)}, 0.6)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Add waterfall streaks near edges
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 240 + Math.random() * 40;
      const x = 256 + Math.cos(angle) * radius;
      const y = 256 + Math.sin(angle) * radius;
      
      // Vertical blue streaks for waterfalls
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
      ctx.lineWidth = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x, y + 10);
      ctx.stroke();
    }
    
    // Create texture from canvas
    const groundTexture = new this.THREE.CanvasTexture(canvas);
    groundTexture.wrapS = this.THREE.RepeatWrapping;
    groundTexture.wrapT = this.THREE.RepeatWrapping;
    groundTexture.repeat.set(3, 3);
    
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
      console.log('Adding physics collider for hill terrain...');
      try {
        // Create a trimesh collider that matches the hill geometry
        const hillMesh = this.groundMesh.clone();
        hillMesh.updateMatrixWorld(true);
        
        // Apply the same transformation as the visual mesh
        hillMesh.rotation.x = -Math.PI / 2;
        hillMesh.position.y = -5;
        hillMesh.updateMatrixWorld(true);
        
        // Create static mesh collider for the hill
        this.physicsWorld.createStaticMesh(
          'ground-hill', 
          groundGeometry, 
          new this.THREE.Vector3(0, -5, 0), 
          new this.THREE.Quaternion().setFromEuler(new this.THREE.Euler(-Math.PI / 2, 0, 0))
        );
        
        console.log('Hill terrain physics collider created');
      } catch (error) {
        console.warn('Failed to create hill physics - using simple ground:', error);
        
        // Fallback: create a simple ground plane
        this.physicsWorld.createRigidBody('ground', {
          bodyType: 'static',
          colliderType: 'cuboid',
          position: new this.THREE.Vector3(0, -6, 0),
          rotation: new this.THREE.Quaternion(0, 0, 0, 1),
          scale: new this.THREE.Vector3(250, 1, 250),
          friction: 0.7,
          restitution: 0.0
        });
      }
    }
    
    // Add to scene
    this.scene.add(this.groundMesh);
    
    console.log('Observatory ground created');
  }

  private createWaterfalls(): void {
    console.log('Creating waterfalls around island edge...');
    
    const islandRadius = 220;
    const waterfallCount = 12; // Number of waterfalls around the edge
    const waterfallGroup = new this.THREE.Group();
    
    for (let i = 0; i < waterfallCount; i++) {
      const angle = (i / waterfallCount) * Math.PI * 2;
      const x = Math.cos(angle) * islandRadius;
      const z = Math.sin(angle) * islandRadius;
      
      // Create waterfall at this position
      this.createSingleWaterfall(x, z, waterfallGroup);
    }
    
    // Store reference and add waterfall group to scene
    this.waterfallGroup = waterfallGroup;
    this.scene.add(this.waterfallGroup);
    
    // Create water pool below the island
    this.createWaterPool();
    
    console.log(`Created ${waterfallCount} waterfalls around island edge`);
  }
  
  private createSingleWaterfall(x: number, z: number, group: any): void {
    // Create water plane for each waterfall
    const waterfallWidth = 15;
    const waterfallHeight = 30;
    
    // Water geometry
    const waterGeometry = new this.THREE.PlaneGeometry(waterfallWidth, waterfallHeight);
    
    // Create animated water material
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    // Create flowing water texture
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(150, 200, 255, 0.8)'); // Light blue top
    gradient.addColorStop(0.3, 'rgba(100, 150, 255, 0.9)'); // Medium blue
    gradient.addColorStop(0.7, 'rgba(50, 100, 200, 0.95)'); // Darker blue
    gradient.addColorStop(1, 'rgba(30, 80, 180, 1.0)'); // Deep blue bottom
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add flowing streaks
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const startY = Math.random() * canvas.height * 0.3;
      const endY = startY + canvas.height * 0.7;
      
      ctx.strokeStyle = 'rgba(200, 230, 255, 0.6)';
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x + (Math.random() - 0.5) * 10, endY);
      ctx.stroke();
    }
    
    // Create water texture
    const waterTexture = new this.THREE.CanvasTexture(canvas);
    waterTexture.wrapS = this.THREE.RepeatWrapping;
    waterTexture.wrapT = this.THREE.RepeatWrapping;
    
    // Create water material
    const waterMaterial = new this.THREE.MeshBasicMaterial({
      map: waterTexture,
      transparent: true,
      opacity: 0.7,
      side: this.THREE.DoubleSide,
      blending: this.THREE.AdditiveBlending
    });
    
    // Create water mesh
    const waterMesh = new this.THREE.Mesh(waterGeometry, waterMaterial);
    
    // Position waterfall
    waterMesh.position.set(x, -5 + waterfallHeight / 2, z);
    
    // Orient waterfall to face center (so it looks like it's falling off the edge)
    const angleToCenter = Math.atan2(z, x);
    waterMesh.rotation.y = angleToCenter;
    
    // Tilt slightly backward for waterfall effect
    waterMesh.rotation.x = 0.2;
    
    group.add(waterMesh);
    
    // Create particle system for waterfall spray
    this.createWaterfallParticles(x, z, group);
  }
  
  private createWaterfallParticles(x: number, z: number, group: any): void {
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Start particles at waterfall edge
      positions[i3] = x + (Math.random() - 0.5) * 10; // X
      positions[i3 + 1] = Math.random() * 15 - 5; // Y (height range)
      positions[i3 + 2] = z + (Math.random() - 0.5) * 10; // Z
      
      // Falling velocity
      velocities[i3] = (Math.random() - 0.5) * 2; // X drift
      velocities[i3 + 1] = -Math.random() * 10 - 5; // Y falling
      velocities[i3 + 2] = (Math.random() - 0.5) * 2; // Z drift
    }
    
    const geometry = new this.THREE.BufferGeometry();
    geometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
    
    const material = new this.THREE.PointsMaterial({
      color: 0x87CEEB, // Sky blue
      size: 2,
      transparent: true,
      opacity: 0.6,
      blending: this.THREE.AdditiveBlending
    });
    
    const particles = new this.THREE.Points(geometry, material);
    group.add(particles);
    
    // Store for animation (you could animate these in the update loop)
    particles.userData = { velocities, particleCount };
  }
  
  private createWaterPool(): void {
    console.log('Creating water pool below island...');
    
    // Create large water plane below the island
    const poolGeometry = new this.THREE.PlaneGeometry(600, 600);
    
    // Create water pool texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Create rippling water effect
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const wave = Math.sin(distance * 0.1) * 0.3 + 0.7;
        
        const blue = Math.floor(100 + wave * 100);
        const green = Math.floor(120 + wave * 80);
        
        ctx.fillStyle = `rgba(20, ${green}, ${blue}, 0.8)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    
    const poolTexture = new this.THREE.CanvasTexture(canvas);
    poolTexture.wrapS = this.THREE.RepeatWrapping;
    poolTexture.wrapT = this.THREE.RepeatWrapping;
    poolTexture.repeat.set(4, 4);
    
    const poolMaterial = new this.THREE.MeshBasicMaterial({
      map: poolTexture,
      transparent: true,
      opacity: 0.6,
      side: this.THREE.DoubleSide
    });
    
    const poolMesh = new this.THREE.Mesh(poolGeometry, poolMaterial);
    poolMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    poolMesh.position.y = -50; // Far below the island
    
    // Store reference and add to scene
    this.waterPool = poolMesh;
    this.scene.add(this.waterPool);
    
    console.log('Water pool created below island');
  }

  private createFireflies(): void {
    console.log('Creating magical fireflies...');
    
    const fireflyCount = 80;
    const positions = new Float32Array(fireflyCount * 3);
    const colors = new Float32Array(fireflyCount * 3);
    const sizes = new Float32Array(fireflyCount);
    
    // Create firefly positions around the island
    for (let i = 0; i < fireflyCount; i++) {
      const i3 = i * 3;
      
      // Position fireflies randomly around the island, mostly in grass areas
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 180 + 20; // Keep them on the island
      const height = Math.random() * 30 + 5; // Floating height
      
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = height;
      positions[i3 + 2] = Math.sin(angle) * radius;
      
      // Magical firefly colors - soft yellows, greens, and blues
      const colorChoice = Math.random();
      if (colorChoice < 0.6) {
        // Warm firefly glow
        colors[i3] = 1.0; // R
        colors[i3 + 1] = 0.8 + Math.random() * 0.2; // G
        colors[i3 + 2] = 0.3 + Math.random() * 0.2; // B
      } else if (colorChoice < 0.8) {
        // Cool magical glow
        colors[i3] = 0.4 + Math.random() * 0.3; // R
        colors[i3 + 1] = 0.8 + Math.random() * 0.2; // G
        colors[i3 + 2] = 1.0; // B
      } else {
        // Mystical purple/pink
        colors[i3] = 0.8 + Math.random() * 0.2; // R
        colors[i3 + 1] = 0.4 + Math.random() * 0.2; // G
        colors[i3 + 2] = 1.0; // B
      }
      
      // Varying sizes for depth - tiny fireflies!
      sizes[i] = Math.random() * 0.3 + 0.1;
    }
    
    const geometry = new this.THREE.BufferGeometry();
    geometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new this.THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new this.THREE.BufferAttribute(sizes, 1));
    
    const material = new this.THREE.PointsMaterial({
      size: 0.8,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: this.THREE.AdditiveBlending,
      map: this.createFireflyTexture()
    });
    
    this.fireflies = new this.THREE.Points(geometry, material);
    this.scene.add(this.fireflies);
    
    // Store original positions for animation
    this.fireflies.userData = {
      originalPositions: positions.slice(),
      time: 0
    };
    
    console.log(`Created ${fireflyCount} magical fireflies`);
  }
  
  private createFireflyTexture(): any {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    // Create soft glowing circle with enhanced glow
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    // Add outer glow ring for enhanced effect
    const outerGlow = ctx.createRadialGradient(32, 32, 20, 32, 32, 45);
    outerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    outerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = outerGlow;
    ctx.fillRect(0, 0, 64, 64);
    
    return new this.THREE.CanvasTexture(canvas);
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
    
    // Animate fireflies
    if (this.fireflies) {
      this.animateFireflies();
    }
    
  }
  
  private animateFireflies(): void {
    const time = Date.now() * 0.0003; // Much slower movement
    this.fireflies.userData.time = time;
    
    const positions = this.fireflies.geometry.attributes.position.array;
    const originalPositions = this.fireflies.userData.originalPositions;
    
    for (let i = 0; i < positions.length; i += 3) {
      const originalX = originalPositions[i];
      const originalY = originalPositions[i + 1];
      const originalZ = originalPositions[i + 2];
      
      // Very gentle, slow floating motion
      positions[i] = originalX + Math.sin(time + i * 0.05) * 3;
      positions[i + 1] = originalY + Math.sin(time * 0.3 + i * 0.1) * 2;
      positions[i + 2] = originalZ + Math.cos(time * 0.2 + i * 0.08) * 2.5;
    }
    
    this.fireflies.geometry.attributes.position.needsUpdate = true;
    
    // Gentle glow pulsing - slower and more subtle
    const glowIntensity = 0.7 + Math.sin(time * 8) * 0.3;
    this.fireflies.material.opacity = glowIntensity;
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
    
    // Dispose fireflies
    if (this.fireflies) {
      this.fireflies.material.dispose();
      this.fireflies.geometry.dispose();
      this.scene.remove(this.fireflies);
      this.fireflies = null;
    }
    
    // CRITICAL: Dispose waterfalls to prevent global contamination
    if (this.waterfallGroup) {
      this.waterfallGroup.traverse((child: any) => {
        if (child.isMesh) {
          if (child.material) {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
          if (child.geometry) child.geometry.dispose();
        }
      });
      this.scene.remove(this.waterfallGroup);
      this.waterfallGroup = null;
    }
    
    // CRITICAL: Dispose water pool to prevent global contamination
    if (this.waterPool) {
      if (this.waterPool.material) {
        if (this.waterPool.material.map) this.waterPool.material.map.dispose();
        this.waterPool.material.dispose();
      }
      if (this.waterPool.geometry) this.waterPool.geometry.dispose();
      this.scene.remove(this.waterPool);
      this.waterPool = null;
    }
    
    this.isInitialized = false;
    console.log('✅ StarObservatory disposed with all visual enhancements AND water elements');
  }
}