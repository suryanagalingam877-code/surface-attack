import { useEffect, useRef, useState, useCallback } from 'react'
import { getScan, getScanResults, startScan, listScans, deleteScan, clearAllScans } from '../services/api'

const terminalStates = new Set(['COMPLETED', 'FAILED', 'PARTIAL'])

export function useScan() {
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const data = await listScans()
      setHistory(Array.isArray(data?.scans) ? data.scans : [])
    } catch {
      // Fallback silently if offline
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

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
        fetchHistory()
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

  async function loadScan(scanId) {
    clearTimeout(timer.current)
    setError('')
    setLoading(true)
    try {
      const complete = await getScanResults(scanId)
      setScan({ ...complete, scan_id: scanId })
      setLoading(false)
    } catch (loadError) {
      setError(loadError.message)
      setLoading(false)
    }
  }

  async function deleteHistoryScan(scanId) {
    try {
      await deleteScan(scanId)
      setHistory((prev) => prev.filter((s) => s.scan_id !== scanId))
      if (scan?.scan_id === scanId) {
        setScan(null)
      }
    } catch (delError) {
      setError(delError.message)
    }
  }

  async function clearHistory() {
    try {
      await clearAllScans()
      setHistory([])
    } catch (clearError) {
      setError(clearError.message)
    }
  }

  function resetScan() {
    clearTimeout(timer.current)
    setScan(null)
    setError('')
    setLoading(false)
    fetchHistory()
  }

  return {
    scan,
    loading,
    error,
    history,
    loadingHistory,
    run,
    loadScan,
    deleteHistoryScan,
    clearHistory,
    fetchHistory,
    resetScan,
  }
}

