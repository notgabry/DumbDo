<script lang="ts">
  import '../app.css'
  import 'mobile-drag-drop/default.css'
  import { onMount } from 'svelte'
  import { initTheme } from '$lib/stores/theme'
  import { polyfill as dragDropPolyfill } from 'mobile-drag-drop'

  onMount(() => {
    initTheme()
    dragDropPolyfill()
  })
</script>

<div class="min-h-screen bg-(--black) text-(--text-primary)">
  <slot />
</div>
