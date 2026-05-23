<script lang="ts">
  import { fly } from 'svelte/transition'

  let { message, type = 'info' }: {
    message: string
    type: 'success' | 'error' | 'info'
  } = $props()
</script>

{#if message}
  <div class="fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-lg border font-mono text-xs tracking-[0.04em] bg-(--surface)"
    class:border-(--success)={type === 'success'}
    class:border-(--accent)={type === 'error'}
    class:border-(--border-visible)={type === 'info'}
    class:text-(--success)={type === 'success'}
    class:text-(--accent)={type === 'error'}
    class:text-(--text-secondary)={type === 'info'}
    transition:fly={{ x: 16, duration: 200 }}>
    {message}
  </div>
{/if}
