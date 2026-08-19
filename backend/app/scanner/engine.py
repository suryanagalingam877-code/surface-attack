import concurrent.futures
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
    results, errors = {}, []
    modules = [("dns", lambda: query_dns(domain)), ("http", lambda: recon_domain(domain)), ("subdomains", lambda: discover_subdomains(domain)), ("tls", lambda: analyze_tls(domain)), ("robots", lambda: analyze_robots(domain)), ("sitemap", lambda: analyze_sitemap(domain))]
    def execute(item):
        name, action = item
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
            if progress: progress(name, "COMPLETED" if value.get("status") != "error" else "FAILED", None)
    http = results.get("http", {})
    results["headers"] = analyze_headers(http.get("headers", {}), http.get("final_url"))
    results["cookies"] = parse_cookies(http.get("headers", {}), http.get("set_cookie_headers", []))
    results["technologies"] = detect_technologies(http.get("headers", {}), http.get("body", ""), results["cookies"])
    results["api_endpoints"] = discover_endpoints(domain, http) if http.get("status") == "completed" else {"status": "skipped", "endpoints": []}
    from app.findings.engine import build_findings
    findings = build_findings(results)
    results["overview"] = {
        "subdomains_discovered": len(results.get("subdomains", {}).get("subdomains", [])),
        "api_endpoints_discovered": len(results.get("api_endpoints", {}).get("endpoints", [])),
        "dns_records": sum(len(records) for records in results.get("dns", {}).get("records", {}).values()),
        "cookies_observed": len(results.get("cookies", [])),
        "security_findings": len(findings),
        "tls_status": results.get("tls", {}).get("status"),
    }
    return results, findings, errors
