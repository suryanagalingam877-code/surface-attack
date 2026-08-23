import concurrent.futures
from datetime import datetime, timezone
from app.scanner.api_discovery import discover_endpoints
from app.scanner.cookies import parse_cookies
from app.scanner.dns import query_dns
from app.scanner.headers import analyze_headers
from app.scanner.http import recon_domain
from app.scanner.robots import analyze_robots
from app.scanner.sitemap import analyze_sitemap
from app.scanner.subdomains import discover_subdomains
from app.scanner.technology import detect_technologies
from app.scanner.tls import analyze_tls


def run_scan(domain: str, progress=None) -> tuple[dict, list[dict], list[dict]]:
    results, errors, timeline = {}, [], []
    def event(name, status, **extra):
        timeline.append({"timestamp": datetime.now(timezone.utc).isoformat(), "module": name, "status": status, **extra})
    modules = [("dns", lambda: query_dns(domain)), ("http", lambda: recon_domain(domain)), ("subdomains", lambda: discover_subdomains(domain)), ("tls", lambda: analyze_tls(domain)), ("robots", lambda: analyze_robots(domain)), ("sitemap", lambda: analyze_sitemap(domain))]
    def execute(item):
        name, action = item
        event(name, "RUNNING")
        if progress: progress(name, "RUNNING", None)
        try:
            value = action()
            failure = value.get("status") == "error" or value.get("error")
            return name, value, ({"module": name, "error": value.get("error", "Module returned an error."), "reason": value.get("errors")} if failure else None)
        except Exception as exc:
            return name, {"status": "error", "error": str(exc)}, {"module": name, "error": str(exc), "reason": "Unhandled module error"}

    with concurrent.futures.ThreadPoolExecutor(max_workers=len(modules)) as executor:
        futures = [executor.submit(execute, item) for item in modules]
        for future in concurrent.futures.as_completed(futures):
            name, value, error = future.result()
            results[name] = value
            if error: errors.append(error)
            event(name, "FAILED" if error else "COMPLETED", error=error.get("error") if error else None)
            if progress: progress(name, "COMPLETED" if value.get("status") != "error" else "FAILED", None)
    http = results.get("http", {})
    results["headers"] = analyze_headers(http.get("headers", {}), http.get("final_url"))
    results["cookies"] = parse_cookies(http.get("headers", {}), http.get("set_cookie_headers", []))
    results["technologies"] = detect_technologies(http.get("headers", {}), http.get("body", ""), results["cookies"])
    results["api_endpoints"] = discover_endpoints(domain, http) if http.get("status") == "completed" else {"status": "skipped", "endpoints": []}
    from app.findings.engine import build_findings
    findings = build_findings(results)
    score, score_reasons = _posture_score(results)
    results["https_security"] = {"https_available": http.get("https_available"), "http_to_https": http.get("http_to_https"), "https_enforcement": http.get("http_to_https", {}).get("state", "UNKNOWN"), "tls_version": results.get("tls", {}).get("tls_version"), "certificate_status": results.get("tls", {}).get("status"), "hostname_match": results.get("tls", {}).get("hostname_match"), "certificate_expiry": results.get("tls", {}).get("not_after"), "hsts": http.get("hsts", {"present": False, "raw_value": None}), "mixed_content": http.get("mixed_content", []), "secure_cookies": sum(1 for cookie in results.get("cookies", []) if cookie.get("secure")), "source": "HTTP_RESPONSE_AND_TLS_CERTIFICATE"}
    results["security_posture"] = {"score": score, "max_score": 100, "reasons": score_reasons, "source": "DETERMINISTIC_OBSERVATIONS"}
    results["timeline"] = timeline + [{"timestamp": datetime.now(timezone.utc).isoformat(), "module": "findings", "status": "COMPLETED"}]
    results["attack_surface"] = _attack_surface(domain, results)
    results["overview"] = {
        "subdomains_discovered": len(results.get("subdomains", {}).get("subdomains", [])),
        "api_endpoints_discovered": len(results.get("api_endpoints", {}).get("endpoints", [])),
        "dns_records": sum(len(records) for records in results.get("dns", {}).get("records", {}).values()),
        "cookies_observed": len(results.get("cookies", [])),
        "security_findings": len(findings),
        "tls_status": results.get("tls", {}).get("status"),
    }
    return results, findings, errors

def _attack_surface(domain: str, results: dict) -> list[dict]:
    timestamp = datetime.now(timezone.utc).isoformat()
    assets = [{"id": "domain", "type": "domain", "value": domain, "status": "observed", "source": "SCOPE_VALIDATION", "evidence": "Target was accepted by domain validation.", "timestamp": timestamp}]
    for item in results.get("subdomains", {}).get("subdomains", []):
        assets.append({"id": f"subdomain:{item['subdomain']}", "type": "subdomain", "value": item["subdomain"], "status": "resolved", "source": "DNS_RESOLUTION", "evidence": f"Resolved IPs: {', '.join(item.get('resolved_ips', []))}", "timestamp": timestamp})
    for item in results.get("api_endpoints", {}).get("endpoints", []):
        assets.append({"id": f"endpoint:{item['url']}", "type": "api_endpoint", "value": item["url"], "status": item.get("discovery_status", "observed"), "source": item.get("source"), "evidence": item.get("evidence"), "timestamp": timestamp})
    for item in results.get("http", {}).get("mixed_content", []):
        assets.append({"id": f"mixed:{item['url']}", "type": "external_resource", "value": item["url"], "status": "observed", "source": "HTML_SOURCE", "evidence": f"Observed in {item.get('element')} {item.get('attribute')}.", "timestamp": timestamp})
    for url in results.get("sitemap", {}).get("urls", []):
        assets.append({"id": f"sitemap:{url}", "type": "sitemap_url", "value": url, "status": "observed", "source": "SITEMAP_XML", "evidence": "URL parsed from sitemap XML.", "timestamp": timestamp})
    return assets

def _posture_score(results: dict) -> tuple[int, list[dict]]:
    score = 0
    reasons = []
    def rule(label, points, applied, evidence):
        nonlocal score
        if applied: score += points
        reasons.append({"rule": label, "points": points if applied else 0, "applied": applied, "evidence": evidence})
    http = results.get("http", {}); tls = results.get("tls", {})
    rule("HTTPS reachable", 20, http.get("https_available") is True, "HTTPS request result")
    rule("HTTP redirects to HTTPS", 20, http.get("http_to_https", {}).get("state") == "ENFORCED", http.get("http_to_https", {}).get("evidence", "Unavailable"))
    rule("Valid TLS certificate", 20, tls.get("status") == "VALID", f"TLS status: {tls.get('status', 'NOT_AVAILABLE')}")
    rule("HSTS observed", 15, http.get("hsts", {}).get("present") is True, f"Strict-Transport-Security: {http.get('hsts', {}).get('raw_value', 'NOT_OBSERVED')}")
    rule("Content-Security-Policy observed", 10, any(item.get("present") and item.get("header") == "Content-Security-Policy" for item in results.get("headers", [])), "Observed response headers")
    rule("No mixed-content indicators", 10, not http.get("mixed_content"), f"Mixed-content indicators: {len(http.get('mixed_content', []))}")
    rule("Secure cookies observed", 5, bool(results.get("cookies")) and all(cookie.get("secure") for cookie in results.get("cookies", [])), f"Cookies observed: {len(results.get('cookies', []))}")
    return max(0, min(100, score)), reasons
