from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: str
    action: str
    target_entity: Optional[str] = None
    target_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True
