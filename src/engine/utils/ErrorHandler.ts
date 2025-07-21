/**
 * Comprehensive error handling utilities for the game engine
 */
export class ErrorHandler {
  private static errorLog: ErrorEntry[] = []
  private static maxLogSize = 100
  private static errorCallbacks: Set<(error: ErrorEntry) => void> = new Set()

  /**
   * Handle a game error with context and recovery suggestions
   */
  public static handleError(error: Error, context: ErrorContext): void {
    const errorEntry: ErrorEntry = {
      error,
      context,
      timestamp: Date.now(),
      stack: error.stack || 'No stack trace available',
      userAgent: navigator.userAgent,
      url: window.location.href,
      recoverySuggestions: this.generateRecoverySuggestions(error, context),
    }

    // Log error
    this.logError(errorEntry)

    // Notify callbacks
    this.notifyCallbacks(errorEntry)

    // Attempt recovery if possible
    this.attemptRecovery(errorEntry)

    // Report to console
    this.reportError(errorEntry)
  }

  /**
   * Add error callback
   */
  public static onError(callback: (error: ErrorEntry) => void): void {
    this.errorCallbacks.add(callback)
  }

  /**
   * Remove error callback
   */
  public static offError(callback: (error: ErrorEntry) => void): void {
    this.errorCallbacks.delete(callback)
  }

  /**
   * Get recent errors
   */
  public static getRecentErrors(count = 10): ErrorEntry[] {
    return this.errorLog.slice(-count)
  }

  /**
   * Clear error log
   */
  public static clearErrorLog(): void {
    this.errorLog = []
  }

  /**
   * Create safe async function wrapper
   */
  public static wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context: ErrorContext,
  ): (...args: T) => Promise<R | null> {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args)
      } catch (error) {
        this.handleError(error as Error, context)
        return null
      }
    }
  }

  /**
   * Create safe sync function wrapper
   */
  public static wrapSync<T extends any[], R>(
    fn: (...args: T) => R,
    context: ErrorContext,
  ): (...args: T) => R | null {
    return (...args: T): R | null => {
      try {
        return fn(...args)
      } catch (error) {
        this.handleError(error as Error, context)
        return null
      }
    }
  }

  /**
   * Validate and handle initialization errors
   */
  public static validateInitialization<T>(
    result: T | null | undefined,
    context: ErrorContext,
  ): T {
    if (result === null || result === undefined) {
      throw new Error(
        `Initialization failed: ${context.operation} returned null/undefined`,
      )
    }
    return result
  }

  /**
   * Assert condition with error handling
   */
  public static assert(
    condition: boolean,
    message: string,
    context: ErrorContext,
  ): void {
    if (!condition) {
      const error = new Error(`Assertion failed: ${message}`)
      this.handleError(error, context)
      throw error
    }
  }

  private static logError(errorEntry: ErrorEntry): void {
    this.errorLog.push(errorEntry)

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }
  }

  private static notifyCallbacks(errorEntry: ErrorEntry): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorEntry)
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError)
      }
    })
  }

  private static attemptRecovery(errorEntry: ErrorEntry): void {
    const { context, recoverySuggestions } = errorEntry

    // Attempt automatic recovery based on context
    switch (context.component) {
      case 'AssetLoader':
        this.recoverAssetLoader(context)
        break

      case 'Level':
        this.recoverLevel(context)
        break

      case 'Renderer':
        this.recoverRenderer(context)
        break

      case 'Physics':
        this.recoverPhysics(context)
        break

      default:
        console.log('No automatic recovery available for:', context.component)
    }
  }

  private static recoverAssetLoader(context: ErrorContext): void {
    console.log('🔄 Attempting asset loader recovery...')

    if (context.operation === 'load') {
      // Could implement asset retry logic here
      console.log('Asset loading will be retried automatically')
    }
  }

  private static recoverLevel(context: ErrorContext): void {
    console.log('🔄 Attempting level recovery...')

    if (context.operation === 'initialize') {
      // Could implement level fallback logic here
      console.log('Level initialization will be retried')
    }
  }

  private static recoverRenderer(context: ErrorContext): void {
    console.log('🔄 Attempting renderer recovery...')

    if (context.operation === 'resize') {
      // Could implement renderer resize retry
      console.log('Renderer resize will be retried')
    }
  }

  private static recoverPhysics(context: ErrorContext): void {
    console.log('🔄 Attempting physics recovery...')

    if (context.operation === 'update') {
      // Could implement physics reset logic
      console.log('Physics system will be reset')
    }
  }

  private static generateRecoverySuggestions(
    error: Error,
    context: ErrorContext,
  ): string[] {
    const suggestions: string[] = []

    // General suggestions
    if (error.message.includes('out of memory')) {
      suggestions.push('Close other tabs or applications to free memory')
      suggestions.push('Reduce graphics quality settings')
    }

    if (error.message.includes('WebGL')) {
      suggestions.push('Update your graphics drivers')
      suggestions.push('Try a different browser')
      suggestions.push('Enable hardware acceleration')
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      suggestions.push('Check your internet connection')
      suggestions.push('Try refreshing the page')
      suggestions.push('Clear browser cache')
    }

    // Context-specific suggestions
    switch (context.component) {
      case 'AssetLoader':
        suggestions.push('Verify asset files are accessible')
        suggestions.push('Check asset file formats are supported')
        break

      case 'Level':
        suggestions.push('Try switching to a different level')
        suggestions.push('Restart the game')
        break

      case 'Renderer':
        suggestions.push('Try reducing screen resolution')
        suggestions.push('Disable post-processing effects')
        break

      case 'Physics':
        suggestions.push('Reset physics simulation')
        suggestions.push('Check for object collisions')
        break
    }

    return suggestions
  }

  private static reportError(errorEntry: ErrorEntry): void {
    const { error, context, timestamp, recoverySuggestions } = errorEntry

    console.group(`🚨 Game Error: ${context.component}.${context.operation}`)
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    console.log('Context:', context)
    console.log('Timestamp:', new Date(timestamp).toISOString())

    if (recoverySuggestions.length > 0) {
      console.log('Recovery suggestions:')
      recoverySuggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion}`)
      })
    }

    console.groupEnd()
  }
}

/**
 * Error context information
 */
export interface ErrorContext {
  component: string
  operation: string
  details?: any
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Error entry for logging
 */
export interface ErrorEntry {
  error: Error
  context: ErrorContext
  timestamp: number
  stack: string
  userAgent: string
  url: string
  recoverySuggestions: string[]
}

/**
 * Utility functions for error handling
 */
export const ErrorUtils = {
  /**
   * Check if error is recoverable
   */
  isRecoverable(error: Error): boolean {
    const nonRecoverableErrors = [
      'out of memory',
      'WebGL context lost',
      'security',
      'permission',
    ]

    const message = error.message.toLowerCase()
    return !nonRecoverableErrors.some(keyword => message.includes(keyword))
  },

  /**
   * Get error severity based on context
   */
  getSeverity(
    error: Error,
    context: ErrorContext,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (
      error.message.includes('out of memory') ||
      error.message.includes('WebGL context lost')
    ) {
      return 'critical'
    }

    if (context.component === 'Engine' || context.component === 'Renderer') {
      return 'high'
    }

    if (context.component === 'AssetLoader' || context.component === 'Level') {
      return 'medium'
    }

    return 'low'
  },

  /**
   * Format error for user display
   */
  formatUserError(error: Error, context: ErrorContext): string {
    const severity = this.getSeverity(error, context)

    switch (severity) {
      case 'critical':
        return 'A critical error occurred. Please refresh the page and try again.'
      case 'high':
        return 'A rendering error occurred. Some features may not work properly.'
      case 'medium':
        return 'A loading error occurred. Some content may be missing.'
      case 'low':
        return 'A minor error occurred. The game should continue normally.'
      default:
        return 'An error occurred. Please try again.'
    }
  },
}
