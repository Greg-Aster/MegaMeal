<script>
    import { onMount } from 'svelte';
    import { getFriends, formatUrl } from '../../../stores/friendStore';
    
    // Constants for localStorage keys
    const FRIENDS_STORAGE_KEY = 'blogFriends';
    const FRIEND_CONTENT_ENABLED_KEY = 'friendContentEnabled';
    const LAST_SYNC_TIME_KEY = 'lastFriendSyncTime';
    
    // State
    let friends = [];
    let friendContentEnabled = true;
    let lastSyncTime = null;
    
    // Form inputs
    let friendName = '';
    let friendUrl = '';
    let friendBio = '';
    let friendAvatar = '';
    
    onMount(() => {
      // Load saved friends
      loadFriends();
      
      // Load settings
      friendContentEnabled = localStorage.getItem(FRIEND_CONTENT_ENABLED_KEY) !== 'false';
      lastSyncTime = localStorage.getItem(LAST_SYNC_TIME_KEY);
    });
    
    // Load friends from localStorage
    function loadFriends() {
      friends = getFriends();
    }
    
    // Add a new friend
    function addNewFriend() {
      // Validate inputs
      if (!friendName || !friendUrl) {
        alert('Please provide both a name and URL for the friend site.');
        return;
      }
      
      // Format URL
      const cleanUrl = formatUrl(friendUrl);
      
      // Check if this URL already exists
      if (friends.some(f => f.url === cleanUrl)) {
        alert('This site is already in your friends list.');
        return;
      }
      
      // Create new friend object
      const newFriend = {
        id: Date.now().toString(),
        name: friendName,
        url: cleanUrl,
        bio: friendBio,
        avatar: friendAvatar,
        postCount: 0,
        lastSynced: null,
        posts: []
      };
      
      // Add to friends array
      friends = [...friends, newFriend];
      
      // Save to localStorage
      localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(friends));
      
      // Clear inputs
      friendName = '';
      friendUrl = '';
      friendBio = '';
      friendAvatar = '';
      
      // Attempt to sync the new friend
      syncFriend(newFriend.id);
    }
    
    // Remove a friend
    function removeFriend(friendId) {
      if (confirm('Are you sure you want to remove this friend? Any synced content will no longer appear in your feed.')) {
        // Filter out the friend to remove
        friends = friends.filter(f => f.id !== friendId);
        
        // Save updated list
        localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(friends));
      }
    }
    
    // Sync a specific friend's content
    function syncFriend(friendId) {
      const friend = friends.find(f => f.id === friendId);
      
      if (!friend) {
        console.error('Friend not found:', friendId);
        return;
      }
      
      // For demonstration purposes, simulate fetching posts
      simulateFetchPosts(friend.url)
        .then(posts => {
          // Update friend data with fetched posts
          friend.posts = posts;
          friend.postCount = posts.length;
          friend.lastSynced = new Date().toISOString();
          
          // Update friends array
          friends = friends.map(f => f.id === friendId ? friend : f);
          
          // Save to localStorage
          localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(friends));
        })
        .catch(error => {
          console.error('Error syncing friend content:', error);
        });
    }
    
    // Sync all friends
    function syncAllFriends() {
      if (friends.length === 0) {
        alert('No friends to sync. Add some friends first.');
        return;
      }
      
      // Sync each friend sequentially
      const syncPromises = friends.map(friend => {
        return simulateFetchPosts(friend.url)
          .then(posts => {
            // Update friend data
            friend.posts = posts;
            friend.postCount = posts.length;
            friend.lastSynced = new Date().toISOString();
            return friend;
          })
          .catch(error => {
            console.error(`Error syncing friend ${friend.name}:`, error);
            return friend; // Return unchanged friend on error
          });
      });
      
      // Update all friends after sync completes
      Promise.all(syncPromises)
        .then(updatedFriends => {
          // Update friends array
          friends = updatedFriends;
          
          // Save to localStorage
          localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(friends));
          
          // Update last sync time
          const now = new Date().toISOString();
          localStorage.setItem(LAST_SYNC_TIME_KEY, now);
          lastSyncTime = now;
        })
        .catch(error => {
          console.error('Error in global sync:', error);
        });
    }
    
    // Update content integration setting
    function updateContentIntegration(event) {
      friendContentEnabled = event.target.checked;
      localStorage.setItem(FRIEND_CONTENT_ENABLED_KEY, friendContentEnabled);
    }
    
    // Simulate fetching posts from a friend's site
    // In a real implementation, this would actually fetch from the friend's site
    function simulateFetchPosts(friendUrl) {
      return new Promise((resolve, reject) => {
        // This is a simulation - in reality you'd fetch actual content from the friend's site
        setTimeout(() => {
          // Generate 3-8 random posts
          const postCount = Math.floor(Math.random() * 6) + 3;
          const posts = [];
          
          for (let i = 0; i < postCount; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // Random date within last 60 days
            
            posts.push({
              id: `friend-post-${Date.now()}-${i}`,
              title: `Friend Blog Post ${i + 1}`,
              slug: `friend-post-${i + 1}`,
              description: 'This is a sample post from a friend blog',
              published: date.toISOString(),
              content: 'Sample content from friend blog. This would be the actual content in a real implementation.',
              sourceUrl: `${friendUrl}/posts/sample-${i + 1}`,
              tags: ['shared', 'friend-content']
            });
          }
          
          resolve(posts);
        }, 1500); // Simulate network delay
      });
    }
    
    // Format a date as "X time ago"
    function formatTimeAgo(dateString) {
      if (!dateString) return 'Never';
      
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffDay > 0) {
        return diffDay === 1 ? 'yesterday' : `${diffDay} days ago`;
      }
      if (diffHour > 0) {
        return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
      }
      if (diffMin > 0) {
        return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
      }
      return 'just now';
    }
  </script>
  
  <!-- Add New Friend Section -->
  <div class="mb-6 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg">
    <h3 class="text-md font-medium text-black/70 dark:text-white/70 mb-3">Add New Friend</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="friend-name" class="block text-sm font-medium text-75 mb-1">Friend Name</label>
        <input 
          type="text" 
          id="friend-name" 
          bind:value={friendName}
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition" 
          placeholder="Enter friend name"
        />
      </div>
      <div>
        <label for="friend-url" class="block text-sm font-medium text-75 mb-1">Site URL</label>
        <input 
          type="url" 
          id="friend-url" 
          bind:value={friendUrl}
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition" 
          placeholder="https://friendsite.com"
        />
      </div>
      <div>
        <label for="friend-bio" class="block text-sm font-medium text-75 mb-1">Bio (Optional)</label>
        <input 
          type="text" 
          id="friend-bio" 
          bind:value={friendBio}
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition" 
          placeholder="Short description of friend's blog"
        />
      </div>
      <div>
        <label for="friend-avatar" class="block text-sm font-medium text-75 mb-1">Avatar URL (Optional)</label>
        <input 
          type="url" 
          id="friend-avatar" 
          bind:value={friendAvatar}
          class="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm transition" 
          placeholder="https://friendsite.com/avatar.jpg"
        />
      </div>
      <div class="col-span-1 md:col-span-2">
        <button 
          on:click={addNewFriend}
          class="mt-3 px-4 py-2 bg-[var(--primary)] text-white font-medium rounded-md hover:opacity-90 transition-opacity flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          Add Friend
        </button>
      </div>
    </div>
  </div>
  
  <!-- Friend List -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    {#if friends.length === 0}
      <div class="col-span-1 md:col-span-2 p-8 text-center bg-neutral-50 dark:bg-neutral-800/20 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <h3 class="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">No Connections Yet</h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Add a friend using the form above to start sharing content.</p>
      </div>
    {:else}
      {#each friends as friend (friend.id)}
        <div class="friend-card flex items-start p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-[var(--primary)] transition-colors">
          <div class="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mr-4 flex-shrink-0">
            <img 
              src={friend.avatar || '/api/placeholder/48/48'} 
              alt={`${friend.name}'s avatar`}
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-medium text-black/80 dark:text-white/80 mb-1">
              {friend.name}
            </h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
              {friend.bio || 'No bio provided'}
            </p>
            <div class="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
              <span class="flex items-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>{friend.postCount || 0} Posts</span>
              </span>
              <span class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{formatTimeAgo(friend.lastSynced)}</span>
              </span>
            </div>
          </div>
          <div class="flex flex-col flex-shrink-0 ml-2 gap-2">
            <button 
              on:click={() => syncFriend(friend.id)}
              class="p-2 text-[var(--primary)] hover:bg-[var(--primary)] hover:bg-opacity-10 rounded-full" 
              title="Sync content"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"></path>
              </svg>
            </button>
            <button 
              on:click={() => removeFriend(friend.id)}
              class="p-2 text-red-500 hover:bg-red-500 hover:bg-opacity-10 rounded-full" 
              title="Remove friend"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
  
  <!-- Content Integration Controls -->
  <div class="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg">
    <h3 class="text-md font-medium text-black/70 dark:text-white/70 mb-3">Content Integration</h3>
    <div class="flex items-center mb-4">
      <input 
        type="checkbox" 
        id="enable-friend-content" 
        checked={friendContentEnabled}
        on:change={updateContentIntegration}
        class="mr-3" 
      />
      <div>
        <label for="enable-friend-content" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Enable Friend Content in Main Feed</label>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">When enabled, your friends' posts will appear in your main feed while you're logged in</p>
      </div>
    </div>
    <div class="flex items-center justify-between">
      <button 
        on:click={syncAllFriends}
        class="px-4 py-2 bg-[var(--primary)] text-white font-medium rounded-md hover:opacity-90 transition-opacity flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 12c0-5.52-4.48-10-10-10s-10 4.48-10 10 4.48 10 10 10 10-4.48 10-10"></path>
          <path d="M12 2v10l4 4"></path>
        </svg>
        Sync All Friends
      </button>
      <div class="text-sm text-neutral-500 dark:text-neutral-400">
        Last global sync: {lastSyncTime ? formatTimeAgo(lastSyncTime) : 'Never'}
      </div>
    </div>
  </div>