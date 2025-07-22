// Miranda Story System Component
// Handles story elements, captain's logs, and interactive objects for the Miranda incident level

import type * as THREE from 'three'
import type { EventBus } from '../../engine/core/EventBus'
import type { IDisposable } from '../../engine/interfaces/IDisposable'
import { InteractionType } from '../../engine/interfaces/InteractableObject'
import type {
  InteractableObject,
  InteractionData,
  InteractionMetadata,
} from '../../engine/interfaces/InteractableObject'
import type { InteractionSystem } from '../../engine/systems/InteractionSystem'
import { ResourceManager } from '../../engine/utils/ResourceManager'

export interface StoryConfig {
  captain_logs?: Array<{
    id: string
    name: string
    position: [number, number, number]
    model: string
    content: string
    unlock_condition?: string
  }>
  interactive_objects?: Array<{
    id: string
    name: string
    position: [number, number, number]
    model: string
    glow?: boolean
    glow_color?: string
    interaction: string
    content: string
    visual_effect?: string
  }>
}

export class MirandaStorySystem implements IDisposable {
  private storyObjects: THREE.Object3D[] = []
  private storyLights: THREE.Light[] = []
  private animationCleanups: (() => void)[] = []
  public readonly isDisposed = false

  // Story progression tracking
  private foundLogs: Set<string> = new Set()
  private examinedObjects: Set<string> = new Set()

  constructor(
    private THREE: any,
    private scene: any,
    private levelGroup: any,
    private interactionSystem: InteractionSystem,
    private eventBus: EventBus,
  ) {}

  async initialize(config: StoryConfig): Promise<void> {
    console.log('📖 Creating Miranda story system...', config)

    // Create captain's logs
    if (config.captain_logs) {
      for (const log of config.captain_logs) {
        await this.createCaptainLog(log)
      }
    }

    // Create interactive objects
    if (config.interactive_objects) {
      for (const obj of config.interactive_objects) {
        await this.createInteractiveObject(obj)
      }
    }
  }

  private async createCaptainLog(log: any): Promise<void> {
    let logMesh

    if (log.model === 'Prop_Chest') {
      // Create chest-like container
      const chestGeometry = new this.THREE.BoxGeometry(0.5, 0.3, 0.3)
      const chestMaterial = new this.THREE.MeshStandardMaterial({
        color: 0x8b4513,
        metalness: 0.1,
        roughness: 0.8,
      })
      logMesh = new this.THREE.Mesh(chestGeometry, chestMaterial)
    } else {
      // Default container
      const containerGeometry = new this.THREE.BoxGeometry(0.3, 0.1, 0.2)
      const containerMaterial = new this.THREE.MeshStandardMaterial({
        color: 0x0066cc,
      })
      logMesh = new this.THREE.Mesh(containerGeometry, containerMaterial)
    }

    logMesh.position.set(...log.position)
    logMesh.castShadow = true
    logMesh.receiveShadow = true
    this.levelGroup.add(logMesh)
    this.storyObjects.push(logMesh)

    const interactableObj: InteractableObject = {
      id: log.id,
      mesh: logMesh,
      interactionRadius: 2,
      isInteractable: true,
      interactionType: InteractionType.CLICK,
      onInteract: (_interactionData: InteractionData) => {
        console.log(`📖 INTERACTION TRIGGERED! Found log: ${log.name}`)

        // Track story progression
        this.foundLogs.add(log.id)

        // Show visual feedback
        this.showWorldNotification(log.name, logMesh.position)

        // Show UI dialogue with the log content
        this.eventBus.emit('ui.dialogue.show', {
          title: log.name,
          content: log.content,
          speaker: "Captain's Log",
          type: 'story_log',
        })

        // Also try a simple alert as fallback
        setTimeout(() => {
          alert(`📖 ${log.name}\n\n${log.content}`)
        }, 100)

        // Emit story progression event
        this.eventBus.emit('story.log_found', {
          logId: log.id,
          content: log.content,
          totalFound: this.foundLogs.size,
        })

        // Check for story completion
        this.checkStoryProgress()
      },
      getInteractionPrompt: () => `Read ${log.name}`,
      getInteractionData: (): InteractionMetadata => ({
        id: log.id,
        name: log.name,
        description: `Captain's log entry`,
        interactionType: InteractionType.CLICK,
        interactionRadius: 2,
        isInteractable: true,
        tags: ['story', 'log'],
        userData: { content: log.content, name: log.name },
      }),
    }

    console.log(
      `🎯 Registering interactable captain log: ${log.id} at position`,
      log.position,
    )
    this.interactionSystem.registerInteractable(interactableObj)
  }

  private async createInteractiveObject(obj: any): Promise<void> {
    let objectMesh: THREE.Object3D

    if (obj.model === 'Prop_ItemHolder') {
      // Create pedestal-like holder
      const pedestalGeometry = new this.THREE.CylinderGeometry(0.2, 0.3, 0.5, 8)
      const pedestalMaterial = new this.THREE.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.7,
        roughness: 0.3,
      })
      objectMesh = new this.THREE.Mesh(pedestalGeometry, pedestalMaterial)

      // Add glow effect if specified
      if (obj.glow) {
        const glowColor = obj.glow_color || '#ffffff'
        const light = new this.THREE.PointLight(glowColor, 1, 5)
        light.position.copy(objectMesh.position)
        light.position.y += 0.5
        this.levelGroup.add(light)
        this.storyLights.push(light)
      }
    } else if (obj.model === 'Prop_Light_Small') {
      // Create anomaly visualization
      const anomalyGeometry = new this.THREE.SphereGeometry(0.5, 16, 16)
      const anomalyMaterial = new this.THREE.MeshBasicMaterial({
        color: 0x8844ff,
        transparent: true,
        opacity: 0.6,
      })
      objectMesh = new this.THREE.Mesh(anomalyGeometry, anomalyMaterial)

      // Add pulsing animation with proper cleanup
      const startTime = Date.now()
      let animationId: number
      const animate = () => {
        if (this.isDisposed) return

        const elapsed = (Date.now() - startTime) * 0.001
        const pulse = Math.sin(elapsed * 2) * 0.2 + 0.8
        anomalyMaterial.opacity = 0.6 * pulse
        objectMesh.scale.setScalar(1 + pulse * 0.1)
        animationId = requestAnimationFrame(animate)
      }
      animate()

      // Store cleanup function
      this.animationCleanups.push(() => {
        if (animationId) cancelAnimationFrame(animationId)
      })
    } else {
      // Default object
      const objGeometry = new this.THREE.BoxGeometry(0.3, 0.3, 0.3)
      const objMaterial = new this.THREE.MeshStandardMaterial({
        color: 0x4444ff,
      })
      objectMesh = new this.THREE.Mesh(objGeometry, objMaterial)
    }

    objectMesh.position.set(obj.position[0], obj.position[1], obj.position[2])

    // Apply shadow properties if it's a mesh
    if (objectMesh instanceof this.THREE.Mesh) {
      objectMesh.castShadow = true
      objectMesh.receiveShadow = true
    }
    this.levelGroup.add(objectMesh)
    this.storyObjects.push(objectMesh)

    const interactableObj: InteractableObject = {
      id: obj.id,
      mesh: objectMesh,
      interactionRadius: obj.interaction === 'approach' ? 1 : 2,
      isInteractable: true,
      interactionType: InteractionType.CLICK,
      onInteract: (_interactionData: InteractionData) => {
        console.log(`🔍 INTERACTION TRIGGERED! Examined: ${obj.name}`)

        // Track story progression
        this.examinedObjects.add(obj.id)

        // Show visual feedback
        this.showWorldNotification(obj.name, objectMesh.position)

        // Show UI dialogue with the object content
        this.eventBus.emit('ui.dialogue.show', {
          title: obj.name,
          content: obj.content,
          speaker: 'Investigation',
          type: 'story_object',
        })

        // Also try a simple alert as fallback
        setTimeout(() => {
          alert(`🔍 ${obj.name}\n\n${obj.content}`)
        }, 100)

        // Emit story progression event
        this.eventBus.emit('story.object_examined', {
          objectId: obj.id,
          content: obj.content,
          totalExamined: this.examinedObjects.size,
        })

        // Check for story completion
        this.checkStoryProgress()
      },
      getInteractionPrompt: () => `${obj.interaction} ${obj.name}`,
      getInteractionData: (): InteractionMetadata => ({
        id: obj.id,
        name: obj.name,
        description: `Interactive story object`,
        interactionType: InteractionType.CLICK,
        interactionRadius: obj.interaction === 'approach' ? 1 : 2,
        isInteractable: true,
        tags: ['story', 'interactive'],
        userData: { content: obj.content, name: obj.name },
      }),
    }

    console.log(
      `🎯 Registering interactable object: ${obj.id} at position`,
      obj.position,
    )
    this.interactionSystem.registerInteractable(interactableObj)
  }

  update(_deltaTime: number): void {
    // Update story object animations if needed
    // Could add temporal distortion effects here
  }

  /**
   * Check story progression and unlock new content
   */
  private checkStoryProgress(): void {
    const totalLogs = this.foundLogs.size
    const totalObjects = this.examinedObjects.size

    // Unlock special content based on progression
    if (totalLogs >= 2 && totalObjects >= 1) {
      this.eventBus.emit('story.milestone_reached', {
        milestone: 'investigation_progress',
        description: 'The Miranda incident is becoming clearer...',
      })
    }

    if (totalLogs >= 3 && totalObjects >= 3) {
      this.eventBus.emit('story.milestone_reached', {
        milestone: 'incident_understood',
        description: 'You have uncovered the truth of the Miranda incident.',
      })
    }
  }

  /**
   * Show a floating notification in the 3D world
   */
  private showWorldNotification(title: string, position: THREE.Vector3): void {
    // Create floating text notification
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = 512
    canvas.height = 256

    // Style the text
    context.fillStyle = 'rgba(0, 0, 0, 0.8)'
    context.fillRect(0, 0, canvas.width, canvas.height)

    context.fillStyle = '#4488ff'
    context.font = 'bold 24px Arial'
    context.textAlign = 'center'
    context.fillText('📖 ' + title, canvas.width / 2, canvas.height / 2 - 20)

    context.fillStyle = '#ffffff'
    context.font = '16px Arial'
    context.fillText(
      "Click to read Captain's log",
      canvas.width / 2,
      canvas.height / 2 + 20,
    )

    // Create texture and material
    const texture = new this.THREE.CanvasTexture(canvas)
    const material = new this.THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
    })

    // Create notification plane
    const geometry = new this.THREE.PlaneGeometry(2, 1)
    const notification = new this.THREE.Mesh(geometry, material)
    notification.position.copy(position)
    notification.position.y += 1.5
    notification.lookAt(position.x, position.y + 1.5, position.z + 10) // Face the camera

    this.levelGroup.add(notification)

    // Animate and remove after 3 seconds
    const startTime = Date.now()
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      if (elapsed > 3) {
        this.levelGroup.remove(notification)
        material.dispose()
        geometry.dispose()
        texture.dispose()
        return
      }

      // Float upward and fade out
      notification.position.y = position.y + 1.5 + elapsed * 0.5
      material.opacity = Math.max(0, 1 - elapsed / 3)

      requestAnimationFrame(animate)
    }
    animate()
  }

  /**
   * Get current story progression
   */
  public getStoryProgress() {
    return {
      logsFound: this.foundLogs.size,
      objectsExamined: this.examinedObjects.size,
      milestones: ['investigation_progress', 'incident_understood'],
    }
  }

  dispose(): void {
    console.log('🧹 Disposing MirandaStorySystem...')

    // Clean up animations
    this.animationCleanups.forEach(cleanup => cleanup())
    this.animationCleanups = []

    // Dispose story objects using ResourceManager
    this.storyObjects.forEach(obj => {
      ResourceManager.disposeObject3D(obj)
      this.levelGroup.remove(obj)
    })
    this.storyObjects = []

    // Dispose lights
    this.storyLights.forEach(light => {
      this.levelGroup.remove(light)
    })
    this.storyLights = []

    // Clear progression tracking
    this.foundLogs.clear()
    this.examinedObjects.clear()

    ;(this as any).isDisposed = true
    console.log('✅ MirandaStorySystem disposed')
  }
}
