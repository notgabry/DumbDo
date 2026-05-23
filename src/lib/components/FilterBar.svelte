<script lang="ts">
  import { fade, slide } from 'svelte/transition'
  import { getTagColorClass } from '$lib/utils/tag'

  let { tags, activeTag, onSelect }: {
    tags: string[]
    activeTag: string | null
    onSelect: (tag: string | null) => void
  } = $props()
</script>

{#if tags.length > 0}
  <div class="flex flex-wrap gap-1.5 mb-4" transition:fade={{ duration: 150 }}>
    <button onclick={() => onSelect(null)}
      class="text-[10px] px-3 py-1 rounded-full border transition-all cursor-pointer font-mono font-bold uppercase tracking-[0.06em]"
      class:bg-(--text-display)={!activeTag}
      class:border-(--text-display)={!activeTag}
      class:text-(--black)={!activeTag}
      class:border-(--border-visible)={activeTag !== null}
      class:text-(--text-secondary)={activeTag !== null}
      class:bg-transparent={activeTag !== null}>ALL</button>
    {#each tags as tag (tag)}
      <button onclick={() => onSelect(activeTag === tag ? null : tag)}
        class="text-[10px] px-3 py-1 rounded-full border transition-all cursor-pointer font-mono font-bold uppercase tracking-[0.06em] {activeTag === tag ? `${getTagColorClass(tag)} text-white border-transparent` : 'bg-transparent border-(--border-visible) text-(--text-secondary)'}"
        transition:slide={{ duration: 150, axis: 'x' }}>
        {tag}
      </button>
    {/each}
  </div>
{/if}
