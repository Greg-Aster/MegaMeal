<!-- 
  Threlte Performance Benchmark Suite
  Comprehensive performance testing and validation
-->
<script lang="ts">
import { onMount, createEventDispatcher } from 'svelte'
import { Canvas, T } from '@threlte/core'
import { performanceUtils } from '../utils/performanceUtils'
import { lodUtils } from '../utils/lodUtils'

const dispatch = createEventDispatcher()

// Benchmark configuration
export let autoStart = false
export let testDuration = 10000 // 10 seconds per test
export let includeStressTests = true

// Benchmark state
let isRunning = false
let currentTest = ''
let testProgress = 0
let results = {}
let benchmarkLog = []

// Test scenarios
const benchmarkTests = [
  {
    id: 'baseline',
    name: 'Baseline Performance',
    description: 'Empty scene with basic lighting',
    objectCount: 0,
    complexity: 'minimal'
  },
  {
    id: 'low_poly',
    name: 'Low Poly Scene',
    description: '100 simple cubes with basic materials',
    objectCount: 100,
    complexity: 'low'
  },
  {
    id: 'medium_poly',
    name: 'Medium Poly Scene', 
    description: '500 detailed objects with textures',
    objectCount: 500,
    complexity: 'medium'
  },
  {
    id: 'high_poly',
    name: 'High Poly Scene',
    description: '1000 complex objects with advanced materials',
    objectCount: 1000,
    complexity: 'high'
  },
  {
    id: 'stress_test',
    name: 'Stress Test',
    description: '2000+ objects with particles and effects',
    objectCount: 2000,
    complexity: 'extreme'
  }
]

// Current test objects
let testObjects = []
let testScene = null

onMount(() => {
  if (autoStart) {
    startBenchmark()
  }
})

/**
 * Start the full benchmark suite
 */
export async function startBenchmark() {
  if (isRunning) return
  
  isRunning = true
  results = {}
  benchmarkLog = []
  testProgress = 0
  
  log('🚀 Starting Threlte Performance Benchmark Suite...')
  dispatch('benchmarkStarted')
  
  try {
    // Run each test
    for (let i = 0; i < benchmarkTests.length; i++) {
      const test = benchmarkTests[i]
      
      // Skip stress tests if not included
      if (!includeStressTests && test.complexity === 'extreme') {
        continue
      }
      
      currentTest = test.name
      testProgress = (i / benchmarkTests.length) * 100
      
      log(`📊 Running test: ${test.name}`)
      
      // Setup test scene
      await setupTestScene(test)
      
      // Wait for scene to stabilize
      await wait(1000)
      
      // Run performance test
      const testResult = await performanceUtils.runPerformanceTest(testDuration)
      
      // Collect additional metrics
      const additionalMetrics = await collectAdditionalMetrics()
      
      // Store results
      results[test.id] = {
        ...testResult,
        ...additionalMetrics,
        test: test,
        timestamp: Date.now()
      }
      
      log(`✅ Test completed: ${test.name} - Avg FPS: ${testResult.averageFPS.toFixed(1)}`)
      
      // Cleanup test scene
      cleanupTestScene()
      
      // Brief pause between tests
      await wait(500)
    }
    
    // Generate final report
    const report = generateBenchmarkReport()
    
    testProgress = 100
    currentTest = 'Complete'
    
    log('🎉 Benchmark suite completed!')
    dispatch('benchmarkCompleted', { results, report })
    
  } catch (error) {
    log(`❌ Benchmark failed: ${error.message}`)
    dispatch('benchmarkError', error)
  } finally {
    isRunning = false
    cleanupTestScene()
  }
}

/**
 * Setup test scene with specified complexity
 */
async function setupTestScene(test) {
  cleanupTestScene()
  testObjects = []
  
  const objectCount = test.objectCount
  
  for (let i = 0; i < objectCount; i++) {
    const object = createTestObject(test.complexity, i)
    testObjects.push(object)
  }
  
  log(`🏗️ Created ${objectCount} test objects for ${test.name}`)
}

/**
 * Create test object based on complexity level
 */
function createTestObject(complexity, index) {
  const position = [
    (Math.random() - 0.5) * 100,
    (Math.random() - 0.5) * 50,
    (Math.random() - 0.5) * 100
  ]
  
  const rotation = [
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  ]
  
  const scale = 0.5 + Math.random() * 1.5
  
  return {
    id: `test_object_${index}`,
    position,
    rotation,
    scale,
    complexity,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  }
}

/**
 * Cleanup test scene
 */
function cleanupTestScene() {
  testObjects = []
}

/**
 * Collect additional performance metrics
 */
async function collectAdditionalMetrics() {
  // Get LOD statistics if available
  const lodStats = lodUtils?.getLODStats() || {}
  
  // Get memory usage
  const memoryInfo = performance.memory ? {
    usedJSHeapSize: performance.memory.usedJSHeapSize,
    totalJSHeapSize: performance.memory.totalJSHeapSize,
    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
  } : {}
  
  // Device information
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory || 'unknown',
    pixelRatio: window.devicePixelRatio,
    screenResolution: `${screen.width}x${screen.height}`,
    windowSize: `${window.innerWidth}x${window.innerHeight}`
  }
  
  return {
    lodStats,
    memoryInfo,
    deviceInfo,
    objectCount: testObjects.length
  }
}

/**
 * Generate comprehensive benchmark report
 */
function generateBenchmarkReport() {
  const report = {
    summary: {
      totalTests: Object.keys(results).length,
      timestamp: Date.now(),
      overallScore: 0,
      recommendedQuality: 'medium'
    },
    details: {},
    recommendations: [],
    deviceCapabilities: {}
  }
  
  // Calculate overall performance score
  let totalScore = 0
  let testCount = 0
  
  for (const [testId, result] of Object.entries(results)) {
    const score = calculateTestScore(result)
    report.details[testId] = {
      ...result,
      score
    }
    
    totalScore += score
    testCount++
  }
  
  report.summary.overallScore = testCount > 0 ? totalScore / testCount : 0
  
  // Determine recommended quality level
  report.summary.recommendedQuality = determineRecommendedQuality(report.summary.overallScore)
  
  // Generate recommendations
  report.recommendations = generateRecommendations(results)
  
  // Add device capabilities
  if (Object.keys(results).length > 0) {
    const firstResult = Object.values(results)[0]
    report.deviceCapabilities = firstResult.deviceInfo || {}
  }
  
  return report
}

/**
 * Calculate test score (0-100)
 */
function calculateTestScore(result) {
  const targetFPS = 60
  const fpsScore = Math.min(result.averageFPS / targetFPS, 1) * 60
  const stabilityScore = (1 - (result.maxFPS - result.minFPS) / result.averageFPS) * 40
  
  return Math.max(0, Math.min(100, fpsScore + stabilityScore))
}

/**
 * Determine recommended quality level
 */
function determineRecommendedQuality(overallScore) {
  if (overallScore >= 90) return 'ultra'
  if (overallScore >= 75) return 'high'
  if (overallScore >= 60) return 'medium'
  if (overallScore >= 40) return 'low'
  return 'ultra_low'
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(results) {
  const recommendations = []
  
  // Analyze results and generate recommendations
  for (const [testId, result] of Object.entries(results)) {
    if (result.averageFPS < 30) {
      recommendations.push(`${result.test.name}: Critical performance issues detected`)
    } else if (result.averageFPS < 45) {
      recommendations.push(`${result.test.name}: Consider reducing quality settings`)
    }
    
    if (result.maxFrameTime > 50) {
      recommendations.push(`${result.test.name}: Frame time spikes detected, enable frame limiting`)
    }
    
    if (result.objectCount > 1000 && result.averageFPS < 45) {
      recommendations.push('Consider implementing LOD system for large object counts')
    }
  }
  
  // Add general recommendations
  const deviceInfo = Object.values(results)[0]?.deviceInfo
  if (deviceInfo?.deviceMemory && deviceInfo.deviceMemory < 4) {
    recommendations.push('Low device memory detected, enable aggressive optimization')
  }
  
  if (deviceInfo?.hardwareConcurrency && deviceInfo.hardwareConcurrency < 4) {
    recommendations.push('Limited CPU cores detected, reduce physics and AI complexity')
  }
  
  return recommendations
}

/**
 * Add log entry
 */
function log(message) {
  const timestamp = new Date().toLocaleTimeString()
  benchmarkLog.push(`[${timestamp}] ${message}`)
  console.log(message)
}

/**
 * Utility wait function
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Export benchmark results
 */
export function exportResults() {
  const exportData = {
    results,
    benchmarkLog,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `threlte-benchmark-${Date.now()}.json`
  a.click()
  
  URL.revokeObjectURL(url)
}

/**
 * Quick performance test
 */
export async function quickTest() {
  const testResult = await performanceUtils.runPerformanceTest(3000)
  const additionalMetrics = await collectAdditionalMetrics()
  
  return {
    ...testResult,
    ...additionalMetrics,
    timestamp: Date.now()
  }
}
</script>

<!-- Benchmark Scene -->
<div class="benchmark-container">
  <!-- Test Scene -->
  <Canvas>
    <!-- Basic lighting -->
    <T.AmbientLight intensity={0.4} />
    <T.DirectionalLight position={[10, 10, 5]} intensity={0.8} />
    
    <!-- Test Objects -->
    {#each testObjects as object (object.id)}
      <T.Group position={object.position} rotation={object.rotation}>
        {#if object.complexity === 'minimal'}
          <T.Mesh scale={object.scale}>
            <T.BoxGeometry args={[1, 1, 1]} />
            <T.MeshBasicMaterial color={object.color} />
          </T.Mesh>
        {:else if object.complexity === 'low'}
          <T.Mesh scale={object.scale}>
            <T.BoxGeometry args={[1, 1, 1]} />
            <T.MeshStandardMaterial color={object.color} />
          </T.Mesh>
        {:else if object.complexity === 'medium'}
          <T.Mesh scale={object.scale}>
            <T.SphereGeometry args={[1, 16, 12]} />
            <T.MeshStandardMaterial color={object.color} metalness={0.5} roughness={0.3} />
          </T.Mesh>
        {:else if object.complexity === 'high'}
          <T.Mesh scale={object.scale}>
            <T.TorusKnotGeometry args={[1, 0.3, 64, 8]} />
            <T.MeshPhysicalMaterial color={object.color} metalness={0.8} roughness={0.2} />
          </T.Mesh>
        {:else if object.complexity === 'extreme'}
          <T.Group>
            <T.Mesh scale={object.scale}>
              <T.IcosahedronGeometry args={[1, 3]} />
              <T.MeshPhysicalMaterial 
                color={object.color} 
                metalness={0.9} 
                roughness={0.1}
                transmission={0.5}
                thickness={0.5}
              />
            </T.Mesh>
            <!-- Add point light for extra complexity -->
            <T.PointLight position={[0, 0, 0]} intensity={0.2} color={object.color} />
          </T.Group>
        {/if}
      </T.Group>
    {/each}
    
    <!-- Camera -->
    <T.PerspectiveCamera position={[0, 5, 20]} fov={60} />
  </Canvas>
  
  <!-- Benchmark UI -->
  <div class="benchmark-ui">
    <div class="benchmark-header">
      <h2>🚀 Threlte Performance Benchmark</h2>
      <div class="benchmark-controls">
        <button 
          on:click={startBenchmark} 
          disabled={isRunning}
          class="btn-primary"
        >
          {isRunning ? 'Running...' : 'Start Benchmark'}
        </button>
        
        <button 
          on:click={quickTest} 
          disabled={isRunning}
          class="btn-secondary"
        >
          Quick Test
        </button>
        
        {#if Object.keys(results).length > 0}
          <button 
            on:click={exportResults}
            class="btn-secondary"
          >
            Export Results
          </button>
        {/if}
      </div>
    </div>
    
    {#if isRunning}
      <div class="benchmark-progress">
        <div class="progress-info">
          <span>Current Test: {currentTest}</span>
          <span>{testProgress.toFixed(1)}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {testProgress}%"></div>
        </div>
      </div>
    {/if}
    
    <!-- Results Display -->
    {#if Object.keys(results).length > 0}
      <div class="results-section">
        <h3>📊 Benchmark Results</h3>
        <div class="results-grid">
          {#each Object.entries(results) as [testId, result]}
            <div class="result-card">
              <h4>{result.test.name}</h4>
              <div class="result-metrics">
                <div class="metric">
                  <span>Avg FPS:</span>
                  <span class="metric-value">{result.averageFPS.toFixed(1)}</span>
                </div>
                <div class="metric">
                  <span>Min FPS:</span>
                  <span class="metric-value">{result.minFPS.toFixed(1)}</span>
                </div>
                <div class="metric">
                  <span>Max FPS:</span>
                  <span class="metric-value">{result.maxFPS.toFixed(1)}</span>
                </div>
                <div class="metric">
                  <span>Objects:</span>
                  <span class="metric-value">{result.objectCount}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Benchmark Log -->
    {#if benchmarkLog.length > 0}
      <div class="log-section">
        <h3>📝 Benchmark Log</h3>
        <div class="log-container">
          {#each benchmarkLog as logEntry}
            <div class="log-entry">{logEntry}</div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .benchmark-container {
    width: 100%;
    height: 100vh;
    position: relative;
    background: #000;
  }
  
  .benchmark-ui {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .benchmark-header {
    pointer-events: auto;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 20px;
    color: white;
  }
  
  .benchmark-header h2 {
    margin: 0 0 16px 0;
  }
  
  .benchmark-controls {
    display: flex;
    gap: 12px;
  }
  
  .btn-primary, .btn-secondary {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .btn-primary:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .benchmark-progress {
    pointer-events: auto;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 16px;
    color: white;
  }
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #10b981);
    transition: width 0.3s ease;
  }
  
  .results-section {
    pointer-events: auto;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 16px;
    color: white;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .results-section h3 {
    margin: 0 0 16px 0;
  }
  
  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
  }
  
  .result-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 12px;
  }
  
  .result-card h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
  }
  
  .result-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .metric {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
  }
  
  .metric-value {
    font-weight: bold;
    color: #10b981;
  }
  
  .log-section {
    pointer-events: auto;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 16px;
    color: white;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .log-section h3 {
    margin: 0 0 12px 0;
  }
  
  .log-container {
    font-family: 'Courier New', monospace;
    font-size: 11px;
  }
  
  .log-entry {
    padding: 2px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
</style>