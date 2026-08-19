from datetime import datetime, timezone


def _finding(identifier, title, severity, category, description, evidence, affected_url, recommendation, module):
    return {"id": identifier, "title": title, "severity": severity, "category": category, "description": description, "evidence": evidence, "affected_url": affected_url, "recommendation": recommendation, "source_module": module, "timestamp": datetime.now(timezone.utc).isoformat()}


def build_findings(results: dict) -> list[dict]:
    findings = []
    headers = results.get("headers", [])
    for item in headers:
        if not item["present"] and item["header"] in {"Content-Security-Policy", "Strict-Transport-Security"}:
            findings.append(_finding(f"HEADER-MISSING-{item['header'].upper().replace('-', '_')}", f"{item['header']} header not observed", "LOW", "Security headers", item["evidence"], item["evidence"], item.get("affected_url"), f"Review whether {item['header']} should be configured for this application.", "headers"))
    tls = results.get("tls", {})
    if tls.get("status") == "EXPIRED": findings.append(_finding("TLS-CERTIFICATE-EXPIRED", "TLS certificate is expired", "HIGH", "TLS", "The observed certificate validity period has ended.", f"Certificate not_after: {tls.get('not_after')}", None, "Renew the certificate and verify the complete certificate chain.", "tls"))
    elif tls.get("status") == "EXPIRING": findings.append(_finding("TLS-CERTIFICATE-EXPIRING", "TLS certificate is expiring soon", "MEDIUM", "TLS", "The observed certificate expires within 30 days.", f"Certificate not_after: {tls.get('not_after')}; days remaining: {tls.get('days_remaining')}", None, "Renew the certificate before its validity period ends.", "tls"))
    for cookie in results.get("cookies", []):
        if not cookie.get("secure"):
            findings.append(_finding("COOKIE-NOT-SECURE", f"Cookie {cookie['name']} lacks Secure attribute", "LOW", "Cookies", "The observed Set-Cookie header did not include the Secure attribute.", f"Cookie name: {cookie['name']}", None, "Set Secure for cookies that should only travel over HTTPS.", "cookies"))
    return findings
