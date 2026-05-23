<script lang="ts">
  import * as store from '$lib/stores/todoStore.svelte'
  import { getTagColorClass, parseTag, linkify } from '$lib/utils/tag'
  import { Check, X } from 'lucide-svelte'
</script>

{#if store.getActiveTodos().length === 0 && store.getDoneTodos().length === 0}
  <div class="text-center py-16 text-xs font-mono text-(--text-disabled) uppercase tracking-[0.06em]">[ EMPTY ]</div>
{:else}
  {#if store.getActiveTodos().length > 0}
    <div>
      {#each store.getActiveTodos() as t, i (t._id || t.text)}
        {@const { tag, text } = parseTag(t.text)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="flex items-start gap-3 px-1 py-2 border-b transition-all border-(--border)" role="listitem">
          <button onclick={() => store.toggleTodo(t)}
            class="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-sm border transition-all cursor-pointer border-(--border-visible) bg-transparent"
            aria-label="Toggle">
            {#if t.completed}
              <Check size={12} strokeWidth={1.5} class="text-(--text-display)" />
            {/if}
          </button>
          {#if store.s.editingId === t._id}
            <input type="text" bind:value={store.s.editingText}
              class="flex-1 text-sm px-2 py-1 rounded border outline-none bg-transparent text-inherit font-mono border-(--border-visible)"
              onblur={() => store.saveEdit(t)}
              onkeydown={(e) => { if (e.key === 'Enter') store.saveEdit(t); if (e.key === 'Escape') store.cancelEdit() }} />
          {:else}
            <div class="flex-1 flex items-center gap-2 min-w-0 cursor-text"
              onclick={() => store.startEdit(t)}
              onkeydown={(e) => { if (e.key === 'Enter') store.startEdit(t) }}
              role="button" tabindex="0">
              {#if tag}
                <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 text-white uppercase font-['Space_Mono'] tracking-[0.08em] {getTagColorClass(tag)}">{tag}</span>
              {/if}
              <span class="text-sm text-(--text-primary) break-all overflow-hidden">
                {#each linkify(text) as segment}
                  {#if segment.type === 'link'}
                    <a href={segment.value} target="_blank" rel="noopener noreferrer" class="underline text-(--interactive)">{segment.value}</a>
                  {:else}
                    {segment.value}
                  {/if}
                {/each}
              </span>
            </div>
          {/if}
          <button onclick={() => store.removeTodo(t)}
            class="shrink-0 w-5 h-5 flex items-center justify-center rounded-sm text-(--text-disabled) hover:text-(--accent) transition-colors cursor-pointer bg-transparent border-none"
            aria-label="Delete">
            <X size={12} strokeWidth={1.5} />
          </button>
        </div>
      {/each}
    </div>
  {/if}

  {#if store.getDoneTodos().length > 0}
    <div>
      <div class="mt-6 mb-3">
        <span class="text-[10px] font-mono text-(--text-disabled) uppercase tracking-[0.08em]">{store.getDoneTodos().length} COMPLETED</span>
      </div>
      <div class="space-y-0.5">
        {#each store.getDoneTodos() as t, i (t._id || t.text)}
          {@const { tag, text } = parseTag(t.text)}
          <div class="flex items-start gap-3 px-1 py-2 border-b transition-all opacity-50 border-(--border)">
            <button onclick={() => store.toggleTodo(t)}
              class="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-sm border transition-all cursor-pointer border-(--border-visible) bg-transparent"
              aria-label="Toggle">
              <Check size={12} strokeWidth={1.5} class="text-(--text-display)" />
            </button>
            <div class="flex-1 flex items-center gap-2 min-w-0">
              {#if tag}
                <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 text-white uppercase font-['Space_Mono'] tracking-[0.08em] {getTagColorClass(tag)}">{tag}</span>
              {/if}
              <span class="text-sm line-through text-(--text-disabled) break-all overflow-hidden">
                {#each linkify(text) as segment}
                  {#if segment.type === 'link'}
                    <a href={segment.value} target="_blank" rel="noopener noreferrer" class="underline text-(--interactive)">{segment.value}</a>
                  {:else}
                    {segment.value}
                  {/if}
                {/each}
              </span>
            </div>
            <button onclick={() => store.removeTodo(t)}
              class="shrink-0 w-5 h-5 flex items-center justify-center rounded-sm text-(--text-disabled) hover:text-(--accent) transition-colors cursor-pointer bg-transparent border-none"
              aria-label="Delete">
              <X size={12} strokeWidth={1.5} />
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
{/if}
