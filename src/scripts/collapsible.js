// Function to handle collapsible section clicks
function handleCollapsibleClick(event) {
  const header = event.currentTarget;
  const content = header.nextElementSibling;
  
  // Prevent processing if already animating
  if (content.hasAttribute('data-animating')) return;

  // Determine if we're expanding or collapsing
  const isCurrentlyExpanded = content.style.maxHeight !== '0px' && content.style.maxHeight !== '';

  // Close all other open sections
  document.querySelectorAll('.collapsible-content').forEach(otherContent => {
    if (otherContent !== content) {
      const otherHeader = otherContent.previousElementSibling;
      collapseSection(otherContent, otherHeader);
    }
  });

  // Toggle current section
  if (!isCurrentlyExpanded) {
    expandSection(content, header);
  } else {
    collapseSection(content, header);
  }
}

function expandSection(content, header) {
  const arrow = header.querySelector('.indicator-arrow');
  
  // Prevent multiple expansions
  content.setAttribute('data-animating', 'true');
  
  // Prepare for animation
  content.style.maxHeight = '0px';
  content.style.opacity = '0';
  
  // Use requestAnimationFrame for smoother animation
  requestAnimationFrame(() => {
    const height = content.scrollHeight;
    
    content.style.maxHeight = `${height}px`;
    content.style.opacity = '1';
    
    // Update attributes
    header.setAttribute('aria-expanded', 'true');
    arrow?.classList.add('rotate-180');
    
    // Remove animating flag after animation
    setTimeout(() => {
      content.removeAttribute('data-animating');
    }, 300);
  });
}

function collapseSection(content, header) {
  const arrow = header.querySelector('.indicator-arrow');
  
  // Prevent multiple collapses
  content.setAttribute('data-animating', 'true');
  
  content.style.maxHeight = '0px';
  content.style.opacity = '0';
  
  // Update attributes
  header.setAttribute('aria-expanded', 'false');
  arrow?.classList.remove('rotate-180');
  
  // Remove animating flag
  setTimeout(() => {
    content.removeAttribute('data-animating');
  }, 300);
}

// Function to initialize all collapsible elements
export function initCollapsibles() {
  const headers = document.querySelectorAll('.collapsible-header');
  
  if (headers.length === 0) {
    console.warn('No collapsible headers found to initialize');
    return;
  }
  
  headers.forEach(header => {
    // Ensure we don't add multiple listeners
    header.removeEventListener('click', handleCollapsibleClick);
    header.addEventListener('click', handleCollapsibleClick);
    
    // Get corresponding content
    const content = header.nextElementSibling;
    
    if (content && content.classList.contains('collapsible-content')) {
      // Initialize with collapsed state
      content.style.maxHeight = '0px';
      content.style.opacity = '0';
      header.setAttribute('aria-expanded', 'false');
    }
  });
  
  console.log(`Initialized ${headers.length} collapsible elements`);
}