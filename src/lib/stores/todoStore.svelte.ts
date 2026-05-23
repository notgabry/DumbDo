import type { TodosData, Todo } from '$lib/types/todo'
import { parseTag } from '$lib/utils/tag'
import { browser } from '$app/environment'

export const s = $state({
  todos: {} as TodosData,
  currentList: 'List 1',
  filterTag: null as string | null,
  viewMode: 'list' as 'list' | 'board',
  editingId: null as number | null,
  editingText: '',
  genId: 0,
})

const nextId = () => ++s.genId

const sortKeys = (ks: string[]) =>
  [...ks].sort((a, b) => {
    if (a === 'List 1') return -1
    if (b === 'List 1') return 1
    return a.localeCompare(b)
  })

// getters (functions instead of $derived exports — svelte 5 limitation)
export const getLists = () => Object.keys(s.todos)
export const getCurrentTodos = () => s.todos[s.currentList] || []

function filtered() {
  let items = s.todos[s.currentList] || []
  return s.filterTag ? items.filter(t => parseTag(t.text).tag === s.filterTag) : items
}

export const getActiveTodos = () => filtered().filter(t => !t.completed)
export const getDoneTodos = () => filtered().filter(t => t.completed)
export const getAllTags = () => [...new Set(getCurrentTodos().map(t => parseTag(t.text).tag).filter(Boolean))].sort() as string[]
export const getHasTags = () => getAllTags().length > 0
export const getBoardTags = () => s.filterTag ? getAllTags().filter(t => t === s.filterTag) : getAllTags()
export const getSortedLists = () => sortKeys(getLists())

// init
export function init(data: TodosData) {
  let maxId = 0
  let clone = structuredClone(data)
  for (let list of Object.values(clone)) {
    for (let t of list) {
      if (t._id == null) t._id = ++maxId
      else if (t._id > maxId) maxId = t._id
    }
  }
  s.todos = clone
  s.currentList = Object.keys(clone)[0] || 'List 1'
  s.genId = maxId
}

// persistence
async function save() {
  try {
    let r = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s.todos)
    })
    if (!r.ok) throw Error()
  } catch {}
}

// crud
export function addTodo(text: string) {
  if (!s.todos[s.currentList]) s.todos[s.currentList] = []
  s.todos[s.currentList] = [...s.todos[s.currentList], { text, completed: false, _id: nextId() } as Todo]
  save()
}

export function toggleTodo(t: Todo) {
  t.completed = !t.completed
  s.todos = s.todos
  save()
}

export function removeTodo(t: Todo) {
  s.todos[s.currentList] = s.todos[s.currentList].filter(item => item !== t)
  save()
}

export function startEdit(t: Todo) {
  s.editingId = t._id ?? null
  s.editingText = t.text
}

export function saveEdit(t: Todo) {
  let v = s.editingText.trim()
  if (!v || v === t.text) { s.editingId = null; return }
  t.text = v
  s.todos = s.todos
  s.editingId = null
  save()
}

export function cancelEdit() {
  s.editingId = null
}

// list management
export function switchList(id: string) {
  s.currentList = id
  s.filterTag = null
}

export function addList() {
  let n = getSortedLists().length + 1
  s.todos[`List ${n}`] = []
  s.currentList = `List ${n}`
  save()
}

export function renameListTo(name: string) {
  if (!name || name === s.currentList || s.todos[name]) return
  let renamed = { ...s.todos, [name]: s.todos[s.currentList] }
  delete renamed[s.currentList]
  s.todos = renamed as TodosData
  s.currentList = name
  save()
}

export function deleteCurrentList() {
  if (getSortedLists().length <= 1 || s.currentList === 'List 1') return false
  let { [s.currentList]: _, ...rest } = s.todos
  s.todos = rest as TodosData
  s.currentList = getSortedLists().find(k => k !== s.currentList) || 'List 1'
  save()
  return true
}

// setters
export function setViewMode(mode: 'list' | 'board') {
  s.viewMode = mode
  if (browser) localStorage.setItem('viewMode', mode)
}
export function setFilterTag(tag: string | null) { s.filterTag = tag }
