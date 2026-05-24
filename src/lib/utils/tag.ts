export interface ParsedTodo {
  tag: string | null
  starTags: string[]
  text: string
}

export const parseTag = (raw: string): ParsedTodo => {
  const prefix = raw.match(/^([A-Za-z]\w*)\s*:\s*(.+)/)
  let text = prefix ? prefix[2].trim() : raw
  const tag = prefix ? prefix[1].toUpperCase() : null
  const stars: string[] = []
  while (true) {
    const m = text.match(/\s+\*(\w+)$/)
    if (!m) break
    stars.unshift(m[1].toUpperCase())
    text = text.slice(0, m.index).trimEnd()
  }
  return { tag, starTags: stars, text }
}

const TAG_PALETTE = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  'bg-rose-500'
]

const tagColorMap: Record<string, string> = {}

export const getTagColorClass = (tag: string): string => {
  if (tagColorMap[tag]) return tagColorMap[tag]
  const idx = ([...tag].reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % TAG_PALETTE.length
  tagColorMap[tag] = TAG_PALETTE[idx]
  return tagColorMap[tag]
}

const URL_RE = /(https?:\/\/[^\s<]+)/g

export function linkify(text: string): Array<{ type: 'text' | 'link'; value: string }> {
  const parts: Array<{ type: 'text' | 'link'; value: string }> = []
  let last = 0, m: RegExpExecArray | null
  while ((m = URL_RE.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) })
    parts.push({ type: 'link', value: m[0] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })
  return parts
}
