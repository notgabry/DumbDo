<script lang="ts">
  import * as store from '$lib/stores/todoStore.svelte'
  import { theme, toggleTheme } from '$lib/stores/theme'
  import { Moon, Sun, Plus, LogOut } from 'lucide-svelte'

  let { siteTitle, singleList, onRenameList, onDeleteList, onToggleView }: {
    siteTitle: string
    singleList: boolean
    onRenameList: () => void
    onDeleteList: () => void
    onToggleView: () => void
  } = $props()

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    window.location.href = '/login'
  }
</script>

<header class="sticky top-0 z-40 border-b backdrop-blur-md bg-(--black)/85 border-(--border)">
  <div class="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
    <div class="flex items-center gap-3 min-w-0">
      <h1 class="text-xl md:text-2xl font-bold tracking-tight shrink-0 font-['Doto'] text-(--text-display)">
        {$theme === 'dark' ? siteTitle.toUpperCase() : siteTitle}
      </h1>

      {#if !singleList && store.getSortedLists().length > 0}
        <div class="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {#each store.getSortedLists() as list}
            <button onclick={() => store.switchList(list)}
              class="px-2.5 py-1 text-[10px] rounded-full border text-nowrap transition-all cursor-pointer font-mono uppercase tracking-[0.06em]"
              class:bg-(--text-display)={list === store.s.currentList}
              class:border-(--text-display)={list === store.s.currentList}
              class:text-(--black)={list === store.s.currentList}
              class:border-(--border-visible)={list !== store.s.currentList}
              class:text-(--text-secondary)={list !== store.s.currentList}
              class:bg-transparent={list !== store.s.currentList}>
              {list.toUpperCase()}
            </button>
          {/each}
        </div>
        <button onclick={store.addList}
          class="w-6 h-6 flex items-center justify-center rounded-full border shrink-0 cursor-pointer border-(--border-visible) text-(--text-secondary) bg-transparent"
          aria-label="Add list">
          <Plus size={10} strokeWidth={2} />
        </button>
      {/if}
    </div>

    <nav class="flex items-center gap-2 shrink-0">
      {#if store.getHasTags()}
        <button onclick={onToggleView}
          class="px-2.5 py-1 text-[10px] rounded-full border transition-all cursor-pointer font-mono uppercase border-(--border-visible) text-(--text-secondary) bg-transparent tracking-[0.06em]">
          {store.s.viewMode === 'list' ? 'BOARD' : 'LIST'}
        </button>
      {/if}
      <button onclick={logout}
        class="w-8 h-8 flex items-center justify-center rounded-full border transition-colors cursor-pointer border-(--border-visible) text-(--text-secondary) bg-transparent"
        aria-label="Logout">
        <LogOut size={14} strokeWidth={1.5} />
      </button>
      <button onclick={toggleTheme}
        class="w-8 h-8 flex items-center justify-center rounded-full border transition-colors cursor-pointer border-(--border-visible) text-(--text-secondary) bg-transparent"
        aria-label="Toggle theme">
        {#if $theme === 'dark'}
          <Moon size={14} strokeWidth={1.5} />
        {:else}
          <Sun size={14} strokeWidth={1.5} />
        {/if}
      </button>
    </nav>
  </div>
</header>
