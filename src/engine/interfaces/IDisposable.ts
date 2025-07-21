/**
 * Interface for objects that need disposal/cleanup
 * Ensures consistent disposal patterns across the codebase
 */
export interface IDisposable {
  /**
   * Dispose of all resources held by this object
   * Should be safe to call multiple times
   */
  dispose(): void

  /**
   * Indicates whether this object has been disposed
   */
  readonly isDisposed: boolean
}

/**
 * Interface for objects that need cleanup but not full disposal
 * Used for UI state cleanup, event listener removal, etc.
 */
export interface ICleanable {
  /**
   * Clean up temporary state, UI elements, event listeners, etc.
   * Does not dispose of the object itself
   */
  cleanup(): void
}

/**
 * Interface for objects that manage multiple disposable resources
 * Provides automatic disposal registry functionality
 */
export interface IDisposableManager extends IDisposable {
  /**
   * Register a disposable object for automatic cleanup
   */
  registerDisposable(disposable: IDisposable): void

  /**
   * Unregister a disposable object
   */
  unregisterDisposable(disposable: IDisposable): void

  /**
   * Get count of registered disposables
   */
  getDisposableCount(): number
}

/**
 * Utility class for managing disposable objects
 */
export class DisposableManager {
  private disposables: any[] = []
  private _isDisposed = false

  public get isDisposed(): boolean {
    return this._isDisposed
  }

  public registerDisposable(disposable: any): void {
    if (this._isDisposed) {
      console.warn('Cannot register disposable on disposed manager')
      return
    }

    if (this.disposables.indexOf(disposable) === -1) {
      this.disposables.push(disposable)
    }
  }

  public unregisterDisposable(disposable: any): void {
    const index = this.disposables.indexOf(disposable)
    if (index !== -1) {
      this.disposables.splice(index, 1)
    }
  }

  public getDisposableCount(): number {
    return this.disposables.length
  }

  public dispose(): void {
    if (this._isDisposed) return

    console.log(
      `🧹 DisposableManager disposing ${this.disposables.length} objects`,
    )

    // Dispose all registered objects
    this.disposables.forEach(disposable => {
      try {
        if (disposable && typeof disposable.dispose === 'function') {
          disposable.dispose()
        }
      } catch (error) {
        console.error('Error disposing object:', error)
      }
    })

    // Clear the registry
    this.disposables = []
    this._isDisposed = true

    console.log('✅ DisposableManager disposed')
  }
}

/**
 * Utility functions for disposal management
 */
export class DisposalUtils {
  /**
   * Safely dispose of an object if it implements IDisposable
   */
  public static safeDispose(obj: any): void {
    if (obj && typeof obj.dispose === 'function' && !obj.isDisposed) {
      obj.dispose()
    }
  }

  /**
   * Safely cleanup an object if it implements ICleanable
   */
  public static safeCleanup(obj: any): void {
    if (obj && typeof obj.cleanup === 'function') {
      obj.cleanup()
    }
  }

  /**
   * Dispose of an array of disposable objects
   */
  public static disposeArray(objects: any[]): void {
    objects.forEach(obj => DisposalUtils.safeDispose(obj))
  }

  /**
   * Create a disposable wrapper for event listeners
   */
  public static createEventListenerDisposable(
    target: EventTarget,
    event: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
  ): IDisposable {
    target.addEventListener(event, listener, options)

    return {
      dispose: () => {
        target.removeEventListener(event, listener, options)
      },
      isDisposed: false, // Simple implementation for wrapper
    }
  }

  /**
   * Create a disposable wrapper for intervals/timeouts
   */
  public static createTimerDisposable(
    timerId: number,
    type: 'interval' | 'timeout' = 'interval',
  ): IDisposable {
    return {
      dispose: () => {
        if (type === 'interval') {
          clearInterval(timerId)
        } else {
          clearTimeout(timerId)
        }
      },
      isDisposed: false,
    }
  }
}
