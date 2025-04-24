{#if browser}
<div class="map-container">
  <div id="vmap" bind:this={mapElement}></div>
</div>
{/if}

<script>
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { initMap } from '$lib/map-service';
  import 'ol/ol.css';

  let mapElement;

  onMount(async () => {
    if (browser && mapElement) {
      try {
        await initMap('vmap');
      } catch (error) {
        console.error('지도 초기화 실패:', error);
      }
    }
  });
</script>

<style>
  .map-container {
    width: 100%;
    height: 100%;
    position: relative;
  }

  #vmap {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
</style> 