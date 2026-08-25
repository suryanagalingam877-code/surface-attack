import {
  Radar,
  Shield,
  TriangleAlert,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Layers,
  Activity,
  ArrowRight,
} from 'lucide-react'
import DomainInput from './components/DomainInput'
import ScanStatus from './components/ScanStatus'
import Dashboard from './components/Dashboard'
import { useScan } from './hooks/useScan'

export default function App() {
  const { scan, loading, error, run } = useScan()

  if (scan) {
    const domain = scan.domain || scan.target_domain || 'Active Target'
    return (
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-mark">
              <Radar size={20} />
            </span>
            <span>
              RECON<span className="accent">/</span>CONSOLE
            </span>
          </div>

          <div className="side-label">Workspace</div>
          <nav className="side-nav">
            <div className="side-item active">
              <div className="side-item-left">
                <Shield size={16} />
                <span>Recon Overview</span>
              </div>
              <span className="side-badge">Active</span>
            </div>
            <div className="side-item" onClick={() => window.location.reload()}>
              <div className="side-item-left">
                <Activity size={16} />
                <span>New Target</span>
              </div>
            </div>
          </nav>

          <div className="side-footer">
            <div className="side-target-card">
              <span>Current Target</span>
              <strong>{domain}</strong>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="environment" style={{ padding: '2px 8px', fontSize: 10 }}>
                  <i /> Live Target Data
                </span>
              </div>
            </div>
          </div>
        </aside>

        <Dashboard scan={scan} onReset={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="landing">
      <header className="landing-top">
        <div className="brand">
          <span className="brand-mark">
            <Radar size={20} />
          </span>
          <span>
            RECON<span className="accent">/</span>CONSOLE
          </span>
        </div>
        <span className="environment">
          <i /> API READY &bull; REAL-DATA ENGINE
        </span>
      </header>

      <main className="hero">
        <div className="hero-copy">
          <div className="eyebrow-pill">
            <ShieldCheck size={14} />
            <span>Authorized Security Reconnaissance</span>
          </div>
          <h1>
            Map your domain's <br />
            <em>exposure surface.</em>
          </h1>
          <p>
            Execute real-time passive reconnaissance against any target domain. Inspect authentic DNS records, TLS certificate integrity, HTTP security posture, discovered subdomains, and deterministic findings.
          </p>

          <div className="hero-features">
            <div className="feature-pill">
              <Shield size={16} />
              <span>100% Genuine Target Signals</span>
            </div>
            <div className="feature-pill">
              <Zap size={16} />
              <span>Zero Mock or Dummy Data</span>
            </div>
            <div className="feature-pill">
              <Lock size={16} />
              <span>Transport & TLS Diagnostics</span>
            </div>
            <div className="feature-pill">
              <Layers size={16} />
              <span>Executive Posture Scoring</span>
            </div>
          </div>
        </div>

        <div className="scan-box">
          <div className="box-heading">
            <div>
              <span className="eyebrow">Target Assessment</span>
              <h2>Launch Reconnaissance</h2>
            </div>
            <span className="step">Target Probe &bull; 01</span>
          </div>

          <DomainInput onSubmit={run} disabled={loading} />

          {loading && (
            <div className="running-state">
              <div className="running-state-top">
                <ScanStatus status="RUNNING" />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Probing DNS, TLS & Headers...</span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-inner" />
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <TriangleAlert size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block' }}>Scan Failed</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="scope-note">
            <Shield size={16} style={{ color: 'var(--emerald)', flexShrink: 0 }} />
            <span>Non-destructive, passive reconnaissance only. Ensure target authorization.</span>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <span><Globe size={13} /> AUTHENTIC RECONNAISSANCE</span>
        <span><Lock size={13} /> PASSIVE NETWORK OBSERVATION</span>
        <span><Shield size={13} /> BACKEND SOURCE OF TRUTH</span>
      </footer>
    </div>
  )
}
