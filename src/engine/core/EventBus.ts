// Global event system for decoupled communication between systems

export type EventCallback = (...args: any[]) => void

export class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map()
  private onceEvents: Map<string, Set<EventCallback>> = new Map()

  // Subscribe to an event
  public on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(callback)
  }

  // Subscribe to an event that will only fire once
  public once(event: string, callback: EventCallback): void {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, new Set())
    }
    this.onceEvents.get(event)!.add(callback)
  }

  // Unsubscribe from an event
  public off(event: string, callback: EventCallback): void {
    if (this.events.has(event)) {
      this.events.get(event)!.delete(callback)
      if (this.events.get(event)!.size === 0) {
        this.events.delete(event)
      }
    }

    if (this.onceEvents.has(event)) {
      this.onceEvents.get(event)!.delete(callback)
      if (this.onceEvents.get(event)!.size === 0) {
        this.onceEvents.delete(event)
      }
    }
  }

  // Emit an event
  public emit(event: string, ...args: any[]): void {
    // Regular events
    if (this.events.has(event)) {
      for (const callback of this.events.get(event)!) {
        try {
          callback(...args)
        } catch (error) {
          console.error(`Error in event callback for "${event}":`, error)
        }
      }
    }

    // Once events
    if (this.onceEvents.has(event)) {
      const callbacks = Array.from(this.onceEvents.get(event)!)
      this.onceEvents.delete(event) // Remove all once callbacks

      for (const callback of callbacks) {
        try {
          callback(...args)
        } catch (error) {
          console.error(`Error in once event callback for "${event}":`, error)
        }
      }
    }
  }

  // Remove all listeners for an event
  public removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event)
      this.onceEvents.delete(event)
    } else {
      this.events.clear()
      this.onceEvents.clear()
    }
  }

  // Get all event names
  public getEventNames(): string[] {
    const regularEvents = Array.from(this.events.keys())
    const onceEvents = Array.from(this.onceEvents.keys())
    return [...new Set([...regularEvents, ...onceEvents])]
  }

  // Get listener count for an event
  public listenerCount(event: string): number {
    const regularCount = this.events.get(event)?.size || 0
    const onceCount = this.onceEvents.get(event)?.size || 0
    return regularCount + onceCount
  }

  // Check if event has listeners
  public hasListeners(event: string): boolean {
    return this.listenerCount(event) > 0
  }

  // Promise-based event waiting
  public wait(event: string, timeout?: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null

      const callback = (...args: any[]) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        resolve(args)
      }

      this.once(event, callback)

      if (timeout) {
        timeoutId = setTimeout(() => {
          this.off(event, callback)
          reject(new Error(`Event "${event}" timed out after ${timeout}ms`))
        }, timeout)
      }
    })
  }

  // Debug information
  public getDebugInfo(): {
    [event: string]: { regular: number; once: number }
  } {
    const info: { [event: string]: { regular: number; once: number } } = {}

    for (const [event, callbacks] of this.events) {
      if (!info[event]) info[event] = { regular: 0, once: 0 }
      info[event].regular = callbacks.size
    }

    for (const [event, callbacks] of this.onceEvents) {
      if (!info[event]) info[event] = { regular: 0, once: 0 }
      info[event].once = callbacks.size
    }

    return info
  }
}
