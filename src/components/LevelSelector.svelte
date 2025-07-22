<!--
  Level Selector Splash Screen
  
  Simple splash screen that lets you choose which level to enter.
  Shows off all the levels we've built with the modular system.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  
  const dispatch = createEventDispatcher()
  
  // Available levels configuration
  const levels = [
    {
      id: 'observatory',
      name: 'Observatory',
      description: 'Original observatory level with firefly-ocean lighting integration',
      component: 'Observatory',
      image: '/assets/levels/observatory-preview.jpg',
      status: 'stable',
      features: ['Fireflies', 'Ocean Reflections', 'Star Map', 'Manual Integration']
    },
    {
      id: 'modular-observatory', 
      name: 'Modular Observatory',
      description: 'Same level rebuilt with proper modular component system',
      component: 'ModularObservatory',
      image: '/assets/levels/modular-observatory-preview.jpg', 
      status: 'improved',
      features: ['Modular Components', 'Auto Integration', 'Clean Architecture']
    },
    {
      id: 'hybrid-observatory',
      name: 'Hybrid Observatory (ECS)',
      description: 'High-performance version using ECS for 1000+ fireflies',
      component: 'HybridObservatory',
      image: '/assets/levels/hybrid-observatory-preview.jpg',
      status: 'cutting-edge',
      features: ['ECS Performance', '1000+ Fireflies', 'Emotional State System', 'Industry Architecture']
    },
    {
      id: 'example-new-level',
      name: 'Example New Level',
      description: 'Demonstrates how easy it is to create new levels',
      component: 'ExampleNewLevel', 
      image: '/assets/levels/example-level-preview.jpg',
      status: 'demo',
      features: ['Quick Creation', 'Component Mixing', 'Different Atmosphere']
    }
  ]
  
  function selectLevel(levelId: string) {
    dispatch('levelSelected', { levelId })
  }
  
  function getStatusColor(status: string) {
    switch(status) {
      case 'stable': return 'bg-green-500'
      case 'improved': return 'bg-blue-500' 
      case 'cutting-edge': return 'bg-purple-500'
      case 'demo': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }
  
  function getStatusText(status: string) {
    switch(status) {
      case 'stable': return 'Stable'
      case 'improved': return 'Improved'
      case 'cutting-edge': return 'Cutting Edge'
      case 'demo': return 'Demo'
      default: return 'Unknown'
    }
  }
</script>

<div class="level-selector">
  <!-- Header -->
  <div class="header">
    <h1 class="title">
      <span class="title-main">MEGAMEAL</span>
      <span class="title-sub">Level Selection</span>
    </h1>
    <p class="subtitle">
      Choose your experience - from stable builds to cutting-edge architecture demonstrations
    </p>
  </div>
  
  <!-- Level Grid -->
  <div class="level-grid">
    {#each levels as level}
      <div class="level-card" on:click={() => selectLevel(level.id)} on:keydown={(e) => e.key === 'Enter' && selectLevel(level.id)} tabindex="0" role="button">
        <!-- Level Preview Image -->
        <div class="level-image">
          <!-- Fallback gradient if image doesn't exist -->
          <div class="image-fallback"></div>
          <img src={level.image} alt={level.name} loading="lazy" on:error={(e) => e.target.style.display = 'none'} />
          
          <!-- Status Badge -->
          <div class="status-badge {getStatusColor(level.status)}">
            {getStatusText(level.status)}
          </div>
        </div>
        
        <!-- Level Info -->
        <div class="level-info">
          <h3 class="level-name">{level.name}</h3>
          <p class="level-description">{level.description}</p>
          
          <!-- Features -->
          <div class="features">
            {#each level.features as feature}
              <span class="feature-tag">{feature}</span>
            {/each}
          </div>
          
          <!-- Enter Button -->
          <button class="enter-btn" on:click|stopPropagation={() => selectLevel(level.id)}>
            Enter Level
          </button>
        </div>
      </div>
    {/each}
  </div>
  
  <!-- Footer Info -->
  <div class="footer">
    <p class="tech-info">
      Built with <strong>Threlte</strong> + <strong>Three.js</strong> + <strong>Modular Component System</strong> + <strong>ECS Architecture</strong>
    </p>
    <p class="performance-note">
      💡 Try the <strong>Hybrid Observatory</strong> to see ECS performance with 1000+ fireflies
    </p>
  </div>
</div>

<style>
  .level-selector {
    min-height: 100vh;
    background: linear-gradient(135deg, #0c0f1a 0%, #1a1f3a 50%, #2a1f3a 100%);
    color: white;
    padding: 2rem;
    font-family: 'Roboto', sans-serif;
  }
  
  .header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .title {
    margin: 0 0 1rem 0;
    line-height: 1.2;
  }
  
  .title-main {
    display: block;
    font-size: 4rem;
    font-weight: bold;
    background: linear-gradient(45deg, #8bb3ff, #87ceeb, #98fb98);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 20px rgba(139, 179, 255, 0.3);
  }
  
  .title-sub {
    display: block;
    font-size: 1.5rem;
    font-weight: normal;
    color: #8bb3ff;
    margin-top: 0.5rem;
  }
  
  .subtitle {
    font-size: 1.1rem;
    color: #a0a0b0;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.5;
  }
  
  .level-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .level-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: pointer;
    backdrop-filter: blur(10px);
  }
  
  .level-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(139, 179, 255, 0.2);
    border-color: rgba(139, 179, 255, 0.3);
  }
  
  .level-card:focus {
    outline: none;
    border-color: #8bb3ff;
    box-shadow: 0 0 20px rgba(139, 179, 255, 0.4);
  }
  
  .level-image {
    position: relative;
    height: 200px;
    overflow: hidden;
  }
  
  .image-fallback {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, #404060, #6a7db3, #8bb3ff);
    opacity: 0.7;
  }
  
  .level-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .level-card:hover .level-image img {
    transform: scale(1.05);
  }
  
  .status-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .level-info {
    padding: 1.5rem;
  }
  
  .level-name {
    margin: 0 0 0.5rem 0;
    font-size: 1.4rem;
    font-weight: bold;
    color: #8bb3ff;
  }
  
  .level-description {
    margin: 0 0 1rem 0;
    color: #c0c0d0;
    line-height: 1.4;
    font-size: 0.9rem;
  }
  
  .features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .feature-tag {
    background: rgba(139, 179, 255, 0.2);
    color: #8bb3ff;
    padding: 0.25rem 0.6rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid rgba(139, 179, 255, 0.3);
  }
  
  .enter-btn {
    width: 100%;
    padding: 0.8rem 1.5rem;
    background: linear-gradient(45deg, #8bb3ff, #98fb98);
    color: #0c0f1a;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .enter-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(139, 179, 255, 0.4);
    background: linear-gradient(45deg, #98fb98, #8bb3ff);
  }
  
  .enter-btn:active {
    transform: translateY(0);
  }
  
  .footer {
    text-align: center;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .tech-info {
    color: #a0a0b0;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  
  .performance-note {
    color: #8bb3ff;
    font-size: 0.85rem;
    font-style: italic;
  }
  
  /* Mobile Responsive */
  @media (max-width: 768px) {
    .level-selector {
      padding: 1rem;
    }
    
    .title-main {
      font-size: 2.5rem;
    }
    
    .title-sub {
      font-size: 1.2rem;
    }
    
    .level-grid {
      grid-template-columns: 1fr;
    }
    
    .level-card {
      margin-bottom: 1rem;
    }
    
    .level-image {
      height: 150px;
    }
  }
  
  /* Loading animation for images */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .level-image img {
    animation: fadeIn 0.5s ease-in-out;
  }
</style>