// Function to handle collapsible section clicks
async function handleCollapsibleClick(event) {
  const header = event.currentTarget;
  const content = header.nextElementSibling;
  const parentCard = header.closest('.card-base');
  const arrow = header.querySelector('.indicator-arrow');
  const contentUrl = header.getAttribute('data-content-url');

  // Check if content is already loaded
  const isContentLoaded = content.hasAttribute('data-loaded');

  // If content is not loaded and we have a content URL, fetch and inject it
  if (!isContentLoaded && contentUrl) {
    try {
      // Show a loading indicator (optional)
      content.innerHTML = '<div class="p-4 text-center">Loading...</div>';
      
      // Fetch the content
      const response = await fetch(contentUrl);
      if (!response.ok) {
        throw new Error(`Failed to load content: ${response.status}`);
      }
      
      const html = await response.text();
      content.innerHTML = html;
      content.setAttribute('data-loaded', 'true');
    } catch (error) {
      console.error('Failed to load content:', error);
      content.innerHTML = '<div class="p-4 text-center text-red-500">Failed to load content</div>';
      return;
    }
  }

  // Toggle all other sections closed
  document.querySelectorAll('.collapsible-content').forEach(otherContent => {
    if (otherContent !== content && !otherContent.classList.contains('max-h-0')) {
      const otherHeader = otherContent.previousElementSibling;
      otherContent.style.maxHeight = '0px';
      otherContent.style.opacity = '0';
      otherHeader.setAttribute('aria-expanded', 'false');
      otherHeader.querySelector('.indicator-arrow')?.classList.remove('rotate-180');
    }
  });

  // Handle the clicked section
  const isExpanding = content.style.maxHeight === '0px' || !content.style.maxHeight;

  if (isExpanding) {
    // Get the scrollHeight to animate to
    const height = content.scrollHeight;
    content.style.maxHeight = '0px';
    content.style.opacity = '0';

    // Force reflow
    content.offsetHeight;

    // Animate to full height
    content.style.maxHeight = height + 'px';
    content.style.opacity = '1';

    // Update accessibility attributes and rotate arrow
    header.setAttribute('aria-expanded', 'true');
    arrow.classList.add('rotate-180');

    // Scroll to the top of this section with a slight delay to allow animation to start
    setTimeout(() => {
      // Trigger TOC rebuild after expanding a section
      const tocElement = document.querySelector('table-of-contents');
      if (tocElement && typeof tocElement.rebuildTOC === 'function') {
        tocElement.rebuildTOC();
      }
      parentCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500); // Wait for animation to complete
  } else {
    content.style.maxHeight = '0px';
    content.style.opacity = '0';

    // Update accessibility attributes and rotate arrow back
    header.setAttribute('aria-expanded', 'false');
    arrow.classList.remove('rotate-180');

    // Trigger TOC rebuild after collapsing a section
    const tocElement = document.querySelector('table-of-contents');
    if (tocElement && typeof tocElement.rebuildTOC === 'function') {
      tocElement.rebuildTOC();
    }
  }
}

// Function to initialize all collapsible elements
export function initCollapsibles() {
  console.log('Initializing collapsibles');
  const headers = document.querySelectorAll('.collapsible-header');
  
  if (headers.length === 0) {
    console.warn('No collapsible headers found to initialize');
    return;
  }
  
  // Remove any existing listeners using event delegation
  headers.forEach(header => {
    // Store a flag to avoid double-binding
    if (!header.hasAttribute('data-collapsible-initialized')) {
      header.removeEventListener('click', handleCollapsibleClick);
      header.addEventListener('click', handleCollapsibleClick);
      header.setAttribute('data-collapsible-initialized', 'true');
    }
  });
  
  console.log(`Initialized ${headers.length} collapsible elements`);
}