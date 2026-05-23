import { writable } from 'svelte/store'
import { browser } from '$app/environment'

const getInitialTheme = (): 'dark' | 'light' => {
  if (!browser) return 'dark'
  const stored = localStorage.getItem('theme') as 'dark' | 'light' | null
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const theme = writable<'dark' | 'light'>(getInitialTheme())

export const toggleTheme = () => {
  if (!browser) return
  theme.update(t => {
    const next = t === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    return next
  })
}

export const initTheme = () => {
  if (!browser) return
  const t = getInitialTheme()
  document.documentElement.setAttribute('data-theme', t)
  theme.set(t)
}
