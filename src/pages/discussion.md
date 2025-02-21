---
import MainGridLayout from '../layouts/MainGridLayout.astro';
import { i18n } from '../i18n/translation';
import I18nKey from '../i18n/i18nKey';
import Markdown from '@components/misc/Markdown.astro';
import { Icon } from 'astro-icon/components';

// You can fetch any configuration content if needed
// const discordConfig = await getEntry('spec', 'discord');
---

<MainGridLayout title={i18n(I18nKey.discord) || "Discord Community"} description={i18n(I18nKey.discordDescription) || "Join our Discord community"}>
  <!-- Discord Interactive Embed Section -->
  <div id="discord-section" class="card-base flex w-full rounded-[var(--radius-large)] overflow-hidden relative min-h-[650px] mb-8">
    <div class="pl-6 md:pl-9 pr-6 md:pr-9 pt-6 md:pt-7 pb-6 w-full">
      <h2 class="text-2xl font-bold text-90 mb-4 text-[var(--primary)] dark:text-[var(--primary)]">Join Our Community</h2>
      <p class="mb-6 text-sm text-neutral-400">Chat directly with our community without leaving the site!</p>
      
      <!-- Discord Interactive Embed -->
      <div class="discord-embed-container w-full h-[600px] rounded-lg overflow-hidden">
        <iframe 
          src="https://discord.com/channels/YOUR_SERVER_ID/YOUR_CHANNEL_ID/embed"
          width="100%" 
          height="100%" 
          allowtransparency="true" 
          frameborder="0" 
          sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-storage-access-by-user-activation"
          loading="lazy"
          class="rounded-lg"
        ></iframe>
      </div>
    </div>
  </div>

  <!-- Information About Discord Embed -->
  <div id="embed-info" class="card-base flex w-full rounded-[var(--radius-large)] overflow-hidden relative min-h-32 mb-8">
    <div class="pl-6 md:pl-9 pr-6 md:pr-9 pt-6 md:pt-7 pb-6 w-full">
      <h2 class="text-2xl font-bold text-90 mb-4 text-[var(--primary)] dark:text-[var(--primary)]">About Our Discord Embed</h2>
      
      <div class="space-y-4">
        <div class="info-item">
          <h3 class="text-lg font-medium mb-2">Interactive Chat</h3>
          <p class="text-sm text-neutral-400">You can chat directly with our community through this embedded Discord widget. New users will need to log in to their Discord account when prompted.</p>
        </div>
        
        <div class="info-item">
          <h3 class="text-lg font-medium mb-2">Limited Functionality</h3>
          <p class="text-sm text-neutral-400">The embedded chat provides basic functionality. For full features like voice chat and file sharing, you'll need to join our server on the Discord app.</p>
        </div>
        
        <div class="info-item">
          <h3 class="text-lg font-medium mb-2">Discord Account Required</h3>
          <p class="text-sm text-neutral-400">You'll need a Discord account to participate in the chat. If you don't have one, you'll be prompted to create one when you try to send a message.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Join Full Discord Section -->
  <section class="card-base px-9 py-6 rounded-[var(--radius-large)]">
    <h2 class="text-2xl font-bold text-90 mb-4 text-[var(--primary)] dark:text-[var(--primary)]">Get the Full Experience</h2>
    <div class="flex flex-col md:flex-row gap-8 items-center">
      <div class="flex-1">
        <p class="text-sm text-neutral-400 mb-4">Want access to all features including voice channels, file sharing, and more?</p>
        <p class="text-sm text-neutral-400 mb-6">Join our full Discord server for the complete community experience.</p>
        
        <a 
          href="https://discord.gg/YOUR_INVITE_CODE" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="btn-primary inline-flex items-center gap-2 py-2 px-4 rounded-md"
        >
          <Icon name="mdi:discord" class="w-5 h-5" />
          Join Full Discord Server
        </a>
      </div>
      <div class="flex-1 flex justify-center">
        <img 
          src="/assets/discord-illustration.svg" 
          alt="Discord Community Illustration" 
          class="max-w-xs w-full h-auto"
          onerror="this.src='/assets/placeholder.png'; this.onerror=null;"
        />
      </div>
    </div>
  </section>
</MainGridLayout>

<style>
  .btn-primary {
    background-color: var(--primary);
    color: white;
    transition: all 0.2s ease-in-out;
  }
  
  .btn-primary:hover {
    background-color: var(--primary-dark);
    transform: translateY(-2px);
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .discord-embed-container {
      height: 500px;
    }
  }
  
  @media (max-width: 640px) {
    .discord-embed-container {
      height: 400px;
    }
  }
</style>

<script>
  // Optional: Add a loading indicator for the iframe
  document.addEventListener('DOMContentLoaded', () => {
    const discordContainer = document.querySelector('.discord-embed-container');
    const iframe = discordContainer?.querySelector('iframe');
    
    if (iframe) {
      // Create loading indicator
      const loader = document.createElement('div');
      loader.classList.add('loading-indicator');
      loader.innerHTML = '<span>Loading Discord...</span>';
      discordContainer?.appendChild(loader);
      
      // Remove loader when iframe loads
      iframe.addEventListener('load', () => {
        loader.remove();
      });
    }
  });
</script>