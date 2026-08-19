export const NOT_AVAILABLE = 'N/A'

export function valueOrNA(value) {
  if (value === null || value === undefined || value === '') return NOT_AVAILABLE
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : []
}

export function normalizeDomain(input) {
  const candidate = input.trim().replace(/^https?:\/\//i, '').split('/')[0].split('?')[0].split('#')[0].toLowerCase().replace(/\.$/, '')
  if (!candidate || candidate.length > 253 || candidate.includes('..')) return null
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
  if (value !== null && value !== undefined && value !== '') return valueOrNA(value)
  if (!startedAt || !completedAt) return NOT_AVAILABLE
  const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  return Number.isFinite(duration) && duration >= 0 ? `${(duration / 1000).toFixed(1)}s` : NOT_AVAILABLE
}

export function titleCase(value) {
  return valueOrNA(value).toLowerCase().replace(/(^|[_-])\\w/g, (match) => match.toUpperCase()).replaceAll('_', ' ')
}
