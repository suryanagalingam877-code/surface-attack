import json
from datetime import datetime
from pathlib import Path
from app.core.config import settings


def build_report(scan, results, findings, errors) -> dict:
    return {"target": scan.domain, "scan_id": scan.scan_id, "status": scan.status, "started_at": scan.start_time.isoformat() if scan.start_time else None, "completed_at": scan.end_time.isoformat() if scan.end_time else None, "results": results, "findings": findings, "errors": errors}


def render_json(report: dict) -> bytes:
    return json.dumps(report, indent=2, ensure_ascii=False, default=str).encode("utf-8")


def persist_json(scan_id: str, report: dict) -> Path:
    directory = Path(settings.report_directory); directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"{scan_id}.json"; path.write_bytes(render_json(report)); return path
