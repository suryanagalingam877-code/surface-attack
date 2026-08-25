# Surface Attack Recon Console

<p align="center">
  <img src="docs/images/banner.jpg" alt="Surface Attack Recon Console Banner" width="100%" style="border-radius: 12px; box-shadow: 0 12px 36px rgba(0,0,0,0.6);" />
</p>

> **Liquid Glass & Cyber Reconnaissance Platform** — 100% genuine, real-data-only, non-destructive web reconnaissance for authorized security assessments.

<p align="center">
  <img src="docs/images/dashboard.jpg" alt="Liquid Glass Dashboard Preview" width="100%" style="border-radius: 12px; box-shadow: 0 12px 36px rgba(0,0,0,0.6);" />
</p>

Mini Pentest Framework / Surface Attack Recon Console turns a single domain name into a focused reconnaissance report. It checks the target through actual DNS queries, HTTP/HTTPS requests, TLS connections, passive web-content analysis, and deterministic security rules.

No fake scan output. No mock dummy data. No port scanner. No Nmap.

## What It Does

Real-data reconnaissance across nine operational areas:

| Area | Observations |
| --- | --- |
| DNS | A, AAAA, CNAME, MX, NS, TXT records |
| HTTP/HTTPS | Status, redirects, headers, content type, server, response time |
| HTTPS Security | Availability, HTTP-to-HTTPS redirect, HSTS, mixed content, enforcement |
| TLS | Certificate, issuer, validity, SANs, cipher, hostname match, TLS version |
| Security Headers | Content-Security-Policy, HSTS, X-Frame-Options, and six more |
| Cookies | Name, Secure, HttpOnly, SameSite, Domain, Path, Expires, Max-Age |
| Discovery | Subdomains, API endpoints, JavaScript endpoints |
| Technologies | Fingerprinted technologies from HTTP headers and HTML |
| Findings | Deterministic security observations with real evidence |
| Security Posture | Real-time risk score calculated from actual observations |
| Reports | JSON and HTML reports from real scan results |

Every value comes from the target or from a genuine failed check. No dummy data. No fake results.

## Quick Start

**Step 1: Clone the repository**

```bash
git clone https://github.com/suryanagalingam877-code/surface-attack.git
cd surface-attack
```

**Step 2: Create the Python environment and install dependencies**

Windows:
```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
```

Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

**Step 3: Run the application**

```powershell
python main.py
```

- On **Windows**, the browser opens automatically to the dashboard.
- On **Linux**, the terminal asks for the target domain interactively.
- The root launcher automatically delegates to `backend/.venv` if dependencies are missing.
- No separate frontend build command is needed; the production bundle is included.

## Platform Modes

### Windows: browser mode

Windows opens a local dashboard automatically. The Python process serves both the backend and the built React frontend.

```powershell
cd D:\pentst
python main.py
```

The server binds to `127.0.0.1` and selects an available local port. The browser opens automatically.

### Linux, Kali, Ubuntu: terminal mode

Linux asks for the domain in the terminal and keeps the complete workflow in the terminal.

```bash
cd /path/to/pentst
python3 main.py
```

The terminal displays real module states, findings, errors, and report paths. It does not open a browser by default.

### Force a mode

```powershell
python main.py --cli
python main.py --web
```

```bash
python3 main.py --cli
python3 main.py --web
```

The domain is entered interactively. It is not required as a command-line argument.

## First-Time Setup

### 1. Create the Python environment

Windows PowerShell:

```powershell
cd D:\pentst
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
```

Linux:

```bash
cd /path/to/pentst
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

### 2. Optional frontend development build

The tested production frontend is included, so this step is not required for normal use. Run it only after changing frontend source files:

```powershell
cd D:\pentst\frontend
npm install
npm run build
```

Then start the application from the repository root:

```powershell
cd D:\pentst
python main.py
```

Node.js is needed for frontend development and builds. It is not needed while the already-built dashboard is being served by Python.

## Development Workflow

Run the backend API directly when developing:

```powershell
cd D:\pentst
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

In a second terminal, run Vite with its `/api` proxy:

```powershell
cd D:\pentst\frontend
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://127.0.0.1:5173`.

The Vite proxy forwards frontend requests to FastAPI at `http://127.0.0.1:8000`. If port 5173 is already occupied, Vite selects another port and displays it.

## Scan Lifecycle

The dashboard sends the entered domain to the backend:

```text
Domain input
    |
    v
POST /api/scan
    |
    v
Domain validation
    |
    v
Background scan engine
    |
    +-- DNS
    +-- HTTP/HTTPS
    +-- TLS
    +-- Subdomains
    +-- API discovery
    +-- Headers and cookies
    +-- Technology detection
    +-- robots.txt and sitemap
    |
    v
GET /api/scan/{scan_id}/status
    |
    v
GET /api/scan/{scan_id}/results
```

The accepted scan returns `STARTED`. The status endpoint reports the actual lifecycle state: `QUEUED`, `RUNNING`, `COMPLETED`, `PARTIAL`, or `FAILED`.

Reports are available at:

```text
GET /api/scan/{scan_id}/report/json
GET /api/scan/{scan_id}/report/html
```

FastAPI documentation is available at `/docs` when the API server is running.

## Configuration

Copy `backend/.env.example` to `backend/.env` and adjust only what your authorized test environment requires:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite or another SQLAlchemy database URL |
| `REQUEST_TIMEOUT` | Network timeout in seconds |
| `MAX_CONCURRENCY` | Upper bound for concurrent checks |
| `REQUEST_DELAY` | Optional request delay for conservative discovery |
| `USER_AGENT` | HTTP identification string |
| `MAX_REDIRECTS` | Redirect limit |
| `MAX_RESPONSE_SIZE` | Maximum response bytes retained |
| `SUBDOMAIN_WORDLIST` | Wordlist path |
| `REPORT_DIRECTORY` | Generated report directory |

The default server binding is local-only: `127.0.0.1`.

## Project Layout

```text
backend/
  main.py                 Cross-platform launcher
  app/
    api/                  Scan and report endpoints
    core/                 Configuration, logging, SQLite
    scanner/              Real reconnaissance modules
    findings/             Deterministic findings rules
    reports/              JSON and HTML report rendering
  tests/                  Unit tests
  wordlists/              Conservative subdomain candidates
frontend/
  src/                    React dashboard
  vite.config.js          Development API proxy
```

The scanner is independent from the terminal and web interfaces. Both modes use the same engine and the same result model.

## Safety Boundary

Use this framework only against domains you own or have explicit authorization to test.

The project intentionally does not implement:

- Nmap, port scanning, or service enumeration
- Exploitation or attack payloads
- Credential attacks or brute force
- JavaScript execution from target sites
- Shell execution from user input or downloaded content
- Public network binding by default

JavaScript resources are downloaded only when referenced by the target page and are treated as untrusted text for passive endpoint discovery.

## Verification

Run the test suite:

```powershell
cd D:\pentst
.\venv\Scripts\python.exe -m pytest -q backend/tests
```

Compile check:

```powershell
.\venv\Scripts\python.exe -m compileall -q backend/app backend/main.py
```

Build the frontend (optional, only after source changes):

```powershell
cd frontend
npm run build
```

All backend tests should pass (`11 passed`).

## Troubleshooting

**`No module named app`**

Run the command from `backend`, or use an absolute path to the backend interpreter and script. The application expects `backend` to be the current working directory.

**`npm cannot find package.json`**

Run npm commands from `frontend`, not from the workspace root.

**Port 5173 is already in use**

Vite automatically selects another local port. Use the URL printed by Vite.

**The Windows page shows the fallback dashboard**

Build the React frontend first:

```powershell
cd D:\pentst\frontend
npm install
npm run build
```

Then rerun `python main.py` from `backend`.

**A scan is `PARTIAL`**

Open the Errors section or inspect the report. A partial scan means one or more real modules failed; failed checks are preserved rather than presented as successful results. Check the timeline and error logs to identify which module failed.

**The root launcher says "Dependencies are missing"**

Run:
```powershell
python -m pip install -r backend\requirements.txt
```

The root launcher will automatically delegate to `backend/.venv` if it is available and correctly installed.

## Features Summary

### Real HTTPS Security Analysis
- HTTPS availability and reachability
- HTTP-to-HTTPS redirect enforcement detection
- HSTS header parsing (max-age, includeSubDomains, preload)
- Mixed-content detection from actual HTML
- TLS version, cipher, and certificate details
- Certificate validity, SAN, and hostname matching

### Security Posture Scoring
- Real-time risk calculation from actual observations
- Deterministic scoring rules with documented evidence
- Rule-based feedback: "Why this score?"

### Attack Surface Inventory
- Domain, subdomains, API endpoints, JavaScript, external resources
- Each asset linked to its discovery source
- Evidence for every observation

### Reconnaissance Graph
- Visual relationship map of discovered assets
- Clickable nodes with source and evidence
- Real data only; no placeholder connections

### Scan Timeline
- Recorded events for every module
- Module lifecycle: RUNNING, COMPLETED, FAILED
- Real timestamps

### Dashboard & CLI
- Cyber-themed dark UI with cyan/green accents
- Responsive tables and panels
- Linux terminal mode with full scan summary
- Windows browser mode with interactive exploration

## License

See [LICENSE](LICENSE).
