from datetime import datetime
from pydantic import BaseModel, Field

class ScanRequest(BaseModel):
    domain: str = Field(min_length=1, max_length=253)

class ScanAccepted(BaseModel):
    scan_id: str
    status: str

class ScanStatus(BaseModel):
    scan_id: str
    domain: str
    status: str
    started_at: datetime | None = None
    completed_at: datetime | None = None
    progress: int | None = None
    errors: list[dict] = []
