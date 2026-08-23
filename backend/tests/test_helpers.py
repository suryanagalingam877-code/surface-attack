from app.scanner.cookies import parse_cookies
from app.scanner.headers import analyze_headers
from app.findings.engine import build_findings
from app.scanner.sitemap import _xml_safe_content
from app.scanner.engine import _posture_score
from app.scanner.http import detect_mixed_content, parse_hsts

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

def test_posture_score_uses_observed_rules_only():
    score, reasons = _posture_score({"http": {"https_available": True, "http_to_https": {"state": "ENFORCED"}, "hsts": {"present": True}, "mixed_content": []}, "tls": {"status": "VALID"}, "headers": [{"header": "Content-Security-Policy", "present": True}], "cookies": []})
    assert score == 95
    assert all(reason["evidence"] for reason in reasons)

def test_hsts_and_mixed_content_use_observed_markup():
    hsts = parse_hsts("max-age=31536000; includeSubDomains; preload")
    mixed = detect_mixed_content('<script src="http://observed.test/app.js"></script><img src="https://observed.test/a.png">')
    assert hsts["max_age"] == "31536000" and hsts["include_subdomains"] is True
    assert mixed[0]["url"] == "http://observed.test/app.js" and mixed[0]["source"] == "HTML_SOURCE"
