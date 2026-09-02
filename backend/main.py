import argparse
import json
import platform
import socket
import sys
import threading
import uuid
import webbrowser
from datetime import datetime, timezone
from pathlib import Path

# Ensure UTF-8 output encoding across all platforms/consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.core.config import settings
from app.core.database import init_db
from app.reports.html_report import render_html
from app.reports.json_report import build_report, render_json
from app.scanner.engine import run_scan
from app.scanner.scope import normalize_domain


def available_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def run_cli(domain: str | None = None) -> int:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.text import Text

    console = Console()
    scan_id = str(uuid.uuid4())
    started = datetime.now(timezone.utc)

    # Stylish Cyber Banner
    banner_text = Text()
    banner_text.append("RECON CONSOLE // ATTACK SURFACE SCANNER\n", style="bold cyan")
    banner_text.append("Authorized, 100% Real-Data Passive Reconnaissance Engine", style="dim white")
    console.print(Panel(banner_text, border_style="cyan", padding=(1, 2)))

    # Interactive Domain Input Prompt
    if not domain:
        console.print("[bold yellow]Enter target domain or website URL[/bold yellow] [dim](e.g. example.com, https://target.org)[/dim]:")
        domain = console.input("[bold cyan]Target > [/bold cyan]").strip()

    if not domain:
        console.print("[red]Error: No target domain provided.[/red]")
        return 1

    domain, valid, reason = normalize_domain(domain)
    if not valid:
        console.print(f"[bold red][!] Invalid domain:[/bold red] {reason}")
        return 2

    console.print(f"\n[*] Target Locked: [bold cyan]{domain}[/bold cyan]")
    console.print("[dim]Executing 9 concurrent reconnaissance modules...[/dim]\n")

    def show_module(name, status, _progress):
        if status == "COMPLETED":
            console.print(f"  [bold green][+][/bold green] [{status}] [white]{name}[/white]")
        elif status == "RUNNING":
            console.print(f"  [bold yellow][*][/bold yellow] [{status}] [dim]{name}[/dim]")
        else:
            console.print(f"  [bold red][!][/bold red] [{status}] [red]{name}[/red]")

    results, findings, errors = run_scan(domain, progress=show_module)

    for error in errors:
        console.print(f"  [red][FAILED][/red] {error.get('module')}: {error.get('error')}")

    # Display Executive Summary
    https = results.get("http", {})
    tls = results.get("tls", {})
    subdomains_count = len(results.get("subdomains", {}).get("subdomains", []))
    endpoints_count = len(results.get("api_endpoints", {}).get("endpoints", []))
    dns_count = sum(len(v) for v in results.get("dns", {}).get("records", {}).values())
    posture = results.get("security_posture", {})
    score = posture.get("score", 0)

    score_color = "green" if score >= 80 else "yellow" if score >= 60 else "red"

    summary_text = (
        f"[bold]Target Domain:[/bold] {domain}\n"
        f"[bold]Security Posture Score:[/bold] [{score_color}]{score}/100[/{score_color}]\n"
        f"[bold]HTTPS Reachable:[/bold] {https.get('https_available', 'NOT_AVAILABLE')}\n"
        f"[bold]HTTPS Enforcement:[/bold] {https.get('http_to_https', {}).get('state', 'UNKNOWN')}\n"
        f"[bold]TLS Status:[/bold] {tls.get('status', 'NOT_AVAILABLE')} ({tls.get('tls_version', 'UNKNOWN')})\n"
        f"[bold]HSTS Header:[/bold] {https.get('hsts', {}).get('raw_value', 'NOT_OBSERVED')}\n"
        f"[bold]DNS Records:[/bold] {dns_count} observed\n"
        f"[bold]Subdomains Discovered:[/bold] {subdomains_count}\n"
        f"[bold]API Endpoints Discovered:[/bold] {endpoints_count}"
    )

    console.print()
    console.print(Panel(summary_text, title="[bold green]RECONNAISSANCE SUMMARY[/bold green]", border_style="green", padding=(1, 2)))

    # Save Reports
    class ScanView:
        pass

    scan = ScanView()
    scan.domain = domain
    scan.scan_id = scan_id
    scan.status = "PARTIAL" if errors else "COMPLETED"
    scan.start_time = started.replace(tzinfo=None)
    scan.end_time = datetime.now(timezone.utc).replace(tzinfo=None)

    report = build_report(scan, results, findings, errors)
    directory = Path(settings.report_directory)
    directory.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = directory / f"scan_{stamp}.json"
    html_path = directory / f"scan_{stamp}.html"
    json_path.write_bytes(render_json(report))
    html_path.write_bytes(render_html(report))

    # Findings Table
    if findings:
        table = Table(title="Security Findings Summary", border_style="yellow")
        table.add_column("Severity", style="bold")
        table.add_column("Finding Title")
        table.add_column("Category")
        for f in findings:
            sev = f.get("severity", "INFO")
            sev_color = "red" if sev in ("HIGH", "CRITICAL") else "yellow" if sev == "MEDIUM" else "cyan"
            table.add_row(f"[{sev_color}]{sev}[/{sev_color}]", f.get("title", "Unknown"), f.get("category", "General"))
        console.print(table)
    else:
        console.print("[bold green][+] Zero security findings observed on target.[/bold green]")

    console.print(f"\n[bold cyan]Standalone HTML Report:[/bold cyan] {html_path.resolve()}")
    console.print(f"[bold cyan]Machine-Readable JSON:[/bold cyan] {json_path.resolve()}\n")
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

