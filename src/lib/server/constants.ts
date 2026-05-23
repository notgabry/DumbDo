import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { env } from '$env/dynamic/private'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../..')

export const PIN = env.DUMBDO_PIN
export const SITE_TITLE = env.DUMBDO_SITE_TITLE || 'DumbDo'
export const SINGLE_LIST = env.SINGLE_LIST === 'true'
export const MIN_PIN_LENGTH = 4
export const MAX_PIN_LENGTH = 10

export const DATA_DIR = path.join(ROOT, 'data')
export const DATA_FILE = path.join(DATA_DIR, 'todos.json')
