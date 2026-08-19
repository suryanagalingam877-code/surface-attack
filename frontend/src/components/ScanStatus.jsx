import { Activity, CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react'
import { titleCase, valueOrNA } from '../utils/formatters'

const icons = { RUNNING: LoaderCircle, COMPLETED: CheckCircle2, PARTIAL: CircleAlert, FAILED: CircleAlert, QUEUED: Activity }
export default function ScanStatus({ status, progress }) {
  const normalized = String(status || '').toUpperCase()
  const Icon = icons[normalized] || Activity
  return <div className={`status-pill status-${normalized.toLowerCase() || 'unknown'}`}><Icon size={15} className={normalized === 'RUNNING' ? 'spin' : ''} /><span>{titleCase(status)}</span>{progress !== undefined && progress !== null && <strong>{valueOrNA(progress)}%</strong>}</div>
}
