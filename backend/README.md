# Recon Console API

Educational, real-data-only web reconnaissance backend for authorized testing. It accepts domain names only and performs non-destructive DNS, HTTP/HTTPS, TLS, passive discovery, and deterministic configuration observations. It does not use Nmap or execute target content.

## Run

Windows:

```powershell
py -3.11 -m venv .venv
.venv\\Scripts\\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python main.py
```

This single command serves the built React frontend and FastAPI backend together, then opens the dashboard in the default browser. Node.js is only needed when rebuilding frontend source changes.

Linux/Kali defaults to terminal mode:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python3 main.py
```

Use `python main.py --web` or `python3 main.py --web` to open the local dashboard explicitly.

Linux default mode stays in the terminal and asks for the domain interactively. It does not open a browser unless `--web` is supplied.

The Windows dashboard opens automatically on a loopback port. The API docs are available at the printed local URL followed by `/docs`.

Only scan domains you own or have explicit authorization to test.
