// 3D audio management system using Howler.js

import { Howl, Howler } from 'howler'
import * as THREE from 'three'

export interface AudioConfig {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  enable3D: boolean
  maxDistance: number
  rolloffFactor: number
}

export interface SoundOptions {
  volume?: number
  loop?: boolean
  position?: THREE.Vector3
  autoplay?: boolean
  onload?: () => void
  onend?: () => void
  onfade?: () => void
}

export class AudioManager {
  private config: AudioConfig
  private isInitialized = false
  private sounds = new Map<string, Howl>()
  private listenerPosition = new THREE.Vector3()
  private listenerOrientation = {
    forward: new THREE.Vector3(0, 0, -1),
    up: new THREE.Vector3(0, 1, 0),
  }

  constructor(config?: Partial<AudioConfig>) {
    this.config = {
      masterVolume: 1.0,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      enable3D: true,
      maxDistance: 100,
      rolloffFactor: 1,
      ...config,
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('AudioManager already initialized')
      return
    }

    console.log('🔊 Initializing Audio Manager...')

    try {
      // Set global Howler settings
      Howler.volume(this.config.masterVolume)

      if (this.config.enable3D) {
        // Set up 3D audio orientation
        this.updateListenerOrientation()
      }

      this.isInitialized = true
      console.log('✅ Audio Manager initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Audio Manager:', error)
      throw error
    }
  }

  public loadSound(
    id: string,
    src: string,
    options?: SoundOptions,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const howlOptions: any = {
        src: [src],
        volume: options?.volume ?? 1.0,
        loop: options?.loop ?? false,
        autoplay: options?.autoplay ?? false,
        onload: () => {
          options?.onload?.()
          resolve()
        },
        onloaderror: (id: number, error: any) => {
          console.error(`Failed to load sound "${id}":`, error)
          reject(error)
        },
        onend: options?.onend,
        onfade: options?.onfade,
      }

      // Enable 3D positioning if requested
      if (this.config.enable3D && options?.position) {
        howlOptions.html5 = true // Required for 3D positioning
      }

      const sound = new Howl(howlOptions)

      // Set 3D position if provided
      if (this.config.enable3D && options?.position) {
        sound.pos(options.position.x, options.position.y, options.position.z)
      }

      this.sounds.set(id, sound)
    })
  }

  public playSound(
    id: string,
    options?: {
      volume?: number
      position?: THREE.Vector3
      fade?: { from: number; to: number; duration: number }
    },
  ): number | null {
    const sound = this.sounds.get(id)
    if (!sound) {
      console.warn(`Sound "${id}" not found`)
      return null
    }

    // Set volume if provided
    if (options?.volume !== undefined) {
      sound.volume(options.volume)
    }

    // Set 3D position if provided
    if (this.config.enable3D && options?.position) {
      sound.pos(options.position.x, options.position.y, options.position.z)
    }

    // Play with fade if requested
    if (options?.fade) {
      const soundId = sound.play()
      sound.fade(
        options.fade.from,
        options.fade.to,
        options.fade.duration,
        soundId,
      )
      return soundId
    }

    return sound.play()
  }

  public stopSound(id: string, soundId?: number): void {
    const sound = this.sounds.get(id)
    if (sound) {
      sound.stop(soundId)
    }
  }

  public pauseSound(id: string, soundId?: number): void {
    const sound = this.sounds.get(id)
    if (sound) {
      sound.pause(soundId)
    }
  }

  public fadeSound(
    id: string,
    from: number,
    to: number,
    duration: number,
    soundId?: number,
  ): void {
    const sound = this.sounds.get(id)
    if (sound) {
      sound.fade(from, to, duration, soundId)
    }
  }

  public setSoundVolume(id: string, volume: number, soundId?: number): void {
    const sound = this.sounds.get(id)
    if (sound) {
      sound.volume(volume, soundId)
    }
  }

  public setSoundPosition(
    id: string,
    position: THREE.Vector3,
    soundId?: number,
  ): void {
    if (!this.config.enable3D) return

    const sound = this.sounds.get(id)
    if (sound) {
      sound.pos(position.x, position.y, position.z, soundId)
    }
  }

  public isSoundPlaying(id: string, soundId?: number): boolean {
    const sound = this.sounds.get(id)
    if (sound) {
      return sound.playing(soundId)
    }
    return false
  }

  public getSoundDuration(id: string): number {
    const sound = this.sounds.get(id)
    if (sound) {
      return sound.duration()
    }
    return 0
  }

  public setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume))
    Howler.volume(this.config.masterVolume)
  }

  public setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume))
    // Apply to all music sounds (you'd need to tag sounds as music)
  }

  public setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume))
    // Apply to all SFX sounds (you'd need to tag sounds as SFX)
  }

  public setListenerPosition(position: THREE.Vector3): void {
    if (!this.config.enable3D) return

    this.listenerPosition.copy(position)
    Howler.pos(position.x, position.y, position.z)
  }

  public setListenerOrientation(
    forward: THREE.Vector3,
    up: THREE.Vector3,
  ): void {
    if (!this.config.enable3D) return

    this.listenerOrientation.forward.copy(forward)
    this.listenerOrientation.up.copy(up)

    Howler.orientation(forward.x, forward.y, forward.z, up.x, up.y, up.z)
  }

  private updateListenerOrientation(): void {
    if (this.config.enable3D) {
      Howler.orientation(
        this.listenerOrientation.forward.x,
        this.listenerOrientation.forward.y,
        this.listenerOrientation.forward.z,
        this.listenerOrientation.up.x,
        this.listenerOrientation.up.y,
        this.listenerOrientation.up.z,
      )
    }
  }

  public muteAll(): void {
    Howler.mute(true)
  }

  public unmuteAll(): void {
    Howler.mute(false)
  }

  public stopAll(): void {
    Howler.stop()
  }

  public update(deltaTime: number): void {
    if (!this.isInitialized) return

    // Update 3D audio if enabled
    if (this.config.enable3D) {
      // This is where you'd update listener position based on camera
      // The actual updating is handled by Howler automatically
    }
  }

  public preloadSounds(
    soundList: { id: string; src: string; options?: SoundOptions }[],
  ): Promise<void[]> {
    const promises = soundList.map(sound =>
      this.loadSound(sound.id, sound.src, sound.options),
    )

    return Promise.all(promises)
  }

  public unloadSound(id: string): void {
    const sound = this.sounds.get(id)
    if (sound) {
      sound.unload()
      this.sounds.delete(id)
    }
  }

  public getLoadedSounds(): string[] {
    return Array.from(this.sounds.keys())
  }

  public getConfig(): AudioConfig {
    return { ...this.config }
  }

  public dispose(): void {
    console.log('🧹 Disposing Audio Manager...')

    // Stop and unload all sounds
    this.sounds.forEach((sound, id) => {
      sound.stop()
      sound.unload()
    })

    this.sounds.clear()

    // Stop all Howler audio
    Howler.stop()

    this.isInitialized = false

    console.log('✅ Audio Manager disposed')
  }
}
