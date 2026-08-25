import { useState } from 'react'
import {
  Download,
  ExternalLink,
  ShieldCheck,
  Shield,
  Layers,
  Network,
  Cpu,
  Lock,
  Cookie,
  Flame,
  Globe,
  Radio,
  FileCode,
  ListOrdered,
  AlertTriangle,
  Copy,
  Check,
  Search,
  Sparkles,
  Server,
} from 'lucide-react'
import ScanStatus from './ScanStatus'
import { EmptyState, Field, Section, Table } from './DataSection'
import {
  arrayOrEmpty,
  copyToClipboard,
  formatDate,
  formatDuration,
  getPostureGrade,
  titleCase,
  valueOrNA,
} from '../utils/formatters'
import { reportUrl } from '../services/api'

const pick = (object, ...keys) =>
  keys.map((key) => object?.[key]).find((value) => value !== undefined && value !== null)
const asRecords = (value) => (Array.isArray(value) ? value : [])

export default function Dashboard({ scan, onReset }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSeverity, setSelectedSeverity] = useState('ALL')
  const [findingsSearch, setFindingsSearch] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  function showToast(msg) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 2200)
  }

  // Authentic Data Extractions
  const subdomains = asRecords(scan.subdomains?.subdomains || scan.subdomain_discovery || scan.subdomains)
  const endpoints = asRecords(scan.api_endpoints?.endpoints || scan.apiEndpoints || scan.endpoints)
  const dns = scan.dns?.records || scan.dns_records || scan.dns || {}
  const tls = scan.tls || scan.ssl || {}
  const http = scan.http || scan.http_recon || {}
  const headers = asRecords(scan.headers || scan.security_headers || scan.headers_security)
  const cookies = asRecords(scan.cookies || scan.cookie_security)
  const technologies = asRecords(scan.technologies || scan.technology_detection)
  const findings = asRecords(scan.findings || scan.security_findings)
  const errors = asRecords(scan.errors || scan.warnings)
  const robots = scan.robots || scan.robots_txt
  const sitemap = scan.sitemap || scan.sitemap_xml
  const scanId = pick(scan, 'scan_id', 'scanId', 'id')
  const httpsSecurity = scan.https_security || {}
  const posture = scan.security_posture || {}
  const surface = asRecords(scan.attack_surface)
  const timeline = asRecords(scan.timeline)
  const [selectedAsset, setSelectedAsset] = useState(surface[0] || null)

  const overview = scan.overview || scan.summary || {}
  const postureGrade = getPostureGrade(posture.score, posture.max_score || 100)

  // Filtered Findings
  const filteredFindings = findings.filter((f) => {
    const matchesSev =
      selectedSeverity === 'ALL' ||
      String(f.severity || '').toUpperCase() === selectedSeverity
    const matchesSearch = findingsSearch.trim()
      ? [f.title, f.description, f.category, f.affected_url, f.recommendation]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(findingsSearch.toLowerCase()))
      : true
    return matchesSev && matchesSearch
  })

  // DNS total records count
  const dnsRecordCount = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT'].reduce(
    (acc, type) => acc + asRecords(dns[type]).length,
    0
  )

  const tabs = [
    { id: 'overview', label: 'Executive Overview', icon: Layers },
    { id: 'findings', label: 'Security Findings', icon: Flame, count: findings.length },
    { id: 'surface', label: 'Attack Surface & Graph', icon: Network, count: surface.length },
    { id: 'dns', label: 'DNS & Network', icon: Globe, count: dnsRecordCount },
    { id: 'transport', label: 'TLS & Transport', icon: Lock },
    { id: 'headers_cookies', label: 'Headers & Cookies', icon: Cookie, count: headers.length + cookies.length },
    { id: 'policy_logs', label: 'Policies & Events', icon: ListOrdered, count: timeline.length },
  ]

  return (
    <main className="content">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="glass-toast">
          <Check size={16} style={{ color: 'var(--emerald)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-title">
          <div className="topbar-icon">
            <Shield size={22} />
          </div>
          <div>
            <span className="eyebrow">Assessment Workspace // Genuine Target Data</span>
            <h1>{pick(scan, 'domain', 'target_domain') || 'Target Reconnaissance'}</h1>
            <div className="topbar-meta">
              <span>Status:</span>
              <ScanStatus status={scan.status} progress={scan.progress} />
              <span>&bull;</span>
              <span>
                Duration: <strong>{formatDuration(pick(scan, 'duration', 'scan_duration'), pick(scan, 'started_at', 'start_time'), pick(scan, 'completed_at', 'completion_time'))}</strong>
              </span>
            </div>
          </div>
        </div>
        <div className="topbar-actions">
          {scanId && (
            <a href={reportUrl(scanId, 'html')} target="_blank" rel="noreferrer" className="btn-secondary" title="View Executive HTML Report">
              <ExternalLink size={14} /> HTML Report
            </a>
          )}
          <button className="btn-primary" onClick={onReset}>
            <Sparkles size={14} /> New Target
          </button>
        </div>
      </header>

      {/* Executive Summary Cards */}
      <div className="executive-grid">
        {/* Posture Score Meter */}
        <div className="posture-score-card">
          <div className="score-header">
            <span>Security Posture</span>
            <span className={`score-grade-badge badge-${postureGrade.color}`}>
              Grade {postureGrade.grade}
            </span>
          </div>
          <div className="score-body">
            <div className="score-circle" style={{ '--score-pct': postureGrade.percentage }}>
              <div className="score-circle-inner">
                <strong>{valueOrNA(posture.score, '0')}</strong>
                <small>/{valueOrNA(posture.max_score, '100')}</small>
              </div>
            </div>
            <div className="score-info">
              <h3>{postureGrade.label}</h3>
              <p>Calculated deterministically from authentic DNS, TLS, and HTTP observations.</p>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Target: {pick(scan, 'domain', 'target_domain')}
          </div>
        </div>

        {/* 6 Key Metrics Stat Grid */}
        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-icon">
              <Network size={20} />
            </div>
            <div className="metric-details">
              <span>Subdomains</span>
              <strong>{valueOrNA(subdomains.length)}</strong>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <Cpu size={20} />
            </div>
            <div className="metric-details">
              <span>API Endpoints</span>
              <strong>{valueOrNA(endpoints.length)}</strong>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <Globe size={20} />
            </div>
            <div className="metric-details">
              <span>DNS Records</span>
              <strong>{valueOrNA(dnsRecordCount)}</strong>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <Cookie size={20} />
            </div>
            <div className="metric-details">
              <span>Cookies</span>
              <strong>{valueOrNA(cookies.length)}</strong>
            </div>
          </div>
          <div className={`metric-card ${findings.length ? 'has-findings' : ''}`}>
            <div className="metric-icon">
              <Flame size={20} />
            </div>
            <div className="metric-details">
              <span>Security Findings</span>
              <strong>{valueOrNA(findings.length)}</strong>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <Lock size={20} />
            </div>
            <div className="metric-details">
              <span>TLS Security</span>
              <strong style={{ fontSize: 16 }}>{valueOrNA(tls.status || tls.tls_version || 'Valid')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Glass Navigation Tabs */}
      <nav className="glass-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
            </button>
          )
        })}
      </nav>

      {/* =========================================================================
          TAB 1: OVERVIEW
         ========================================================================= */}
      {activeTab === 'overview' && (
        <>
          <Section eyebrow="Scan Context" title="Assessment Parameters">
            <div className="field-grid">
              <Field label="Target Domain" value={pick(scan, 'domain', 'target_domain')} copyable />
              <Field label="Scan Status" value={<ScanStatus status={scan.status} progress={scan.progress} />} />
              <Field label="Started" value={formatDate(pick(scan, 'started_at', 'start_time', 'scan_start_time'))} />
              <Field label="Completed" value={formatDate(pick(scan, 'completed_at', 'completion_time', 'scan_completion_time'))} />
              <Field label="Scan ID" value={scanId} copyable />
              <Field
                label="Duration"
                value={formatDuration(
                  pick(scan, 'duration', 'scan_duration'),
                  pick(scan, 'started_at', 'start_time'),
                  pick(scan, 'completed_at', 'completion_time')
                )}
              />
            </div>
          </Section>

          <Section eyebrow="HTTPS Security" title="Transport Posture Matrix">
            <div className="https-grid">
              <Field label="HTTPS Availability" value={httpsSecurity.https_available} />
              <Field label="HTTP to HTTPS Redirect" value={httpsSecurity.http_to_https?.state} />
              <Field label="TLS Version" value={httpsSecurity.tls_version || tls.tls_version} />
              <Field label="Certificate Status" value={httpsSecurity.certificate_status || tls.status} />
              <Field label="Hostname Match" value={httpsSecurity.hostname_match} />
              <Field label="Certificate Expiry" value={formatDate(httpsSecurity.certificate_expiry || tls.valid_until)} />
              <Field label="HSTS Configuration" value={httpsSecurity.hsts?.present ? httpsSecurity.hsts.raw_value : 'NOT_OBSERVED'} />
              <Field label="Mixed Content" value={`${asRecords(httpsSecurity.mixed_content).length} observed`} />
              <Field label="Secure Cookies Ratio" value={httpsSecurity.secure_cookies} />
            </div>
          </Section>

          <div className="two-col">
            <Section eyebrow="Posture Score Breakdown" title={`Rule Points: ${valueOrNA(posture.score)} / ${valueOrNA(posture.max_score)}`}>
              <div className="posture-reasons">
                {asRecords(posture.reasons).length ? (
                  posture.reasons.map((reason, index) => (
                    <div className="posture-reason-row" key={index}>
                      <span className={`posture-pts ${reason.applied ? 'pts-applied' : 'pts-neutral'}`}>
                        {reason.applied ? `+${reason.points}` : '0'}
                      </span>
                      <div className="posture-reason-text">
                        <strong>{valueOrNA(reason.rule)}</strong>
                        <small>{valueOrNA(reason.evidence, 'No failure observed')}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState>No posture scoring rules returned.</EmptyState>
                )}
              </div>
            </Section>

            <Section eyebrow="Quick Findings" title={`${findings.length} Security Observations`}>
              {findings.length ? (
                <div className="finding-list">
                  {findings.slice(0, 3).map((finding, idx) => (
                    <div className={`finding-card sev-${String(finding.severity || '').toLowerCase()}`} key={finding.id || idx}>
                      <div className="finding-top">
                        <span className={`severity severity-${String(finding.severity || '').toLowerCase()}`}>
                          {titleCase(finding.severity)}
                        </span>
                        <strong>{valueOrNA(finding.title)}</strong>
                      </div>
                      <p className="finding-desc">{valueOrNA(finding.description)}</p>
                    </div>
                  ))}
                  {findings.length > 3 && (
                    <button className="btn-secondary" onClick={() => setActiveTab('findings')}>
                      View all {findings.length} findings &rarr;
                    </button>
                  )}
                </div>
              ) : (
                <EmptyState title="Clean Scan">No security vulnerabilities or exposures detected.</EmptyState>
              )}
            </Section>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 2: FINDINGS
         ========================================================================= */}
      {activeTab === 'findings' && (
        <Section eyebrow="Security Assessment" title="Vulnerability & Misconfiguration Findings" count={findings.length}>
          <div className="findings-filter-bar">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => (
              <button
                key={sev}
                className={`findings-filter-btn ${selectedSeverity === sev ? 'active' : ''}`}
                onClick={() => setSelectedSeverity(sev)}
              >
                {sev === 'ALL' ? 'All Findings' : titleCase(sev)}
                <span className="tab-count">
                  {sev === 'ALL' ? findings.length : findings.filter((f) => String(f.severity || '').toUpperCase() === sev).length}
                </span>
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 18 }}>
            <div className="table-search" style={{ width: '100%', maxWidth: 360 }}>
              <Search size={14} />
              <input
                type="text"
                placeholder="Search findings by title, description, or URL..."
                value={findingsSearch}
                onChange={(e) => setFindingsSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredFindings.length ? (
            <div className="finding-list">
              {filteredFindings.map((finding, index) => {
                const sev = String(finding.severity || '').toLowerCase()
                return (
                  <article className={`finding-card sev-${sev}`} key={finding.id || index}>
                    <div className="finding-top">
                      <span className={`severity severity-${sev}`}>{titleCase(finding.severity)}</span>
                      <strong>{valueOrNA(finding.title)}</strong>
                      <span className="finding-id">{valueOrNA(finding.id)}</span>
                    </div>
                    <p className="finding-desc">{valueOrNA(finding.description)}</p>
                    <div className="finding-meta">
                      <Field label="Category" value={finding.category} />
                      <Field label="Affected Resource" value={finding.affected_url} copyable />
                      <Field label="Source Module" value={finding.source_module} />
                      <Field label="Remediation" value={finding.recommendation} />
                    </div>
                    {finding.evidence && (
                      <div className="evidence-box">
                        <div className="evidence-box-header">
                          <span>Raw Evidence Payload</span>
                          <button
                            type="button"
                            className="preset-btn"
                            onClick={async () => {
                              const ok = await copyToClipboard(finding.evidence)
                              if (ok) showToast('Evidence copied to clipboard')
                            }}
                          >
                            <Copy size={11} style={{ marginRight: 4 }} /> Copy Evidence
                          </button>
                        </div>
                        <pre className="evidence">{valueOrNA(finding.evidence)}</pre>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <EmptyState title="No Matching Findings">
              {findings.length === 0
                ? 'No security vulnerabilities or risks detected during this assessment.'
                : 'No findings match the selected severity and search filters.'}
            </EmptyState>
          )}
        </Section>
      )}

      {/* =========================================================================
          TAB 3: ATTACK SURFACE & RECON GRAPH
         ========================================================================= */}
      {activeTab === 'surface' && (
        <>
          <Section eyebrow="Asset Discovery" title="Interactive Reconnaissance Graph">
            <div className="recon-graph">
              {surface.length ? (
                surface.map((asset) => {
                  const isSelected = selectedAsset?.value === asset.value
                  return (
                    <button
                      type="button"
                      className={`graph-node ${isSelected ? 'selected' : ''}`}
                      key={asset.id || asset.value}
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <span>{asset.type || 'Asset'}</span>
                      <strong>{asset.value}</strong>
                    </button>
                  )
                })
              ) : (
                <EmptyState>No graph assets discovered in target scope.</EmptyState>
              )}
            </div>

            {selectedAsset && (
              <div className="asset-detail-card">
                <span className="eyebrow" style={{ display: 'block', marginBottom: 12 }}>
                  Selected Asset Details
                </span>
                <div className="field-grid">
                  <Field label="Asset Type" value={selectedAsset.type} />
                  <Field label="Asset Target" value={selectedAsset.value} copyable />
                  <Field label="Discovery Source" value={selectedAsset.source} />
                  <Field label="Status" value={selectedAsset.status} />
                </div>
                {selectedAsset.evidence && (
                  <div style={{ marginTop: 12 }}>
                    <span className="eyebrow" style={{ fontSize: 10 }}>Evidence</span>
                    <pre className="evidence" style={{ marginTop: 6 }}>{valueOrNA(selectedAsset.evidence)}</pre>
                  </div>
                )}
              </div>
            )}
          </Section>

          <div className="two-col">
            <Section eyebrow="Discovery" title="Discovered Subdomains" count={subdomains.length}>
              <Table
                rows={subdomains}
                empty="No subdomains discovered in passive scope."
                searchable
                searchPlaceholder="Search subdomains..."
                columns={[
                  { key: 'subdomain', label: 'Subdomain', render: (r) => r.subdomain || r.name, copyable: true },
                  { key: 'resolution', label: 'Resolved IP', render: (r) => r.resolved_ip || r.ip || r.resolution, copyable: true },
                  { key: 'http', label: 'HTTP Status', render: (r) => r.http_status || r.http, code: true },
                  { key: 'https', label: 'HTTPS Status', render: (r) => r.https_status || r.https, code: true },
                ]}
              />
            </Section>

            <Section eyebrow="Discovery" title="Observed API Endpoints" count={endpoints.length}>
              <Table
                rows={endpoints}
                empty="No API endpoints discovered in passive scope."
                searchable
                searchPlaceholder="Search endpoints..."
                columns={[
                  { key: 'endpoint', label: 'Endpoint', render: (r) => r.endpoint || r.url, copyable: true },
                  { key: 'method', label: 'Method', code: true },
                  { key: 'source', label: 'Source' },
                  { key: 'status', label: 'Status', code: true },
                ]}
              />
            </Section>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 4: DNS & NETWORK
         ========================================================================= */}
      {activeTab === 'dns' && (
        <Section eyebrow="Infrastructure" title="DNS Record Zone Inventory" count={dnsRecordCount}>
          <div className="dns-grid">
            {['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT'].map((type) => {
              const records = asRecords(dns[type])
              return (
                <div className="dns-card" key={type}>
                  <div className="dns-card-top">
                    <span className="dns-type-badge">{type}</span>
                    <span className="dns-card-count">{records.length} records</span>
                  </div>
                  <div className="dns-records-list">
                    {records.length ? (
                      records.map((rec, i) => (
                        <div
                          className="dns-record-item cell-copyable"
                          key={i}
                          onClick={async () => {
                            const ok = await copyToClipboard(String(rec))
                            if (ok) showToast(`Copied ${type} record`)
                          }}
                          title="Click to copy"
                        >
                          <span>{valueOrNA(rec)}</span>
                          <Copy size={11} className="copy-icon" />
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', padding: '10px 0' }}>
                        No {type} records found
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* =========================================================================
          TAB 5: TLS & TRANSPORT
         ========================================================================= */}
      {activeTab === 'transport' && (
        <div className="two-col">
          <Section eyebrow="Transport Layer" title="TLS / SSL Certificate">
            <div className="field-grid">
              <Field label="Certificate Status" value={tls.status || tls.certificate_status} />
              <Field label="TLS Protocol Version" value={tls.tls_version} />
              <Field label="Subject CN" value={tls.subject || tls.certificate_subject} copyable />
              <Field label="Issuer Organization" value={tls.issuer} copyable />
              <Field label="Valid From" value={formatDate(tls.valid_from || tls.not_before)} />
              <Field label="Valid Until" value={formatDate(tls.valid_until || tls.not_after)} />
              <Field label="Days Remaining" value={tls.days_remaining} />
              <Field label="Hostname Match" value={tls.hostname_match} />
              <Field label="Cipher Suite" value={tls.cipher || tls.cipher_suite} copyable />
            </div>
          </Section>

          <Section eyebrow="HTTP Reconnaissance" title="Target Web Server Response">
            <div className="field-grid">
              <Field label="HTTP Status Code" value={http.status_code || http.http_status || http.status} />
              <Field label="Final Destination URL" value={http.final_url} copyable />
              <Field label="Content-Type" value={http.content_type} />
              <Field label="Server Banner" value={http.server} />
              <Field label="Response Time" value={http.response_time ? `${http.response_time} ms` : 'N/A'} />
              <Field label="HTTPS Reachable" value={http.https_available} />
            </div>
          </Section>
        </div>
      )}

      {/* =========================================================================
          TAB 6: HEADERS & COOKIES
         ========================================================================= */}
      {activeTab === 'headers_cookies' && (
        <>
          <Section eyebrow="Controls" title="Security Headers Audit" count={headers.length}>
            <Table
              rows={headers}
              empty="No security header observations returned."
              searchable
              searchPlaceholder="Search headers..."
              columns={[
                { key: 'header', label: 'Security Header', render: (r) => r.header || r.name, copyable: true },
                {
                  key: 'status',
                  label: 'Classification',
                  render: (r) => {
                    const st = String(r.status || r.classification || (r.present ? 'Present' : 'Missing')).toLowerCase()
                    const badgeClass = st.includes('present') || st.includes('pass') ? 'badge-emerald' : 'badge-amber'
                    return <span className={`score-grade-badge ${badgeClass}`}>{titleCase(st)}</span>
                  },
                },
                { key: 'observed_value', label: 'Observed Value', render: (r) => r.observed_value || r.value || 'Not observed', copyable: true },
                { key: 'severity', label: 'Severity', render: (r) => r.severity ? <span className={`severity severity-${String(r.severity).toLowerCase()}`}>{titleCase(r.severity)}</span> : 'N/A' },
                { key: 'recommendation', label: 'Recommendation', render: (r) => r.recommendation || 'Standard header configuration' },
              ]}
            />
          </Section>

          <div className="two-col">
            <Section eyebrow="Session Security" title="Observed Cookies" count={cookies.length}>
              <Table
                rows={cookies}
                empty="No cookies observed in server responses."
                searchable
                searchPlaceholder="Search cookies..."
                columns={[
                  { key: 'name', label: 'Cookie Name', render: (r) => r.name || r.cookie, copyable: true },
                  { key: 'secure', label: 'Secure Flag', render: (r) => (r.secure ? 'Yes' : 'No'), code: true },
                  { key: 'httponly', label: 'HttpOnly', render: (r) => (r.httponly ?? r.http_only ? 'Yes' : 'No'), code: true },
                  { key: 'samesite', label: 'SameSite', render: (r) => r.samesite || 'None', code: true },
                  { key: 'domain', label: 'Domain', render: (r) => r.domain || 'Target' },
                ]}
              />
            </Section>

            <Section eyebrow="Fingerprinting" title="Technology Detection" count={technologies.length}>
              <Table
                rows={technologies}
                empty="No technology fingerprints detected."
                searchable
                searchPlaceholder="Search technologies..."
                columns={[
                  { key: 'technology', label: 'Technology', render: (r) => r.technology || r.name, copyable: true },
                  { key: 'category', label: 'Category' },
                  { key: 'confidence', label: 'Confidence', code: true },
                  { key: 'evidence', label: 'Evidence Payload' },
                ]}
              />
            </Section>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 7: POLICIES & TIMELINE LOGS
         ========================================================================= */}
      {activeTab === 'policy_logs' && (
        <>
          <div className="two-col">
            <Section eyebrow="Policy Files" title="robots.txt">
              {robots ? (
                <pre className="evidence" style={{ maxHeight: 260 }}>
                  {typeof robots === 'string' ? robots : JSON.stringify(robots, null, 2)}
                </pre>
              ) : (
                <EmptyState title="robots.txt not observed">Target does not expose a public robots.txt file.</EmptyState>
              )}
            </Section>

            <Section eyebrow="Policy Files" title="sitemap.xml">
              {sitemap ? (
                <div style={{ display: 'grid', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                  {asRecords(sitemap.urls || sitemap).map((url, index) => (
                    <div
                      className="cell-copyable code-chip"
                      key={index}
                      onClick={async () => {
                        const ok = await copyToClipboard(String(url))
                        if (ok) showToast('Sitemap URL copied')
                      }}
                      title="Click to copy"
                    >
                      <ExternalLink size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ wordBreak: 'break-all' }}>{valueOrNA(url)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="sitemap.xml not observed">Target does not expose a public sitemap.xml file.</EmptyState>
              )}
            </Section>
          </div>

          <Section eyebrow="Scan Operations" title="Engine Execution Timeline" count={timeline.length}>
            <Table
              rows={timeline}
              empty="No execution timeline recorded."
              columns={[
                { key: 'timestamp', label: 'Timestamp', render: (r) => formatDate(r.timestamp) },
                { key: 'module', label: 'Recon Module', code: true },
                {
                  key: 'status',
                  label: 'Status',
                  render: (r) => <ScanStatus status={r.status} />,
                },
                { key: 'error', label: 'Errors / Notes', render: (r) => r.error || 'Normal execution' },
              ]}
            />
          </Section>

          {errors.length > 0 && (
            <Section eyebrow="Errors & Warnings" title="Module Diagnostics" count={errors.length}>
              <Table
                rows={errors}
                empty="No errors encountered."
                columns={[
                  { key: 'module', label: 'Module', code: true },
                  { key: 'error', label: 'Error Detail', render: (r) => r.error || r.message },
                  { key: 'reason', label: 'Failure Reason' },
                  { key: 'timestamp', label: 'Time', render: (r) => formatDate(r.timestamp) },
                ]}
              />
            </Section>
          )}
        </>
      )}

      {/* Report Download Bar */}
      {scanId && (
        <div className="report-bar">
          <div className="report-bar-left">
            <div className="report-bar-icon">
              <ShieldCheck size={22} />
            </div>
            <div className="report-bar-text">
              <strong>Export Assessment Deliverables</strong>
              <span>Verified genuine scan observations compiled by the backend engine.</span>
            </div>
          </div>
          <div className="report-actions">
            <a href={reportUrl(scanId, 'json')} download className="btn-secondary">
              <Download size={14} /> Download JSON
            </a>
            <a href={reportUrl(scanId, 'html')} download className="btn-primary">
              <Download size={14} /> Download HTML Report
            </a>
          </div>
        </div>
      )}
    </main>
  )
}

