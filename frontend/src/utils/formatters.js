export const NOT_AVAILABLE = 'N/A'

export function valueOrNA(value, fallback = NOT_AVAILABLE) {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.length === 0 ? fallback : value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ')
    }
    return JSON.stringify(value)
  }
  return String(value)
}

export function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : []
}

export function normalizeDomain(input) {
  if (!input || typeof input !== 'string') return null
  let candidate = input.trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^\/\//, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .split(':')[0]
    .toLowerCase()
    .replace(/\.$/, '')

  if (!candidate || candidate.length > 253 || candidate.includes('..')) return null

  // If user typed a single name without TLD (e.g., "google", "railfeast"), auto-complete with .com
  if (!candidate.includes('.') && /^[a-z0-9-]+$/.test(candidate)) {
    candidate = `${candidate}.com`
  }

  const labels = candidate.split('.')
  if (labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null
  return candidate
}


export function formatDate(value) {
  if (!value) return NOT_AVAILABLE
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? valueOrNA(value) : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatDuration(value, startedAt, completedAt) {
  if (value !== null && value !== undefined && value !== '') {
    if (typeof value === 'number') return `${value.toFixed(1)}s`
    return valueOrNA(value)
  }
  if (!startedAt || !completedAt) return NOT_AVAILABLE
  const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  return Number.isFinite(duration) && duration >= 0 ? `${(duration / 1000).toFixed(1)}s` : NOT_AVAILABLE
}

export function titleCase(value) {
  if (!value) return NOT_AVAILABLE
  return String(value)
    .toLowerCase()
    .replace(/(^|[_\-\s])(\w)/g, (_, sep, char) => (sep === '_' || sep === '-' ? ' ' : sep) + char.toUpperCase())
    .trim()
}

export function getPostureGrade(score, maxScore = 100) {
  if (score === null || score === undefined) return { grade: 'N/A', label: 'Unrated', color: 'neutral', percentage: 0 }
  const numericScore = Number(score)
  const numericMax = Number(maxScore) || 100
  const percentage = Math.round((numericScore / numericMax) * 100)
  
  if (percentage >= 85) return { grade: 'A', label: 'Low Risk / Strong Posture', color: 'emerald', percentage }
  if (percentage >= 70) return { grade: 'B', label: 'Moderate Risk', color: 'cyan', percentage }
  if (percentage >= 50) return { grade: 'C', label: 'Elevated Risk', color: 'amber', percentage }
  return { grade: 'D', label: 'High Risk / Action Needed', color: 'rose', percentage }
}

export async function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch {
    return false
  }
}
