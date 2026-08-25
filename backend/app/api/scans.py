import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, HTTPException
from sqlalchemy import select, delete
from app.core.database import SessionLocal
from app.models.scan import Scan
from app.scanner.engine import run_scan
from app.scanner.scope import normalize_domain
from app.schemas.scan import ScanAccepted, ScanRequest, ScanStatus
from app.reports.json_report import build_report, persist_json

router = APIRouter(prefix="/api/scans", tags=["scans"])
scan_router = APIRouter(prefix="/api/scan", tags=["scans"])


def _now(): return datetime.now(timezone.utc).replace(tzinfo=None)

def _run(scan_id: str, domain: str):
    db = SessionLocal(); scan = db.get(Scan, scan_id)
    try:
        scan.status = "RUNNING"; scan.start_time = _now(); db.commit()
        results, findings, errors = run_scan(domain)
        scan.results = json.dumps(results, default=str); scan.findings = json.dumps(findings); scan.errors = json.dumps(errors); scan.status = "PARTIAL" if errors else "COMPLETED"; scan.end_time = _now(); db.commit()
        persist_json(scan_id, build_report(scan, results, findings, errors))
    except Exception as exc:
        scan.status = "FAILED"; scan.errors = json.dumps([{"module": "engine", "error": str(exc), "reason": "Scan orchestration failure"}]); scan.end_time = _now(); db.commit()
    finally: db.close()

@router.get("")
@scan_router.get("")
def list_scans():
    db = SessionLocal()
    try:
        stmt = select(Scan).order_by(Scan.start_time.desc().nulls_last(), Scan.scan_id.desc()).limit(100)
        scans = db.scalars(stmt).all()
        items = []
        for s in scans:
            results = json.loads(s.results or "{}") if s.results else {}
            findings = json.loads(s.findings or "[]") if s.findings else []
            errors = json.loads(s.errors or "[]") if s.errors else []
            posture = results.get("security_posture", {}) if isinstance(results, dict) else {}
            subdomains = results.get("subdomains", {}).get("subdomains", []) if isinstance(results, dict) and isinstance(results.get("subdomains"), dict) else []
            endpoints = results.get("api_endpoints", {}).get("endpoints", []) if isinstance(results, dict) and isinstance(results.get("api_endpoints"), dict) else []

            duration_sec = None
            if s.start_time and s.end_time:
                duration_sec = round((s.end_time - s.start_time).total_seconds(), 1)

            items.append({
                "scan_id": s.scan_id,
                "domain": s.domain,
                "status": s.status,
                "started_at": s.start_time.isoformat() if s.start_time else None,
                "completed_at": s.end_time.isoformat() if s.end_time else None,
                "duration": duration_sec,
                "findings_count": len(findings),
                "errors_count": len(errors),
                "score": posture.get("score") if isinstance(posture, dict) else None,
                "max_score": posture.get("max_score", 100) if isinstance(posture, dict) else 100,
                "subdomains_count": len(subdomains) if isinstance(subdomains, list) else 0,
                "endpoints_count": len(endpoints) if isinstance(endpoints, list) else 0,
            })
        return {"scans": items, "total": len(items)}
    finally:
        db.close()

@router.delete("")
@scan_router.delete("")
def clear_all_scans():
    db = SessionLocal()
    try:
        db.execute(delete(Scan))
        db.commit()
        return {"status": "CLEARED", "message": "All scan history cleared."}
    finally:
        db.close()

@router.post("", response_model=ScanAccepted, status_code=202)
@scan_router.post("", response_model=ScanAccepted, status_code=202)
def create_scan(payload: ScanRequest, background_tasks: BackgroundTasks):
    domain, valid, reason = normalize_domain(payload.domain)
    if not valid: raise HTTPException(status_code=422, detail={"message": reason, "validation_status": "invalid"})
    scan_id = str(uuid.uuid4()); db = SessionLocal(); db.add(Scan(scan_id=scan_id, domain=domain, status="QUEUED")); db.commit(); db.close(); background_tasks.add_task(_run, scan_id, domain)
    return {"scan_id": scan_id, "status": "STARTED"}

@router.get("/{scan_id}", response_model=ScanStatus)
@scan_router.get("/{scan_id}/status", response_model=ScanStatus)
@scan_router.get("/{scan_id}", response_model=ScanStatus)
def get_scan(scan_id: str):
    db = SessionLocal(); scan = db.get(Scan, scan_id); db.close()
    if not scan: raise HTTPException(status_code=404, detail="Scan not found.")
    errors = json.loads(scan.errors or "[]")
    return {"scan_id": scan.scan_id, "domain": scan.domain, "status": scan.status, "started_at": scan.start_time, "completed_at": scan.end_time, "errors": errors}

@router.delete("/{scan_id}")
@scan_router.delete("/{scan_id}")
def delete_scan(scan_id: str):
    db = SessionLocal()
    try:
        scan = db.get(Scan, scan_id)
        if not scan: raise HTTPException(status_code=404, detail="Scan not found.")
        db.delete(scan)
        db.commit()
        return {"status": "DELETED", "scan_id": scan_id}
    finally:
        db.close()

@router.get("/{scan_id}/results")
@scan_router.get("/{scan_id}/results")
def get_results(scan_id: str):
    db = SessionLocal(); scan = db.get(Scan, scan_id); db.close()
    if not scan: raise HTTPException(status_code=404, detail="Scan not found.")
    results = json.loads(scan.results or "{}")
    return {"scan_id": scan.scan_id, "domain": scan.domain, "status": scan.status, "started_at": scan.start_time, "completed_at": scan.end_time, "results": results, **results, "findings": json.loads(scan.findings or "[]"), "errors": json.loads(scan.errors or "[]")}

@router.get("/{scan_id}/findings")
@scan_router.get("/{scan_id}/findings")
def get_findings(scan_id: str):
    db = SessionLocal(); scan = db.get(Scan, scan_id); db.close()
    if not scan: raise HTTPException(status_code=404, detail="Scan not found.")
    return {"scan_id": scan_id, "findings": json.loads(scan.findings or "[]")}

