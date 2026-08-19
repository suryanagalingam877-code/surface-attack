const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const REQUEST_TIMEOUT = 30000

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      signal: controller.signal,
    })
    const text = await response.text()
    let body = null
    try { body = text ? JSON.parse(text) : null } catch { throw new Error('Backend returned invalid JSON.') }
    if (!response.ok) throw new Error(body?.message || body?.error || `Backend request failed (${response.status}).`)
    return body
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Request timed out. The backend did not respond in time.')
    if (error instanceof TypeError) throw new Error('Backend unavailable. Check the API connection.')
    throw error
  } finally { clearTimeout(timeout) }
}

export function startScan(domain) {
  return request('/scan', { method: 'POST', body: JSON.stringify({ domain }) })
}

export function getScan(scanId) {
  return request(`/scan/${encodeURIComponent(scanId)}/status`)
}

export function getScanResults(scanId) {
  return request(`/scan/${encodeURIComponent(scanId)}/results`)
}

export function reportUrl(scanId, format) {
  return `${API_BASE_URL}/scan/${encodeURIComponent(scanId)}/report.${format}`
}
