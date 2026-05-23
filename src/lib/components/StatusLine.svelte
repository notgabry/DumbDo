<script lang="ts">
  let { message, type = 'info' }: {
    message: string
    type: 'success' | 'error' | 'info'
  } = $props()

  const colorClass = $derived(
    type === 'success' ? 'text-(--success)' :
    type === 'error' ? 'text-(--accent)' :
    'text-(--text-secondary)'
  )
</script>

{#if message}
  <div class="mb-3 text-xs font-mono tracking-[0.04em] {colorClass}">[ {message} ]</div>
{:else}
  <div class="mb-3 text-xs font-mono text-(--text-secondary) min-h-[1.2em] tracking-[0.04em]">&nbsp;</div>
{/if}
