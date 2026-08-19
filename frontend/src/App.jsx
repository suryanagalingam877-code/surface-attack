import { Radar, Shield, TriangleAlert } from 'lucide-react'
import DomainInput from './components/DomainInput'
import ScanStatus from './components/ScanStatus'
import Dashboard from './components/Dashboard'
import { useScan } from './hooks/useScan'

export default function App() {
  const { scan, loading, error, run } = useScan()
  if (scan) return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark"><Radar size={19} /></span><span>RECON<span className="accent">/</span>CONSOLE</span></div><div className="side-label">Workspace</div><div className="side-item active"><Shield size={16} />Recon dashboard</div><div className="side-footer">Passive analysis<br /><span>Backend source of truth</span></div></aside><Dashboard scan={scan} onReset={() => window.location.reload()} /></div>
  return <div className="landing"><div className="landing-top"><div className="brand"><span className="brand-mark"><Radar size={19} /></span><span>RECON<span className="accent">/</span>CONSOLE</span></div><span className="environment"><i /> API CONNECTED</span></div><div className="hero"><div className="hero-copy"><span className="eyebrow">Web reconnaissance framework</span><h1>Understand your<br /><em>exposure surface.</em></h1><p>Run a focused, non-destructive assessment against a single domain. Every signal shown here comes directly from your backend.</p></div><div className="scan-box"><div className="box-heading"><div><span className="eyebrow">New assessment</span><h2>Target a domain</h2></div><span className="step">01 / 01</span></div><DomainInput onSubmit={run} disabled={loading} />{loading && <div className="running-state"><ScanStatus status="RUNNING" /><span>Waiting for backend results...</span></div>}{error && <div className="error-banner"><TriangleAlert size={17} /><span>{error}</span></div>}<div className="scope-note"><Shield size={15} /><span>Passive and non-destructive modules only</span></div></div></div><div className="landing-footer"><span>REAL-TIME RECONNAISSANCE</span><span>NO PORT SCANNING</span><span>DATA FROM YOUR BACKEND</span></div></div>
}
