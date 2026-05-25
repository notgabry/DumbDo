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
  let colOrderBackup: string[] = []
  $effect(() => {
    const tags = store.getBoardTags()
    const key = tags.join(',')
    if (key === prevTags) return
    prevTags = key
    // when entering filter mode, save order and restrict columns
    if (store.s.filterTag) {
      if (colOrder.length > 0 && colOrderBackup.length === 0) {
        colOrderBackup = [...colOrder]
      }
      colOrder = tags
      return
    }
    // when leaving filter mode, restore backup + new tags
    if (colOrderBackup.length > 0) {
      const missing = tags.filter(t => !colOrderBackup.includes(t))
      colOrder = [...colOrderBackup.filter(t => tags.includes(t)), ...missing]
      colOrderBackup = []
      return
    }
    if (colOrder.length === 0) {
      const persisted = store.getBoardColumnOrder()
      if (persisted && persisted.length > 0) {
        colOrder = persisted.filter(t => tags.includes(t))
        for (const t of tags) {
          if (!colOrder.includes(t)) colOrder.push(t)
        }
        return
      }
    }
    const existing = new Set(colOrder)
    const added = tags.filter(t => !existing.has(t))
    const removed = colOrder.filter(t => !tags.includes(t))
    if (added.length === 0 && removed.length === 0) return
    if (colOrder.length === 0) {
      colOrder = [...tags]
    } else {
      for (const t of added) colOrder.push(t)
      colOrder = colOrder.filter(t => tags.includes(t))
    }
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
    if (!dragItemKey) return
    const key = todo._id?.toString() || todo.text
    if (key !== dragItemKey) itemDropTarget = { col: colTag, idx }
  }

  const itemDragLeave = () => {
    itemDropTarget = null
  }

  const updateTodoTag = (todo: Todo, newTag: string) => {
    const { starTags, text } = parseTag(todo.text)
    const stars = starTags.length > 0 ? ' *' + starTags.join(' *') : ''
    todo.text = `${newTag}: ${text}${stars}`
  }

  const itemDrop = (e: DragEvent, colTag: string, dropIdx: number) => {
    e.preventDefault()
    let key = dragItemKey
    try {
      const data = e.dataTransfer ? JSON.parse(e.dataTransfer.getData('text/plain')) : null
      if (data?.key) key = data.key
    } catch {}
    if (!key) { dragItemKey = null; itemDropTarget = null; return }
    const list = store.s.todos[store.s.currentList]
    const todo = list.find(t => (t._id?.toString() || t.text) === key)
    if (!todo) { dragItemKey = null; itemDropTarget = null; return }
    // cross-column — change tag
    if (dragCol !== colTag) updateTodoTag(todo, colTag)
    const items = store.getCurrentTodos().filter(t => getColTag(t) === colTag)
    const from = list.indexOf(todo)
    const targetTodo = dropIdx >= 0 ? items[dropIdx] : null
    const to = targetTodo ? list.indexOf(targetTodo) : list.length
    if (from === -1 || to === -1) { dragItemKey = null; itemDropTarget = null; store.save(); return }
    if (from !== to) {
      list.splice(from, 1)
      const adjustedTo = from < to ? to - 1 : to
      list.splice(adjustedTo, 0, todo)
    }
    store.save()
    dragItemKey = null
    itemDropTarget = null
  }

  const containerDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  }

  const colFromPoint = (x: number, y: number): string | null => {
    const cols = document.querySelectorAll<HTMLElement>('[data-col]')
    for (const c of cols) {
      const r = c.getBoundingClientRect()
      if (x >= r.left && x < r.right && y >= r.top && y < r.bottom) {
        return c.getAttribute('data-col')
      }
    }
    return null
  }

  // --- Touch DnD for items ---
  let touchItem: { key: string; colTag: string } | null = null

  let touchItemGrip: HTMLElement | null = null

  const onItemTouchStart = (e: TouchEvent, colTag: string, todo: Todo) => {
    e.preventDefault()
    const key = todo._id?.toString() || todo.text
    touchItem = { key, colTag }
    dragItemKey = key
    dragCol = colTag
    itemDropTarget = null
    const grip = e.currentTarget as HTMLElement
    grip.draggable = false
    touchItemGrip = grip
    document.addEventListener('touchmove', onItemTouchMove, { passive: false })
    document.addEventListener('touchend', onItemTouchEnd, { passive: false })
  }

  const onItemTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    if (!touchItem) return
    const touch = e.touches[0]
    const colTag = colFromPoint(touch.clientX, touch.clientY)
    if (!colTag) { itemDropTarget = null; return }
    const colEl = document.querySelector<HTMLElement>(`[data-col="${colTag}"]`)
    if (!colEl) { itemDropTarget = null; return }
    const itemEls = [...colEl.querySelectorAll<HTMLElement>('[data-key]')]
    let dropIdx = itemEls.length
    for (let i = 0; i < itemEls.length; i++) {
      const r = itemEls[i].getBoundingClientRect()
      const midY = r.top + r.height / 2
      if (touch.clientY < midY) { dropIdx = i; break }
    }
    itemDropTarget = { col: colTag, idx: dropIdx }
  }

  const onItemTouchEnd = (e: TouchEvent) => {
    document.removeEventListener('touchmove', onItemTouchMove)
    document.removeEventListener('touchend', onItemTouchEnd)
    if (!touchItem) { touchItem = null; dragItemKey = null; itemDropTarget = null; return }
    const ti = touchItem
    const touch = e.changedTouches[0]
    const colTag = colFromPoint(touch.clientX, touch.clientY)
    let targetCol = ti.colTag
    let targetIdx = -1
    if (colTag) targetCol = colTag
    const colEl = document.querySelector<HTMLElement>(`[data-col="${targetCol}"]`)
    if (colEl) {
      const itemEls = [...colEl.querySelectorAll<HTMLElement>('[data-key]')]
      targetIdx = itemEls.length
      for (let i = 0; i < itemEls.length; i++) {
        const key = itemEls[i].getAttribute('data-key')
        if (key === ti.key) continue
        const r = itemEls[i].getBoundingClientRect()
        const midY = r.top + r.height / 2
        if (touch.clientY < midY) { targetIdx = i; break }
      }
    }
    const list = store.s.todos[store.s.currentList]
    const todo = list.find(t => (t._id?.toString() || t.text) === ti.key)
    if (todo) {
      if (ti.colTag !== targetCol && targetCol) updateTodoTag(todo, targetCol)
      const colItems = store.getCurrentTodos().filter(t => getColTag(t) === targetCol)
      const from = list.indexOf(todo)
      const targetTodo = targetIdx >= 0 && targetIdx < colItems.length ? colItems[targetIdx] : null
      const to = targetTodo ? list.indexOf(targetTodo) : list.length
      if (from >= 0 && to >= 0 && from !== to) {
        list.splice(from, 1)
        list.splice(from < to ? to - 1 : to, 0, todo)
      }
      store.save()
    }
    if (touchItemGrip) touchItemGrip.draggable = true
    touchItemGrip = null
    touchItem = null
    dragItemKey = null
    itemDropTarget = null
  }

  // --- Touch DnD for columns ---
  let touchCol: string | null = null
  let touchColHeader: HTMLElement | null = null

  const onColTouchStart = (e: TouchEvent, col: string) => {
    e.preventDefault()
    touchCol = col
    dragCol = col
    colDropTarget = null
    const header = e.currentTarget as HTMLElement
    header.draggable = false
    touchColHeader = header
    document.addEventListener('touchmove', onColTouchMove, { passive: false })
    document.addEventListener('touchend', onColTouchEnd, { passive: false })
  }

  const onColTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    if (!touchCol) return
    const touch = e.touches[0]
    const colTag = colFromPoint(touch.clientX, touch.clientY)
    if (colTag && colTag !== touchCol) {
      colDropTarget = colTag
    } else {
      colDropTarget = null
    }
  }

  const onColTouchEnd = (e: TouchEvent) => {
    document.removeEventListener('touchmove', onColTouchMove)
    document.removeEventListener('touchend', onColTouchEnd)
    if (touchColHeader) touchColHeader.draggable = true
    touchColHeader = null
    if (!touchCol) { touchCol = null; dragCol = null; colDropTarget = null; return }
    const touch = e.changedTouches[0]
    const targetCol = colFromPoint(touch.clientX, touch.clientY)
    if (targetCol && targetCol !== touchCol && colOrder.includes(touchCol) && colOrder.includes(targetCol)) {
      const from = colOrder.indexOf(touchCol)
      const to = colOrder.indexOf(targetCol)
      colOrder.splice(from, 1)
      colOrder.splice(from < to ? to - 1 : to, 0, touchCol)
      store.setBoardColumnOrder(colOrder)
    }
    touchCol = null
    dragCol = null
    colDropTarget = null
  }
</script>

<div class="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))] items-start" role="none" ondragover={containerDragOver}>
  {#each colOrder as colTag}
    {@const colTodos = store.getCurrentTodos().filter(t => getColTag(t) === colTag)}
    <div class="rounded-xl p-4 border bg-(--surface) border-(--border) transition-all" role="none" data-col={colTag}
      class:ring-2={colDropTarget === colTag} class:ring-(--interactive)={colDropTarget === colTag}
      ondragover={(e) => colDragOver(e, colTag)}
      ondragleave={() => colDragLeave(colTag)}
      ondrop={(e) => colDrop(e, colTag)}>
      <div class="flex items-center gap-2 mb-3 select-none" role="button" tabindex="0" draggable="true"
        ondragstart={(e) => colDragStart(e, colTag)}
        ondragend={() => { dragCol = null; colDropTarget = null }}
        ontouchstart={(e) => onColTouchStart(e, colTag)}>
        <div class="shrink-0 cursor-grab text-(--text-disabled) opacity-30 hover:opacity-100 transition-opacity" role="none">
          <GripVertical size={12} strokeWidth={1.5} />
        </div>
        <span class="text-[9px] px-2 py-0.5 rounded-full font-bold text-white uppercase font-['Space_Mono'] tracking-[0.08em] {getTagColorClass(colTag)}">{colTag}</span>
        <span class="text-[10px] font-mono text-(--text-disabled) tracking-[0.04em]">{colTodos.length}</span>
      </div>
      <div class="space-y-1">
        {#each colTodos as t, i (t._id || t.text)}
          {@const { tag: tTag, starTags: tStars, text: tText } = parseTag(t.text)}
          {@const tKey = t._id?.toString() || t.text}
          <div class="relative flex items-start gap-2 px-2 py-1.5 rounded-lg border transition-all bg-(--surface-raised) border-(--border)" role="listitem" data-key={tKey} class:opacity-50={t.completed}
            ondragend={() => { dragItemKey = null; itemDropTarget = null }}
            ondragover={(e) => itemDragOver(e, colTag, i, t)}
            ondragleave={itemDragLeave}
            ondrop={(e) => itemDrop(e, colTag, i)}
            class:ring-2={dragItemKey === tKey} class:ring-(--interactive)={dragItemKey === tKey}>
            {#if itemDropTarget && itemDropTarget.col === colTag && itemDropTarget.idx === i}
              <div class="absolute -top-1 left-0 right-0 h-0.5 rounded-full bg-(--interactive)"></div>
            {/if}
            <div class="mt-0.5 shrink-0 cursor-grab text-(--text-disabled) opacity-40 hover:opacity-100 transition-opacity select-none" role="none" draggable="true" ondragstart={(e) => itemDragStart(e, colTag, t)} ontouchstart={(e) => onItemTouchStart(e, colTag, t)}>
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
