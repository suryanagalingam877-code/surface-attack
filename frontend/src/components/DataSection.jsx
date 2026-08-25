import { useState } from 'react'
import { Copy, Check, Search, Inbox } from 'lucide-react'
import { copyToClipboard, valueOrNA } from '../utils/formatters'

export function EmptyState({ title = 'No Data Observed', children = 'No genuine observations recorded for this module in the current scan scope.', icon: Icon = Inbox }) {
  return (
    <div className="empty-state">
      <Icon size={28} />
      <div>
        <strong style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 2 }}>{title}</strong>
        <span>{children}</span>
      </div>
    </div>
  )
}

export function Field({ label, value, copyable = false }) {
  const [copied, setCopied] = useState(false)
  const displayVal = value && typeof value === 'object' ? value : valueOrNA(value)

  async function handleCopy() {
    if (!copyable || !value) return
    const ok = await copyToClipboard(typeof value === 'object' ? JSON.stringify(value) : String(value))
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="field">
      <span>{label}</span>
      {copyable && value ? (
        <strong className="cell-copyable" onClick={handleCopy} title="Click to copy">
          {displayVal}
          {copied ? <Check size={13} style={{ color: 'var(--emerald)' }} /> : <Copy size={13} className="copy-icon" />}
        </strong>
      ) : (
        <strong>{displayVal}</strong>
      )}
    </div>
  )
}

export function Section({ eyebrow, title, children, actions, className = '', count }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div className="panel-heading-left">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2>{title}</h2>
            {count !== undefined && <span className="tab-count">{count}</span>}
          </div>
        </div>
        {actions && <div className="panel-actions">{actions}</div>}
      </div>
      {children}
    </section>
  )
}

export function Table({ columns, rows = [], empty = 'No records observed.', searchable = false, searchPlaceholder = 'Filter records...' }) {
  const [search, setSearch] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)

  async function handleCopy(text, key) {
    if (!text || text === 'N/A') return
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1600)
    }
  }

  const filteredRows = search.trim()
    ? rows.filter((row) =>
        Object.values(row).some((val) =>
          String(val || '').toLowerCase().includes(search.toLowerCase())
        )
      )
    : rows

  if (!rows || rows.length === 0) {
    return <EmptyState title="No Records">{empty}</EmptyState>
  }

  return (
    <div>
      {(searchable || rows.length > 6) && (
        <div className="table-toolbar">
          <div className="table-search">
            <Search size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Showing {filteredRows.length} of {rows.length}
          </span>
        </div>
      )}
      {filteredRows.length === 0 ? (
        <EmptyState title="No matches found">No items match your filter "{search}".</EmptyState>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} style={column.style || {}}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, rowIndex) => (
                <tr key={row.id || row.name || row.subdomain || row.endpoint || rowIndex}>
                  {columns.map((column) => {
                    const rawVal = typeof column.render === 'function' ? column.render(row) : row[column.key]
                    const formatted = valueOrNA(rawVal)
                    const cellId = `${rowIndex}-${column.key}`
                    const isCopied = copiedKey === cellId

                    if (column.copyable && rawVal && formatted !== 'N/A') {
                      return (
                        <td key={column.key}>
                          <span
                            className="cell-copyable code-chip"
                            onClick={() => handleCopy(String(rawVal), cellId)}
                            title="Click to copy"
                          >
                            {formatted}
                            {isCopied ? (
                              <Check size={12} style={{ color: 'var(--emerald)' }} />
                            ) : (
                              <Copy size={12} className="copy-icon" />
                            )}
                          </span>
                        </td>
                      )
                    }

                    if (column.code) {
                      return (
                        <td key={column.key}>
                          <span className="code-chip">{formatted}</span>
                        </td>
                      )
                    }

                    return <td key={column.key}>{formatted}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
