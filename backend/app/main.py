from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.reports import router as reports_router, scan_router as scan_reports_router
from app.api.scans import router as scans_router, scan_router
from app.core.database import init_db
from app.core.logging import configure_logging

configure_logging()
init_db()
app = FastAPI(title="Recon Console API", version="0.1.0", description="Real, non-destructive domain reconnaissance for authorized testing.")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_methods=["GET", "POST"], allow_headers=["*"])
app.include_router(scans_router)
app.include_router(scan_router)
app.include_router(reports_router)
app.include_router(scan_reports_router)

@app.get("/health", tags=["system"])
def health(): return {"status": "ok"}
