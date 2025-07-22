/**
 * Abstract base class for all game objects
 * Provides common lifecycle methods and state management
 */
export abstract class GameObject {
  protected isInitialized = false
  protected isDisposed = false
  protected isActive = true

  /**
   * Initialize the game object
   * Must be implemented by subclasses
   */
  public abstract initialize(): Promise<void>

  /**
   * Update the game object each frame
   * Must be implemented by subclasses
   */
  public abstract update(deltaTime: number): void

  /**
   * Dispose of the game object and clean up resources
   * Must be implemented by subclasses
   */
  public abstract dispose(): void

  /**
   * Check if the object is initialized
   */
  public getIsInitialized(): boolean {
    return this.isInitialized
  }

  /**
   * Check if the object is disposed
   */
  public getIsDisposed(): boolean {
    return this.isDisposed
  }

  /**
   * Check if the object is active
   */
  public getIsActive(): boolean {
    return this.isActive
  }

  /**
   * Set the active state of the object
   */
  public setActive(active: boolean): void {
    this.isActive = active
  }

  /**
   * Validate that the object is in a valid state for operations
   * @throws {Error} If the object is disposed or not initialized
   */
  protected validateState(): void {
    if (this.isDisposed) {
      throw new Error(`${this.constructor.name} is disposed and cannot be used`)
    }
    if (!this.isInitialized) {
      throw new Error(
        `${this.constructor.name} is not initialized. Call initialize() first.`,
      )
    }
  }

  /**
   * Validate that the object is not disposed
   * @throws {Error} If the object is disposed
   */
  protected validateNotDisposed(): void {
    if (this.isDisposed) {
      throw new Error(`${this.constructor.name} is disposed and cannot be used`)
    }
  }

  /**
   * Mark the object as initialized
   * Should be called by subclasses after successful initialization
   */
  protected markInitialized(): void {
    this.isInitialized = true
  }

  /**
   * Mark the object as disposed
   * Should be called by subclasses after disposal
   */
  protected markDisposed(): void {
    this.isDisposed = true
    this.isActive = false
  }
}
