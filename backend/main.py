import argparse
import json
import platform
import socket
import threading
import uuid
import webbrowser
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings
from app.core.database import init_db
from app.reports.html_report import render_html
from app.reports.json_report import build_report, render_json
from app.scanner.engine import run_scan
from app.scanner.scope import normalize_domain


def available_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0)); return sock.getsockname()[1]


def run_cli(domain: str | None = None) -> int:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    console = Console(); scan_id = str(uuid.uuid4()); started = datetime.now(timezone.utc)
    console.print(Panel.fit("MINI PENTEST FRAMEWORK\nAuthorized, non-destructive reconnaissance", style="green"))
    if not domain:
        domain = console.input("Target domain: ").strip()
    domain, valid, reason = normalize_domain(domain)
    if not valid:
        console.print(f"[red]Invalid domain:[/red] {reason}")
        return 2
    console.print(f"Target: [bold]{domain}[/bold]")
    def show_module(name, status, _progress):
        color = "green" if status == "COMPLETED" else "yellow" if status == "RUNNING" else "red"
        console.print(f"[{color}][{status}][/{color}] {name}")

    results, findings, errors = run_scan(domain, progress=show_module)
    for error in errors: console.print(f"[red][FAILED][/red] {error.get('module')}: {error.get('error')}")
    https = results.get("http", {})
    tls = results.get("tls", {})
    console.print(Panel.fit(
        f"HTTPS: {https.get('https_available', 'NOT_AVAILABLE')}\n"
        f"HTTP -> HTTPS: {https.get('http_to_https', {}).get('state', 'UNKNOWN')}\n"
        f"TLS: {tls.get('tls_version', 'NOT_AVAILABLE')}\n"
        f"Certificate: {tls.get('status', 'NOT_AVAILABLE')}\n"
        f"HSTS: {https.get('hsts', {}).get('raw_value', 'NOT_OBSERVED')}\n"
        f"Mixed content: {len(https.get('mixed_content', []))} observed",
        title="HTTPS SECURITY",
        border_style="cyan",
    ))
    class ScanView:
        pass
    scan = ScanView(); scan.domain = domain; scan.scan_id = scan_id; scan.status = "PARTIAL" if errors else "COMPLETED"; scan.start_time = started.replace(tzinfo=None); scan.end_time = datetime.now(timezone.utc).replace(tzinfo=None)
    report = build_report(scan, results, findings, errors); directory = Path(settings.report_directory); directory.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S"); json_path = directory / f"scan_{stamp}.json"; html_path = directory / f"scan_{stamp}.html"; json_path.write_bytes(render_json(report)); html_path.write_bytes(render_html(report))
    table = Table(title="Findings from actual checks"); table.add_column("Severity"); table.add_column("Count", justify="right")
    for severity in ("INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"): table.add_row(severity, str(sum(1 for item in findings if item.get("severity") == severity)))
    console.print(table); console.print(f"JSON report: {json_path}"); console.print(f"HTML report: {html_path}")
    return 0


def run_web() -> int:
    import asyncio
    import signal
    import uvicorn
    from fastapi.staticfiles import StaticFiles
    from app.main import app
    dist = Path(__file__).resolve().parents[1] / "frontend" / "dist"
    if dist.is_dir() and (dist / "index.html").is_file():
        app.mount("/", StaticFiles(directory=dist, html=True), name="frontend")
    else:
        from app.web import router as dashboard_router
        app.include_router(dashboard_router)
    port = available_port(); url = f"http://127.0.0.1:{port}/"
    print(f"Local server: {url}")
    print("Press Ctrl+C to stop.")
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="info")
    server = uvicorn.Server(config)
    def signal_handler(signum, frame):
        print("\n[!] Shutting down local server...")
        server.should_exit = True
        server.force_exit = True

    try:
        signal.signal(signal.SIGINT, signal_handler)
    except Exception:
        pass

    try:
        asyncio.run(server.serve())
    except (KeyboardInterrupt, SystemExit):
        return 0
    return 0



def main() -> int:
    parser = argparse.ArgumentParser(
        description="Recon Console: authorized, non-destructive domain reconnaissance (Web & Terminal only)."
    )
    parser.add_argument("domain", nargs="?", default=None, help="Target domain to scan in CLI mode (e.g. example.com)")
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--cli", action="store_true", help="Run in Terminal / CLI mode")
    modes.add_argument("--web", action="store_true", help="Run in Web UI mode (FastAPI local server)")
    args = parser.parse_args()

    print("Only scan domains you own or have explicit authorization to test.")
    try:
        init_db()
        is_windows = platform.system() == "Windows"
        if args.web:
            use_web = True
        elif args.cli:
            use_web = False
        elif args.domain is not None:
            use_web = False
        else:
            # On Windows: 'python main.py' defaults to Web UI (opens browser)
            # On Linux: 'python main.py' defaults to interactive Terminal CLI
            use_web = is_windows

        return run_web() if use_web else run_cli(args.domain)
    except KeyboardInterrupt:
        print("\n[INTERRUPTED] Application stopped by user.")
        return 0
    except Exception as exc:
        print(f"[ERROR] {exc}")
        return 1



if __name__ == "__main__":
    raise SystemExit(main())

