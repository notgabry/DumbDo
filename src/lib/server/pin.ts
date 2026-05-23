import crypto from 'node:crypto'
import { PIN, MAX_PIN_LENGTH } from './constants'

interface AttemptRecord {
  count: number
  lastAttempt: number
}

const loginAttempts = new Map<string, AttemptRecord>()
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000

const resetAttempts = (ip: string) => {
  loginAttempts.delete(ip)
}

const isLockedOut = (ip: string): boolean => {
  const attempts = loginAttempts.get(ip)
  if (!attempts) return false

  if (attempts.count >= MAX_ATTEMPTS) {
    const timeElapsed = Date.now() - attempts.lastAttempt
    if (timeElapsed < LOCKOUT_TIME) return true
    resetAttempts(ip)
  }
  return false
}

const recordAttempt = (ip: string) => {
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 }
  attempts.count += 1
  attempts.lastAttempt = Date.now()
  loginAttempts.set(ip, attempts)
}

const getLockoutMinutes = (ip: string): number => {
  const attempts = loginAttempts.get(ip)
  if (!attempts) return 0
  const remaining = LOCKOUT_TIME - (Date.now() - attempts.lastAttempt)
  return Math.ceil(Math.max(remaining, 0) / 1000 / 60)
}

const getAttemptsLeft = (ip: string): number => {
  const attempts = loginAttempts.get(ip)
  return attempts ? MAX_ATTEMPTS - attempts.count : MAX_ATTEMPTS
}

const secureCompare = (a: string, b: string): boolean => {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  return crypto.timingSafeEqual(
    Buffer.from(a.padEnd(MAX_PIN_LENGTH, '0')),
    Buffer.from(b.padEnd(MAX_PIN_LENGTH, '0'))
  )
}

const isValidPin = (providedPin?: string): boolean => {
  if (!PIN) return true
  return !!providedPin && secureCompare(providedPin, PIN)
}

const validateCookie = (cookie: string | undefined): boolean => {
  return isValidPin(cookie)
}

export {
  loginAttempts,
  MAX_ATTEMPTS,
  LOCKOUT_TIME,
  resetAttempts,
  isLockedOut,
  recordAttempt,
  getLockoutMinutes,
  getAttemptsLeft,
  secureCompare,
  isValidPin,
  validateCookie
}
