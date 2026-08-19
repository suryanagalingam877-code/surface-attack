import { useEffect, useRef, useState } from 'react'
import { getScan, getScanResults, startScan } from '../services/api'

const terminalStates = new Set(['COMPLETED', 'FAILED', 'PARTIAL'])

export function useScan() {
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function poll(scanId) {
    try {
      const result = await getScan(scanId)
      if (!terminalStates.has(String(result?.status || '').toUpperCase())) {
        setScan(result)
        timer.current = setTimeout(() => poll(scanId), 2000)
      } else {
        const complete = await getScanResults(scanId)
        setScan({ ...result, ...complete, scan_id: scanId })
        setLoading(false)
      }
    } catch (pollError) {
      setError(pollError.message)
      setLoading(false)
    }
  }

  async function run(domain) {
    clearTimeout(timer.current)
    setError('')
    setLoading(true)
    try {
      const result = await startScan(domain)
      setScan(result)
      const scanId = result?.scan_id || result?.scanId || result?.id
      if (scanId && !terminalStates.has(String(result?.status || '').toUpperCase())) poll(scanId)
      else setLoading(false)
    } catch (startError) {
      setError(startError.message)
      setLoading(false)
    }
  }

  return { scan, loading, error, run }
}
