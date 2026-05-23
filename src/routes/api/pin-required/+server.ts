import type { RequestHandler } from './$types'
import { PIN, MIN_PIN_LENGTH } from '$lib/server/constants'
import { isLockedOut, getLockoutMinutes, getAttemptsLeft } from '$lib/server/pin'

export const GET: RequestHandler = async ({ request }) => {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const locked = isLockedOut(ip)

  return new Response(JSON.stringify({
    required: !!PIN,
    length: PIN ? PIN.length : MIN_PIN_LENGTH,
    locked,
    attemptsLeft: getAttemptsLeft(ip),
    lockoutMinutes: locked ? getLockoutMinutes(ip) : 0
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
