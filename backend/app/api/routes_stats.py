from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.stats import StatsSummaryResponse
from app.services.stats_service import get_dashboard_summary


router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/summary", response_model=StatsSummaryResponse)
def get_stats_summary(db: Session = Depends(get_db)) -> dict:
    return get_dashboard_summary(db)
