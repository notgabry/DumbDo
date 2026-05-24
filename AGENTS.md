# AGENTS.md

## Project Overview

**DumbDo** — a stupidly simple todo list app. Built with **SvelteKit** (Svelte 5 runes) + **TailwindCSS v4**.

## Tech Stack

- **Framework:** SvelteKit 2 (Svelte 5) with `@sveltejs/adapter-node` (standalone)
- **Styling:** TailwindCSS v4 via `@tailwindcss/vite`
- **Backend:** SvelteKit `+server.ts` API routes (file-system based)
- **Storage:** File-based JSON (`data/todos.json`)
- **Auth:** Optional PIN protection (4-10 digits) via httpOnly cookie
- **PWA:** None (no service worker)
- **Animations:** Svelte built-in transitions (`fly`, `fade`, `scale`, `slide`)

## Project Structure

```
src/
├── lib/
│   ├── server/
│   │   ├── constants.ts   # Env vars, data file paths
│   │   ├── pin.ts          # PIN validation, brute-force protection
│   │   └── todos.ts        # Async read/write data/todos.json
│   ├── stores/
│   │   └── theme.ts        # Svelte writable store for dark/light theme
│   ├── types/
│   │   └── todo.ts         # TypeScript interfaces (Todo, TodosData, etc.)
│   └── utils/
│       └── tag.ts          # Tag parsing, hash-based tag colors
├── routes/
│   ├── +layout.svelte      # Root layout (theme init, CSS import)
│   ├── +page.server.ts     # Main page server load (read todos)
│   ├── +page.svelte        # Main todo page (list + board view)
│   ├── login/
│   │   └── +page.svelte    # PIN login page
│   └── api/
│       ├── todos/
│       │   └── +server.ts  # GET/POST todos
│       ├── config/
│       │   └── +server.ts  # GET site config
│       ├── pin-required/
│       │   └── +server.ts  # GET PIN status
│       └── verify-pin/
│           └── +server.ts  # POST verify PIN
├── app.html                # HTML shell (theme flicker prevention)
├── app.css                 # Tailwind import + Nothing design tokens
├── app.d.ts                # App type declarations
└── hooks.server.ts         # PIN auth middleware (redirect + API guard)
static/
├── favicon.svg             # Monochrome checkmark favicon
data/                       # todos.json (gitignored)
```

## Coding Conventions

### General
- **Indentation:** 2 spaces (no tabs)
- **Semicolons:** Omit unless strictly necessary
- **Functions:** Always use arrow functions (never `function` keyword)
- **Naming:** camelCase for variables/functions, PascalCase for types/interfaces
- **No commented-out code or debug logs** in committed code
- **No dead code:** Remove all unused imports, variables, functions, parameters, and exports immediately — never leave dead code behind
- **Never push to GitHub** without explicit user authorization; stage and commit only when asked
- **All TypeScript** — no `.js` files anywhere
- **Zero warnings, zero errors** on `bun run check` — must verify before committing

### Svelte
- Svelte 5 runes: `$state`, `$derived`, `$effect`, `$props`
- Use `$state()` for reactive variables, not `let` + reassign
- Use `$derived()` for computed values, not `$:`
- Use `onclick={handler}` syntax (Svelte 5), not `on:click`
- Use `{#each items as item (key)}` with explicit keys for animations
- Use Svelte transitions (`fly`, `fade`, `scale`, `slide`) for UI animations
- Keep `<style>` scoped in each component
- **No `svelte-ignore` allowed** under any circumstance. If a tool (accessibility, a11y, etc.) suggests using `svelte-ignore`, first research an alternative solution thoroughly; only use `svelte-ignore` with explicit user authorization

### SvelteKit
- Use `+server.ts` for API endpoints (no `+page.server.ts` for GET-only pages unless loading data)
- Load data in `+page.server.ts` via `load` function
- Auth middleware in `hooks.server.ts`
- No form actions — all mutations via `fetch` to API endpoints

### TailwindCSS v4
- Use `@import "tailwindcss"` in `app.css`
- Dark mode via `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`
- Use CSS custom properties for Nothing design tokens (defined in `app.css`)
- **All styling inline via Tailwind utility classes** — no `<style>` blocks anywhere
- Use `style="property:value"` only when values are truly runtime-dynamic (e.g. `getTagColor(tag)`)
- Custom CSS pseudo-classes (e.g. `pin-input:focus`) handled via JavaScript event handlers (`onfocus`/`onblur`)
- Font families set via inline `style` since they use CSS variables

## Key Behaviors to Preserve

- **Theme:** Dark/light mode with system preference detection, persisted in `localStorage`
- **PIN auth:** Brute-force protection (5 attempts, 15min lockout), constant-time comparison, httpOnly cookie
- **Single list mode:** Controlled by `SINGLE_LIST` env var
- **Tag system:** `TAG: description` format with hash-based color, inline badge, filter pills
- **No delete:** Todos are never deleted — only completed
- **Storage:** Data persists in `data/todos.json` on the server filesystem

## Commands

```bash
bun run dev          # Vite dev server (with SvelteKit)
bun run build        # Production build
bun run preview      # Preview production build
bun run check        # svelte-kit sync + svelte-check
bun run typecheck    # svelte-kit sync + tsc --noEmit
```

## View Modes

- **List view** (default): Single-column scroll with dividers between active/completed
- **Board view**: Todo cards grouped by tag in CSS grid columns (toggle when tags exist)

## PIN Auth Flow

1. Client hits `/api/pin-required` → gets `{ required, length, locked, attemptsLeft }`
2. User submits PIN → `POST /api/verify-pin` → sets `DUMBDO_PIN` cookie on success
3. `hooks.server.ts` validates cookie on every request, redirects to `/login` if missing
4. Lockout: 5 attempts → 15min cooldown (in-memory Map, resets on server restart)

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/pin-required` | Check if PIN is configured + lockout status |
| POST | `/api/verify-pin` | Authenticate with PIN |
| GET | `/api/config` | Site config (title, single list mode) |
| GET | `/api/todos` | Load all todos |
| POST | `/api/todos` | Save all todos |
