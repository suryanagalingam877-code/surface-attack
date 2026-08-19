from app.scanner.cookies import parse_cookies
from app.scanner.headers import analyze_headers
from app.findings.engine import build_findings
from app.scanner.sitemap import _xml_safe_content

def test_cookie_parser_uses_observed_header():
    cookies = parse_cookies({"set-cookie": "session=abc; Secure; HttpOnly; SameSite=Lax; Path=/"})
    assert cookies[0]["name"] == "session"
    assert cookies[0]["secure"] is True

def test_cookie_parser_preserves_multiple_set_cookie_headers():
    cookies = parse_cookies({}, ["one=1; Secure", "two=2; HttpOnly; SameSite=Strict"])
    assert [cookie["name"] for cookie in cookies] == ["one", "two"]
    assert cookies[1]["httponly"] is True

def test_header_analysis_has_traceable_evidence():
    result = analyze_headers({"server": "observed"}, "https://target.invalid")
    csp = next(item for item in result if item["header"] == "Content-Security-Policy")
    assert csp["present"] is False
    assert "not observed" in csp["evidence"]

def test_findings_are_deterministic():
    findings = build_findings({"headers": analyze_headers({}, "https://target.invalid"), "tls": {}, "cookies": []})
    assert all(item["severity"] in {"INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"} for item in findings)
    assert all(item["evidence"] for item in findings)

def test_sitemap_parser_removes_only_invalid_xml_controls():
    assert _xml_safe_content("<url>\x00https://observed.test/\x08</url>") == "<url>https://observed.test/</url>"
