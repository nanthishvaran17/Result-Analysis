from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(50), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    target_entity = Column(String(50), nullable=True)
    target_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    status = Column(String(20), default="SUCCESS", nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
