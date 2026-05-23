import type { RequestHandler } from './$types'
import { readTodos, writeTodos } from '$lib/server/todos'

export const GET: RequestHandler = async () => {
  try {
    const todos = await readTodos()
    return new Response(JSON.stringify(todos), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to read todos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json()
    await writeTodos(body)
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to save todos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
