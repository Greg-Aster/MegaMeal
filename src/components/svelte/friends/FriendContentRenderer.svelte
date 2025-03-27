<script>
    import { onMount } from 'svelte';
    import { getFriendContent } from '../../../stores/friendStore';
    
    // Props
    export let slug;
    
    // State
    let loading = true;
    let error = null;
    let friendPost = null;
    
    onMount(async () => {
      try {
        // Check if this is a friend content route
        if (!slug.startsWith('friend-')) {
          return;
        }
        
        // Extract friend post ID from slug
        const friendPostId = slug.replace('friend-', '');
        
        // Get all friend content
        const allFriendContent = getFriendContent();
        
        // Find the specific post
        const post = allFriendContent.find(p => p.slug === friendPostId || p.id === friendPostId);
        
        if (post) {
          friendPost = post;
        } else {
          error = 'Friend post not found';
        }
      } catch (err) {
        console.error('Error loading friend content:', err);
        error = 'Failed to load friend content';
      } finally {
        loading = false;
      }
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
  
  {#if loading}
    <div class="flex justify-center items-center min-h-[200px]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-6 rounded-lg">
      <h2 class="text-xl font-bold mb-2">Error Loading Content</h2>
      <p>{error}</p>
      <a href="/" class="text-[var(--primary)] hover:underline mt-4 inline-block">Return to Home</a>
    </div>
  {:else if friendPost}
    <article>
      <!-- Friend Content Header -->
      <div class="mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-700">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mr-3 flex-shrink-0">
            <img 
              src={friendPost.friendAvatar || '/api/placeholder/40/40'} 
              alt={`${friendPost.friendName}'s avatar`} 
              class="w-full h-full object-cover"
            />
          </div>
          <div>
            <div class="text-sm text-neutral-500 dark:text-neutral-400">
              Shared content from
            </div>
            <a 
              href={friendPost.friendUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              class="font-medium text-[var(--primary)] hover:underline"
            >
              {friendPost.friendName}
            </a>
          </div>
        </div>
        
        <h1 class="text-3xl font-bold mb-2">{friendPost.title}</h1>
        
        {#if friendPost.description}
          <p class="text-neutral-600 dark:text-neutral-300 mb-4">
            {friendPost.description}
          </p>
        {/if}
        
        <div class="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
          <span>Published: {formatDate(friendPost.published)}</span>
          
          {#if friendPost.sourceUrl}
            <span class="mx-2">•</span>
            <a 
              href={friendPost.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              class="text-[var(--primary)] hover:underline"
            >
              View Original
            </a>
          {/if}
        </div>
      </div>
      
      <!-- Friend Content Body -->
      <div class="markdown-content">
        {#if friendPost.content}
          <div class="prose dark:prose-invert max-w-none">
            {@html friendPost.content}
          </div>
        {:else}
          <div class="bg-neutral-50 dark:bg-neutral-800/20 p-6 rounded-lg text-center">
            <p class="text-neutral-600 dark:text-neutral-300">
              This is a preview of shared content. Visit the original post to read the full article.
            </p>
            {#if friendPost.sourceUrl}
              <a 
                href={friendPost.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                class="mt-4 inline-block px-4 py-2 bg-[var(--primary)] text-white font-medium rounded-md hover:opacity-90 transition-opacity"
              >
                Read Full Article
              </a>
            {/if}
          </div>
        {/if}
      </div>
    </article>
  {:else}
    <div class="bg-neutral-50 dark:bg-neutral-800/20 p-6 rounded-lg text-center">
      <h2 class="text-xl font-bold mb-2">Content Not Found</h2>
      <p class="text-neutral-600 dark:text-neutral-300">The requested friend content could not be found.</p>
      <a href="/" class="text-[var(--primary)] hover:underline mt-4 inline-block">Return to Home</a>
    </div>
  {/if}