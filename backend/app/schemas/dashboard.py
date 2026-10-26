from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class ActivityItem(BaseModel):
    id: int
    action: str
    username: str
    target: Optional[str] = None
    status: str
    timestamp: datetime

class DashboardStats(BaseModel):
    total_eligible_students: int
    results_retrieved: int
    results_verified: int
    pending_records: int
    failed_records: int
    missing_ambiguous_results: int
    latest_session: Optional[str] = None
    latest_session_id: Optional[int] = None
    recent_activities: List[ActivityItem] = []
    latest_excel_export: Optional[Dict[str, Any]] = None
    system_health: Dict[str, Any]
