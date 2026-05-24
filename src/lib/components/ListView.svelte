<script lang="ts">
  import * as store from '$lib/stores/todoStore.svelte'
  import { getTagColorClass, parseTag, linkify } from '$lib/utils/tag'
  import type { Todo } from '$lib/types/todo'
  import { Check, X, GripVertical } from 'lucide-svelte'

  let dragKey: string | null = $state(null)
  let dropIdx: number | null = $state(null)

  const dragStart = (e: DragEvent, todo: Todo) => {
    const key = todo._id?.toString() || todo.text
    dragKey = key
    dropIdx = null
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', key)
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  const dragOver = (e: DragEvent, idx: number, todo: Todo) => {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    const key = todo._id?.toString() || todo.text
    if (key !== dragKey) dropIdx = idx
  }

  const dragLeave = () => {
    dropIdx = null
  }

  const handleDrop = (e: DragEvent, dropAtIdx: number) => {
    e.preventDefault()
    const key = e.dataTransfer?.getData('text/plain') || dragKey
    if (!key) { dragKey = null; dropIdx = null; return }
    const list = store.s.todos[store.s.currentList]
    const active = store.getActiveTodos()
    const from = list.indexOf(active.find(t => (t._id?.toString() || t.text) === key)!)
    const to = list.indexOf(active[dropAtIdx])
    if (from === -1 || to === -1 || from === to) { dragKey = null; dropIdx = null; return }
    list.splice(from, 1)
    const adjustedTo = from < to ? to - 1 : to
    list.splice(adjustedTo, 0, active.find(t => (t._id?.toString() || t.text) === key)!)
    store.save()
    dragKey = null
    dropIdx = null
  }
</script>

{#if store.getActiveTodos().length === 0 && store.getDoneTodos().length === 0}
  <div class="text-center py-16 text-xs font-mono text-(--text-disabled) uppercase tracking-[0.06em]">[ EMPTY ]</div>
{:else}
  {#if store.getActiveTodos().length > 0}
    <div>
      {#each store.getActiveTodos() as t, i (t._id || t.text)}
        {@const { tag, starTags, text } = parseTag(t.text)}
        {@const tKey = t._id?.toString() || t.text}
        <div class="relative flex items-start gap-3 px-1 py-2 border-b transition-all border-(--border)" role="listitem"
          draggable="true"
          ondragstart={(e) => dragStart(e, t)}
          ondragend={() => { dragKey = null; dropIdx = null }}
          ondragover={(e) => dragOver(e, i, t)}
          ondragleave={dragLeave}
          ondrop={(e) => handleDrop(e, i)}
          class:ring-2={dragKey === tKey} class:ring-(--interactive)={dragKey === tKey}>
          {#if dropIdx === i}
            <div class="absolute -top-px left-0 right-0 h-0.5 rounded-full bg-(--interactive)"></div>
          {/if}
          <div class="mt-1 shrink-0 cursor-grab text-(--text-disabled) opacity-30 hover:opacity-100 transition-opacity">
            <GripVertical size={12} strokeWidth={1.5} />
          </div>
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
              {#if starTags.length > 0}
                <div class="flex items-center gap-0.5">
                  {#each starTags as s}
                    <span class="shrink-0 flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold text-white font-['Space_Mono'] {getTagColorClass(s)}">{s.slice(0, 2)}</span>
                  {/each}
                </div>
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
          {@const { tag, starTags, text } = parseTag(t.text)}
          <div class="flex items-start gap-3 px-1 py-2 border-b transition-all opacity-50 border-(--border)">
            <div class="mt-1 shrink-0 w-[12px]"></div>
            <button onclick={() => store.toggleTodo(t)}
              class="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-sm border transition-all cursor-pointer border-(--border-visible) bg-transparent">
              <Check size={12} strokeWidth={1.5} class="text-(--text-display)" />
            </button>
            <div class="flex-1 flex items-center gap-2 min-w-0">
              {#if tag}
                <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 text-white uppercase font-['Space_Mono'] tracking-[0.08em] {getTagColorClass(tag)}">{tag}</span>
              {/if}
              {#if starTags.length > 0}
                <div class="flex items-center gap-0.5">
                  {#each starTags as s}
                    <span class="shrink-0 flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold text-white font-['Space_Mono'] {getTagColorClass(s)}">{s.slice(0, 2)}</span>
                  {/each}
                </div>
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
