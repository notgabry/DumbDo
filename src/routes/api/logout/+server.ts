import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'

export const POST: RequestHandler = async ({ cookies }) => {
  cookies.delete('DUMBDO_PIN', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  })
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
