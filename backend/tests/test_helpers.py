from app.scanner.cookies import parse_cookies
from app.scanner.headers import analyze_headers
from app.findings.engine import build_findings

def test_cookie_parser_uses_observed_header():
    cookies = parse_cookies({"set-cookie": "session=abc; Secure; HttpOnly; SameSite=Lax; Path=/"})
    assert cookies[0]["name"] == "session"
    assert cookies[0]["secure"] is True

def test_header_analysis_has_traceable_evidence():
    result = analyze_headers({"server": "observed"}, "https://target.invalid")
    csp = next(item for item in result if item["header"] == "Content-Security-Policy")
    assert csp["present"] is False
    assert "not observed" in csp["evidence"]

def test_findings_are_deterministic():
    findings = build_findings({"headers": analyze_headers({}, "https://target.invalid"), "tls": {}, "cookies": []})
    assert all(item["severity"] in {"INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"} for item in findings)
    assert all(item["evidence"] for item in findings)
