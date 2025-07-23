// Miranda Ship System Component
// Handles spaceship interior creation for Miranda investigation level

import type * as THREE from 'three'
import type { EventBus } from '../../engine/core/EventBus'
import type { IDisposable } from '../../engine/interfaces/IDisposable'
import type { InteractionSystem } from '../../engine/systems/InteractionSystem'
import { ResourceManager } from '../../engine/utils/ResourceManager'

// Import spaceship-specific systems
import { AtmosphericAudioSystem } from '../components/AtmosphericAudioSystem'
import { MirandaStorySystem } from '../components/MirandaStorySystem'
import { ShipPropsSystem } from '../components/ShipPropsSystem'

export interface MirandaShipConfig {
  type: string
  ship_layout?: any
  story_elements?: any
  atmospheric_audio?: any
  ship_props?: any
  environment?: any
}

export class MirandaShipSystem implements IDisposable {
  // Spaceship systems
  private atmosphericAudio!: AtmosphericAudioSystem
  private shipProps!: ShipPropsSystem
  private mirandaStory!: MirandaStorySystem

  private spaceshipObjects: THREE.Object3D[] = []
  private spaceshipLights: THREE.Light[] = []
  private animationCleanups: (() => void)[] = []
  public readonly isDisposed = false

  constructor(
    private THREE: any,
    private scene: any,
    private levelGroup: any,
    private interactionSystem: InteractionSystem,
    private eventBus: EventBus,
    private camera?: any,
    private gameContainer?: any,
  ) {}

  async initialize(config: MirandaShipConfig): Promise<void> {
    console.log('🚀 Initializing Miranda Ship System...', config)

    try {
      // Setup spaceship environment
      await this.setupSpaceshipEnvironment()

      // Initialize spaceship subsystems
      await this.initializeShipSystems()

      // Build ship interior
      await this.buildShipInterior()

      // Setup story elements
      await this.setupStoryElements(config.story_elements)

      // Setup atmospheric audio
      await this.setupAtmosphericAudio(config.atmospheric_audio)

      console.log('✅ Miranda Ship System initialized successfully')

      // Emit level ready event
      this.eventBus.emit('level.ready', {
        name: 'Miranda Investigation Bridge',
        description:
          "Bridge of Captain Zhao's salvage vessel investigating the Miranda incident",
      })
    } catch (error) {
      console.error('❌ Failed to initialize Miranda Ship System:', error)
      throw error
    }
  }

  private async setupSpaceshipEnvironment(): Promise<void> {
    console.log('🌌 Setting up spaceship environment...')

    // Add cosmic horror fog
    const fog = new this.THREE.Fog(0x0a0a1a, 1, 80)
    this.scene.fog = fog

    // Ambient lighting for moody atmosphere
    const ambientLight = new this.THREE.AmbientLight(0x404080, 0.3)
    this.levelGroup.add(ambientLight)
    this.spaceshipLights.push(ambientLight)

    // Directional light from ship's main systems
    const directionalLight = new this.THREE.DirectionalLight(0x8888ff, 0.7)
    directionalLight.position.set(10, 20, 5)
    directionalLight.castShadow = true

    if (directionalLight.castShadow) {
      directionalLight.shadow.mapSize.width = 2048
      directionalLight.shadow.mapSize.height = 2048
      directionalLight.shadow.camera.near = 0.5
      directionalLight.shadow.camera.far = 50
    }

    this.levelGroup.add(directionalLight)
    this.spaceshipLights.push(directionalLight)

    // Add stars visible through windows
    await this.createStarField()
  }

  private async createStarField(): Promise<void> {
    const starGeometry = new this.THREE.BufferGeometry()
    const starMaterial = new this.THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
    })

    const starCount = 1000
    const positions = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200 // x
      positions[i + 1] = (Math.random() - 0.5) * 200 // y
      positions[i + 2] = (Math.random() - 0.5) * 200 // z
    }

    starGeometry.setAttribute(
      'position',
      new this.THREE.BufferAttribute(positions, 3),
    )
    const stars = new this.THREE.Points(starGeometry, starMaterial)
    this.levelGroup.add(stars)
    this.spaceshipObjects.push(stars)
  }

  private async initializeShipSystems(): Promise<void> {
    console.log('⚙️ Initializing ship systems...')

    // Initialize atmospheric audio system
    this.atmosphericAudio = new AtmosphericAudioSystem(
      this.THREE,
      this.scene,
      this.levelGroup,
      this.eventBus,
    )

    // Initialize ship props system
    this.shipProps = new ShipPropsSystem(
      this.THREE,
      this.scene,
      this.levelGroup,
      null, // assetLoader
    )

    // Initialize Miranda story system
    this.mirandaStory = new MirandaStorySystem(
      this.THREE,
      this.scene,
      this.levelGroup,
      this.interactionSystem,
      this.eventBus,
    )
  }

  private async buildShipInterior(): Promise<void> {
    console.log('🏗️ Building ship interior...')

    // Create spaceship bridge layout
    await this.createSpaceshipBridge()
  }

  private async createSpaceshipBridge(): Promise<void> {
    // Create vector-style grid floor inspired by FTL
    await this.createVectorGridFloor()

    // Create vector-style bridge walls and panels
    await this.createVectorBridgeLayout()

    // Create sleek command stations with clean lines
    await this.createCommandStations()
  }

  private async createVectorGridFloor(): Promise<void> {
    // Create main floor base - dark navy like FTL
    const floorGeometry = new this.THREE.PlaneGeometry(20, 20)
    const floorMaterial = new this.THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
      metalness: 0.1,
    })
    const floor = new this.THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.98
    floor.receiveShadow = true
    this.levelGroup.add(floor)
    this.spaceshipObjects.push(floor)

    // Create grid lines using Line geometry - classic vector style
    const gridMaterial = new this.THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
    })

    // Vertical grid lines
    for (let i = -10; i <= 10; i += 2) {
      const points = [
        new this.THREE.Vector3(i, -0.97, -10),
        new this.THREE.Vector3(i, -0.97, 10),
      ]
      const geometry = new this.THREE.BufferGeometry().setFromPoints(points)
      const line = new this.THREE.Line(geometry, gridMaterial)
      this.levelGroup.add(line)
      this.spaceshipObjects.push(line)
    }

    // Horizontal grid lines
    for (let i = -10; i <= 10; i += 2) {
      const points = [
        new this.THREE.Vector3(-10, -0.97, i),
        new this.THREE.Vector3(10, -0.97, i),
      ]
      const geometry = new this.THREE.BufferGeometry().setFromPoints(points)
      const line = new this.THREE.Line(geometry, gridMaterial)
      this.levelGroup.add(line)
      this.spaceshipObjects.push(line)
    }
  }

  private async createVectorBridgeLayout(): Promise<void> {
    // Create clean geometric wall panels with accent lines
    const panelMaterial = new this.THREE.MeshStandardMaterial({
      color: 0x2d2d44,
      roughness: 0.7,
      metalness: 0.3,
    })

    const accentMaterial = new this.THREE.LineBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.8,
    })

    // Left panel with accent lines
    const leftPanel = new this.THREE.PlaneGeometry(4, 3)
    const leftWall = new this.THREE.Mesh(leftPanel, panelMaterial)
    leftWall.position.set(-8, 1.5, -3)
    leftWall.rotation.y = Math.PI / 2
    this.levelGroup.add(leftWall)
    this.spaceshipObjects.push(leftWall)

    // Right panel with accent lines
    const rightWall = new this.THREE.Mesh(leftPanel, panelMaterial)
    rightWall.position.set(8, 1.5, -3)
    rightWall.rotation.y = -Math.PI / 2
    this.levelGroup.add(rightWall)
    this.spaceshipObjects.push(rightWall)

    // Add geometric accent lines to walls
    this.addVectorAccentLines(-8, 1.5, -3, accentMaterial)
    this.addVectorAccentLines(8, 1.5, -3, accentMaterial)

    // Create large viewscreen with vector border
    await this.createVectorViewscreen()
  }

  private addVectorAccentLines(
    x: number,
    y: number,
    z: number,
    material: any,
  ): void {
    // Create geometric accent pattern
    const lines = [
      // Horizontal lines
      [
        new this.THREE.Vector3(x - 1.5, y + 1, z),
        new this.THREE.Vector3(x + 1.5, y + 1, z),
      ],
      [
        new this.THREE.Vector3(x - 1.5, y, z),
        new this.THREE.Vector3(x + 1.5, y, z),
      ],
      [
        new this.THREE.Vector3(x - 1.5, y - 1, z),
        new this.THREE.Vector3(x + 1.5, y - 1, z),
      ],
      // Vertical accents
      [
        new this.THREE.Vector3(x - 1, y + 1.2, z),
        new this.THREE.Vector3(x - 1, y - 1.2, z),
      ],
      [
        new this.THREE.Vector3(x + 1, y + 1.2, z),
        new this.THREE.Vector3(x + 1, y - 1.2, z),
      ],
    ]

    lines.forEach(points => {
      const geometry = new this.THREE.BufferGeometry().setFromPoints(points)
      const line = new this.THREE.Line(geometry, material)
      this.levelGroup.add(line)
      this.spaceshipObjects.push(line)
    })
  }

  private async createVectorViewscreen(): Promise<void> {
    // Main viewscreen - large and imposing like in FTL
    const screenGeometry = new this.THREE.PlaneGeometry(12, 6)
    const screenMaterial = new this.THREE.MeshStandardMaterial({
      color: 0x001122,
      transparent: true,
      opacity: 0.8,
      emissive: 0x002244,
    })
    const viewscreen = new this.THREE.Mesh(screenGeometry, screenMaterial)
    viewscreen.position.set(0, 3, 9.5)
    this.levelGroup.add(viewscreen)
    this.spaceshipObjects.push(viewscreen)

    // Viewscreen border with vector lines
    const borderMaterial = new this.THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9,
    })

    const borderPoints = [
      new this.THREE.Vector3(-6, 6, 9.6),
      new this.THREE.Vector3(6, 6, 9.6),
      new this.THREE.Vector3(6, 0, 9.6),
      new this.THREE.Vector3(-6, 0, 9.6),
      new this.THREE.Vector3(-6, 6, 9.6),
    ]

    const borderGeometry = new this.THREE.BufferGeometry().setFromPoints(
      borderPoints,
    )
    const borderLine = new this.THREE.Line(borderGeometry, borderMaterial)
    this.levelGroup.add(borderLine)
    this.spaceshipObjects.push(borderLine)
  }

  private async createCommandStations(): Promise<void> {
    // Captain's command console (central investigation station)
    const consoleGeometry = new this.THREE.BoxGeometry(1.5, 1, 0.8)
    const consoleMaterial = new this.THREE.MeshStandardMaterial({
      color: 0x225588,
      emissive: 0x002244,
      roughness: 0.3,
      metalness: 0.7,
    })
    const commandConsole = new this.THREE.Mesh(consoleGeometry, consoleMaterial)
    commandConsole.position.set(0, 0.5, 2)
    commandConsole.castShadow = true
    commandConsole.receiveShadow = true
    this.levelGroup.add(commandConsole)
    this.spaceshipObjects.push(commandConsole)

    // Add console lighting with pulsing effect
    const consoleLight = new this.THREE.PointLight(0x4488ff, 0.8, 8)
    consoleLight.position.set(0, 1.5, 2)
    this.levelGroup.add(consoleLight)
    this.spaceshipLights.push(consoleLight)

    // Side workstations for investigation data
    const workstationGeometry = new this.THREE.BoxGeometry(1, 0.8, 0.6)

    const leftWorkstation = new this.THREE.Mesh(
      workstationGeometry,
      consoleMaterial,
    )
    leftWorkstation.position.set(-3, 0.4, -1)
    leftWorkstation.castShadow = true
    leftWorkstation.receiveShadow = true
    this.levelGroup.add(leftWorkstation)
    this.spaceshipObjects.push(leftWorkstation)

    const rightWorkstation = new this.THREE.Mesh(
      workstationGeometry,
      consoleMaterial,
    )
    rightWorkstation.position.set(3, 0.4, -1)
    rightWorkstation.castShadow = true
    rightWorkstation.receiveShadow = true
    this.levelGroup.add(rightWorkstation)
    this.spaceshipObjects.push(rightWorkstation)

    // Add holographic displays above workstations
    this.createHolographicDisplays()

    // Initialize ship props with config
    await this.shipProps.initialize({
      props: [
        {
          model: 'Prop_Crate3',
          positions: [
            [6, 0, -6],
            [-6, 0, -6],
            [0, 0, -8],
          ],
          rotation: 'random',
        },
        {
          model: 'Prop_Light_Corner',
          positions: [
            [7, 2, 5],
            [-7, 2, 5],
            [7, 2, -8],
            [-7, 2, -8],
          ],
          lighting: true,
        },
      ],
    })
  }

  private createHolographicDisplays(): void {
    // Create holographic Miranda debris field display
    const debrisGeometry = new this.THREE.PlaneGeometry(2, 1.5)
    const debrisMaterial = new this.THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.6,
      side: this.THREE.DoubleSide,
    })
    const debrisDisplay = new this.THREE.Mesh(debrisGeometry, debrisMaterial)
    debrisDisplay.position.set(-3, 1.8, -1)
    debrisDisplay.rotation.x = -Math.PI / 6
    this.levelGroup.add(debrisDisplay)
    this.spaceshipObjects.push(debrisDisplay)

    // Create holographic temporal anomaly display
    const anomalyGeometry = new this.THREE.PlaneGeometry(2, 1.5)
    const anomalyMaterial = new this.THREE.MeshBasicMaterial({
      color: 0x8844ff,
      transparent: true,
      opacity: 0.7,
      side: this.THREE.DoubleSide,
    })
    const anomalyDisplay = new this.THREE.Mesh(anomalyGeometry, anomalyMaterial)
    anomalyDisplay.position.set(3, 1.8, -1)
    anomalyDisplay.rotation.x = -Math.PI / 6
    this.levelGroup.add(anomalyDisplay)
    this.spaceshipObjects.push(anomalyDisplay)
  }

  private async setupStoryElements(storyConfig: any): Promise<void> {
    if (!storyConfig) {
      console.log(
        '📖 No story configuration provided, using default Miranda investigation elements...',
      )

      // Default story configuration
      storyConfig = {
        captain_logs: [
          {
            id: 'log_initial_scan',
            name: 'Initial Debris Scan Report',
            position: [3, 0.5, -1],
            model: 'Prop_Chest',
            content: `Captain's Log, Stardate 45.7.21: This is Captain Helena Zhao of the salvage vessel Second Breakfast. A number of weeks ago, the primary sun in the Miranda system went supernova without warning, destroying the entire system. The inner planets - vaporized. The debris field is expanding at an alarming rate. Our initial scans show a high concentration of Fe and Ni isotopes, consistent with a Type II supernova. However, the sheer scale of the explosion and the speed at which the star collapsed defies all known astrophysical models.`,
          },
          {
            id: 'log_quantum_anomaly',
            name: 'Quantum Resonance Discovery',
            position: [-3, 0.5, -1],
            model: 'Prop_Chest',
            content: `Captain's Log, Stardate 45.8.15: We've detected a quantum resonance signature pattern. What we recovered is unsettling - not just because of the content, but because of the contradictions. The radiation was concentrating in a manner that was breaking the second law of thermodynamics. Instead of decaying into entropy, it was reconstituting itself into order—as if it was reversing its decay. After the drones returned, some crew began experiencing headaches. I've started waking with my uniform collar damp with cold sweat.`,
          },
          {
            id: 'log_temporal_dreams',
            name: 'Temporal Dream Analysis',
            position: [0, 0.5, 2],
            model: 'Prop_Chest',
            content: `Personal Log: The crew remains focused, but I've started experiencing lapses. Dreams that feel more like transmissions. Three elderly men playing cards, their faces blurred by cigar smoke. A figure in a fedora ordering "a Bloody Mary, no pickles, make it a double" - the phrase echoes in my head. When I whispered it in the mess hall, my coffee cup vibrated slightly. I've forbidden myself from speaking it aloud again.`,
          },
        ],

        interactive_objects: [
          {
            id: 'perfect_mary_sample',
            name: 'Perfect Bloody Mary Sample',
            position: [0, 1, 0],
            model: 'Prop_ItemHolder',
            glow: true,
            glow_color: '#8844ff',
            interaction: 'examine',
            content: `A sealed containment unit holds what appears to be a liquid sample. The container is filled with a deep red substance that seems to pulse with its own light. A faint purple aura surrounds it, and looking directly at it causes a strange temporal resonance sensation. The label reads: "Perfect Mary - Final Iteration 1,342. WARNING: Do not speak activation phrase. 'No pickles' - Temporal weapon confirmed."`,
            visual_effect: 'temporal_distortion',
          },

          {
            id: 'debris_analyzer',
            name: 'Debris Field Analyzer',
            position: [5, 0, 4],
            model: 'Prop_ItemHolder',
            glow: true,
            glow_color: '#00ffff',
            interaction: 'access',
            content: `Holographic display shows the expanding Miranda debris field. Radiation patterns exhibit impossible thermodynamic violations - energy organizing instead of dissipating. Multiple temporal echoes detected from the same coordinates. Analysis suggests artificial acceleration of stellar fusion processes. Required energy: equivalent to multiple star systems. Current technology cannot account for this level of stellar manipulation.`,
          },
        ],
      }
    }

    console.log('📖 Setting up Miranda story elements...')

    // Initialize story system with Miranda investigation content
    await this.mirandaStory.initialize(storyConfig)
  }

  private async setupAtmosphericAudio(audioConfig: any): Promise<void> {
    if (!audioConfig) {
      // Default atmospheric audio configuration
      audioConfig = {
        ambient_tracks: [
          {
            id: 'ship_hum',
            file: '/audio/ambient/ship_hum.ogg',
            volume: 0.3,
            loop: true,
            position: 'global',
          },
          {
            id: 'computer_systems',
            file: '/audio/ambient/computer_beeps.ogg',
            volume: 0.2,
            loop: true,
            position: [0, 0, 2],
            radius: 8,
          },
        ],

        sound_effects: [
          {
            trigger: 'story.log_found',
            sound: '/audio/effects/data_access.ogg',
            volume: 0.5,
          },
          {
            trigger: 'story.object_examined',
            sound: '/audio/effects/scanner_beep.ogg',
            volume: 0.4,
          },
        ],
      }
    }

    console.log('🎵 Setting up atmospheric audio...')

    // Initialize atmospheric audio system
    await this.atmosphericAudio.initialize(audioConfig)
  }

  update(deltaTime: number): void {
    // Update ship systems
    if (this.atmosphericAudio && !this.atmosphericAudio.isDisposed) {
      this.atmosphericAudio.update(deltaTime)
    }

    if (this.shipProps && !this.shipProps.isDisposed) {
      this.shipProps.update(deltaTime)
    }

    if (this.mirandaStory && !this.mirandaStory.isDisposed) {
      this.mirandaStory.update(deltaTime)
    }

    // Update temporal distortion effects
    this.updateTemporalEffects(deltaTime)
  }

  private updateTemporalEffects(deltaTime: number): void {
    // Add subtle temporal distortion effects for cosmic horror atmosphere
    const time = Date.now() * 0.001

    // Slightly distort the fog color to create an unsettling atmosphere
    if (this.scene.fog && this.scene.fog instanceof this.THREE.Fog) {
      const pulse = Math.sin(time * 0.5) * 0.1 + 0.9
      const baseColor = new this.THREE.Color(0x0a0a1a)
      baseColor.multiplyScalar(pulse)
      this.scene.fog.color = baseColor
    }
  }

  /**
   * Get spawn point for this ship interior
   */
  getSpawnPoint(): { x: number; y: number; z: number } {
    return { x: 0, y: 0, z: -2 }
  }

  /**
   * Get height at position (for terrain following)
   */
  getHeightAt(x: number, z: number): number {
    // Ship interior has a flat floor at y = -1
    return -1
  }

  dispose(): void {
    console.log('🧹 Disposing Miranda Ship System...')

    // Clean up animations
    this.animationCleanups.forEach(cleanup => cleanup())
    this.animationCleanups = []

    // Dispose ship systems
    if (this.atmosphericAudio && !this.atmosphericAudio.isDisposed) {
      this.atmosphericAudio.dispose()
    }

    if (this.shipProps && !this.shipProps.isDisposed) {
      this.shipProps.dispose()
    }

    if (this.mirandaStory && !this.mirandaStory.isDisposed) {
      this.mirandaStory.dispose()
    }

    // Dispose spaceship objects using ResourceManager
    this.spaceshipObjects.forEach(obj => {
      ResourceManager.disposeObject3D(obj)
      this.levelGroup.remove(obj)
    })
    this.spaceshipObjects = []

    // Dispose lights
    this.spaceshipLights.forEach(light => {
      this.levelGroup.remove(light)
    })
    this.spaceshipLights = []

    // Clear fog
    this.scene.fog = null

    ;(this as any).isDisposed = true
    console.log('✅ Miranda Ship System disposed')
  }
}
