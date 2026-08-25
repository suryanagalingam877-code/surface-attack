import { useState } from 'react'
import {
  Radar,
  Shield,
  TriangleAlert,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Layers,
  History,
} from 'lucide-react'
import DomainInput from './components/DomainInput'
import ScanStatus from './components/ScanStatus'
import Dashboard from './components/Dashboard'
import ScanHistory from './components/ScanHistory'
import CyberBackground from './components/CyberBackground'
import { useScan } from './hooks/useScan'

export default function App() {
  const {
    scan,
    loading,
    error,
    history,
    run,
    loadScan,
    deleteHistoryScan,
    clearHistory,
    resetScan,
  } = useScan()

  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)

  if (scan) {
    const domain = scan.domain || scan.target_domain || 'Active Target'
    return (
      <div className="app-shell">
        <CyberBackground />
        <header className="global-nav">
          <div className="nav-brand" onClick={resetScan} style={{ cursor: 'pointer' }} title="Reset to Home">
            <span className="brand-mark">
              <Radar size={20} />
            </span>
            <span>
              RECON<span className="accent">/</span>CONSOLE
            </span>
          </div>

          <div className="nav-target-badge">
            <span className="live-dot" />
            <span className="target-label">TARGET:</span>
            <strong>{domain}</strong>
          </div>

          <div className="nav-actions">
            <button
              className="btn-secondary"
              onClick={() => setHistoryDrawerOpen(true)}
              title="View past assessments"
            >
              <History size={14} />
              <span>History ({history.length})</span>
            </button>

            <button className="btn-primary" onClick={resetScan}>
              <Zap size={14} /> New Scan
            </button>
          </div>
        </header>

        <Dashboard scan={scan} onReset={resetScan} />

        <ScanHistory
          isDrawer={true}
          isOpen={historyDrawerOpen}
          onClose={() => setHistoryDrawerOpen(false)}
          history={history}
          onSelectScan={(id) => {
            setHistoryDrawerOpen(false)
            loadScan(id)
          }}
          onDeleteScan={deleteHistoryScan}
          onClearHistory={clearHistory}
        />
      </div>
    )
  }

  return (
    <div className="landing">
      <CyberBackground />
      <header className="landing-top">
        <div className="brand">
          <span className="brand-mark">
            <Radar size={20} />
          </span>
          <span>
            RECON<span className="accent">/</span>CONSOLE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {history.length > 0 && (
            <button
              className="btn-secondary"
              onClick={() => setHistoryDrawerOpen(true)}
              title="Open Assessment History"
            >
              <History size={14} />
              <span>History ({history.length})</span>
            </button>
          )}

          <span className="environment">
            <i /> API READY &bull; REAL-DATA ENGINE
          </span>
        </div>
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

      {/* Inline Recent History on Landing Page */}
      {history.length > 0 && (
        <section className="landing-history-section">
          <ScanHistory
            isDrawer={false}
            history={history}
            onSelectScan={loadScan}
            onDeleteScan={deleteHistoryScan}
            onClearHistory={clearHistory}
          />
        </section>
      )}

      <footer className="landing-footer">
        <span><Globe size={13} /> AUTHENTIC RECONNAISSANCE</span>
        <span><Lock size={13} /> PASSIVE NETWORK OBSERVATION</span>
        <span><Shield size={13} /> PERSISTED SQLITE ENGINE</span>
      </footer>

      {/* Drawer */}
      <ScanHistory
        isDrawer={true}
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        history={history}
        onSelectScan={(id) => {
          setHistoryDrawerOpen(false)
          loadScan(id)
        }}
        onDeleteScan={deleteHistoryScan}
        onClearHistory={clearHistory}
      />
    </div>
  )
}

