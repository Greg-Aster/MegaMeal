// Debug utilities and lil-gui integration

import { GUI } from 'lil-gui';
import Stats from 'stats.js';
import type { Engine } from '../core/Engine';

export interface DebugConfig {
  enableStats: boolean;
  enableGui: boolean;
  statsPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  guiWidth: number;
  guiClosed: boolean;
}

export class Debug {
  private engine: Engine;
  private config: DebugConfig;
  private gui: GUI | null = null;
  private stats: Stats | null = null;
  private isInitialized = false;
  
  // Debug folders
  private folders: { [key: string]: GUI } = {};
  
  // Debug data
  private debugData = {
    engine: {
      fps: 0,
      deltaTime: 0,
      totalTime: 0,
      isRunning: false
    },
    renderer: {
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0
    },
    physics: {
      gravity: { x: 0, y: -9.81, z: 0 },
      enabled: true
    },
    input: {
      mouseSensitivity: 0.002,
      touchSensitivity: 0.004,
      pointerLocked: false
    },
    postProcessing: {
      bloomIntensity: 0.5,
      ssaoIntensity: 0.5,
      toneMappingExposure: 1.0,
      enableBloom: true,
      enableSSAO: false,
      enableFXAA: true
    }
  };
  
  constructor(engine: Engine, config?: Partial<DebugConfig>) {
    this.engine = engine;
    this.config = {
      enableStats: true,
      enableGui: true,
      statsPosition: 'top-left',
      guiWidth: 300,
      guiClosed: false,
      ...config
    };
  }
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Debug already initialized');
      return;
    }
    
    console.log('🐛 Initializing Debug utilities...');
    
    try {
      if (this.config.enableStats) {
        this.setupStats();
      }
      
      if (this.config.enableGui) {
        this.setupGui();
      }
      
      this.setupEventListeners();
      this.isInitialized = true;
      
      console.log('✅ Debug utilities initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Debug utilities:', error);
      throw error;
    }
  }
  
  private setupStats(): void {
    this.stats = new Stats();
    this.stats.dom.style.position = 'absolute';
    this.stats.dom.style.zIndex = '1000';
    
    // Position stats based on config
    switch (this.config.statsPosition) {
      case 'top-left':
        this.stats.dom.style.top = '0px';
        this.stats.dom.style.left = '0px';
        break;
      case 'top-right':
        this.stats.dom.style.top = '0px';
        this.stats.dom.style.right = '0px';
        break;
      case 'bottom-left':
        this.stats.dom.style.bottom = '0px';
        this.stats.dom.style.left = '0px';
        break;
      case 'bottom-right':
        this.stats.dom.style.bottom = '0px';
        this.stats.dom.style.right = '0px';
        break;
    }
    
    document.body.appendChild(this.stats.dom);
  }
  
  private setupGui(): void {
    this.gui = new GUI({ width: this.config.guiWidth, closed: this.config.guiClosed });
    this.gui.title('Game Engine Debug');
    
    this.setupEngineFolder();
    this.setupRendererFolder();
    this.setupPhysicsFolder();
    this.setupInputFolder();
    this.setupPostProcessingFolder();
    this.setupUtilityFolder();
  }
  
  private setupEngineFolder(): void {
    if (!this.gui) return;
    
    const folder = this.gui.addFolder('Engine');
    this.folders.engine = folder;
    
    folder.add(this.debugData.engine, 'fps').name('FPS').listen().disable();
    folder.add(this.debugData.engine, 'deltaTime', 0, 0.1).name('Delta Time').listen().disable();
    folder.add(this.debugData.engine, 'totalTime').name('Total Time').listen().disable();
    folder.add(this.debugData.engine, 'isRunning').name('Running').listen().disable();
    
    folder.add({ pause: () => this.engine.pause() }, 'pause').name('Pause Engine');
    folder.add({ resume: () => this.engine.resume() }, 'resume').name('Resume Engine');
    folder.add({ stop: () => this.engine.stop() }, 'stop').name('Stop Engine');
  }
  
  private setupRendererFolder(): void {
    if (!this.gui) return;
    
    const folder = this.gui.addFolder('Renderer');
    this.folders.renderer = folder;
    
    folder.add(this.debugData.renderer, 'drawCalls').name('Draw Calls').listen().disable();
    folder.add(this.debugData.renderer, 'triangles').name('Triangles').listen().disable();
    folder.add(this.debugData.renderer, 'geometries').name('Geometries').listen().disable();
    folder.add(this.debugData.renderer, 'textures').name('Textures').listen().disable();
    
    const renderer = this.engine.getRenderer();
    
    folder.add({ screenshot: () => this.takeScreenshot() }, 'screenshot').name('Take Screenshot');
    
    // Pixel ratio control
    folder.add({ pixelRatio: window.devicePixelRatio }, 'pixelRatio', 0.5, 3, 0.1)
      .name('Pixel Ratio')
      .onChange((value: number) => renderer.setPixelRatio(value));
  }
  
  private setupPhysicsFolder(): void {
    if (!this.gui) return;
    
    const physicsWorld = this.engine.getPhysicsWorld();
    if (!physicsWorld) return;
    
    const folder = this.gui.addFolder('Physics');
    this.folders.physics = folder;
    
    folder.add(this.debugData.physics.gravity, 'x', -20, 20, 0.1)
      .name('Gravity X')
      .onChange(() => this.updateGravity());
    
    folder.add(this.debugData.physics.gravity, 'y', -20, 20, 0.1)
      .name('Gravity Y')
      .onChange(() => this.updateGravity());
    
    folder.add(this.debugData.physics.gravity, 'z', -20, 20, 0.1)
      .name('Gravity Z')
      .onChange(() => this.updateGravity());
    
    folder.add({ debugRender: false }, 'debugRender')
      .name('Debug Render')
      .onChange((value: boolean) => physicsWorld.enableDebugRender(value));
  }
  
  private setupInputFolder(): void {
    if (!this.gui) return;
    
    const inputManager = this.engine.getInputManager();
    const folder = this.gui.addFolder('Input');
    this.folders.input = folder;
    
    folder.add(this.debugData.input, 'mouseSensitivity', 0.0001, 0.01, 0.0001)
      .name('Mouse Sensitivity')
      .onChange((value: number) => inputManager.setMouseSensitivity(value));
    
    folder.add(this.debugData.input, 'touchSensitivity', 0.001, 0.02, 0.001)
      .name('Touch Sensitivity')
      .onChange((value: number) => inputManager.setTouchSensitivity(value));
    
    folder.add(this.debugData.input, 'pointerLocked').name('Pointer Locked').listen().disable();
    
    folder.add({ requestLock: () => inputManager.requestPointerLock() }, 'requestLock')
      .name('Request Pointer Lock');
    
    folder.add({ exitLock: () => inputManager.exitPointerLock() }, 'exitLock')
      .name('Exit Pointer Lock');
    
    folder.add({ invertY: false }, 'invertY')
      .name('Invert Y')
      .onChange((value: boolean) => inputManager.setInvertY(value));
  }
  
  private setupPostProcessingFolder(): void {
    if (!this.gui) return;
    
    const renderer = this.engine.getRenderer();
    const folder = this.gui.addFolder('Post Processing');
    this.folders.postProcessing = folder;
    
    folder.add(this.debugData.postProcessing, 'bloomIntensity', 0, 2, 0.1)
      .name('Bloom Intensity')
      .onChange((value: number) => renderer.setBloomIntensity(value));
    
    folder.add(this.debugData.postProcessing, 'ssaoIntensity', 0, 2, 0.1)
      .name('SSAO Intensity')
      .onChange((value: number) => renderer.setSSAOIntensity(value));
    
    folder.add(this.debugData.postProcessing, 'toneMappingExposure', 0, 3, 0.1)
      .name('Exposure')
      .onChange((value: number) => renderer.setToneMappingExposure(value));
  }
  
  private setupUtilityFolder(): void {
    if (!this.gui) return;
    
    const folder = this.gui.addFolder('Utilities');
    this.folders.utilities = folder;
    
    folder.add({ clearConsole: () => console.clear() }, 'clearConsole').name('Clear Console');
    folder.add({ logDebugInfo: () => this.logDebugInfo() }, 'logDebugInfo').name('Log Debug Info');
    folder.add({ toggleStats: () => this.toggleStats() }, 'toggleStats').name('Toggle Stats');
  }
  
  private setupEventListeners(): void {
    const eventBus = this.engine.getEventBus();
    
    // Listen to engine events
    eventBus.on('engine.update', (data) => {
      this.debugData.engine.deltaTime = data.deltaTime;
      this.debugData.engine.totalTime = data.totalTime;
    });
    
    // Listen to input events
    eventBus.on('input.pointerlockchange', (locked) => {
      this.debugData.input.pointerLocked = locked;
    });
  }
  
  private updateGravity(): void {
    const physicsWorld = this.engine.getPhysicsWorld();
    if (physicsWorld) {
      physicsWorld.setGravity(
        new (window as any).THREE.Vector3(
          this.debugData.physics.gravity.x,
          this.debugData.physics.gravity.y,
          this.debugData.physics.gravity.z
        )
      );
    }
  }
  
  private takeScreenshot(): void {
    const renderer = this.engine.getRenderer();
    const dataURL = renderer.captureScreenshot();
    
    // Create download link
    const link = document.createElement('a');
    link.download = `screenshot-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }
  
  private toggleStats(): void {
    if (this.stats) {
      const isVisible = this.stats.dom.style.display !== 'none';
      this.stats.dom.style.display = isVisible ? 'none' : 'block';
    }
  }
  
  private logDebugInfo(): void {
    const info = {
      engine: {
        isRunning: this.engine.isEngineRunning(),
        time: this.engine.getTime().getTotalTime(),
        fps: this.engine.getTime().getFPS()
      },
      renderer: this.engine.getRenderer().getRenderInfo(),
      input: this.engine.getInputManager().getState(),
      physics: this.engine.getPhysicsWorld()?.getConfig() || null
    };
    
    console.group('🐛 Debug Info');
    console.log('Engine:', info.engine);
    console.log('Renderer:', info.renderer);
    console.log('Input:', info.input);
    console.log('Physics:', info.physics);
    console.groupEnd();
  }
  
  public update(): void {
    if (!this.isInitialized) return;
    
    // Update stats
    if (this.stats) {
      this.stats.update();
    }
    
    // Update debug data
    const time = this.engine.getTime();
    const renderer = this.engine.getRenderer();
    
    this.debugData.engine.fps = time.getFPS();
    this.debugData.engine.isRunning = this.engine.isEngineRunning();
    
    const renderInfo = renderer.getRenderInfo();
    this.debugData.renderer.drawCalls = renderInfo.render.calls;
    this.debugData.renderer.triangles = renderInfo.render.triangles;
    this.debugData.renderer.geometries = renderInfo.memory.geometries;
    this.debugData.renderer.textures = renderInfo.memory.textures;
  }
  
  public addFolder(name: string): GUI | null {
    if (!this.gui) return null;
    
    const folder = this.gui.addFolder(name);
    this.folders[name] = folder;
    return folder;
  }
  
  public getFolder(name: string): GUI | null {
    return this.folders[name] || null;
  }
  
  public getGui(): GUI | null {
    return this.gui;
  }
  
  public getStats(): Stats | null {
    return this.stats;
  }
  
  public show(): void {
    if (this.gui) {
      this.gui.show();
    }
    if (this.stats) {
      this.stats.dom.style.display = 'block';
    }
  }
  
  public hide(): void {
    if (this.gui) {
      this.gui.hide();
    }
    if (this.stats) {
      this.stats.dom.style.display = 'none';
    }
  }
  
  public dispose(): void {
    console.log('🧹 Disposing Debug utilities...');
    
    // Remove stats
    if (this.stats && this.stats.dom.parentNode) {
      this.stats.dom.parentNode.removeChild(this.stats.dom);
      this.stats = null;
    }
    
    // Remove GUI
    if (this.gui) {
      this.gui.destroy();
      this.gui = null;
    }
    
    // Clear folders
    this.folders = {};
    
    this.isInitialized = false;
    
    console.log('✅ Debug utilities disposed');
  }
}