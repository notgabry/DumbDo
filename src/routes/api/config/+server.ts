import type { RequestHandler } from './$types'
import { SITE_TITLE, SINGLE_LIST } from '$lib/server/constants'

export const GET: RequestHandler = async () => {
  return new Response(JSON.stringify({
    siteTitle: SITE_TITLE,
    singleList: SINGLE_LIST
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
