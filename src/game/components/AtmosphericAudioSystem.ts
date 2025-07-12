// Atmospheric Audio System Component
// Handles ambient sounds and audio effects for enhanced atmosphere

import type { IDisposable } from '../../engine/interfaces/IDisposable';
import { EventBus } from '../../engine/core/EventBus';

export interface AudioConfig {
  ambient_tracks?: Array<{
    id: string;
    file: string;
    volume: number;
    loop: boolean;
    position: 'global' | [number, number, number];
    radius?: number;
  }>;
  sound_effects?: Array<{
    trigger: string;
    sound: string;
    volume: number;
  }>;
}

export class AtmosphericAudioSystem implements IDisposable {
  private audioContext: AudioContext | null = null;
  private audioSources: Map<string, AudioBufferSourceNode> = new Map();
  private eventListeners: Map<string, () => void> = new Map();
  private trackingData: Map<string, any> = new Map();
  public readonly isDisposed = false;
  
  constructor(
    private THREE: any,
    private scene: any,
    private levelGroup: any,
    private eventBus: EventBus
  ) {
    this.initAudioContext();
  }
  
  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🎧 Audio context initialized');
    } catch (error) {
      console.warn('⚠️ Audio context not available:', error);
    }
  }
  
  async initialize(config: AudioConfig): Promise<void> {
    console.log('🔊 Creating atmospheric audio system...', config);
    
    // Start ambient tracks
    if (config.ambient_tracks) {
      for (const track of config.ambient_tracks) {
        this.playAmbientTrack(track);
      }
    }
    
    // Register sound effect triggers
    if (config.sound_effects) {
      for (const effect of config.sound_effects) {
        const listener = () => this.playSoundEffect(effect);
        this.eventListeners.set(effect.trigger, listener);
        
        // Register with eventBus if available
        if (this.eventBus && typeof this.eventBus.on === 'function') {
          this.eventBus.on(effect.trigger, listener);
        } else {
          console.warn(`EventBus not available or missing 'on' method for trigger: ${effect.trigger}`);
        }
      }
    }
  }
  
  private playAmbientTrack(track: any): void {
    console.log(`🎵 Playing ambient track: ${track.id}`);
    
    // Store track information for later real implementation
    this.trackingData.set(track.id, {
      file: track.file,
      volume: track.volume,
      loop: track.loop,
      position: track.position,
      radius: track.radius,
      type: 'ambient'
    });
    
    // In a real implementation, this would load and play audio files
    if (track.position === 'global') {
      console.log(`🌍 Global ambient: ${track.file} at volume ${track.volume}`);
    } else {
      console.log(`📍 Positional audio: ${track.file} at ${track.position} (radius: ${track.radius})`);
    }
  }
  
  private playSoundEffect(effect: any): void {
    console.log(`🔊 Playing sound effect: ${effect.sound} at volume ${effect.volume}`);
    
    // Store effect information for later real implementation
    this.trackingData.set(`effect_${Date.now()}`, {
      sound: effect.sound,
      volume: effect.volume,
      trigger: effect.trigger,
      type: 'effect',
      timestamp: Date.now()
    });
    
    // In a real implementation, this would play the sound effect
  }
  
  update(_deltaTime: number): void {
    // Update positional audio based on player position
    // When audio is re-enabled, this will handle 3D audio positioning
  }
  
  /**
   * Get audio system statistics
   */
  public getStats() {
    return {
      totalTracks: this.trackingData.size,
      activeListeners: this.eventListeners.size,
      audioContextState: this.audioContext?.state || 'unavailable'
    };
  }
  
  dispose(): void {
    console.log('🧹 Disposing AtmosphericAudioSystem...');
    
    // Clean up event listeners
    this.eventListeners.forEach((listener, trigger) => {
      if (this.eventBus && typeof this.eventBus.off === 'function') {
        this.eventBus.off(trigger, listener);
      }
    });
    this.eventListeners.clear();
    
    // Clean up audio sources
    this.audioSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Source may already be stopped
      }
    });
    this.audioSources.clear();
    
    // Clear tracking data
    this.trackingData.clear();
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close().catch(e => {
        console.warn('Error closing audio context:', e);
      });
    }
    
    (this as any).isDisposed = true;
    console.log('✅ AtmosphericAudioSystem disposed');
  }
}