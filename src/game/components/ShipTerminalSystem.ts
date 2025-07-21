// Ship Terminal System Component
// Handles interactive terminals and computer consoles for spaceship environments

import type * as THREE from 'three'
import type { EventBus } from '../../engine/core/EventBus'
import type { IDisposable } from '../../engine/interfaces/IDisposable'
import {
  type InteractableObject,
  type InteractionData,
  type InteractionMetadata,
  InteractionType,
} from '../../engine/interfaces/InteractableObject'
import type { InteractionSystem } from '../../engine/systems/InteractionSystem'
import { ResourceManager } from '../../engine/utils/ResourceManager'

export interface TerminalConfig {
  terminals: Array<{
    id: string
    name: string
    position: [number, number, number]
    model: string
    status: 'normal' | 'damaged' | 'flickering' | 'temporal_loop'
    data: {
      title: string
      content: string
      timestamp: string
    }
  }>
}

export class ShipTerminalSystem implements IDisposable {
  private terminals: THREE.Object3D[] = []
  private terminalLights: THREE.Light[] = []
  private terminalIntervals: NodeJS.Timeout[] = []
  public readonly isDisposed = false

  // Terminal access tracking
  private accessedTerminals: Set<string> = new Set()

  constructor(
    private THREE: any,
    private scene: any,
    private levelGroup: any,
    private interactionSystem: InteractionSystem,
    private assetLoader: any,
    private eventBus?: EventBus,
  ) {
    // Initialize terminal system
  }

  async initialize(config: TerminalConfig): Promise<void> {
    console.log('💻 Creating ship terminal system...', config)

    if (config.terminals) {
      for (const terminal of config.terminals) {
        await this.createTerminal(terminal)
      }
    }
  }

  private async createTerminal(terminal: any): Promise<void> {
    let terminalMesh

    if (terminal.model === 'Prop_Computer') {
      // Create computer console
      const consoleGroup = new this.THREE.Group()

      // Base
      const baseGeometry = new this.THREE.BoxGeometry(1.2, 0.8, 0.6)
      const baseMaterial = new this.THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2,
      })
      const base = new this.THREE.Mesh(baseGeometry, baseMaterial)
      base.position.y = 0.4
      consoleGroup.add(base)

      // Screen
      const screenGeometry = new this.THREE.PlaneGeometry(0.8, 0.5)
      const screenMaterial = new this.THREE.MeshStandardMaterial({
        color:
          terminal.status === 'damaged'
            ? 0x440000
            : terminal.status === 'flickering'
              ? 0x004400
              : 0x000044,
        emissive:
          terminal.status === 'damaged'
            ? 0x220000
            : terminal.status === 'flickering'
              ? 0x002200
              : 0x000022,
      })
      const screen = new this.THREE.Mesh(screenGeometry, screenMaterial)
      screen.position.set(0, 0.9, 0.31)
      consoleGroup.add(screen)

      terminalMesh = consoleGroup
    } else {
      // Default terminal design
      const terminalGeometry = new this.THREE.BoxGeometry(1, 1.5, 0.3)
      const terminalMaterial = new this.THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.6,
        roughness: 0.4,
      })
      terminalMesh = new this.THREE.Mesh(terminalGeometry, terminalMaterial)
    }

    terminalMesh.position.set(...terminal.position)
    terminalMesh.castShadow = true
    terminalMesh.receiveShadow = true
    this.levelGroup.add(terminalMesh)
    this.terminals.push(terminalMesh)

    // Add status lighting with proper cleanup
    if (terminal.status === 'flickering') {
      const light = new this.THREE.PointLight(0x00ff00, 0.5, 3)
      light.position.copy(terminalMesh.position)
      light.position.y += 1
      this.levelGroup.add(light)
      this.terminalLights.push(light)

      // Simple flicker animation with cleanup tracking
      const flickerInterval = setInterval(() => {
        if (this.isDisposed) return
        light.intensity = Math.random() * 0.5 + 0.2
      }, 200)
      this.terminalIntervals.push(flickerInterval)
    } else if (terminal.status === 'damaged') {
      const light = new this.THREE.PointLight(0xff0000, 0.3, 2)
      light.position.copy(terminalMesh.position)
      light.position.y += 1
      this.levelGroup.add(light)
      this.terminalLights.push(light)
    } else if (terminal.status === 'temporal_loop') {
      const light = new this.THREE.PointLight(0x8844ff, 0.8, 4)
      light.position.copy(terminalMesh.position)
      light.position.y += 1
      this.levelGroup.add(light)
      this.terminalLights.push(light)

      // Pulsing temporal effect
      const pulseInterval = setInterval(() => {
        if (this.isDisposed) return
        const pulse = Math.sin(Date.now() * 0.005) * 0.4 + 0.8
        light.intensity = 0.8 * pulse
      }, 50)
      this.terminalIntervals.push(pulseInterval)
    }

    // Register interaction with proper interface
    const interactableObj: InteractableObject = {
      id: terminal.id,
      mesh: terminalMesh,
      interactionRadius: 3,
      isInteractable: true,
      interactionType: InteractionType.CLICK,
      onInteract: (_interactionData: InteractionData) => {
        console.log(
          `💻 Terminal ${terminal.name} accessed:`,
          terminal.data.title,
        )

        // Track terminal access
        this.accessedTerminals.add(terminal.id)

        // Show terminal content in UI
        if (this.eventBus) {
          this.eventBus.emit('ui.dialogue.show', {
            title: terminal.data.title,
            content: terminal.data.content,
            speaker: terminal.name,
            type: 'terminal_log',
            timestamp: terminal.data.timestamp,
          })
        }

        // Emit terminal access event for story progression
        if (this.eventBus) {
          this.eventBus.emit('story.terminal_accessed', {
            terminalId: terminal.id,
            terminalName: terminal.name,
            data: terminal.data,
            totalAccessed: this.accessedTerminals.size,
          })
        }

        // Play terminal access sound effect
        if (this.eventBus) {
          this.eventBus.emit('audio.play_effect', {
            sound: 'computer_beep_distorted.ogg',
            volume: 0.4,
          })
        }
      },
      getInteractionPrompt: () => `Access ${terminal.name}`,
      getInteractionData: (): InteractionMetadata => ({
        id: terminal.id,
        name: terminal.name,
        description: terminal.data.title,
        interactionType: InteractionType.CLICK,
        interactionRadius: 3,
        isInteractable: true,
        tags: ['terminal', 'computer'],
        userData: terminal.data,
      }),
    }

    this.interactionSystem.registerInteractable(interactableObj)
  }

  update(_deltaTime: number): void {
    // Update terminal animations if needed
    // Could add screen flicker effects or data scrolling
  }

  /**
   * Get terminal access statistics
   */
  public getAccessStats() {
    return {
      totalTerminals: this.terminals.length,
      accessedTerminals: this.accessedTerminals.size,
      accessedIds: Array.from(this.accessedTerminals),
    }
  }

  dispose(): void {
    console.log('🧹 Disposing ShipTerminalSystem...')

    // Clear all intervals
    this.terminalIntervals.forEach(interval => clearInterval(interval))
    this.terminalIntervals = []

    // Dispose terminals using ResourceManager
    this.terminals.forEach(terminal => {
      ResourceManager.disposeObject3D(terminal)
      this.levelGroup.remove(terminal)
    })
    this.terminals = []

    // Dispose lights
    this.terminalLights.forEach(light => {
      this.levelGroup.remove(light)
    })
    this.terminalLights = []

    // Clear access tracking
    this.accessedTerminals.clear()

    ;(this as any).isDisposed = true
    console.log('✅ ShipTerminalSystem disposed')
  }
}
