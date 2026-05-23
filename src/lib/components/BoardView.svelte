<script lang="ts">
  import * as store from '$lib/stores/todoStore.svelte'
  import { getTagColorClass, parseTag, linkify } from '$lib/utils/tag'
  import { Check, X } from 'lucide-svelte'
</script>

<div class="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))] items-start">
  {#each store.getBoardTags() as tag}
    {@const colTodos = store.getCurrentTodos().filter(t => parseTag(t.text).tag === tag)}
    <div class="rounded-xl p-4 border bg-(--surface) border-(--border)">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-[9px] px-2 py-0.5 rounded-full font-bold text-white uppercase font-['Space_Mono'] tracking-[0.08em] {getTagColorClass(tag)}">{tag}</span>
        <span class="text-[10px] font-mono text-(--text-disabled) tracking-[0.04em]">{colTodos.length}</span>
      </div>
      <div class="space-y-1">
        {#each colTodos as t (t._id || t.text)}
          <div class="flex items-start gap-2 px-2 py-1.5 rounded-lg border transition-all bg-(--surface-raised) border-(--border)" class:opacity-50={t.completed}>
            <button onclick={() => store.toggleTodo(t)}
              class="mt-0.5 shrink-0 flex items-center justify-center w-4 h-4 rounded-sm border transition-all cursor-pointer border-(--border-visible) bg-transparent"
              aria-label="Toggle">
              {#if t.completed}
                <Check size={10} strokeWidth={1.5} class="text-(--text-display)" />
              {/if}
            </button>
            {#if store.s.editingId === t._id}
              <input type="text" bind:value={store.s.editingText}
                class="flex-1 text-xs px-1.5 py-1 rounded border outline-none bg-transparent text-inherit font-mono border-(--border-visible) min-w-0"
                onblur={() => store.saveEdit(t)}
                onkeydown={(e) => { if (e.key === 'Enter') store.saveEdit(t); if (e.key === 'Escape') store.cancelEdit() }} />
            {:else}
              <span class="text-xs flex-1 break-all overflow-hidden cursor-text"
                class:line-through={t.completed} class:text-(--text-disabled)={t.completed} class:text-(--text-primary)={!t.completed}
                onclick={() => store.startEdit(t)} onkeydown={(e) => { if (e.key === 'Enter') store.startEdit(t) }} role="button" tabindex="0">
                {#each linkify(parseTag(t.text).text) as segment}
                  {#if segment.type === 'link'}
                    <a href={segment.value} target="_blank" rel="noopener noreferrer" class="underline text-(--interactive)">{segment.value}</a>
                  {:else}
                    {segment.value}
                  {/if}
                {/each}
              </span>
            {/if}
            <button onclick={() => store.removeTodo(t)}
              class="shrink-0 w-4 h-4 flex items-center justify-center rounded-sm text-(--text-disabled) hover:text-(--accent) transition-colors cursor-pointer bg-transparent border-none"
              aria-label="Delete">
              <X size={10} strokeWidth={1.5} />
            </button>
          </div>
        {/each}
        {#if colTodos.length === 0}
          <div class="text-center py-4 text-[10px] font-mono text-(--text-disabled) tracking-[0.04em]">[ EMPTY ]</div>
        {/if}
      </div>
    </div>
  {/each}
  {#if !store.s.filterTag && store.getCurrentTodos().some(t => !parseTag(t.text).tag)}
    {@const untagged = store.getCurrentTodos().filter(t => !parseTag(t.text).tag)}
    <div class="rounded-xl p-4 border bg-(--surface) border-(--border)">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-[10px] font-mono text-(--text-disabled) uppercase tracking-[0.06em]">UNTAGGED</span>
      </div>
      <div class="space-y-1">
        {#each untagged as t (t._id || t.text)}
          <div class="flex items-start gap-2 px-2 py-1.5 rounded-lg border transition-all bg-(--surface-raised) border-(--border)" class:opacity-50={t.completed}>
            <button onclick={() => store.toggleTodo(t)}
              class="mt-0.5 shrink-0 flex items-center justify-center w-4 h-4 rounded-sm border transition-all cursor-pointer border-(--border-visible) bg-transparent"
              aria-label="Toggle">
              {#if t.completed}
                <Check size={10} strokeWidth={1.5} class="text-(--text-display)" />
              {/if}
            </button>
            {#if store.s.editingId === t._id}
              <input type="text" bind:value={store.s.editingText}
                class="flex-1 text-xs px-1.5 py-1 rounded border outline-none bg-transparent text-inherit font-mono border-(--border-visible) min-w-0"
                onblur={() => store.saveEdit(t)}
                onkeydown={(e) => { if (e.key === 'Enter') store.saveEdit(t); if (e.key === 'Escape') store.cancelEdit() }} />
            {:else}
              <span class="text-xs flex-1 break-all overflow-hidden cursor-text"
                class:line-through={t.completed} class:text-(--text-disabled)={t.completed} class:text-(--text-primary)={!t.completed}
                onclick={() => store.startEdit(t)} onkeydown={(e) => { if (e.key === 'Enter') store.startEdit(t) }} role="button" tabindex="0">
                {#each linkify(t.text) as segment}
                  {#if segment.type === 'link'}
                    <a href={segment.value} target="_blank" rel="noopener noreferrer" class="underline text-(--interactive)">{segment.value}</a>
                  {:else}
                    {segment.value}
                  {/if}
                {/each}
              </span>
            {/if}
            <button onclick={() => store.removeTodo(t)}
              class="shrink-0 w-4 h-4 flex items-center justify-center rounded-sm text-(--text-disabled) hover:text-(--accent) transition-colors cursor-pointer bg-transparent border-none"
              aria-label="Delete">
              <X size={10} strokeWidth={1.5} />
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
