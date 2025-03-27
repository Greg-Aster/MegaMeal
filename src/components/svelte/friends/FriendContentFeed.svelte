<script>
    import { onMount } from 'svelte';
    import { getFriendContent, isFriendContentEnabled } from '../../../stores/friendStore';
    
    // State
    let isAuthenticated = false;
    let friendContentEnabled = false;
    let friendPosts = [];
    let loading = true;
    
    onMount(() => {
      // Check authentication status
      isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      
      // Check if friend content is enabled
      friendContentEnabled = isFriendContentEnabled();
      
      // If authenticated and enabled, load friend content
      if (isAuthenticated && friendContentEnabled) {
        // Get friend content
        friendPosts = getFriendContent();
      }
      
      loading = false;
    });
    
    // Format date for display
    function formatDate(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    }
  </script>
  
  {#if isAuthenticated && friendContentEnabled}
    <div class="friend-content-feed mb-8">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-2xl font-bold text-black/90 dark:text-white/90">
          Friend Content
        </h2>
        <a 
          href="/friends" 
          class="text-[var(--primary)] hover:underline text-sm"
        >
          Manage Friends
        </a>
      </div>
      
      {#if loading}
        <div class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </div>
      {:else if friendPosts.length === 0}
        <div class="bg-neutral-50 dark:bg-neutral-800/20 p-4 rounded-lg text-center">
          <p class="text-neutral-600 dark:text-neutral-300">
            No friend content available. Add friends in the Friends section to see their content here.
          </p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each friendPosts.slice(0, 4) as post}
            <a 
              href={post.sourceUrl || `/friend-${post.slug || post.id}`}
              target={post.sourceUrl ? "_blank" : "_self"}
              class="card-base p-4 rounded-lg hover:shadow-md transition-shadow"
            >
              <div class="flex items-center mb-2">
                <div class="w-6 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mr-2 flex-shrink-0">
                  <img 
                    src={post.friendAvatar || '/api/placeholder/24/24'} 
                    alt={`${post.friendName}'s avatar`} 
                    class="w-full h-full object-cover"
                  />
                </div>
                <span class="text-sm text-neutral-500 dark:text-neutral-400">
                  {post.friendName}
                </span>
              </div>
              
              <h3 class="text-lg font-bold mb-2 text-black/80 dark:text-white/80 line-clamp-2">
                {post.title}
              </h3>
              
              {#if post.description}
                <p class="text-neutral-600 dark:text-neutral-300 text-sm mb-3 line-clamp-2">
                  {post.description}
                </p>
              {/if}
              
              <div class="text-xs text-neutral-500 dark:text-neutral-400">
                {formatDate(post.published)}
              </div>
            </a>
          {/each}
        </div>
        
        {#if friendPosts.length > 4}
          <div class="mt-4 text-center">
            <a 
              href="/friends" 
              class="inline-block px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-black/70 dark:text-white/70 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              View All Friend Content
            </a>
          </div>
        {/if}
      {/if}
    </div>
  {/if}