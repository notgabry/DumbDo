<script lang="ts">
  import * as store from '$lib/stores/todoStore.svelte'
  import { onMount } from 'svelte'
  import { Pencil, Trash2 } from 'lucide-svelte'
  import PageHeader from '$lib/components/PageHeader.svelte'
  import FilterBar from '$lib/components/FilterBar.svelte'
  import Toast from '$lib/components/Toast.svelte'
  import ListView from '$lib/components/ListView.svelte'
  import BoardView from '$lib/components/BoardView.svelte'
  import Modal from '$lib/components/Modal.svelte'

  let { data } = $props()
  ;(() => store.init(data.todos))()

  let ready = $state(false)
  onMount(() => {
    const v = document.documentElement.getAttribute('data-view-mode')
    if (v === 'list' || v === 'board') store.s.viewMode = v
    ready = true
  })

  let newTodoText = $state('')
  let modal: { type: 'confirm' | 'prompt'; title: string; message?: string; confirmText?: string; inputValue?: string } | null = $state(null)
  let modalResolve: ((value: any) => void) | null = $state(null)
  let statusMsg = $state('')
  let statusType = $state<'success' | 'error' | 'info'>('info')
  let statusTimer: ReturnType<typeof setTimeout> | null = null

  const show = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    statusMsg = msg; statusType = type
    if (statusTimer) clearTimeout(statusTimer)
    statusTimer = setTimeout(() => { statusMsg = '' }, 3000)
  }

  const addTodo = () => {
    let raw = newTodoText.trim()
    if (!raw) return
    store.addTodo(raw)
    newTodoText = ''
    show('ADDED', 'success')
  }

  const renameList = async () => {
    let name = await prompt({ title: 'RENAME LIST' })
    if (!name) return
    store.renameListTo(name)
    show('LIST RENAMED')
  }

  const deleteList = async () => {
    if (!await confirm({ title: 'DELETE LIST', message: `Delete "${store.s.currentList}" and all its tasks?`, confirmText: 'DELETE' })) return
    if (store.deleteCurrentList()) show('LIST DELETED')
    else show('CANNOT DELETE', 'error')
  }

  const confirm = (opts: { title: string; message: string; confirmText?: string }): Promise<boolean> =>
    new Promise(resolve => { modal = { type: 'confirm', ...opts }; modalResolve = resolve })

  const prompt = (opts: { title: string; defaultValue?: string }): Promise<string | null> =>
    new Promise(resolve => { modal = { type: 'prompt', ...opts, inputValue: opts.defaultValue || '' }; modalResolve = resolve })

  const closeModal = (result?: any) => {
    if (modalResolve) modalResolve(result ?? null)
    modal = null; modalResolve = null
  }
</script>

<div class="min-h-screen flex flex-col bg-(--black) text-(--text-primary)">
  {#if !ready}
    <div class="flex-1 flex items-center justify-center text-xs font-mono text-(--text-disabled) uppercase tracking-[0.06em]">LOADING</div>
  {:else}
    <PageHeader siteTitle={data.siteTitle} singleList={data.singleList}
      onRenameList={renameList} onDeleteList={deleteList}
      onToggleView={() => store.setViewMode(store.s.viewMode === 'list' ? 'board' : 'list')} />

    <main class="flex-1 w-full px-4 md:px-8 py-5">
      <div class="max-w-5xl mx-auto">
        <div class="flex gap-2 mb-4">
          <input type="text" bind:value={newTodoText} placeholder="TAG: description"
            class="flex-1 px-4 py-2.5 text-sm rounded-full border font-mono bg-(--surface) border-(--border-visible) text-(--text-primary) tracking-[0.02em]"
            onkeydown={(e) => { if (e.key === 'Enter') addTodo() }} />
          <button onclick={addTodo}
            class="h-9 px-5 text-sm rounded-full border-none text-nowrap cursor-pointer font-mono uppercase bg-(--text-display) text-(--black) tracking-[0.06em]">ADD</button>
          <button onclick={renameList}
            class="w-9 h-9 flex items-center justify-center rounded-full border shrink-0 cursor-pointer border-(--border-visible) text-(--text-secondary) bg-transparent"
            aria-label="Rename list">
            <Pencil size={14} strokeWidth={1.5} />
          </button>
          {#if store.getSortedLists().length > 1}
            <button onclick={deleteList}
              class="w-9 h-9 flex items-center justify-center rounded-full border shrink-0 cursor-pointer border-(--accent) text-(--accent) bg-transparent"
              aria-label="Delete list">
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          {/if}
        </div>

        <FilterBar tags={store.getAllTags()} activeTag={store.s.filterTag}
          onSelect={(tag: string | null) => store.setFilterTag(tag)} />

        <Toast message={statusMsg} type={statusType} />

        {#key store.s.viewMode}
          {#if store.s.viewMode === 'list'}
            <ListView />
          {:else}
            <BoardView />
          {/if}
        {/key}
      </div>
    </main>
  {/if}
</div>

<div class="hidden bg-red-500 bg-orange-500 bg-amber-500 bg-yellow-500 bg-lime-500 bg-green-500 bg-emerald-500 bg-teal-500 bg-cyan-500 bg-sky-500 bg-blue-500 bg-indigo-500 bg-violet-500 bg-purple-500 bg-fuchsia-500 bg-pink-500 bg-rose-500"></div>

<Modal {modal} onClose={closeModal} />
