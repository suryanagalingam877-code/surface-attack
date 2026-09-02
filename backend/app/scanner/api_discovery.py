import re
import concurrent.futures
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from app.core.config import settings
from app.scanner.http import request_url

API_PATH_RE = re.compile(
    r"(?:['\"])((?:https?://[^'\"\s]+|/(?:api|v[0-9]+|graphql|swagger|openapi|rest|auth|oauth|token|webhook|rpc|json)[A-Za-z0-9_./?=&%-]*))['\"]",
    re.IGNORECASE,
)
METHOD_PATTERNS = [
    (re.compile(r"(?:axios|http|fetch|\$)\.post\s*\(\s*['\"]([^'\"]+)['\"]", re.IGNORECASE), "POST"),
    (re.compile(r"(?:axios|http|fetch|\$)\.put\s*\(\s*['\"]([^'\"]+)['\"]", re.IGNORECASE), "PUT"),
    (re.compile(r"(?:axios|http|fetch|\$)\.delete\s*\(\s*['\"]([^'\"]+)['\"]", re.IGNORECASE), "DELETE"),
    (re.compile(r"(?:axios|http|fetch|\$)\.patch\s*\(\s*['\"]([^'\"]+)['\"]", re.IGNORECASE), "PATCH"),
    (re.compile(r"(?:axios|http|fetch|\$)\.get\s*\(\s*['\"]([^'\"]+)['\"]", re.IGNORECASE), "GET"),
]


def discover_endpoints(domain: str, http_result: dict, robots: dict | None = None, sitemap: dict | None = None) -> dict:
    base = http_result.get("final_url") or f"https://{domain}"
    base_netloc = urlparse(base).netloc.lower()
    body = http_result.get("body", "")
    soup = BeautifulSoup(body, "html.parser")
    candidates = {}

    # Extract from HTML forms
    for form in soup.find_all("form"):
        action = form.get("action")
        if action:
            method = (form.get("method") or "GET").upper()
            url = urljoin(base, action)
            candidates[url] = {"source": "HTML form", "method": method}

    # Extract from links and script src tags
    for tag, attr in (("a", "href"), ("script", "src"), ("link", "href")):
        for node in soup.find_all(tag):
            value = node.get(attr)
            if value and not value.startswith(("javascript:", "mailto:", "tel:", "#")):
                url = urljoin(base, value)
                if url not in candidates:
                    candidates[url] = {"source": f"HTML <{tag}> {attr}", "method": "UNKNOWN"}

    # Extract from HTML body / inline scripts with regex
    for match in API_PATH_RE.findall(body):
        url = urljoin(base, match)
        if url not in candidates:
            candidates[url] = {"source": "HTML source / inline script", "method": "UNKNOWN"}

    for pattern, method in METHOD_PATTERNS:
        for match in pattern.findall(body):
            url = urljoin(base, match)
            candidates[url] = {"source": "Inline script HTTP client", "method": method}

    # Extract from robots.txt paths if provided
    if robots and robots.get("exists") and robots.get("discovered_paths"):
        for path in robots.get("discovered_paths", []):
            url = urljoin(base, path)
            if url not in candidates:
                candidates[url] = {"source": "robots.txt path", "method": "UNKNOWN"}

    # Extract from sitemap.xml URLs if provided
    if sitemap and sitemap.get("exists") and sitemap.get("urls"):
        for url in sitemap.get("urls", [])[:50]:  # Bound sitemap ingestion
            if url not in candidates:
                candidates[url] = {"source": "sitemap.xml URL", "method": "UNKNOWN"}

    endpoints = []
    javascript_candidates = []

    for url, meta in sorted(candidates.items()):
        parsed = urlparse(url)
        if parsed.netloc and parsed.netloc.lower() != base_netloc:
            continue
        entry = {
            "url": url,
            "method": meta.get("method", "UNKNOWN"),
            "source": meta.get("source", "HTML indicator"),
            "discovery_status": "DISCOVERED_FROM_SOURCE",
            "evidence": f"URL was observed via {meta.get('source', 'target response')}.",
        }
        if parsed.path.lower().endswith((".js", ".mjs")):
            javascript_candidates.append((url, entry))
            continue
        endpoints.append(entry)

    # Inspect referenced JavaScript concurrently
    def inspect_javascript(item):
        url, entry = item
        script = request_url(url)
        entry["source"] = "Referenced JavaScript"
        discovered = []
        if script.get("status") == "completed":
            entry["status"] = script.get("status_code")
            entry["content_type"] = script.get("content_type")
            entry["discovery_status"] = "CONFIRMED"
            entry["evidence"] = "Resource was referenced by target HTML and downloaded successfully."
            script_body = script.get("body", "")
            for match in API_PATH_RE.findall(script_body):
                discovered_url = urljoin(url, match)
                discovered.append({
                    "url": discovered_url,
                    "method": "UNKNOWN",
                    "source": "Referenced JavaScript content",
                    "discovery_status": "DISCOVERED_FROM_SOURCE",
                    "status": None,
                    "content_type": None,
                    "evidence": "Path indicator was observed in a JavaScript resource referenced by the target.",
                })
            for pattern, method in METHOD_PATTERNS:
                for match in pattern.findall(script_body):
                    discovered_url = urljoin(url, match)
                    discovered.append({
                        "url": discovered_url,
                        "method": method,
                        "source": "Referenced JavaScript HTTP call",
                        "discovery_status": "DISCOVERED_FROM_SOURCE",
                        "status": None,
                        "content_type": None,
                        "evidence": f"HTTP {method} call indicator was observed in referenced JavaScript.",
                    })
        return entry, discovered

    with concurrent.futures.ThreadPoolExecutor(max_workers=settings.max_concurrency) as executor:
        inspected = list(executor.map(inspect_javascript, javascript_candidates))

    known_urls = {item["url"] for item in endpoints}
    for entry, discovered in inspected:
        if entry["url"] not in known_urls:
            endpoints.append(entry)
            known_urls.add(entry["url"])
        for item in discovered:
            parsed = urlparse(item["url"])
            if parsed.netloc and parsed.netloc.lower() != base_netloc:
                continue
            if item["url"] not in known_urls:
                endpoints.append(item)
                known_urls.add(item["url"])

    return {"status": "completed", "endpoints": endpoints}

