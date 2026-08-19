import html
from app.reports.json_report import render_json


def render_html(report: dict) -> bytes:
    title = html.escape(f"Recon report: {report.get('target', 'target')}")
    body = html.escape(render_json(report).decode("utf-8"))
    return f"<!doctype html><html lang='en'><head><meta charset='utf-8'><title>{title}</title><style>body{{background:#0b0e13;color:#dbe1e8;font:14px monospace;padding:2rem}}pre{{white-space:pre-wrap;line-height:1.5}}</style></head><body><h1>{title}</h1><pre>{body}</pre></body></html>".encode("utf-8")
