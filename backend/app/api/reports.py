import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, Response
from app.core.database import SessionLocal
from app.models.scan import Scan
from app.reports.html_report import render_html
from app.reports.json_report import build_report, render_json

router = APIRouter(prefix="/api/scans", tags=["reports"])
scan_router = APIRouter(prefix="/api/scan", tags=["reports"])

def _report(scan_id: str):
    db = SessionLocal(); scan = db.get(Scan, scan_id); db.close()
    if not scan: raise HTTPException(status_code=404, detail="Scan not found.")
    return build_report(scan, json.loads(scan.results or "{}"), json.loads(scan.findings or "[]"), json.loads(scan.errors or "[]"))

@router.get("/{scan_id}/report/json")
@router.get("/{scan_id}/report.json")
@scan_router.get("/{scan_id}/report/json")
@scan_router.get("/{scan_id}/report.json")
def json_report(scan_id: str): return Response(render_json(_report(scan_id)), media_type="application/json", headers={"Content-Disposition": f"attachment; filename={scan_id}.json"})

@router.get("/{scan_id}/report/html")
@router.get("/{scan_id}/report.html")
@scan_router.get("/{scan_id}/report/html")
@scan_router.get("/{scan_id}/report.html")
def html_report(scan_id: str): return HTMLResponse(render_html(_report(scan_id)), headers={"Content-Disposition": f"attachment; filename={scan_id}.html"})
