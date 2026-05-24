import type { RequestHandler } from './$types'
import { PIN, MIN_PIN_LENGTH, MAX_PIN_LENGTH } from '$lib/server/constants'
import {
  isLockedOut,
  recordAttempt,
  resetAttempts,
  secureCompare,
  getAttemptsLeft,
  getLockoutMinutes,
  hashPin
} from '$lib/server/pin'
import crypto from 'node:crypto'
import { env } from '$env/dynamic/private'

export const POST: RequestHandler = async ({ request, cookies }) => {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const body = await request.json()
  const { pin } = body

  if (isLockedOut(ip)) {
    return new Response(JSON.stringify({
      error: `Too many attempts. Please try again in ${getLockoutMinutes(ip)} minutes.`,
      locked: true,
      lockoutMinutes: getLockoutMinutes(ip)
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (PIN && (pin.length < MIN_PIN_LENGTH || pin.length > MAX_PIN_LENGTH)) {
    recordAttempt(ip)
    return new Response(JSON.stringify({
      valid: false,
      error: `PIN must be between ${MIN_PIN_LENGTH} and ${MAX_PIN_LENGTH} digits`,
      attemptsLeft: getAttemptsLeft(ip)
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const delay = crypto.randomInt(50, 150)
  await new Promise(resolve => setTimeout(resolve, delay))

  if (!PIN || secureCompare(pin, PIN)) {
    resetAttempts(ip)
    cookies.set('DUMBDO_PIN', hashPin(pin), {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })
    return new Response(JSON.stringify({ valid: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  recordAttempt(ip)
  return new Response(JSON.stringify({
    valid: false,
    error: `Invalid PIN. ${getAttemptsLeft(ip)} attempts remaining before lockout.`,
    attemptsLeft: getAttemptsLeft(ip)
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  })
}
