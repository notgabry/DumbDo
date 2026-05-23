import type { RequestHandler } from './$types'
import { SITE_TITLE, SINGLE_LIST, IDLE_TIMEOUT_SECONDS } from '$lib/server/constants'

export const GET: RequestHandler = async () => {
  return new Response(JSON.stringify({
    siteTitle: SITE_TITLE,
    singleList: SINGLE_LIST,
    idleTimeoutSeconds: IDLE_TIMEOUT_SECONDS
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
