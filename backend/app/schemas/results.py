from typing import Any
from pydantic import BaseModel

class ScanResults(BaseModel):
    scan_id: str
    domain: str
    status: str
    started_at: str | None = None
    completed_at: str | None = None
    results: dict[str, Any]
    findings: list[dict[str, Any]]
    errors: list[dict[str, Any]]
