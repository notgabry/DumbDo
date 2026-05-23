import fs from 'node:fs/promises'
import type { TodosData } from '$lib/types/todo'
import { DATA_DIR, DATA_FILE } from './constants'

const initDataFile = async (): Promise<void> => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch { /* exists */ }

  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, '{}')
  }
}

export const readTodos = async (): Promise<TodosData> => {
  await initDataFile()
  const data = await fs.readFile(DATA_FILE, 'utf-8')
  return JSON.parse(data) as TodosData
}

export const writeTodos = async (todos: TodosData): Promise<void> => {
  await initDataFile()
  await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2))
}
