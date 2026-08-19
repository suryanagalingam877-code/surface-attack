import concurrent.futures
from pathlib import Path
from app.core.config import settings
from app.scanner.dns import resolve_hostname
from app.scanner.http import request_url


def discover_subdomains(domain: str) -> dict:
    path = Path(settings.subdomain_wordlist)
    if not path.is_file(): return {"status": "error", "subdomains": [], "error": f"Wordlist not found: {path}"}
    candidates = sorted({line.strip().lower() for line in path.read_text(encoding="utf-8").splitlines() if line.strip() and not line.startswith("#")})
    def check(label: str):
        hostname = f"{label}.{domain}"
        ips = resolve_hostname(hostname)
        if not ips: return None
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as http_executor:
            http_future = http_executor.submit(request_url, f"http://{hostname}")
            https_future = http_executor.submit(request_url, f"https://{hostname}")
            http = http_future.result()
            https = https_future.result()
        return {"subdomain": hostname, "resolved_ips": ips, "http_status": http.get("status_code"), "https_status": https.get("status_code"), "resolution": "resolved", "source": "DNS_RESOLUTION"}
    with concurrent.futures.ThreadPoolExecutor(max_workers=settings.max_concurrency) as executor:
        results = [item for item in executor.map(check, candidates) if item]
    return {"status": "completed", "subdomains": results, "checked_candidates": len(candidates)}
