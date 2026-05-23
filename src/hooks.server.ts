import type { Handle } from '@sveltejs/kit'
import { validateCookie } from '$lib/server/pin'
import { PIN } from '$lib/server/constants'

export const handle: Handle = async ({ event, resolve }) => {
  const { request, cookies, url } = event
  const pathname = url.pathname

  if (!PIN) return await resolve(event)

  // API endpoints (except auth)
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/pin-required' || pathname === '/api/verify-pin' || pathname === '/api/logout') {
      return await resolve(event)
    }
    const providedPin = cookies.get('DUMBDO_PIN')
    if (!validateCookie(providedPin)) {
      return new Response(JSON.stringify({ error: 'Invalid PIN' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return await resolve(event)
  }

  // Login page - redirect if already authed
  if (pathname === '/login') {
    const providedPin = cookies.get('DUMBDO_PIN')
    if (validateCookie(providedPin)) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/' }
      })
    }
    return await resolve(event)
  }

  // All other pages - redirect to login if not authed
  const providedPin = cookies.get('DUMBDO_PIN')
  if (!validateCookie(providedPin)) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/login' }
    })
  }

  return await resolve(event)
}
