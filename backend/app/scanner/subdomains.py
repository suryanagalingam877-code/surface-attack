import concurrent.futures
import re
from pathlib import Path
from app.core.config import settings
from app.scanner.dns import resolve_hostname
from app.scanner.http import request_url
from app.scanner.scope import normalize_domain


SUBDOMAIN_LABEL_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")


def discover_subdomains(domain: str) -> dict:
    normalized_domain, valid, reason = normalize_domain(domain)
    if not valid or not normalized_domain:
        return {"status": "error", "subdomains": [], "error": reason or "Invalid domain supplied for subdomain enumeration.", "checked_candidates": 0}

    path = Path(settings.subdomain_wordlist)
    if not path.is_file():
        return {"status": "error", "subdomains": [], "error": f"Wordlist not found: {path}", "checked_candidates": 0}

    raw_candidates = []
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        item = line.strip().lower()
        if not item or item.startswith("#") or item.startswith("//"):
            continue
        item = item.strip(".")
        if not item or item == "*":
            continue
        if item.startswith("."):
            item = item.lstrip(".")
        if item and item != normalized_domain and SUBDOMAIN_LABEL_RE.fullmatch(item):
            raw_candidates.append(item)

    candidates = sorted(set(raw_candidates))
    if not candidates:
        return {"status": "completed", "subdomains": [], "checked_candidates": 0}

    def check(label: str):
        hostname = f"{label}.{normalized_domain}"
        ips = resolve_hostname(hostname)
        if not ips:
            return None
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as http_executor:
            http_future = http_executor.submit(request_url, f"http://{hostname}")
            https_future = http_executor.submit(request_url, f"https://{hostname}")
            http = http_future.result()
            https = https_future.result()
        return {"subdomain": hostname, "resolved_ips": ips, "http_status": http.get("status_code"), "https_status": https.get("status_code"), "resolution": "resolved", "source": "DNS_RESOLUTION"}

    with concurrent.futures.ThreadPoolExecutor(max_workers=settings.max_concurrency) as executor:
        results = [item for item in executor.map(check, candidates) if item]
    return {"status": "completed", "subdomains": results, "checked_candidates": len(candidates)}
