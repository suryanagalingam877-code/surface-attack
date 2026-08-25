import { Activity, CheckCircle2, CircleAlert, LoaderCircle, ShieldAlert } from 'lucide-react'
import { titleCase, valueOrNA } from '../utils/formatters'

const icons = {
  RUNNING: LoaderCircle,
  COMPLETED: CheckCircle2,
  PARTIAL: CircleAlert,
  FAILED: ShieldAlert,
  QUEUED: Activity,
}

export default function ScanStatus({ status, progress }) {
  const normalized = String(status || '').toUpperCase()
  const Icon = icons[normalized] || Activity
  const statusClass = normalized ? normalized.toLowerCase() : 'unknown'

  return (
    <div className={`status-pill status-${statusClass}`}>
      <Icon size={14} className={normalized === 'RUNNING' ? 'spin' : ''} />
      <span>{titleCase(status || 'PENDING')}</span>
      {progress !== undefined && progress !== null && (
        <span className="status-progress-pct">{valueOrNA(progress)}%</span>
      )}
    </div>
  )
}
