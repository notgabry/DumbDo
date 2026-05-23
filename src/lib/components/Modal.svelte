<script lang="ts">
  import { fade, scale } from 'svelte/transition'

  let { modal, onClose }: {
    modal: { type: 'confirm' | 'prompt'; title: string; message?: string; confirmText?: string; inputValue?: string } | null
    onClose: (result?: any) => void
  } = $props()

  let inputValue = $state('')

  $effect(() => {
    if (modal?.type === 'prompt') inputValue = modal.inputValue ?? ''
  })
</script>

{#if modal}
  <div class="fixed inset-0 z-50 flex items-center justify-center cursor-pointer bg-black/60 backdrop-blur-[2px]"
    role="dialog" aria-modal="true" tabindex="-1"
    onclick={() => onClose()}
    onkeydown={(e) => { if (e.key === 'Escape') onClose() }}
    transition:fade={{ duration: 150 }}>
    <div class="w-[90%] max-w-sm p-6 rounded-2xl border cursor-default bg-(--surface) border-(--border-visible)"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="none"
      transition:scale={{ start: 0.95, duration: 200 }}>
      {#if modal.type === 'confirm'}
        <div class="text-[11px] mb-2 font-mono uppercase tracking-[0.08em] text-(--text-secondary)">{modal.title}</div>
        <p class="text-sm mb-5 leading-relaxed text-(--text-primary)">{modal.message}</p>
        <div class="flex gap-2 justify-end">
          <button class="px-4 py-2 text-[10px] rounded-full border transition-all cursor-pointer font-mono font-bold uppercase bg-transparent border-(--border-visible) text-(--text-primary)"
            onclick={(e) => { e.stopPropagation(); onClose(false) }}>[ CANCEL ]</button>
          <button class="px-4 py-2 text-[10px] rounded-full border transition-all cursor-pointer font-mono font-bold uppercase bg-(--accent) border-(--accent) text-white"
            onclick={(e) => { e.stopPropagation(); onClose(true) }}>[ {modal.confirmText || 'CONFIRM'} ]</button>
        </div>
      {:else}
        <div class="text-[11px] mb-3 font-mono uppercase tracking-[0.08em] text-(--text-secondary)">{modal.title}</div>
        <input type="text" bind:value={inputValue}
          class="w-full px-3 py-2.5 mb-4 text-sm rounded-full border outline-none font-mono bg-(--surface-raised) text-(--text-primary) border-(--border-visible)"
          onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onClose(inputValue.trim() || null) }; if (e.key === 'Escape') onClose(null) }} />
        <div class="flex gap-2 justify-end">
          <button class="px-4 py-2 text-[10px] rounded-full border transition-all cursor-pointer font-mono font-bold uppercase bg-transparent border-(--border-visible) text-(--text-primary)"
            onclick={(e) => { e.stopPropagation(); onClose(null) }}>[ CANCEL ]</button>
          <button class="px-4 py-2 text-[10px] rounded-full border transition-all cursor-pointer font-mono font-bold uppercase bg-(--accent) border-(--accent) text-white"
            onclick={(e) => { e.stopPropagation(); onClose(inputValue.trim() || null) }}>[ OK ]</button>
        </div>
      {/if}
    </div>
  </div>
{/if}
