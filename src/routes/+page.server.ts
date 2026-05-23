import { readTodos } from '$lib/server/todos'
import { SITE_TITLE, SINGLE_LIST } from '$lib/server/constants'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  let todos = await readTodos()
  if (Object.keys(todos).length === 0) {
    todos = { 'List 1': [] }
  }
  return {
    todos,
    siteTitle: SITE_TITLE,
    singleList: SINGLE_LIST
  }
}
