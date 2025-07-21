/**
 * Performance Testing Utilities
 * Extracted from Performance.svelte for proper module importing
 */

export interface PerformanceTestResult {
  averageFPS: number
  minFPS: number
  maxFPS: number
  maxFrameTime: number
  frameCount: number
}

export const performanceUtils = {
  runPerformanceTest: (duration: number): Promise<PerformanceTestResult> => {
    return new Promise((resolve) => {
      const frameTimes: number[] = []
      let frameCount = 0
      let lastTime = performance.now()
      const startTime = lastTime

      const testLoop = () => {
        const currentTime = performance.now()
        const frameTime = currentTime - lastTime
        
        if (frameTime > 0) {
          frameTimes.push(frameTime)
          frameCount++
        }
        
        lastTime = currentTime

        if (currentTime - startTime < duration) {
          requestAnimationFrame(testLoop)
        } else {
          // Test finished, calculate results
          const totalTime = frameTimes.reduce((a, b) => a + b, 0)
          const averageFPS = totalTime > 0 ? (frameCount * 1000) / totalTime : 0
          const maxFrameTime = frameTimes.length > 0 ? Math.max(...frameTimes) : 0
          const minFrameTime = frameTimes.length > 0 ? Math.min(...frameTimes) : 0
          
          const maxFPS = minFrameTime > 0 ? 1000 / minFrameTime : 0
          const minFPS = maxFrameTime > 0 ? 1000 / maxFrameTime : 0

          resolve({ averageFPS, minFPS, maxFPS, maxFrameTime, frameCount })
        }
      }
      requestAnimationFrame(testLoop)
    })
  }
}