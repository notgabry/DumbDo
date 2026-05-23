<script lang="ts">
  import { fly } from 'svelte/transition'
  import { CircleCheck, CircleX, Info, X } from 'lucide-svelte'

  let { message = '', type = 'info', duration = 3000, onDismiss }: {
    message?: string
    type?: 'success' | 'error' | 'info'
    duration?: number
    onDismiss?: () => void
  } = $props()

  let visible = $state(false)
  let progress = $state(100)
  let timer: ReturnType<typeof setTimeout>
  let raf: number

  const icons = { success: CircleCheck, error: CircleX, info: Info }
  const Icon = $derived(icons[type])

  const dismiss = () => {
    visible = false
    cancelAnimationFrame(raf)
    clearTimeout(timer)
    onDismiss?.()
  }

  $effect(() => {
    if (!message) {
      visible = false
      return
    }
    visible = true
    progress = 100
    clearTimeout(timer)
    cancelAnimationFrame(raf)
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      progress = Math.max(0, 100 - (elapsed / duration) * 100)
      if (progress > 0) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    timer = setTimeout(dismiss, duration)
    return () => { clearTimeout(timer); cancelAnimationFrame(raf) }
  })
</script>

{#if visible}
  {#key message}
    <div class="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)]"
      transition:fly={{ x: 32, duration: 250 }}>
      <div class="relative overflow-hidden rounded-xl border font-mono text-xs tracking-[0.04em] shadow-lg backdrop-blur-md"
        class:border-(--success)={type === 'success'}
        class:border-(--accent)={type === 'error'}
        class:border-(--border-visible)={type === 'info'}
        class:text-(--success)={type === 'success'}
        class:text-(--accent)={type === 'error'}
        class:text-(--text-secondary)={type === 'info'}
        style="background:{type === 'success' ? 'rgba(74,158,92,0.08)' : type === 'error' ? 'rgba(215,25,33,0.08)' : 'var(--surface)'}">
        <div class="flex items-start gap-3 px-4 py-3.5">
          <div class="shrink-0 mt-0.5">
            <Icon size={14} strokeWidth={2} />
          </div>
          <span class="flex-1 leading-relaxed">{message}</span>
          <button onclick={dismiss}
            class="shrink-0 flex items-center justify-center w-5 h-5 rounded-full transition-colors cursor-pointer hover:bg-(--black)/10 text-current opacity-40 hover:opacity-100"
            aria-label="Dismiss">
            <X size={12} strokeWidth={2} />
          </button>
        </div>
        <div class="h-0.5 bg-current opacity-25 transition-none" style="width:{progress}%"></div>
      </div>
    </div>
  {/key}
{/if}
