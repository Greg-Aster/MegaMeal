<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import GeneralConfigTab from './config-tabs/GeneralConfigTab.svelte';
    import NavigationConfigTab from './config-tabs/NavigationConfigTab.svelte';
    import ProfileConfigTab from './config-tabs/ProfileConfigTab.svelte';
    import AppearanceConfigTab from './config-tabs/AppearanceConfigTab.svelte';
    import TimelineConfigTab from './config-tabs/TimelineConfigTab.svelte';
    import AdvancedConfigTab from './config-tabs/AdvancedConfigTab.svelte';
    
    // Props for configuration objects
    export let siteConfig;
    export let navBarConfig;
    export let profileConfig;
    export let licenseConfig;
    export let timelineConfig;
    
    // State management
    let activeTab = 'general';
    let saveStatus = { saving: false, success: false, error: null };
    
    // Event dispatcher for notifying parent components
    const dispatch = createEventDispatcher();
    
    // Tabs configuration
    const tabs = [
      { id: 'general', label: 'General', icon: 'mdi:cog-outline' },
      { id: 'navigation', label: 'Navigation', icon: 'mdi:navigation' },
      { id: 'profile', label: 'Profile', icon: 'mdi:account' },
      { id: 'appearance', label: 'Appearance', icon: 'mdi:palette-outline' },
      { id: 'timeline', label: 'Timeline', icon: 'mdi:timeline' },
      { id: 'advanced', label: 'Advanced', icon: 'mdi:code-json' }
    ];
    
    // Tab switching
    function setActiveTab(tabId) {
      activeTab = tabId;
    }
    
    // Function to handle saving all configuration
    async function saveAllConfiguration() {
      try {
        saveStatus.saving = true;
        saveStatus.error = null;
        
        // In a real implementation, you would send the configuration to a backend
        // For now, we'll just simulate saving with a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store in localStorage for demonstration
        localStorage.setItem('siteConfig', JSON.stringify(siteConfig));
        localStorage.setItem('navBarConfig', JSON.stringify(navBarConfig));
        localStorage.setItem('profileConfig', JSON.stringify(profileConfig));
        localStorage.setItem('licenseConfig', JSON.stringify(licenseConfig));
        localStorage.setItem('timelineConfig', JSON.stringify(timelineConfig));
        
        // Show success message
        saveStatus.success = true;
        
        // Notify parent component
        dispatch('saved', { 
          siteConfig, 
          navBarConfig, 
          profileConfig, 
          licenseConfig,
          timelineConfig
        });
        
        // Reset success message after a delay
        setTimeout(() => {
          saveStatus.success = false;
        }, 3000);
      } catch (error) {
        console.error('Error saving configuration:', error);
        saveStatus.error = 'Failed to save configuration. Please try again.';
      } finally {
        saveStatus.saving = false;
      }
    }
    
    // On component mount
    onMount(() => {
      // Check for saved config in localStorage (for demo/persistence)
      try {
        const savedSiteConfig = localStorage.getItem('siteConfig');
        if (savedSiteConfig) {
          siteConfig = { ...siteConfig, ...JSON.parse(savedSiteConfig) };
        }
        
        const savedNavConfig = localStorage.getItem('navBarConfig');
        if (savedNavConfig) {
          navBarConfig = { ...navBarConfig, ...JSON.parse(savedNavConfig) };
        }
        
        const savedProfileConfig = localStorage.getItem('profileConfig');
        if (savedProfileConfig) {
          profileConfig = { ...profileConfig, ...JSON.parse(savedProfileConfig) };
        }
        
        const savedLicenseConfig = localStorage.getItem('licenseConfig');
        if (savedLicenseConfig) {
          licenseConfig = { ...licenseConfig, ...JSON.parse(savedLicenseConfig) };
        }
        
        const savedTimelineConfig = localStorage.getItem('timelineConfig');
        if (savedTimelineConfig) {
          timelineConfig = { ...timelineConfig, ...JSON.parse(savedTimelineConfig) };
        }
      } catch (error) {
        console.error('Error loading saved configuration:', error);
      }
    });
  </script>
  
  <!-- Main Configuration Panel -->
  <div class="config-panel">
    <!-- Config Tabs Header -->
    <div class="card-base w-full rounded-[var(--radius-large)] overflow-hidden relative mb-4">
      <div class="p-6 md:p-9">
        <h1 class="text-3xl font-bold text-black/90 dark:text-white/90 mb-6">Site Configuration</h1>
        
        <div class="border-b border-neutral-200 dark:border-neutral-700 mb-6">
          <nav class="flex flex-wrap space-x-1 md:space-x-8" aria-label="Configuration Tabs">
            {#each tabs as tab}
              <button 
                id={`tab-${tab.id}`} 
                class="tab-button py-4 px-3 border-b-2 transition-colors font-medium flex items-center whitespace-nowrap
                       {activeTab === tab.id ? 
                         'border-[var(--primary)] text-[var(--primary)]' : 
                         'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}"
                on:click={() => setActiveTab(tab.id)}
              >
                <span class="hidden md:inline mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                    <!-- Dynamically determine which icon path to use -->
                    {#if tab.icon === 'mdi:cog-outline'}
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    {:else if tab.icon === 'mdi:navigation'}
                      <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                    {:else if tab.icon === 'mdi:account'}
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    {:else if tab.icon === 'mdi:palette-outline'}
                      <circle cx="13.5" cy="6.5" r="2.5"></circle>
                      <circle cx="19" cy="13" r="2.5"></circle>
                      <circle cx="6" cy="12" r="2.5"></circle>
                      <circle cx="14" cy="19.5" r="2.5"></circle>
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
                    {:else if tab.icon === 'mdi:timeline'}
                      <line x1="12" y1="22" x2="12" y2="15"></line>
                      <path d="M6 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path>
                      <path d="M22 12H2"></path>
                      <path d="M12 7V2"></path>
                      <path d="m14 3-2 2-2-2"></path>
                      <path d="M18 15v7"></path>
                      <path d="M18 22l-2-2"></path>
                      <path d="M18 22l2-2"></path>
                      <path d="M6 15v7"></path>
                      <path d="M6 22l-2-2"></path>
                      <path d="M6 22l2-2"></path>
                    {:else if tab.icon === 'mdi:code-json'}
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    {/if}
                  </svg>
                </span>
                {tab.label}
              </button>
            {/each}
          </nav>
        </div>
        
        <!-- Tab Panels -->
        <div class="tab-panels">
          {#if activeTab === 'general'}
            <GeneralConfigTab bind:siteConfig bind:licenseConfig />
          {:else if activeTab === 'navigation'}
            <NavigationConfigTab bind:navBarConfig />
          {:else if activeTab === 'profile'}
            <ProfileConfigTab bind:profileConfig />
          {:else if activeTab === 'appearance'}
            <AppearanceConfigTab bind:siteConfig />
          {:else if activeTab === 'timeline'}
            <TimelineConfigTab bind:timelineConfig />
          {:else if activeTab === 'advanced'}
            <AdvancedConfigTab 
              {siteConfig} 
              {navBarConfig} 
              {profileConfig} 
              {licenseConfig}
              {timelineConfig}
              on:update={(e) => {
                // Handle updates from the advanced editor
                const { configType, newValue } = e.detail;
                if (configType === 'siteConfig') siteConfig = newValue;
                else if (configType === 'navBarConfig') navBarConfig = newValue;
                else if (configType === 'profileConfig') profileConfig = newValue;
                else if (configType === 'licenseConfig') licenseConfig = newValue;
                else if (configType === 'timelineConfig') timelineConfig = newValue;
              }}
            />
          {/if}
        </div>
        
        <!-- Save Button -->
        <div class="mt-8 border-t border-neutral-200 dark:border-neutral-700 pt-6">
          <div class="flex justify-between items-center">
            <!-- Status message -->
            <div class="text-sm">
              {#if saveStatus.saving}
                <span class="text-neutral-500 dark:text-neutral-400 flex items-center">
                  <svg class="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving changes...
                </span>
              {:else if saveStatus.success}
                <span class="text-green-600 dark:text-green-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  Configuration saved successfully!
                </span>
              {:else if saveStatus.error}
                <span class="text-red-600 dark:text-red-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  {saveStatus.error}
                </span>
              {/if}
            </div>
            
            <button 
              on:click={saveAllConfiguration}
              disabled={saveStatus.saving}
              class="py-2 px-6 bg-[var(--primary)] hover:opacity-90 text-white font-medium rounded-md transition-opacity flex items-center disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {saveStatus.saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <style>
    /* Add any component-specific styles here */
    .tab-button {
      position: relative;
    }
    
    .tab-button::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: transparent;
      transition: background-color 0.2s ease;
    }
    
    .tab-button.active::after {
      background-color: var(--primary);
    }
  </style>