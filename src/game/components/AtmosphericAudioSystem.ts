// Atmospheric Audio System Component
// Handles ambient sounds and audio effects for enhanced atmosphere

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

export class AtmosphericAudioSystem {
  private audioContext: AudioContext | null = null;
  private audioSources: Map<string, AudioBufferSourceNode> = new Map();
  private eventListeners: Map<string, () => void> = new Map();
  
  constructor(
    private THREE: any,
    private scene: any,
    private levelGroup: any,
    private eventBus: any // Will be properly typed when we fix the interface
  ) {
    this.initAudioContext();
  }
  
  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not available:', error);
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
    // In a real implementation, this would load and play audio files
    // For now, just log the track info
    if (track.position === 'global') {
      console.log(`Global ambient: ${track.file} at volume ${track.volume}`);
    } else {
      console.log(`Positional audio: ${track.file} at ${track.position} (radius: ${track.radius})`);
    }
  }
  
  private playSoundEffect(effect: any): void {
    console.log(`🔊 Playing sound effect: ${effect.sound} at volume ${effect.volume}`);
    // In a real implementation, this would play the sound effect
  }
  
  update(_deltaTime: number): void {
    // Update positional audio based on player position
  }
  
  dispose(): void {
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
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}