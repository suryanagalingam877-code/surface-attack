import { Download, ExternalLink, ShieldCheck } from 'lucide-react'
import ScanStatus from './ScanStatus'
import { EmptyState, Field, Section, Table } from './DataSection'
import { arrayOrEmpty, formatDate, formatDuration, titleCase, valueOrNA } from '../utils/formatters'
import { reportUrl } from '../services/api'

const pick = (object, ...keys) => keys.map((key) => object?.[key]).find((value) => value !== undefined && value !== null)
const asRecords = (value) => Array.isArray(value) ? value : []

function Overview({ scan }) {
  const overview = scan.overview || scan.summary || {}
  const cards = [['Subdomains discovered', pick(overview, 'subdomains_discovered', 'subdomainsCount', 'subdomains_count')], ['API endpoints discovered', pick(overview, 'api_endpoints_discovered', 'apiEndpointsCount', 'api_endpoints_count')], ['DNS records', pick(overview, 'dns_records', 'dnsRecordsCount', 'dns_records_count')], ['Security findings', pick(overview, 'security_findings', 'findingsCount', 'findings_count')], ['TLS status', pick(overview, 'tls_status', 'tlsStatus')]]
  return <><div className="metric-grid">{cards.map(([label, value]) => <div className="metric" key={label}><span>{label}</span><strong>{valueOrNA(value)}</strong></div>)}</div><Section eyebrow="Scan context" title="Overview"><div className="field-grid"><Field label="Target domain" value={pick(scan, 'domain', 'target_domain')} /><Field label="Scan status" value={<ScanStatus status={scan.status} progress={scan.progress} />} /><Field label="Started" value={formatDate(pick(scan, 'started_at', 'start_time', 'scan_start_time'))} /><Field label="Completed" value={formatDate(pick(scan, 'completed_at', 'completion_time', 'scan_completion_time'))} /><Field label="Duration" value={formatDuration(pick(scan, 'duration', 'scan_duration'), pick(scan, 'started_at', 'start_time'), pick(scan, 'completed_at', 'completion_time'))} /></div></Section></>
}

export default function Dashboard({ scan, onReset }) {
  const subdomains = asRecords(scan.subdomains || scan.subdomain_discovery)
  const endpoints = asRecords(scan.api_endpoints || scan.apiEndpoints)
  const dns = scan.dns || scan.dns_records || {}
  const tls = scan.tls || scan.ssl || {}
  const http = scan.http || scan.http_recon || {}
  const headers = asRecords(scan.security_headers || scan.headers_security)
  const cookies = asRecords(scan.cookies || scan.cookie_security)
  const technologies = asRecords(scan.technologies || scan.technology_detection)
  const findings = asRecords(scan.findings || scan.security_findings)
  const errors = asRecords(scan.errors || scan.warnings)
  const robots = scan.robots || scan.robots_txt
  const sitemap = scan.sitemap || scan.sitemap_xml
  const scanId = pick(scan, 'scan_id', 'scanId', 'id')
  return <main className="content">
    <header className="topbar"><div><span className="eyebrow">Assessment workspace</span><h1>Reconnaissance overview</h1></div><button className="quiet-button" onClick={onReset}>New scan</button></header>
    <Overview scan={scan} />
    <div className="two-col">
      <Section eyebrow="Discovery" title="Subdomains"><Table rows={subdomains} empty="No subdomains discovered." columns={[{ key: 'subdomain', label: 'Subdomain', render: (r) => r.subdomain || r.name }, { key: 'resolution', label: 'Resolution', render: (r) => r.resolved_ip || r.ip || r.resolution }, { key: 'http', label: 'HTTP', render: (r) => r.http_status || r.http }, { key: 'https', label: 'HTTPS', render: (r) => r.https_status || r.https }]} /></Section>
      <Section eyebrow="Discovery" title="API endpoints"><Table rows={endpoints} empty="No API endpoints discovered." columns={[{ key: 'endpoint', label: 'Endpoint', render: (r) => r.endpoint || r.url }, { key: 'method', label: 'Method' }, { key: 'source', label: 'Source' }, { key: 'status', label: 'Status' }]} /></Section>
    </div>
    <Section eyebrow="Infrastructure" title="DNS information"><div className="dns-grid">{['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT'].map((type) => <div className="dns-card" key={type}><span>{type}</span>{asRecords(dns[type]).length ? asRecords(dns[type]).map((record, index) => <code key={index}>{valueOrNA(record)}</code>) : <small>No records found</small>}</div>)}</div></Section>
    <div className="two-col"><Section eyebrow="Transport security" title="TLS / SSL"><div className="field-grid"><Field label="Certificate status" value={tls.status || tls.certificate_status} /><Field label="Subject" value={tls.subject || tls.certificate_subject} /><Field label="Issuer" value={tls.issuer} /><Field label="Valid from" value={formatDate(tls.valid_from)} /><Field label="Valid until" value={formatDate(tls.valid_until)} /><Field label="Days remaining" value={tls.days_remaining} /><Field label="Hostname match" value={tls.hostname_match} /><Field label="TLS version" value={tls.tls_version} /></div></Section><Section eyebrow="Transport" title="HTTP recon"><div className="field-grid"><Field label="HTTP status" value={http.status || http.http_status} /><Field label="Final URL" value={http.final_url} /><Field label="Content-Type" value={http.content_type} /><Field label="Server" value={http.server} /><Field label="Response time" value={http.response_time} /><Field label="HTTPS available" value={http.https_available} /></div></Section></div>
    <Section eyebrow="Controls" title="Security headers"><Table rows={headers} empty="No security header data returned." columns={[{ key: 'header', label: 'Header', render: (r) => r.header || r.name }, { key: 'status', label: 'Status' }, { key: 'observed_value', label: 'Observed value', render: (r) => r.observed_value || r.value }, { key: 'severity', label: 'Severity' }, { key: 'recommendation', label: 'Recommendation' }]} /></Section>
    <div className="two-col"><Section eyebrow="Session security" title="Cookies"><Table rows={cookies} empty="No cookies observed." columns={[{ key: 'name', label: 'Cookie', render: (r) => r.name || r.cookie }, { key: 'secure', label: 'Secure' }, { key: 'httponly', label: 'HttpOnly', render: (r) => r.httponly ?? r.http_only }, { key: 'samesite', label: 'SameSite' }, { key: 'domain', label: 'Domain' }, { key: 'path', label: 'Path' }]} /></Section><Section eyebrow="Fingerprinting" title="Technology detection"><Table rows={technologies} empty="No technology evidence returned." columns={[{ key: 'technology', label: 'Technology', render: (r) => r.technology || r.name }, { key: 'category', label: 'Category' }, { key: 'evidence', label: 'Evidence' }, { key: 'confidence', label: 'Confidence' }]} /></Section></div>
    <div className="two-col"><Section eyebrow="Policy files" title="robots.txt">{robots ? <pre className="readable-content">{typeof robots === 'string' ? robots : JSON.stringify(robots, null, 2)}</pre> : <EmptyState>robots.txt not available</EmptyState>}</Section><Section eyebrow="Policy files" title="sitemap.xml">{sitemap ? <div className="url-list">{asRecords(sitemap.urls || sitemap).map((url, index) => <div key={index}><ExternalLink size={14} />{valueOrNA(url)}</div>)}</div> : <EmptyState>sitemap.xml not available</EmptyState>}</Section></div>
    <Section eyebrow="Security review" title="Findings"><div className="finding-list">{findings.length ? findings.map((finding, index) => <article className="finding" key={finding.id || index}><div className="finding-top"><span className={`severity severity-${String(finding.severity || '').toLowerCase()}`}>{titleCase(finding.severity)}</span><strong>{valueOrNA(finding.title)}</strong><span className="finding-id">{valueOrNA(finding.id)}</span></div><p>{valueOrNA(finding.description)}</p><div className="finding-meta"><Field label="Category" value={finding.category} /><Field label="Affected URL" value={finding.affected_url} /><Field label="Source module" value={finding.source_module} /><Field label="Recommendation" value={finding.recommendation} /></div>{finding.evidence && <pre className="evidence">{valueOrNA(finding.evidence)}</pre>}</article>) : <EmptyState>No security findings returned.</EmptyState>}</div></Section>
    <Section eyebrow="Operations" title="Errors & warnings"><Table rows={errors} empty="No errors or warnings returned." columns={[{ key: 'module', label: 'Module' }, { key: 'error', label: 'Error', render: (r) => r.error || r.message }, { key: 'reason', label: 'Reason' }, { key: 'timestamp', label: 'Timestamp', render: (r) => formatDate(r.timestamp) }]} /></Section>
    {scanId && <div className="report-bar"><div><ShieldCheck size={19} /><span>Reports are generated by the backend for this scan.</span></div><div className="report-actions"><a href={reportUrl(scanId, 'json')} download><Download size={16} /> JSON report</a><a href={reportUrl(scanId, 'html')} download><Download size={16} /> HTML report</a></div></div>}
  </main>
}
