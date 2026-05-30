<script lang="ts">
    import { fade } from "svelte/transition"
    import { onMount } from "svelte"
    import { theme, toggleTheme, initTheme } from "$lib/stores/theme"
    import { browser } from "$app/environment"
    import { Moon, Sun } from "lucide-svelte"

    onMount(() => { initTheme(); fetchStatus() })

    let pinDigits = $state<string[]>([])
    let pinLength = $state(4)
    let locked = $state(false)
    let lockoutMinutes = $state(0)
    let attemptsLeft = $state(5)
    let error = $state("")
    let loading = $state(true)

    const fetchStatus = async () => {
        try {
            const r = await fetch("/api/pin-required")
            if (r.status >= 400) throw Error()
            const d = await r.json()
            if (!d.required && browser) { window.location.replace("/"); return }
            pinLength = d.length
            locked = d.locked
            attemptsLeft = d.attemptsLeft
            lockoutMinutes = d.lockoutMinutes
            pinDigits = new Array(d.length).fill("")
            loading = false
            if (d.locked) startLockoutTimer()
        } catch {
            loading = false
            error = "FAILED TO INITIALIZE"
        }
    }

    let lockoutTimer: ReturnType<typeof setInterval> | null = null

    const startLockoutTimer = () => {
        if (lockoutTimer) clearInterval(lockoutTimer)
        lockoutTimer = setInterval(async () => {
            try {
                const r = await fetch("/api/pin-required")
                const d = await r.json()
                lockoutMinutes = d.lockoutMinutes
                attemptsLeft = d.attemptsLeft
                if (!d.locked) { locked = false; error = ""; if (lockoutTimer) clearInterval(lockoutTimer) }
            } catch { /* ignore */ }
        }, 10000)
    }

    const submitPin = async () => {
        const pin = pinDigits.join("")
        if (pin.length !== pinLength) return
        try {
            const r = await fetch("/api/verify-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin }),
            })
            const d = await r.json()
            if (d.valid && browser) { window.location.replace("/"); return }
            if (d.locked) {
                locked = true
                lockoutMinutes = d.lockoutMinutes
                error = `LOCKED ${d.lockoutMinutes}MIN`
                startLockoutTimer()
                return
            }
            error = d.error || "INVALID PIN"
            attemptsLeft = d.attemptsLeft
            pinDigits = new Array(pinLength).fill("")
            ;(document.getElementById("pin-0") as HTMLInputElement)?.focus()
        } catch {
            error = "VERIFY FAILED"
            pinDigits = new Array(pinLength).fill("")
            ;(document.getElementById("pin-0") as HTMLInputElement)?.focus()
        }
    }

    const handleInput = (index: number) => {
        if (!/^\d$/.test(pinDigits[index])) { pinDigits[index] = ""; return }
        if (index < pinLength - 1) (document.getElementById(`pin-${index + 1}`) as HTMLInputElement)?.focus()
        if (pinDigits.every(d => d !== "")) submitPin()
    }

    const handleKeydown = (index: number, e: KeyboardEvent) => {
        if (e.key === "Backspace") {
            const last = pinDigits.findLastIndex(d => d !== "")
            const targetIdx = last >= 0 ? last : Math.max(0, index - 1)
            pinDigits[targetIdx] = ""
            const el = document.getElementById(`pin-${targetIdx}`) as HTMLInputElement
            if (el) { el.focus(); el.select() }
        }
    }

    const handlePaste = (e: ClipboardEvent) => {
        e.preventDefault()
        const text = e.clipboardData?.getData("text") || ""
        if (!/^\d+$/.test(text)) return
        for (let i = 0; i < Math.min(text.length, pinLength); i++) pinDigits[i] = text[i]
        const last = Math.min(text.length, pinLength) - 1
        const el = document.getElementById(`pin-${last}`) as HTMLInputElement
        el?.focus(); el?.select()
        if (pinDigits.every(d => d !== "")) submitPin()
    }
</script>

<div
    class="min-h-screen flex items-center justify-center p-4 bg-(--black) text-(--text-primary)"
>
    <div class="w-full max-w-sm" transition:fade={{ duration: 300 }}>
        <div class="flex items-center justify-between mb-8">
            <h1
                class="text-2xl md:text-3xl font-bold tracking-tight font-['Doto'] text-(--text-display)"
            >
                {$theme === "dark" ? "DUMBDO" : "DumbDo"}
            </h1>
            <button
                onclick={toggleTheme}
                class="w-9 h-9 flex items-center justify-center rounded-full border transition-colors border-(--border-visible) text-(--text-secondary) bg-transparent"
                aria-label="Toggle theme"
            >
                {#if $theme === "dark"}
                    <Moon size={16} strokeWidth={1.5} />
                {:else}
                    <Sun size={16} strokeWidth={1.5} />
                {/if}
            </button>
        </div>

        <form
            onsubmit={(e) => { e.preventDefault(); if (!loading && !locked) submitPin() }}
        >
            <div
                class="p-6 rounded-2xl border bg-(--surface) border-(--border-visible)"
                transition:fade={{ duration: 200 }}
            >
                {#if loading}
                    <div class="flex items-center justify-center" style="height:148px">
                        <span
                            class="text-[11px] font-['Space_Mono'] text-(--text-disabled) tracking-[0.06em]"
                        >LOADING</span
                        >
                    </div>
                {:else if locked}
                    <div
                        class="text-center text-[10px] p-2.5 rounded-xl border font-['Space_Mono'] tracking-[0.04em] text-(--accent) bg-(--accent-subtle) border-(--accent)"
                    >
                        TOO MANY ATTEMPTS. TRY AGAIN IN {lockoutMinutes} MIN.
                    </div>
                {:else}
                    <div
                        class="text-[11px] mb-1 font-['Space_Mono'] tracking-[0.08em] uppercase text-(--text-secondary)"
                    >
                        ENTER PIN
                    </div>
                    <p class="text-[13px] mb-5 text-(--text-disabled) font-['Space_Mono']">
                        Enter your PIN to access your todos.
                    </p>

                    <div class="flex gap-1.5 justify-center mb-4" onpaste={handlePaste}>
                        {#each Array(pinLength) as _, i (i)}
                            <input
                                type="password"
                                id="pin-{i}"
                                maxlength="1"
                                inputmode="numeric"
                                autocomplete="off"
                                bind:value={pinDigits[i]}
                                class="w-9 h-12 text-center text-base p-0 flex-none rounded-lg border outline-none transition-all font-['Space_Mono']"
                                class:border-(--text-display)={pinDigits[i] !== ""}
                                class:bg-(--text-display)={pinDigits[i] !== ""}
                                class:text-(--black)={pinDigits[i] !== ""}
                                class:border-(--border-visible)={pinDigits[i] === ""}
                                class:bg-transparent={pinDigits[i] === ""}
                                oninput={() => handleInput(i)}
                                onkeydown={(e) => handleKeydown(i, e)}
                            />
                        {/each}
                    </div>

                    {#if error}
                        <div
                            class="text-center text-[10px] font-['Space_Mono'] tracking-[0.04em] text-(--accent)"
                            transition:fade={{ duration: 150 }}
                        >
                            {error}
                        </div>
                    {/if}
                    {#if !locked && attemptsLeft < 5 && attemptsLeft >= 0}
                        <div
                            class="text-center mt-1 text-[9px] font-['Space_Mono'] tracking-[0.04em] text-(--accent)"
                        >
                            {attemptsLeft} ATTEMPT{attemptsLeft === 1 ? "" : "S"} REMAINING
                        </div>
                    {/if}
                {/if}
            </div>
        </form>
    </div>
</div>
