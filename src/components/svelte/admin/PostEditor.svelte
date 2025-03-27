<script>
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  
  // Reactive state management
  let post = {
    title: '',
    description: '',
    slug: '',
    published: new Date().toISOString().split('T')[0],
    image: '',
    tags: '',
    category: '',
    timelineData: {
      enabled: false,
      year: undefined,
      era: '',
      location: '',
      isKeyEvent: false
    },
    banner: {
      type: '',
      videoId: '',
      timelineCategory: ''
    },
    content: '',
    draft: true
  };
  
  // Derived values
  $: tagsArray = post.tags ? post.tags.split(',').map(tag => tag.trim()) : [];
  $: previewHtml = post.content ? marked(post.content) : '';
  $: formValid = !!post.title && !!post.slug && !!post.published;
  $: showVideoFields = post.banner.type === 'video';
  $: showTimelineFields = post.timelineData.enabled;
  
  // Toast notification state
  let showToast = false;
  let toastMessage = '';
  let toastType = 'success';
  
  // Generate slug from title
  function generateSlug() {
    if (post.title) {
      post.slug = post.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }
  }
  
  // Toast notification function
  function showNotification(message, type = 'success') {
    toastMessage = message;
    toastType = type;
    showToast = true;
    
    setTimeout(() => {
      showToast = false;
    }, 3000);
  }
  
  // Save draft
  async function saveDraft() {
    await savePost(true);
  }
  
  // Publish post
  async function publishPost() {
    await savePost(false);
  }
  
  // Common save function
  async function savePost(isDraft = false) {
    try {
      post.draft = isDraft;
      
      // Build complete post data
      const postData = {
        ...post,
        tags: tagsArray,
      };
      
      // Add timeline data if enabled
      if (post.timelineData.enabled) {
        postData.timelineYear = post.timelineData.year;
        postData.timelineEra = post.timelineData.era;
        postData.timelineLocation = post.timelineData.location;
        postData.isKeyEvent = post.timelineData.isKeyEvent;
      }
      
      // Add banner data if selected
      if (post.banner.type) {
        postData.bannerType = post.banner.type;
        postData.bannerData = {};
        
        if (post.banner.type === 'video') {
          postData.bannerData.videoId = post.banner.videoId;
        } else if (post.banner.type === 'timeline') {
          postData.bannerData.category = post.banner.timelineCategory;
        }
      }
      
      // In a real implementation, send to your API
      // For now, we'll just generate and download the MDX
      generateMdxFile(postData);
      
      // Show success toast
      showNotification(isDraft ? 'Draft saved successfully!' : 'Post published successfully!');
    } catch (error) {
      console.error('Error saving post:', error);
      showNotification('Failed to save post: ' + error.message, 'error');
    }
  }
  
  // Generate frontmatter
  function generateFrontmatter(data) {
    let frontmatter = `---\n`;
    frontmatter += `title: "${data.title}"\n`;
    frontmatter += `published: ${data.published}\n`;
    frontmatter += `description: "${data.description}"\n`;
    
    if (data.image) {
      frontmatter += `image: "${data.image}"\n`;
    }
    
    if (data.tags && data.tags.length > 0) {
      frontmatter += `tags: [${data.tags.map(tag => `"${tag}"`).join(', ')}]\n`;
    }
    
    if (data.category) {
      frontmatter += `category: "${data.category}"\n`;
    }
    
    frontmatter += `draft: ${data.draft}\n`;
    
    // Add timeline data if present
    if (data.timelineYear) {
      frontmatter += `timelineYear: ${data.timelineYear}\n`;
      frontmatter += `timelineEra: "${data.timelineEra}"\n`;
      frontmatter += `timelineLocation: "${data.timelineLocation}"\n`;
      frontmatter += `isKeyEvent: ${data.isKeyEvent}\n`;
    }
    
    // Add banner data if present
    if (data.bannerType) {
      frontmatter += `bannerType: "${data.bannerType}"\n`;
      frontmatter += `bannerData: \n`;
      
      if (data.bannerType === 'video' && data.bannerData.videoId) {
        frontmatter += `  videoId: "${data.bannerData.videoId}"\n`;
      } else if (data.bannerType === 'timeline' && data.bannerData.category) {
        frontmatter += `  category: "${data.bannerData.category}"\n`;
      }
    }
    
    frontmatter += `---`;
    return frontmatter;
  }
  
  // Generate and download MDX file
  function generateMdxFile(postData) {
    const frontmatter = generateFrontmatter(postData);
    const fullContent = `${frontmatter}\n\n${postData.content}`;
    
    // Create downloadable file
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${postData.slug}.mdx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // Load saved draft if available
  onMount(() => {
    const savedDraft = localStorage.getItem('draftPost');
    if (savedDraft) {
      try {
        post = JSON.parse(savedDraft);
        showNotification('Draft loaded from local storage');
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
    
    // Auto-save draft every 30 seconds
    const autoSaveInterval = setInterval(() => {
      if (post.title) {
        localStorage.setItem('draftPost', JSON.stringify(post));
        console.log('Draft auto-saved');
      }
    }, 30000);
    
    return () => {
      clearInterval(autoSaveInterval);
    };
  });
</script>

<div class="post-editor w-full">
  <!-- Toast notification -->
  {#if showToast}
    <div class="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md {toastType === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-50 text-red-800 border-l-4 border-red-500 dark:bg-red-900/30 dark:text-red-200'}" transition:fade>
      {toastMessage}
    </div>
  {/if}
  
  <h1 class="text-3xl font-bold text-black/90 dark:text-white/90 mb-6">Create New Post</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Frontmatter Section -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold text-black/80 dark:text-white/80 mb-3">Post Information</h2>
      
      <div>
        <label for="title" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Title*</label>
        <input 
          type="text" 
          id="title" 
          bind:value={post.title} 
          on:blur={generateSlug}
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm" 
          required 
        />
      </div>
      
      <div>
        <label for="description" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description*</label>
        <input 
          type="text" 
          id="description" 
          bind:value={post.description} 
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm" 
          required 
        />
      </div>
      
      <div>
        <label for="slug" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Slug*</label>
        <div class="flex">
          <input 
            type="text" 
            id="slug" 
            bind:value={post.slug} 
            class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-l text-sm" 
            required 
          />
          <button 
            on:click={generateSlug} 
            class="px-3 py-2 bg-neutral-200 dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-600 rounded-r"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <p class="text-xs text-neutral-500 mt-1">URL-friendly version of the title (e.g., "my-blog-post")</p>
      </div>
      
      <div>
        <label for="published" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Publication Date*</label>
        <input 
          type="date" 
          id="published" 
          bind:value={post.published} 
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm" 
          required 
        />
      </div>
      
      <div>
        <label for="image" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Featured Image URL</label>
        <input 
          type="text" 
          id="image" 
          bind:value={post.image} 
          placeholder="/posts/your-image.jpg" 
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm" 
        />
        {#if post.image}
          <div class="mt-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
            <p class="text-xs mb-1">Image Preview:</p>
            <img src={post.image} alt="Preview" class="max-h-32 rounded" on:error={(e) => e.target.style.display = 'none'} />
          </div>
        {/if}
      </div>
      
      <div>
        <label for="tags" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tags (comma-separated)</label>
        <input 
          type="text" 
          id="tags" 
          bind:value={post.tags} 
          placeholder="news, tutorial, video" 
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm" 
        />
        {#if tagsArray.length > 0}
          <div class="flex flex-wrap gap-1 mt-2">
            {#each tagsArray as tag}
              <span class="px-2 py-1 text-xs bg-neutral-200 dark:bg-neutral-700 rounded">{tag}</span>
            {/each}
          </div>
        {/if}
      </div>
      
      <div>
        <label for="category" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Category</label>
        <input 
          type="text" 
          id="category" 
          bind:value={post.category} 
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm" 
        />
      </div>
      
      <!-- Timeline specific fields with toggle -->
      <div>
        <div class="flex items-center mb-2">
          <input 
            type="checkbox" 
            id="enable-timeline" 
            bind:checked={post.timelineData.enabled} 
            class="mr-2" 
          />
          <label for="enable-timeline" class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Add to Timeline</label>
        </div>
        
        {#if showTimelineFields}
          <div class="pl-5 space-y-3">
            <div>
              <label for="timelineYear" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Timeline Year</label>
              <input 
                type="number" 
                id="timelineYear" 
                bind:value={post.timelineData.year} 
                class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm" 
              />
            </div>
            
            <div>
              <label for="timelineEra" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Timeline Era</label>
              <select 
                id="timelineEra" 
                bind:value={post.timelineData.era} 
                class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm"
              >
                <option value="">Select an era</option>
                <option value="ancient-epoch">The Ancient Epoch</option>
                <option value="awakening-era">The Awakening Era</option>
                <option value="golden-age">The Corporate Golden Age</option>
                <option value="conflict-epoch">Extinction Epoch</option>
                <option value="singularity-conflict">Transtemporal Singularity Conflict</option>
                <option value="transcendent-age">The Transcendent Age</option>
                <option value="final-epoch">The Final Epoch</option>
              </select>
            </div>
            
            <div>
              <label for="timelineLocation" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Timeline Location</label>
              <input 
                type="text" 
                id="timelineLocation" 
                bind:value={post.timelineData.location} 
                class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm" 
              />
            </div>
            
            <div class="flex items-center">
              <input 
                type="checkbox" 
                id="isKeyEvent" 
                bind:checked={post.timelineData.isKeyEvent} 
                class="mr-2" 
              />
              <label for="isKeyEvent" class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Key Event</label>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Special banner types -->
      <div>
        <label for="bannerType" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Banner Type</label>
        <select 
          id="bannerType" 
          bind:value={post.banner.type} 
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm"
        >
          <option value="">Default (Image)</option>
          <option value="video">Video</option>
          <option value="timeline">Timeline</option>
        </select>
      </div>
      
      {#if showVideoFields}
        <div class="pl-5 space-y-3">
          <div>
            <label for="videoId" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">YouTube Video ID</label>
            <input 
              type="text" 
              id="videoId" 
              bind:value={post.banner.videoId} 
              placeholder="dQw4w9WgXcQ" 
              class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm" 
            />
            <p class="text-xs text-neutral-500 mt-1">The ID from the YouTube URL (e.g., youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong>)</p>
            
            {#if post.banner.videoId}
              <div class="mt-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                <p class="text-xs mb-1">Video Preview:</p>
                <div class="relative pt-[56.25%] bg-black">
                  <iframe 
                    src={`https://www.youtube.com/embed/${post.banner.videoId}?autoplay=0&controls=1`}
                    title="YouTube video preview" 
                    class="absolute top-0 left-0 w-full h-full"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                  ></iframe>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Content Section -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold text-black/80 dark:text-white/80 mb-3">Content</h2>
      
      <div>
        <label for="content" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Post Content (Markdown/MDX)</label>
        <textarea 
          id="content" 
          bind:value={post.content} 
          rows="20" 
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm font-mono"
        ></textarea>
      </div>
      
      <div class="pt-4">
        <h3 class="text-lg font-medium text-black/80 dark:text-white/80 mb-3">Preview</h3>
        <div class="p-4 bg-neutral-100 dark:bg-neutral-800 rounded min-h-[300px] markdown-content">
          {@html previewHtml}
        </div>
      </div>
    </div>
  </div>
  
  <!-- Action Buttons -->
  <div class="flex justify-end space-x-4 mt-8">
    <button 
      on:click={() => { localStorage.removeItem('draftPost'); post = { ...post, title: '', content: '' }; showNotification('Draft cleared!'); }}
      class="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 font-medium rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
    >
      Clear
    </button>
    <button 
      on:click={saveDraft}
      class="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-medium rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition"
    >
      Save as Draft
    </button>
    <button 
      on:click={publishPost}
      disabled={!formValid}
      class="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Publish Post
    </button>
  </div>
</div>

<style>
  :global(.markdown-content h1) {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
  }
  
  :global(.markdown-content h2) {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 0.75rem;
  }
  
  :global(.markdown-content h3) {
    font-size: 1.125rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  :global(.markdown-content p) {
    margin-bottom: 1rem;
  }
  
  :global(.markdown-content ul, .markdown-content ol) {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }
  
  :global(.markdown-content ul) {
    list-style-type: disc;
  }
  
  :global(.markdown-content ol) {
    list-style-type: decimal;
  }
  
  :global(.markdown-content code) {
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
  }
  
  :global(.markdown-content pre) {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.5rem;
    border-radius: 0.25rem;
    overflow-x: auto;
    margin-bottom: 1rem;
  }
  
  :global(.markdown-content blockquote) {
    border-left: 4px solid rgba(0, 0, 0, 0.1);
    padding-left: 1rem;
    font-style: italic;
    margin-bottom: 1rem;
  }
  
  :global(.markdown-content img) {
    max-width: 100%;
    height: auto;
    margin: 1rem 0;
    border-radius: 0.25rem;
  }
</style>