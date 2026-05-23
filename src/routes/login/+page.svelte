<script lang="ts">
  import { fade } from 'svelte/transition'
  import { onMount } from 'svelte'
  import { theme, toggleTheme, initTheme } from '$lib/stores/theme'
  import { browser } from '$app/environment'

  onMount(() => { initTheme(); fetchStatus() })

  let pinDigits = $state<string[]>([])
  let pinLength = $state(4)
  let locked = $state(false)
  let lockoutMinutes = $state(0)
  let attemptsLeft = $state(5)
  let error = $state('')
  let loading = $state(true)
  let filledIndexes = $state(new Set<number>())

  const fetchStatus = async () => {
    try {
      const r = await fetch('/api/pin-required')
      if (r.status >= 400) throw Error()
      const d = await r.json()
      if (!d.required && browser) { window.location.replace('/'); return }
      pinLength = d.length
      locked = d.locked
      attemptsLeft = d.attemptsLeft
      lockoutMinutes = d.lockoutMinutes
      pinDigits = new Array(d.length).fill('')
      loading = false
      if (d.locked) startLockoutTimer()
    } catch { loading = false; error = 'FAILED TO INITIALIZE' }
  }

  let lockoutTimer: ReturnType<typeof setInterval> | null = null

  const startLockoutTimer = () => {
    if (lockoutTimer) clearInterval(lockoutTimer)
    lockoutTimer = setInterval(async () => {
      try {
        const r = await fetch('/api/pin-required')
        const d = await r.json()
        lockoutMinutes = d.lockoutMinutes
        attemptsLeft = d.attemptsLeft
        if (!d.locked) {
          locked = false; error = ''
          if (lockoutTimer) clearInterval(lockoutTimer)
        }
      } catch { /* ignore */ }
    }, 10000)
  }

  const clearInputs = () => {
    for (let i = 0; i < pinLength; i++) {
      const el = document.getElementById(`pin-${i}`) as HTMLInputElement
      if (el) el.value = ''
    }
    const first = document.getElementById('pin-0') as HTMLInputElement
    first?.focus()
  }

  const submitPin = async () => {
    const pin = pinDigits.join('')
    if (pin.length !== pinLength) return
    try {
      const r = await fetch('/api/verify-pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) })
      const d = await r.json()
      if (d.valid && browser) { window.location.replace('/'); return }
      if (d.locked) { locked = true; lockoutMinutes = d.lockoutMinutes; error = `LOCKED ${d.lockoutMinutes}MIN`; startLockoutTimer(); return }
      error = d.error || 'INVALID PIN'
      attemptsLeft = d.attemptsLeft
      pinDigits = new Array(pinLength).fill(''); filledIndexes = new Set(); clearInputs()
    } catch { error = 'VERIFY FAILED'; pinDigits = new Array(pinLength).fill(''); filledIndexes = new Set(); clearInputs() }
  }

  const handleInput = (index: number, e: Event) => {
    const target = e.target as HTMLInputElement
    const v = target.value
    if (!/^\d$/.test(v)) { target.value = ''; return }
    pinDigits[index] = v; filledIndexes = new Set([...filledIndexes, index])
    if (index < pinLength - 1) {
      const next = document.getElementById(`pin-${index + 1}`) as HTMLInputElement
      next?.focus()
    }
    if (pinDigits.every(d => d !== '')) submitPin()
  }

  const handleKeydown = (index: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      const prev = document.getElementById(`pin-${index - 1}`) as HTMLInputElement
      prev?.focus(); prev?.select(); filledIndexes.delete(index - 1); filledIndexes = new Set(filledIndexes)
    }
    if (e.key === 'Enter' && pinDigits.every(d => d !== '')) submitPin()
  }

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData?.getData('text') || ''
    if (!/^\d+$/.test(text)) return
    const fi = new Set<number>()
    for (let i = 0; i < Math.min(text.length, pinLength); i++) {
      pinDigits[i] = text[i]
      const el = document.getElementById(`pin-${i}`) as HTMLInputElement
      if (el) el.value = text[i]; fi.add(i)
    }
    filledIndexes = fi
    const last = Math.min(text.length, pinLength) - 1
    const el = document.getElementById(`pin-${last}`) as HTMLInputElement
    el?.focus(); el?.select()
    if (pinDigits.every(d => d !== '')) submitPin()
  }
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-(--black) text-(--text-primary)">
  <div class="w-full max-w-sm" transition:fade={{ duration: 300 }}>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl md:text-3xl font-bold tracking-tight font-['Doto'] text-(--text-display)">{$theme === 'dark' ? 'DUMBDO' : 'DumbDo'}</h1>
      <button onclick={toggleTheme}
        class="w-9 h-9 flex items-center justify-center rounded-full border transition-colors border-(--border-visible) text-(--text-secondary) bg-transparent"
        aria-label="Toggle theme">
        {#if $theme === 'dark'}
          <svg viewBox="0 0 24 24" class="w-4 h-4 stroke-current fill-none stroke-[1.5]"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        {:else}
          <svg viewBox="0 0 24 24" class="w-4 h-4 stroke-current fill-none stroke-[1.5]"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        {/if}
      </button>
    </div>

      <div class="p-6 rounded-2xl border bg-(--surface) border-(--border-visible)" transition:fade={{ duration: 200 }}>
        {#if loading}
          <div class="flex items-center justify-center" style="height:148px">
            <span class="text-[11px] font-['Space_Mono'] text-(--text-disabled) tracking-[0.06em]">LOADING</span>
          </div>
        {:else if locked}
          <div class="text-center text-[10px] p-2.5 rounded-xl border font-['Space_Mono'] tracking-[0.04em] text-(--accent) bg-(--accent-subtle) border-(--accent)">
            TOO MANY ATTEMPTS. TRY AGAIN IN {lockoutMinutes} MIN.
          </div>
        {:else}
          <div class="text-[11px] mb-1 font-['Space_Mono'] tracking-[0.08em] uppercase text-(--text-secondary)">ENTER PIN</div>
          <p class="text-[13px] mb-5 text-(--text-disabled) font-['Space_Mono']">Enter your PIN to access your todos.</p>

          <div class="flex gap-1.5 justify-center mb-4" onpaste={handlePaste}>
            {#each Array(pinLength) as _, i (i)}
              <input type="password" id="pin-{i}" maxlength="1" inputmode="numeric" autocomplete="off"
                class="w-9 h-12 text-center text-base p-0 flex-none rounded-lg border outline-none transition-all font-['Space_Mono']"
                class:border-(--text-display)={filledIndexes.has(i)}
                class:bg-(--text-display)={filledIndexes.has(i)}
                class:text-(--black)={filledIndexes.has(i)}
                class:border-(--border-visible)={!filledIndexes.has(i)}
                class:bg-transparent={!filledIndexes.has(i)}
                oninput={(e) => handleInput(i, e)}
                onkeydown={(e) => handleKeydown(i, e)} />
            {/each}
          </div>

          {#if error}
            <div class="text-center text-[10px] font-['Space_Mono'] tracking-[0.04em] text-(--accent)" transition:fade={{ duration: 150 }}>{error}</div>
          {/if}
          {#if attemptsLeft < 5}
            <div class="text-center mt-1 text-[9px] font-['Space_Mono'] tracking-[0.04em] text-(--accent)">{attemptsLeft} ATTEMPT{attemptsLeft === 1 ? '' : 'S'} REMAINING</div>
          {/if}
        {/if}
      </div>
  </div>
</div>
