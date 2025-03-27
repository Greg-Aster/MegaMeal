<script>
    import { onMount } from 'svelte';
    import EraEditor from '../timeline/EraEditor.svelte';
    import ViewSettingsEditor from '../timeline/ViewSettingsEditor.svelte';
    
    // Props
    export let timelineConfig;
    
    // Local state
    let activeSection = 'eras';
    let editingEra = null;
    let showEraEditor = false;
    
    // Function to edit an era
    function editEra(eraKey) {
      editingEra = {
        key: eraKey,
        ...timelineConfig.eraConfig[eraKey]
      };
      showEraEditor = true;
    }
    
    // Function to add a new era
    function addNewEra() {
      editingEra = {
        key: '',
        displayName: '',
        startYear: 0,
        endYear: 0,
        colorClass: '',
        badgeClass: '',
        zoomLevel: 1,
        panToYear: 0
      };
      showEraEditor = true;
    }
    
    // Function to save era changes
    function saveEra(era) {
      if (!era.key) {
        return false; // Need a key
      }
      
      // Update the era config
      timelineConfig = {
        ...timelineConfig,
        eraConfig: {
          ...timelineConfig.eraConfig,
          [era.key]: {
            displayName: era.displayName,
            startYear: era.startYear,
            endYear: era.endYear,
            colorClass: era.colorClass,
            badgeClass: era.badgeClass,
            zoomLevel: era.zoomLevel,
            panToYear: era.panToYear,
            backgroundImage: era.backgroundImage
          }
        }
      };
      
      showEraEditor = false;
      return true;
    }
    
    // Function to delete an era
    function deleteEra(eraKey) {
      if (confirm(`Are you sure you want to delete the "${timelineConfig.eraConfig[eraKey].displayName}" era?`)) {
        const { [eraKey]: _, ...remainingEras } = timelineConfig.eraConfig;
        timelineConfig = {
          ...timelineConfig,
          eraConfig: remainingEras
        };
      }
    }
    
    // Function to update view settings
    function updateViewSettings(newViewSettings) {
      timelineConfig = {
        ...timelineConfig,
        viewConfig: {
          ...timelineConfig.viewConfig,
          ...newViewSettings
        }
      };
    }
    
    // Sort eras by start year
    $: sortedEras = Object.entries(timelineConfig.eraConfig)
      .sort(([, a], [, b]) => a.startYear - b.startYear)
      .map(([key, config]) => ({ key, ...config }));
  </script>
  
  <div class="timeline-config-tab">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-black/80 dark:text-white/80 mb-4">Timeline Configuration</h2>
      <p class="text-neutral-600 dark:text-neutral-400 mb-4">
        Configure timeline eras, visualization settings, and behavior.
      </p>
      
      <!-- Section Tabs -->
      <div class="flex mb-6 space-x-4 border-b border-neutral-200 dark:border-neutral-700">
        <button 
          class="py-2 px-4 {activeSection === 'eras' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-neutral-600 dark:text-neutral-400'}"
          on:click={() => activeSection = 'eras'}
        >
          Eras
        </button>
        <button 
          class="py-2 px-4 {activeSection === 'view' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-neutral-600 dark:text-neutral-400'}"
          on:click={() => activeSection = 'view'}
        >
          View Settings
        </button>
      </div>
      
      <!-- Eras Section -->
      {#if activeSection === 'eras'}
        <div class="eras-section">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-black/80 dark:text-white/80">Timeline Eras</h3>
            <button 
              class="py-1.5 px-3 bg-[var(--primary)] hover:opacity-90 text-white font-medium rounded-md transition-opacity text-sm flex items-center"
              on:click={addNewEra}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              Add Era
            </button>
          </div>
          
          <!-- Eras List -->
          <div class="eras-list space-y-3 mb-4">
            {#if sortedEras.length === 0}
              <p class="text-neutral-500 dark:text-neutral-400 italic text-sm">No eras configured.</p>
            {:else}
              {#each sortedEras as era}
                <div class="era-item bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-[var(--primary)] transition-colors">
                  <div class="flex justify-between items-start">
                    <div>
                      <h4 class="font-medium text-black/90 dark:text-white/90">{era.displayName}</h4>
                      <div class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        <span>Years: {era.startYear} - {era.endYear}</span>
                        {#if era.key === 'unknown' || era.key === 'all-time' || era.key === 'all-eras'}
                          <span class="ml-2 text-amber-600 dark:text-amber-400">(System Era)</span>
                        {/if}
                      </div>
                    </div>
                    <div class="flex space-x-2">
                      <button 
                        class="p-1.5 text-neutral-500 hover:text-[var(--primary)] rounded-full"
                        on:click={() => editEra(era.key)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      {#if era.key !== 'unknown' && era.key !== 'all-time' && era.key !== 'all-eras'}
                        <button 
                          class="p-1.5 text-neutral-500 hover:text-red-500 rounded-full"
                          on:click={() => deleteEra(era.key)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      {/if}
                    </div>
                  </div>
                  
                  {#if era.backgroundImage}
                    <div class="mt-2 text-sm text-neutral-600 dark:text-neutral-400 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Background: {era.backgroundImage.split('/').pop()}
                    </div>
                  {/if}
                  
                  {#if era.zoomLevel || era.panToYear}
                    <div class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {#if era.zoomLevel}
                        <span class="inline-flex items-center mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                          Zoom: {era.zoomLevel}x
                        </span>
                      {/if}
                      {#if era.panToYear}
                        <span class="inline-flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                          </svg>
                          Focus Year: {era.panToYear}
                        </span>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
          
          <!-- Era Editor Modal -->
          {#if showEraEditor}
            <div class="fixed inset-0 bg-black/50 dark:bg-black/60 z-50 flex items-center justify-center">
              <div class="bg-white dark:bg-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto shadow-lg">
                <EraEditor 
                  era={editingEra}
                  onSave={saveEra}
                  onCancel={() => showEraEditor = false}
                />
              </div>
            </div>
          {/if}
        </div>
      {:else if activeSection === 'view'}
        <!-- View Settings Section -->
        <ViewSettingsEditor 
          viewSettings={timelineConfig.viewConfig}
          onUpdate={updateViewSettings}
        />
      {/if}
    </div>
  </div>