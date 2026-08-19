import re
import concurrent.futures
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from app.core.config import settings
from app.scanner.http import request_url

PATH_RE = re.compile(r"(?:['\"])((?:https?://[^'\"]+|/[A-Za-z0-9_./?=&%-]*(?:api|graphql|swagger|openapi)[A-Za-z0-9_./?=&%-]*))['\"]", re.IGNORECASE)

def discover_endpoints(domain: str, http_result: dict) -> dict:
    base = http_result.get("final_url") or f"https://{domain}"
    body = http_result.get("body", "")
    soup = BeautifulSoup(body, "html.parser")
    candidates = set()
    for tag, attr in (("a", "href"), ("form", "action"), ("script", "src")):
        for node in soup.find_all(tag):
            value = node.get(attr)
            if value: candidates.add(urljoin(base, value))
    candidates.update(match for match in PATH_RE.findall(body))
    endpoints = []
    javascript_candidates = []
    for candidate in sorted(candidates):
        parsed = urlparse(candidate if candidate.startswith("http") else urljoin(base, candidate))
        if parsed.netloc and parsed.netloc != urlparse(base).netloc: continue
        url = candidate if candidate.startswith("http") else urljoin(base, candidate)
        source = "HTML link/form/script" if url in candidates else "HTML source indicator"
        entry = {"url": url, "method": "UNKNOWN", "source": source, "discovery_status": "DISCOVERED_FROM_SOURCE", "evidence": "URL was observed in the target HTTP response."}
        if parsed.path.lower().endswith((".js", ".mjs")):
            javascript_candidates.append((url, entry))
            continue
        endpoints.append(entry)
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
            for match in PATH_RE.findall(script.get("body", "")):
                discovered_url = urljoin(url, match)
                discovered.append({"url": discovered_url, "method": "UNKNOWN", "source": "Referenced JavaScript content", "discovery_status": "DISCOVERED_FROM_SOURCE", "status": None, "content_type": None, "evidence": "Path indicator was observed in a JavaScript resource referenced by the target."})
        return entry, discovered
    with concurrent.futures.ThreadPoolExecutor(max_workers=settings.max_concurrency) as executor:
        inspected = list(executor.map(inspect_javascript, javascript_candidates))
    known_urls = {item["url"] for item in endpoints}
    for entry, discovered in inspected:
        if entry["url"] not in known_urls:
            endpoints.append(entry); known_urls.add(entry["url"])
        for item in discovered:
            if item["url"] not in known_urls:
                endpoints.append(item); known_urls.add(item["url"])
    return {"status": "completed", "endpoints": endpoints}
