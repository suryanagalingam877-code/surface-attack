# Surface Attack Recon Console

<p align="center">
  <img src="docs/images/banner.jpg" alt="Surface Attack Recon Console Banner" width="100%" style="border-radius: 12px; box-shadow: 0 12px 36px rgba(0,0,0,0.6);" />
</p>

> **Liquid Glass & Cyber Reconnaissance Platform** — 100% genuine, real-data-only, non-destructive web reconnaissance for authorized security assessments.

<p align="center">
  <img src="docs/images/dashboard.jpg" alt="Liquid Glass Dashboard Preview" width="100%" style="border-radius: 12px; box-shadow: 0 12px 36px rgba(0,0,0,0.6);" />
</p>

Mini Pentest Framework / Surface Attack Recon Console turns a single domain name into a focused reconnaissance report. It checks the target through actual DNS queries, HTTP/HTTPS requests, TLS connections, passive web-content analysis, and deterministic security rules.

**Architecture:** Strictly **Web-Based** (FastAPI backend + Browser UI) and **Terminal-Based** (Python CLI) only. Pure lightweight Python — no native app wrappers, no electron, and no complex containers required.

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
| Discovery | Subdomains (300+ wordlist), API endpoints, JavaScript endpoints |
| Technologies | Fingerprinted technologies from HTTP headers and HTML |
| Findings | Deterministic security observations with real evidence |
| Security Posture | Real-time risk score calculated from actual observations |
| Reports | JSON and standalone HTML reports from real scan results |

Every value comes from the target or from a genuine failed check. No dummy data. No fake results.

## Quick Start

### 1. Clone & Setup

```bash
git clone https://github.com/suryanagalingam877-code/surface-attack.git
cd surface-attack
```

**Linux / Kali / Ubuntu:**
```bash
# Install Python venv if not present: sudo apt install python3-venv python3-pip -y
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

**Windows (PowerShell):**
```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

---

### 2. How to Run (Linux, macOS & Windows)

The application automatically adapts to your operating system:

#### 🪟 Windows (Defaults to Web Browser Mode)
Running without arguments opens the Cyber Reconnaissance Web Dashboard automatically in your browser:
```powershell
python main.py
```
*(Or explicitly specify `--web`: `python main.py --web`, or double-click `run.bat` / run `.\run.ps1`)*

To run a terminal CLI scan on Windows:
```powershell
python main.py example.com
# or
python main.py example.com --cli
```

---

#### 🐧 Linux, Kali, Ubuntu & macOS (Defaults to Terminal Mode)
Running without arguments runs interactive reconnaissance directly in your terminal:
```bash
python3 main.py
```
*(Prompts for the target domain interactively and outputs formatted live terminal findings + JSON/HTML reports)*

To start the Web Dashboard on Linux:
```bash
python3 main.py --web
```
*Access in any browser at:* **`http://127.0.0.1:8000/`**

To scan a target domain directly via CLI on Linux:
```bash
python3 main.py example.com
# or
python3 main.py example.com --cli
```

---

### ⚡ 1-Click Automated Scripts (Optional)

If you prefer an automated 1-click launcher that activates the virtual environment and checks dependencies for you:

| Platform | Command | Mode Launched |
| :--- | :--- | :--- |
| **Linux / Kali / macOS** | `./run.sh` | Terminal mode (or `./run.sh --web` for Web) |
| **Windows (PowerShell)** | `.\run.ps1` | Web Console |
| **Windows (CMD / Double-click)** | `run.bat` | Web Console |


### Optional Frontend Development Build

The tested production frontend bundle is already compiled and included in `frontend/dist/`. Building with Node is only needed when editing frontend source code:

```powershell
cd frontend
npm run build
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

### ⚡ Instant Scan & Resilient Target Input
- **Instant Scan on Enter**: Type any domain or website name and press `Enter` to run the scan immediately.
- **Auto-Normalizing Inputs**:
  - Plain website names (e.g. `google` or `railfeast` -> `google.com` / `railfeast.com`).
  - Full URLs with paths (e.g. `https://railfeast.com/about` -> `railfeast.com`).
  - URLs with ports or queries (e.g. `example.com:443?ref=test` -> `example.com`).
- **Quick Preset Chips**: 1-click test launches for `scanme.nmap.org` and `example.com`.

### 📂 Persistent Assessment History
- **SQLite Database Persistence**: Every scan is automatically recorded and preserved.
- **Inline History Feed**: Recent assessments appear right on the home landing page.
- **Slide-Out History Drawer**: Click `History (N)` from the top navigation bar anytime.
- **Instant Loading**: 1-click `View` button reloads any past assessment directly into the dashboard with zero re-scanning.
- **Standalone HTML Export & Deletion**: Quick links to download reports and delete individual records or clear history.

### 🎨 Luminous Aurora & Liquid Crystal Glass UI
- **Interactive Cyber Canvas**: Dynamic horizon perspective grid, floating luminous plasma clouds (cyan, indigo, magenta, emerald), and mouse-reactive constellation particle mesh.
- **Liquid Crystal Glass Cards**: `backdrop-filter: blur(28px) saturate(190%)` with white-glass specular highlights and fluid glowing borders.
- **Executive Posture Gauge**: Conic gradient score ring with risk level letter grade (`Grade A`, `Grade B`, `Grade C`, `Grade D`) and deterministic rule breakdown.

### 🛡️ Real HTTPS & Transport Security
- HTTPS availability and reachability.
- HTTP-to-HTTPS redirect enforcement detection.
- HSTS header parsing (`max-age`, `includeSubDomains`, `preload`).
- Mixed-content detection from actual HTML source.
- TLS version, cipher suite, issuer, and certificate validity dates.
- SAN matching and hostname verification.

### 🌐 Attack Surface Inventory & Recon Graph
- Discovered subdomains, API endpoints, JavaScript references.
- Interactive graph nodes linked with authentic discovery evidence.
- Zero mock or placeholder connections.

### 📄 Executive Reporting
- Standalone self-contained Dark Glass HTML report.
- Machine-readable JSON report.

## Verification

Run the test suite:

```powershell
cd D:\pentst\backend
.\.venv\Scripts\python.exe -m pytest -q tests
```

Compile check:

```powershell
cd D:\pentst\backend
.\.venv\Scripts\python.exe -m compileall -q app main.py
```

Build the frontend (optional, only needed when editing frontend source code):

```powershell
cd D:\pentst\frontend
npm run build
```

All backend tests pass (`13 passed in 1.41s`).

## Troubleshooting

**`No module named app`**

Run the command from `backend`, or use the root launchers (`run.bat`, `.\run.ps1`, `./run.sh`, `python main.py`). The application automatically configures Python import paths.

**`Dependencies are missing`**

Run:
```powershell
python -m pip install -r backend\requirements.txt
```
Or run `run.bat` / `.\run.ps1` / `./run.sh` to automatically set up the virtual environment and install dependencies.

**Port 5173 is already in use**

Vite automatically selects another local port. Use the URL printed by Vite.

**A scan is `PARTIAL`**

Open the Errors section or inspect the report. A partial scan means one or more real modules failed; failed checks are preserved rather than presented as successful results. Check the timeline and error logs to identify which module failed.

## License

See [LICENSE](LICENSE).

