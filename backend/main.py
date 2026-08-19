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
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Mini Pentest Framework: authorized, non-destructive domain reconnaissance.")
    parser.add_argument("domain", nargs="?", help=argparse.SUPPRESS)
    modes = parser.add_mutually_exclusive_group(); modes.add_argument("--cli", action="store_true", help="Force terminal mode"); modes.add_argument("--web", action="store_true", help="Force local web mode")
    args = parser.parse_args()
    print("Only scan domains you own or have explicit authorization to test.")
    init_db(); use_web = args.web or (not args.cli and platform.system() == "Windows")
    return run_web() if use_web else run_cli(args.domain)

if __name__ == "__main__": raise SystemExit(main())
