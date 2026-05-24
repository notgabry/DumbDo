<script lang="ts">
  import * as store from '$lib/stores/todoStore.svelte'
  import { getTagColorClass, parseTag, linkify } from '$lib/utils/tag'
  import type { Todo } from '$lib/types/todo'
  import { Check, X, GripVertical } from 'lucide-svelte'

  let colOrder = $state<string[]>([])
  let dragCol: string | null = $state(null)
  let dragItemKey: string | null = $state(null)
  let colDropTarget: string | null = $state(null)
  let itemDropTarget: { col: string; idx: number } | null = $state(null)

  let prevTags = ''
  let synced = false
  $effect(() => {
    const tags = store.getBoardTags()
    const key = tags.join(',')
    if (key === prevTags) return
    prevTags = key
    if (colOrder.length === 0) {
      const persisted = store.getBoardColumnOrder()
      if (persisted && persisted.length > 0) {
        colOrder = persisted.filter(t => tags.includes(t))
        for (const t of tags) {
          if (!colOrder.includes(t)) colOrder.push(t)
        }
        synced = false
        return
      }
    }
    const existing = new Set(colOrder)
    const added = tags.filter(t => !existing.has(t))
    const removed = colOrder.filter(t => !tags.includes(t))
    if (added.length === 0 && removed.length === 0) {
      synced = true
      return
    }
    if (colOrder.length === 0) {
      colOrder = [...tags]
    } else {
      for (const t of added) colOrder.push(t)
      colOrder = colOrder.filter(t => tags.includes(t))
    }
    synced = true
    store.setBoardColumnOrder(colOrder)
  })

  const getColTag = (t: Todo): string | null => parseTag(t.text).tag

  const colDragStart = (e: DragEvent, col: string) => {
    dragCol = col
    colDropTarget = null
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', col)
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  const colDragOver = (e: DragEvent, col: string) => {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    if (dragCol && dragCol !== col) colDropTarget = col
  }

  const colDragLeave = (col: string) => {
    if (colDropTarget === col) colDropTarget = null
  }

  const colDrop = (e: DragEvent, col: string) => {
    e.preventDefault()
    const dragged = e.dataTransfer?.getData('text/plain') || dragCol
    if (!dragged || dragged === col) { dragCol = null; colDropTarget = null; return }
    const from = colOrder.indexOf(dragged)
    const to = colOrder.indexOf(col)
    if (from === -1 || to === -1) { dragCol = null; colDropTarget = null; return }
    colOrder.splice(from, 1)
    colOrder.splice(from < to ? to - 1 : to, 0, dragged)
    dragCol = null
    colDropTarget = null
    store.setBoardColumnOrder(colOrder)
  }

  const itemDragStart = (e: DragEvent, colTag: string, todo: Todo) => {
    const key = todo._id?.toString() || todo.text
    dragItemKey = key
    dragCol = colTag
    itemDropTarget = null
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', JSON.stringify({ colTag, key }))
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  const itemDragOver = (e: DragEvent, colTag: string, idx: number, todo: Todo) => {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    if (!dragItemKey || dragCol !== colTag) return
    const key = todo._id?.toString() || todo.text
    if (key !== dragItemKey) itemDropTarget = { col: colTag, idx }
  }

  const itemDragLeave = () => {
    itemDropTarget = null
  }

  const itemDrop = (e: DragEvent, colTag: string, dropIdx: number) => {
    e.preventDefault()
    let key = dragItemKey
    try {
      const data = e.dataTransfer ? JSON.parse(e.dataTransfer.getData('text/plain')) : null
      if (data?.key) key = data.key
    } catch {}
    if (!key || dragCol !== colTag) { dragItemKey = null; itemDropTarget = null; return }
    const items = store.getCurrentTodos().filter(t => getColTag(t) === colTag)
    const todo = items.find(t => (t._id?.toString() || t.text) === key)
    if (!todo) { dragItemKey = null; itemDropTarget = null; return }
    const list = store.s.todos[store.s.currentList]
    const from = list.indexOf(todo)
    const targetTodo = dropIdx >= 0 ? items[dropIdx] : null
    const to = targetTodo ? list.indexOf(targetTodo) : list.length
    if (from === -1 || to === -1) { dragItemKey = null; itemDropTarget = null; return }
    if (from === to) { dragItemKey = null; itemDropTarget = null; return }
    list.splice(from, 1)
    const adjustedTo = from < to ? to - 1 : to
    list.splice(adjustedTo, 0, todo)
    store.save()
    dragItemKey = null
    itemDropTarget = null
  }

  const containerDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  }
</script>

<div class="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))] items-start" role="none" ondragover={containerDragOver}>
  {#each colOrder as colTag}
    {@const colTodos = store.getCurrentTodos().filter(t => getColTag(t) === colTag)}
    <div class="rounded-xl p-4 border bg-(--surface) border-(--border) transition-all" role="none"
      class:ring-2={colDropTarget === colTag} class:ring-(--interactive)={colDropTarget === colTag}
      ondragover={(e) => colDragOver(e, colTag)}
      ondragleave={() => colDragLeave(colTag)}
      ondrop={(e) => colDrop(e, colTag)}>
      <div class="flex items-center gap-2 mb-3" role="button" tabindex="0" draggable="true"
        ondragstart={(e) => colDragStart(e, colTag)}
        ondragend={() => { dragCol = null; colDropTarget = null }}>
        <div class="shrink-0 cursor-grab text-(--text-disabled) opacity-30 hover:opacity-100 transition-opacity">
          <GripVertical size={12} strokeWidth={1.5} />
        </div>
        <span class="text-[9px] px-2 py-0.5 rounded-full font-bold text-white uppercase font-['Space_Mono'] tracking-[0.08em] {getTagColorClass(colTag)}">{colTag}</span>
        <span class="text-[10px] font-mono text-(--text-disabled) tracking-[0.04em]">{colTodos.length}</span>
      </div>
      <div class="space-y-1">
        {#each colTodos as t, i (t._id || t.text)}
          {@const { tag: tTag, starTags: tStars, text: tText } = parseTag(t.text)}
          {@const tKey = t._id?.toString() || t.text}
          <div class="relative flex items-start gap-2 px-2 py-1.5 rounded-lg border transition-all bg-(--surface-raised) border-(--border)" role="listitem" class:opacity-50={t.completed}
            draggable="true"
            ondragstart={(e) => itemDragStart(e, colTag, t)}
            ondragend={() => { dragItemKey = null; itemDropTarget = null }}
            ondragover={(e) => itemDragOver(e, colTag, i, t)}
            ondragleave={itemDragLeave}
            ondrop={(e) => itemDrop(e, colTag, i)}
            class:ring-2={dragItemKey === tKey} class:ring-(--interactive)={dragItemKey === tKey}>
            {#if itemDropTarget && itemDropTarget.col === colTag && itemDropTarget.idx === i}
              <div class="absolute -top-1 left-0 right-0 h-0.5 rounded-full bg-(--interactive)"></div>
            {/if}
            <div class="mt-0.5 shrink-0 cursor-grab text-(--text-disabled) opacity-40 hover:opacity-100 transition-opacity">
              <GripVertical size={10} strokeWidth={1.5} />
            </div>
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
                {#each tStars as s}
                  <span class="inline-flex items-center justify-center w-4 h-4 rounded text-[7px] font-bold text-white font-['Space_Mono'] align-middle mr-1 {getTagColorClass(s)}">{s.slice(0, 2)}</span>
                {/each}
                {#each linkify(tText) as segment}
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
  {#if !store.s.filterTag}
    {@const untagged = store.getCurrentTodos().filter(t => !getColTag(t))}
    {#if untagged.length > 0}
      <div class="rounded-xl p-4 border bg-(--surface) border-(--border)">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-[10px] font-mono text-(--text-disabled) uppercase tracking-[0.06em]">UNTAGGED</span>
        </div>
        <div class="space-y-1">
          {#each untagged as t (t._id || t.text)}
            {@const { starTags: tStars, text: tText } = parseTag(t.text)}
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
                  {#each tStars as s}
                    <span class="inline-flex items-center justify-center w-4 h-4 rounded text-[7px] font-bold text-white font-['Space_Mono'] align-middle mr-1 {getTagColorClass(s)}">{s.slice(0, 2)}</span>
                  {/each}
                  {#each linkify(tText) as segment}
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
  {/if}
</div>
