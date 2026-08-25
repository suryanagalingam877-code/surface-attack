import html
import json
from app.reports.json_report import render_json


def render_html(report: dict) -> bytes:
    target = html.escape(str(report.get("target", "Target Assessment")))
    status = html.escape(str(report.get("status", "UNKNOWN")).upper())
    scan_id = html.escape(str(report.get("scan_id", "N/A")))
    start_time = html.escape(str(report.get("start_time") or "N/A"))
    end_time = html.escape(str(report.get("end_time") or "N/A"))

    findings = report.get("findings", [])
    if not isinstance(findings, list):
        findings = []

    posture = report.get("security_posture", {})
    if not isinstance(posture, dict):
        posture = {}

    score = posture.get("score", "N/A")
    max_score = posture.get("max_score", "100")

    raw_json_str = render_json(report).decode("utf-8")
    escaped_json = html.escape(raw_json_str)

    # Render findings rows
    findings_html = ""
    if findings:
        for f in findings:
            sev = html.escape(str(f.get("severity", "INFO")).upper())
            title = html.escape(str(f.get("title", "Observation")))
            desc = html.escape(str(f.get("description", "")))
            rec = html.escape(str(f.get("recommendation", "Standard configuration")))
            sev_class = sev.lower()
            findings_html += f"""
            <div class="finding sev-{sev_class}">
                <div class="finding-header">
                    <span class="badge badge-{sev_class}">{sev}</span>
                    <strong>{title}</strong>
                </div>
                <p>{desc}</p>
                <div class="meta-row"><strong>Remediation:</strong> {rec}</div>
            </div>
            """
    else:
        findings_html = "<div class='empty'>No security findings observed in this scan scope.</div>"

    doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Recon Security Report - {target}</title>
<style>
  :root {{
    --bg: #05070c;
    --surface: rgba(13, 19, 32, 0.85);
    --border: rgba(255, 255, 255, 0.08);
    --text: #f1f5f9;
    --muted: #8492a6;
    --primary: #38bdf8;
    --emerald: #10b981;
    --rose: #f43f5e;
    --amber: #f59e0b;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    padding: 40px 20px;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
  }}
  .container {{
    max-width: 1080px;
    margin: 0 auto;
  }}
  header {{
    background: var(--surface);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px 32px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }}
  .header-left h1 {{ margin: 0 0 6px; font-size: 26px; font-weight: 800; color: #fff; }}
  .header-left .meta {{ color: var(--muted); font-size: 13px; font-family: monospace; }}
  .score-box {{
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: var(--emerald);
    padding: 12px 20px;
    border-radius: 12px;
    text-align: right;
    font-family: monospace;
  }}
  .score-box strong {{ font-size: 22px; display: block; }}
  .panel {{
    background: var(--surface);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px 28px;
    margin-bottom: 24px;
  }}
  .panel h2 {{ margin: 0 0 16px; font-size: 18px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; }}
  .grid {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }}
  .field {{
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 14px;
  }}
  .field span {{ display: block; font-size: 11px; text-transform: uppercase; color: var(--muted); font-family: monospace; }}
  .field strong {{ display: block; font-size: 13px; font-family: monospace; color: #fff; margin-top: 4px; word-break: break-all; }}
  .finding {{
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  }}
  .finding.sev-critical {{ border-left: 4px solid var(--rose); }}
  .finding.sev-high {{ border-left: 4px solid #ea580c; }}
  .finding.sev-medium {{ border-left: 4px solid var(--amber); }}
  .finding.sev-low {{ border-left: 4px solid var(--primary); }}
  .finding.sev-info {{ border-left: 4px solid #06b6d4; }}
  .finding-header {{ display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }}
  .badge {{
    font-family: monospace;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }}
  .badge-critical, .badge-high {{ background: rgba(244, 63, 94, 0.15); color: var(--rose); }}
  .badge-medium {{ background: rgba(245, 158, 11, 0.15); color: var(--amber); }}
  .badge-low, .badge-info {{ background: rgba(56, 189, 248, 0.15); color: var(--primary); }}
  .meta-row {{ font-size: 12px; color: var(--muted); margin-top: 8px; }}
  .empty {{ padding: 24px; text-align: center; color: var(--muted); font-size: 13px; }}
  details summary {{
    cursor: pointer;
    font-family: monospace;
    font-size: 13px;
    color: var(--primary);
    padding: 8px 0;
  }}
  pre.raw-json {{
    background: #020408;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    color: #94a3b8;
    font-family: monospace;
    font-size: 11px;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 400px;
    overflow-y: auto;
  }}
</style>
</head>
<body>
<div class="container">
  <header>
    <div class="header-left">
      <h1>Executive Reconnaissance Report</h1>
      <div class="meta">Target: {target} &bull; Status: {status} &bull; Scan ID: {scan_id}</div>
    </div>
    <div class="score-box">
      <span>Security Posture</span>
      <strong>{score} / {max_score}</strong>
    </div>
  </header>

  <div class="panel">
    <h2>Scan Overview</h2>
    <div class="grid">
      <div class="field"><span>Target Domain</span><strong>{target}</strong></div>
      <div class="field"><span>Execution Status</span><strong>{status}</strong></div>
      <div class="field"><span>Start Time</span><strong>{start_time}</strong></div>
      <div class="field"><span>End Time</span><strong>{end_time}</strong></div>
    </div>
  </div>

  <div class="panel">
    <h2>Security Findings ({len(findings)})</h2>
    {findings_html}
  </div>

  <div class="panel">
    <h2>Raw Verified Telemetry</h2>
    <details>
      <summary>View Complete JSON Assessment Payload</summary>
      <pre class="raw-json">{escaped_json}</pre>
    </details>
  </div>
</div>
</body>
</html>
"""
    return doc.encode("utf-8")

