<script>
  import { createEventDispatcher } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  
  // Event dispatcher for communicating with parent components
  const dispatch = createEventDispatcher();
  
  // Form data
  let username = '';
  let password = '';
  let rememberMe = false;
  
  // UI state
  let isLoading = false;
  let errorMessage = '';
  let formShown = false;
  
  // Constants - credentials (same as in other components)
  const ADMIN_USERNAME = 'dndiy';
  const ADMIN_PASSWORD = 'dndiy';
  
  // Show the login form
  export function show() {
    formShown = true;
  }
  
  // Hide the login form
  export function hide() {
    formShown = false;
  }
  
  // Toggle the form visibility
  export function toggle() {
    formShown = !formShown;
  }
  
  // Handle form submission
  async function handleSubmit() {
    // Validate inputs
    if (!username || !password) {
      errorMessage = 'Please enter both username and password';
      return;
    }
    
    try {
      isLoading = true;
      errorMessage = '';
      
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify credentials with hardcoded values (no API)
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Store authentication state in localStorage
        localStorage.setItem('isAuthenticated', 'true');
        
        // Notify parent of successful login
        dispatch('login', { username });
        
        // Hide the form
        formShown = false;
        
        // Reload the page to update auth state
        window.location.reload();
      } else {
        errorMessage = 'Invalid credentials';
      }
    } catch (error) {
      console.error('Login error:', error);
      errorMessage = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

{#if formShown}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black/25 dark:bg-black/40 z-40" 
    on:click={hide} 
    transition:fade={{ duration: 200 }}
  ></div>
  
  <!-- Login Panel -->
  <div 
    class="absolute top-full left-0 mt-1 card-base float-panel p-5 w-72 z-50"
    transition:slide={{ duration: 150, axis: 'y' }}
  >
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <h3 class="text-lg font-medium text-center mb-4 text-90">Admin Login</h3>
      
      {#if errorMessage}
        <div class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm p-2 rounded border border-red-200 dark:border-red-800">
          {errorMessage}
        </div>
      {/if}
      
      <div>
        <label for="username" class="block text-sm font-medium text-75 mb-1">Username</label>
        <input 
          type="text" 
          id="username" 
          bind:value={username} 
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition" 
          disabled={isLoading}
          required 
        />
      </div>
      
      <div>
        <label for="password" class="block text-sm font-medium text-75 mb-1">Password</label>
        <input 
          type="password" 
          id="password" 
          bind:value={password} 
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition" 
          disabled={isLoading}
          required 
        />
      </div>
      
      <div class="flex items-center">
        <input 
          type="checkbox" 
          id="remember-me" 
          bind:checked={rememberMe} 
          class="h-4 w-4 text-[var(--primary)] border-neutral-300 dark:border-neutral-600 rounded" 
          disabled={isLoading}
        />
        <label for="remember-me" class="ml-2 block text-sm text-75">
          Remember me
        </label>
      </div>
      
      <button 
        type="submit" 
        class="w-full py-2 px-4 bg-[var(--primary)] hover:opacity-90 text-white font-medium rounded-md transition-opacity disabled:opacity-60 flex justify-center items-center"
        disabled={isLoading}
      >
        {#if isLoading}
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Logging in...
        {:else}
          Login
        {/if}
      </button>
    </form>
  </div>
{/if}