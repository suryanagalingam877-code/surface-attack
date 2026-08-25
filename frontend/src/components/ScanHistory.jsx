import { useState } from 'react'
import {
  History,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Search,
  ArrowRight,
  Clock,
  Flame,
  Globe,
  Sparkles,
  X,
} from 'lucide-react'
import { reportUrl } from '../services/api'
import ScanStatus from './ScanStatus'

function formatDateTime(isoString) {
  if (!isoString) return 'Recent'
  try {
    const d = new Date(isoString)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

export default function ScanHistory({
  history = [],
  onSelectScan,
  onDeleteScan,
  onClearHistory,
  isOpen,
  onClose,
  isDrawer = false,
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredHistory = history.filter((item) => {
    if (!searchTerm.trim()) return true
    return String(item.domain || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim())
  })

  const content = (
    <div className={`history-container ${isDrawer ? 'history-drawer-content' : 'history-inline-card'}`}>
      <div className="history-header">
        <div className="history-header-left">
          <div className="history-icon-badge">
            <History size={18} />
          </div>
          <div>
            <h3>Assessment History</h3>
            <span className="history-subtitle">
              {history.length} {history.length === 1 ? 'assessment' : 'assessments'} recorded in database
            </span>
          </div>
        </div>

        <div className="history-header-actions">
          {history.length > 0 && onClearHistory && (
            <button
              className="btn-secondary danger-hover"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all assessment history?')) {
                  onClearHistory()
                }
              }}
              title="Clear all history"
            >
              <Trash2 size={13} />
              <span>Clear All</span>
            </button>
          )}

          {isDrawer && onClose && (
            <button className="icon-btn" onClick={onClose} title="Close History">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {history.length > 3 && (
        <div className="history-search-bar">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search past targets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {filteredHistory.length === 0 ? (
        <div className="history-empty-state">
          <History size={32} />
          <p>
            {searchTerm
              ? `No assessments found matching "${searchTerm}"`
              : 'No previous assessment history recorded yet.'}
          </p>
          <span className="empty-subtext">New reconnaissance scans will be automatically saved here.</span>
        </div>
      ) : (
        <div className="history-list">
          {filteredHistory.map((item) => {
            const hasScore = typeof item.score === 'number'
            const scoreGrade = hasScore
              ? item.score >= 85
                ? 'A'
                : item.score >= 70
                ? 'B'
                : item.score >= 50
                ? 'C'
                : 'D'
              : null

            return (
              <div key={item.scan_id} className="history-card">
                <div className="history-card-main">
                  <div className="history-card-title-row">
                    <strong className="history-domain" onClick={() => onSelectScan(item.scan_id)}>
                      {item.domain}
                    </strong>
                    <ScanStatus status={item.status} />
                  </div>

                  <div className="history-card-meta">
                    <span className="meta-chip">
                      <Clock size={11} /> {formatDateTime(item.started_at || item.completed_at)}
                    </span>

                    {item.duration !== null && item.duration !== undefined && (
                      <span className="meta-chip">{item.duration}s</span>
                    )}

                    {hasScore && (
                      <span className={`posture-badge badge-${scoreGrade === 'A' ? 'emerald' : scoreGrade === 'B' ? 'cyan' : scoreGrade === 'C' ? 'amber' : 'rose'}`}>
                        <ShieldCheck size={11} /> {item.score}/{item.max_score || 100} (Grade {scoreGrade})
                      </span>
                    )}

                    {item.findings_count > 0 ? (
                      <span className="findings-chip has-findings">
                        <Flame size={11} /> {item.findings_count} {item.findings_count === 1 ? 'Finding' : 'Findings'}
                      </span>
                    ) : (
                      <span className="findings-chip clean">
                        <Sparkles size={11} /> Clean (0 Findings)
                      </span>
                    )}

                    {item.subdomains_count > 0 && (
                      <span className="meta-chip">
                        <Globe size={11} /> {item.subdomains_count} Subdomains
                      </span>
                    )}
                  </div>
                </div>

                <div className="history-card-actions">
                  <button
                    className="btn-primary-sm"
                    onClick={() => onSelectScan(item.scan_id)}
                    title="Load this scan in dashboard"
                  >
                    <span>View</span>
                    <ArrowRight size={13} />
                  </button>

                  <a
                    href={reportUrl(item.scan_id, 'html')}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-icon-subtle"
                    title="Open standalone HTML Report"
                  >
                    <ExternalLink size={14} />
                  </a>

                  {onDeleteScan && (
                    <button
                      className="btn-icon-danger"
                      onClick={() => onDeleteScan(item.scan_id)}
                      title="Delete this record"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  if (!isDrawer) return content
  if (!isOpen) return null

  return (
    <div className="history-drawer-backdrop" onClick={onClose}>
      <div className="history-drawer" onClick={(evt) => evt.stopPropagation()}>
        {content}
      </div>
    </div>
  )
}