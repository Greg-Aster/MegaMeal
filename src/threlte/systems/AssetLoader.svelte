<!-- 
  Threlte Asset Loading System
  Replaces AssetLoader.ts with reactive asset management
-->
<script lang="ts">
import { onMount, onDestroy, createEventDispatcher } from 'svelte'
import { writable } from 'svelte/store'
import { AssetLoader } from '../../engine/resources/AssetLoader'

const dispatch = createEventDispatcher()

// Reactive stores for loading state
export const loadingStore = writable(false)
export const progressStore = writable(0)
export const errorStore = writable(null)
export const loadedAssetsStore = writable([])

let assetLoader: AssetLoader
let isInitialized = false

// Export loading state for external access
export let isLoading = false
export let loadingProgress = 0
export let loadingError = null
export let loadedAssets = []

onMount(async () => {
  console.log('📦 Initializing Threlte Asset Loading System...')
  
  try {
    // Create Asset Loader
    assetLoader = new AssetLoader()
    await assetLoader.initialize()
    
    // Set up loading event listeners
    setupLoadingEvents()
    
    isInitialized = true
    console.log('✅ Threlte Asset Loading System initialized')
  } catch (error) {
    console.error('❌ Failed to initialize Asset Loading System:', error)
    loadingError = error
    errorStore.set(error)
  }
})

/**
 * Set up loading event listeners
 */
function setupLoadingEvents() {
  // Note: AssetLoader might need to be enhanced to emit events
  // For now, we'll create a wrapper system
  
  // Loading start
  const originalLoad = assetLoader.loadGLTF?.bind(assetLoader)
  if (originalLoad) {
    assetLoader.loadGLTF = async (url: string, onProgress?: (progress: number) => void) => {
      isLoading = true
      loadingStore.set(true)
      dispatch('loadingStart', { url })
      
      try {
        const result = await originalLoad(url, (progress) => {
          loadingProgress = progress
          progressStore.set(progress)
          dispatch('loadingProgress', { url, progress })
          if (onProgress) onProgress(progress)
        })
        
        isLoading = false
        loadingStore.set(false)
        loadedAssets.push(url)
        loadedAssetsStore.set([...loadedAssets])
        dispatch('loadingComplete', { url, asset: result })
        
        return result
      } catch (error) {
        isLoading = false
        loadingStore.set(false)
        loadingError = error
        errorStore.set(error)
        dispatch('loadingError', { url, error })
        throw error
      }
    }
  }
}

/**
 * Load GLTF model
 */
export async function loadGLTF(url: string, onProgress?: (progress: number) => void) {
  if (!assetLoader) {
    throw new Error('AssetLoader not initialized')
  }
  
  return await assetLoader.loadGLTF(url, onProgress)
}

/**
 * Load texture
 */
export async function loadTexture(url: string) {
  if (!assetLoader) {
    throw new Error('AssetLoader not initialized')
  }
  
  return await assetLoader.loadTexture(url)
}

/**
 * Load audio
 */
export async function loadAudio(url: string) {
  if (!assetLoader) {
    throw new Error('AssetLoader not initialized')
  }
  
  return await assetLoader.loadAudio(url)
}

/**
 * Preload assets
 */
export async function preloadAssets(urls: string[]) {
  if (!assetLoader) {
    throw new Error('AssetLoader not initialized')
  }
  
  isLoading = true
  loadingStore.set(true)
  dispatch('preloadStart', { urls })
  
  try {
    const results = []
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      const progress = (i / urls.length) * 100
      
      loadingProgress = progress
      progressStore.set(progress)
      dispatch('preloadProgress', { progress, current: url })
      
      // Determine asset type and load accordingly
      if (url.endsWith('.gltf') || url.endsWith('.glb')) {
        results.push(await loadGLTF(url))
      } else if (url.match(/\.(jpg|jpeg|png|webp)$/)) {
        results.push(await loadTexture(url))
      } else if (url.match(/\.(mp3|wav|ogg)$/)) {
        results.push(await loadAudio(url))
      }
    }
    
    isLoading = false
    loadingStore.set(false)
    loadingProgress = 100
    progressStore.set(100)
    dispatch('preloadComplete', { results })
    
    return results
  } catch (error) {
    isLoading = false
    loadingStore.set(false)
    loadingError = error
    errorStore.set(error)
    dispatch('preloadError', { error })
    throw error
  }
}

/**
 * Get loading statistics
 */
export function getLoadingStats() {
  return {
    isLoading,
    progress: loadingProgress,
    loadedCount: loadedAssets.length,
    error: loadingError
  }
}

onDestroy(() => {
  if (assetLoader) {
    assetLoader.dispose()
    console.log('🧹 Threlte Asset Loading System disposed')
  }
})

// Export asset loader for external access
export { assetLoader }
</script>

<!-- No visual output - this is a system component -->

{#if isInitialized}
  <slot />
{/if}