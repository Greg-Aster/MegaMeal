import * as THREE from 'three'
import {
  BaseLevelGenerator,
  type LevelGeneratorDependencies,
} from '../interfaces/ILevelGenerator'

/**
 * Generates Jerry's Room as a beautiful indoor hippie forest
 * with psychedelic lighting and an interactive video screen.
 */
export class JerrysRoomEnvironmentSystem extends BaseLevelGenerator {
  private jerryScreen: THREE.Mesh | null = null
  private videoElement: HTMLVideoElement | null = null
  private psychedelicLights: THREE.Light[] = []

  constructor(dependencies: LevelGeneratorDependencies) {
    super(dependencies)
    console.log('🛋️ JerrysRoomEnvironmentSystem created')
  }

  public async initialize(config?: any): Promise<void> {
    try {
      console.log("🛋️ Initializing Jerry's Room Environment...")

      this.createLighting()
      await this.createJerryScreen()
      await this.createForest()

      console.log("✅ Jerry's Room Environment initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize Jerry's Room:", error)
      throw error
    }
  }

  private createLighting(): void {
    // A brighter ambient light to fix the dim lighting issue
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8)
    this.dependencies.levelGroup.add(ambientLight)

    // Add psychedelic lights for the hippie forest vibe
    const lightColors = [0xff00ff, 0x00ffff, 0x00ff00, 0xffff00]
    lightColors.forEach(color => {
      const light = new THREE.PointLight(color, 0.7, 12, 2)
      light.position.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 8,
      )
      this.psychedelicLights.push(light)
      this.dependencies.levelGroup.add(light)
    })
  }

  private async createForest(): Promise<void> {
    console.log('🌳 Creating hippie forest environment...')
    const assetLoader = this.dependencies.assetLoader
    if (!assetLoader) {
      console.error('AssetLoader not found in dependencies!')
      return
    }

    const treeTypes = [
      'BirchTree_1.gltf',
      'MapleTree_2.gltf',
      'BirchTree_3.gltf',
    ]
    const flowerTypes = [
      'Flower_1_Clump.gltf',
      'Flower_3_Clump.gltf',
      'Flower_5_Clump.gltf',
    ]
    const naturePackPath =
      '/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/glTF/'

    // Create a ground plane
    const groundGeometry = new THREE.CircleGeometry(10, 32)
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x224422 }) // Dark green
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
    groundMesh.rotation.x = -Math.PI / 2
    groundMesh.receiveShadow = true
    this.dependencies.levelGroup.add(groundMesh)

    // Scatter some trees to enclose the space
    for (let i = 0; i < 15; i++) {
      const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)]
      const asset = await assetLoader.loadModel(
        `jerry_tree_${i}`,
        `${naturePackPath}${treeType}`,
        'gltf',
      )
      const tree = asset.scene
      tree.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          if (child.material) {
            ;(child.material as any).transparent = true
            ;(child.material as any).alphaTest = 0.1
          }
        }
      })
      const angle = Math.random() * Math.PI * 2
      const radius = 3 + Math.random() * 6
      tree.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
      tree.rotation.y = Math.random() * Math.PI * 2
      tree.scale.setScalar(0.8 + Math.random() * 0.5)
      this.dependencies.levelGroup.add(tree)
    }
  }

  private async createJerryScreen(): Promise<void> {
    // Create an HTML video element programmatically
    this.videoElement = document.createElement('video')
    this.videoElement.src = '/jerry/jerry.webm' // Using the file from the 404 error
    this.videoElement.crossOrigin = 'anonymous'
    this.videoElement.loop = true
    this.videoElement.muted = true // Required for autoplay in most browsers
    this.videoElement.playsInline = true
    this.videoElement.playbackRate = 0.5 // Slow down playback to 50%
    this.videoElement.style.display = 'none' // Hide the video element
    document.body.appendChild(this.videoElement)

    try {
      await this.videoElement.play()
      console.log('▶️ Jerry video playback started.')
    } catch (error) {
      console.error(
        '❌ Video playback failed to start automatically. User interaction may be required.',
        error,
      )
    }

    const videoTexture = new THREE.VideoTexture(this.videoElement)
    videoTexture.minFilter = THREE.LinearFilter
    videoTexture.magFilter = THREE.LinearFilter
    videoTexture.colorSpace = THREE.SRGBColorSpace

    // Set geometry to the requested 592x768 portrait aspect ratio
    const aspectRatio = 592 / 768 // Width / Height for portrait
    const screenHeight = 4.5
    const screenWidth = screenHeight * aspectRatio
    const screenGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight)
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: videoTexture,
      toneMapped: false, // Ensure video colors are not affected by scene lighting
    })

    this.jerryScreen = new THREE.Mesh(screenGeometry, screenMaterial)
    this.jerryScreen.name = 'jerry_video_screen'
    this.jerryScreen.position.set(0, 0, -4.9) // Position on the back wall

    // --- Make the screen interactive ---
    this.jerryScreen.userData.isInteractive = true
    this.jerryScreen.userData.interaction = {
      type: 'click',
      action: 'startJerryChat',
      payload: { character: 'Jerry' },
    }

    this.dependencies.levelGroup.add(this.jerryScreen)

    // Register for interaction
    const interactionSystem = this.dependencies.engine.getInteractionSystem?.()
    if (interactionSystem) {
      interactionSystem.registerInteractiveObject(
        this.jerryScreen,
        (payload: any) => {
          console.log(
            `🗣️ Clicked on Jerry! Time to start a chat. Payload:`,
            payload,
          )
          // TODO: Hook this up to open the Jerry chat dialog UI
        },
      )
    }
  }

  public update(_deltaTime: number, _camera?: THREE.Camera): void {
    // Animate the psychedelic lights to make them float around
    const time = this.dependencies.engine.getTime().elapsed
    this.psychedelicLights.forEach((light, index) => {
      const x = Math.sin(time * 0.3 + index) * 4
      const z = Math.cos(time * 0.3 + index * 2) * 4
      const y = Math.sin(time * 0.5 + index) * 1.5 + 2
      light.position.set(x, y, z)
    })
  }

  public dispose(): void {
    // Clean up video element and texture
    if (this.videoElement) {
      this.videoElement.pause()
      this.videoElement.removeAttribute('src')
      this.videoElement.load()
      if (this.videoElement.parentNode) {
        this.videoElement.parentNode.removeChild(this.videoElement)
      }
      this.videoElement = null
    }
    if (this.jerryScreen) {
      ;(this.jerryScreen.material as THREE.MeshBasicMaterial).map?.dispose()
    }

    // Clean up psychedelic lights
    this.psychedelicLights.forEach(light => {
      this.dependencies.levelGroup.remove(light)
      light.dispose()
    })
    this.psychedelicLights = []
    console.log('🧹 JerrysRoomEnvironmentSystem disposed')
  }
}
