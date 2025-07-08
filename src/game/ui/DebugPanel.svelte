<!-- Debug interface using lil-gui -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { GUI } from 'lil-gui';
  
  export let engine: any = null;
  
  let debugContainer: HTMLElement;
  let gui: GUI;
  
  onMount(() => {
    if (!engine) return;
    
    gui = new GUI({ container: debugContainer });
    gui.title('Debug Panel');
    
    // Engine controls
    const engineFolder = gui.addFolder('Engine');
    engineFolder.add({ fps: 60 }, 'fps').listen().disable();
    
    // Rendering controls
    const renderFolder = gui.addFolder('Rendering');
    renderFolder.add({ bloom: 0.5 }, 'bloom', 0, 2, 0.1);
    
    return () => {
      gui?.destroy();
    };
  });
</script>

<div bind:this={debugContainer} class="absolute top-4 left-1/2 transform -translate-x-1/2 z-50"></div>