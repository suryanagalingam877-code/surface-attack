from types import SimpleNamespace
from app.reports.html_report import render_html
from app.reports.json_report import build_report, render_json

def test_reports_serialize_only_supplied_data():
    scan = SimpleNamespace(domain="observed.test", scan_id="scan-id", status="COMPLETED", start_time=None, end_time=None)
    report = build_report(scan, {"dns": {"records": {"A": []}}}, [], [])
    assert b"observed.test" in render_json(report)
    assert b"observed.test" in render_html(report)
    assert "fake" not in render_json(report).decode().lower()
