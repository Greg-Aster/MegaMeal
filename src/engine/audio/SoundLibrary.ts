// Sound asset management system

import { Howl } from 'howler'

export class SoundLibrary {
  private sounds = new Map<string, Howl>()

  public load(id: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sound = new Howl({
        src: [src],
        onload: () => resolve(),
        onloaderror: (_, error) => reject(error),
      })

      this.sounds.set(id, sound)
    })
  }

  public play(id: string): void {
    const sound = this.sounds.get(id)
    if (sound) {
      sound.play()
    }
  }

  public stop(id: string): void {
    const sound = this.sounds.get(id)
    if (sound) {
      sound.stop()
    }
  }

  public dispose(): void {
    this.sounds.forEach(sound => sound.unload())
    this.sounds.clear()
  }
}
