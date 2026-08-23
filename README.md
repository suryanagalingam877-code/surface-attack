# Mini Pentest Framework

> Real-data-only, non-destructive web reconnaissance for authorized security testing.

Mini Pentest Framework turns a single domain name into a focused reconnaissance report. It checks the target through actual DNS queries, HTTP/HTTPS requests, TLS connections, passive web-content analysis, and deterministic security rules.

No fake scan output. No port scanner. No Nmap.

## What It Does

| Area | Observations |
| --- | --- |
| DNS | A, AAAA, CNAME, MX, NS, and TXT records |
| Web | HTTP/HTTPS status, redirects, headers, content type, server, response time |
| TLS | Certificate subject, issuer, validity, hostname match, and TLS version |
| Discovery | Wordlist-based subdomain resolution and passive API endpoint discovery |
| Application surface | Cookies, technologies, robots.txt, and sitemap.xml |
| Findings | Deterministic configuration observations with traceable evidence |
| Reports | JSON and HTML reports generated from the scan result |

Every value comes from the target or from a failed check recorded by the scanner. Missing information remains missing.

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

### 2. Build the frontend once for Windows browser mode

The compiled frontend is intentionally ignored by Git. Build it after cloning or after frontend changes:

```powershell
cd D:\pentst\frontend
npm install
npm run build
```

Then start the application from `backend`:

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

From `backend`:

```powershell
.\.venv\Scripts\python.exe -m compileall -q app main.py
.\.venv\Scripts\python.exe -m pytest -q
```

From `frontend`:

```powershell
npm run build
```

The project should report seven passing backend tests and a successful Vite production build.

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

Open the Errors section or inspect the report. A partial scan means one or more real modules failed; failed checks are preserved rather than presented as successful results.

## License

See [LICENSE](LICENSE).
