import { valueOrNA } from '../utils/formatters'

export function EmptyState({ children = 'No data returned' }) { return <div className="empty-state">{children}</div> }
export function Field({ label, value }) { return <div className="field"><span>{label}</span><strong>{value && typeof value === 'object' ? value : valueOrNA(value)}</strong></div> }
export function Section({ eyebrow, title, children, className = '' }) { return <section className={`panel ${className}`}><div className="panel-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div></div>{children}</section> }
export function Table({ columns, rows, empty }) { return rows.length ? <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || row.name || row.subdomain || row.endpoint || index}>{columns.map((column) => <td key={column.key}>{valueOrNA(typeof column.render === 'function' ? column.render(row) : row[column.key])}</td>)}</tr>)}</tbody></table></div> : <EmptyState>{empty}</EmptyState> }
