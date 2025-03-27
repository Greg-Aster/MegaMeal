<script>
    import { createEventDispatcher, onMount } from 'svelte';
    
    // Props
    export let siteConfig;
    export let navBarConfig;
    export let profileConfig;
    export let licenseConfig;
    export let timelineConfig;
    
    // Local state
    let activeConfigType = 'siteConfig';
    let editorContent = '';
    let jsonError = null;
    let prettifyEnabled = true;
    let backupContent = '';
    let validationTimer = null;
    
    // Event dispatcher
    const dispatch = createEventDispatcher();
    
    // Config type options
    const configTypes = [
      { value: 'siteConfig', label: 'Site Configuration' },
      { value: 'navBarConfig', label: 'Navigation Bar' },
      { value: 'profileConfig', label: 'Profile' },
      { value: 'licenseConfig', label: 'License' },
      { value: 'timelineConfig', label: 'Timeline' },
    ];
    
    // Maps config types to their objects
    const configMap = {
      siteConfig,
      navBarConfig,
      profileConfig,
      licenseConfig,
      timelineConfig
    };
    
    // Initialize editor content when the component mounts
    onMount(() => {
      updateEditorContent();
    });
    
    // Update the editor content based on selected config type
    function updateEditorContent() {
      try {
        editorContent = prettifyEnabled 
          ? JSON.stringify(configMap[activeConfigType], null, 2)
          : JSON.stringify(configMap[activeConfigType]);
        
        backupContent = editorContent;
        jsonError = null;
      } catch (error) {
        jsonError = `Error generating JSON: ${error.message}`;
      }
    }
    
    // Handle config type change
    function handleConfigTypeChange() {
      updateEditorContent();
    }
    
    // Toggle prettify option
    function togglePrettify() {
      prettifyEnabled = !prettifyEnabled;
      updateEditorContent();
    }
    
    // Validate JSON as the user types
    function handleEditorChange() {
      // Clear any previous validation timer
      clearTimeout(validationTimer);
      
      // Set a new timer to validate after the user stops typing
      validationTimer = setTimeout(() => {
        try {
          JSON.parse(editorContent);
          jsonError = null;
        } catch (error) {
          jsonError = `Invalid JSON: ${error.message}`;
        }
      }, 500);
    }
    
    // Apply the changes to the config
    function applyChanges() {
      try {
        const newConfig = JSON.parse(editorContent);
        
        // Dispatch an update event with the new configuration
        dispatch('update', {
          configType: activeConfigType,
          newValue: newConfig
        });
        
        // Update the backup content
        backupContent = editorContent;
        
        // Show success message
        jsonError = null;
        showToast('Configuration updated successfully', 'success');
      } catch (error) {
        jsonError = `Error applying changes: ${error.message}`;
      }
    }
    
    // Reset to last saved content
    function resetChanges() {
      editorContent = backupContent;
      jsonError = null;
    }
    
    // Format the JSON
    function formatJson() {
      try {
        const parsedJson = JSON.parse(editorContent);
        editorContent = JSON.stringify(parsedJson, null, 2);
        jsonError = null;
      } catch (error) {
        jsonError = `Cannot format invalid JSON: ${error.message}`;
      }
    }
    
    // Simple toast notification system
    let toast = { message: '', type: '', visible: false };
    let toastTimer = null;
    
    function showToast(message, type = 'info') {
      // Clear any existing timer
      if (toastTimer) clearTimeout(toastTimer);
      
      // Set toast content
      toast = { message, type, visible: true };
      
      // Hide toast after 3 seconds
      toastTimer = setTimeout(() => {
        toast.visible = false;
      }, 3000);
    }
    
    // Monitor changes to props and update editor content
    $: {
      // This will update the editor content when any of the config objects change
      configMap.siteConfig = siteConfig;
      configMap.navBarConfig = navBarConfig;
      configMap.profileConfig = profileConfig;
      configMap.licenseConfig = licenseConfig;
      configMap.timelineConfig = timelineConfig;
      
      // If the current config being edited changes, update the editor
      if (configMap[activeConfigType] !== JSON.parse(backupContent)) {
        updateEditorContent();
      }
    }
  </script>
  
  <div class="advanced-config-tab">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-black/80 dark:text-white/80 mb-4">Advanced Configuration Editor</h2>
      <p class="text-neutral-600 dark:text-neutral-400 mb-4">
        Edit configuration files directly in JSON format. This is for advanced users who need full control over their site configuration.
      </p>
      
      <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-md p-3 text-amber-800 dark:text-amber-200 text-sm mb-6">
        <div class="flex">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p class="font-medium">Warning: Advanced Editing</p>
            <p class="mt-1">Editing configurations directly can break your site if not done correctly. Make sure you understand the JSON format and the configuration structure.</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Editor Controls -->
    <div class="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 mb-4">
      <div class="md:w-1/3">
        <label for="config-type" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Configuration File
        </label>
        <select 
          id="config-type" 
          bind:value={activeConfigType}
          on:change={handleConfigTypeChange}
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition"
        >
          {#each configTypes as configType}
            <option value={configType.value}>{configType.label}</option>
          {/each}
        </select>
      </div>
      
      <div class="md:w-2/3 flex justify-end items-end space-x-2">
        <button 
          class="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded text-sm transition-colors flex items-center"
          on:click={togglePrettify}
          title={prettifyEnabled ? 'Switch to compact view' : 'Switch to pretty view'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {prettifyEnabled ? 'Compact' : 'Pretty'}
        </button>
        
        <button 
          class="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded text-sm transition-colors flex items-center"
          on:click={formatJson}
          title="Format JSON"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Format
        </button>
        
        <button 
          class="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded text-sm transition-colors flex items-center"
          on:click={resetChanges}
          title="Reset to saved config"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>
      </div>
    </div>
    
    <!-- JSON Editor -->
    <div class="mb-4">
      <div class="relative">
        <textarea 
          bind:value={editorContent}
          on:input={handleEditorChange}
          rows="20"
          class="w-full px-3 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md font-mono text-sm transition resize-y focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          placeholder="JSON configuration..."
          spellcheck="false"
        ></textarea>
        
        {#if jsonError}
          <div class="absolute bottom-3 left-3 right-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs p-2 rounded">
            {jsonError}
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div class="flex justify-end">
      <button 
        class="px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white font-medium rounded-md transition-opacity flex items-center disabled:opacity-50"
        on:click={applyChanges}
        disabled={!!jsonError}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Apply Changes
      </button>
    </div>
    
    <!-- Toast Message -->
    {#if toast.visible}
      <div 
        class="fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-opacity duration-200 ease-in-out {toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}"
        transition:fade
      >
        <div class="flex items-center">
          {#if toast.type === 'success'}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          {/if}
          <span>{toast.message}</span>
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    /* For the fade transition */
    .fade-enter-active, .fade-leave-active {
      transition: opacity 0.5s;
    }
    .fade-enter, .fade-leave-to {
      opacity: 0;
    }
  </style>