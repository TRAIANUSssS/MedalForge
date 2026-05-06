from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.maps_repository import get_maps_meta, list_maps
from app.schemas.maps import MapsMetaResponse, MapsResponse


router = APIRouter(prefix="/api/maps", tags=["maps"])


@router.get("/meta", response_model=MapsMetaResponse)
def get_maps_metadata(db: Session = Depends(get_db)) -> dict:
    return get_maps_meta(db)


@router.get("", response_model=MapsResponse)
def get_maps(
    status: Literal["all", "earned", "missing", "close", "not_played"] = "all",
    category: str | None = None,
    search: str | None = None,
    sort: str = "name",
    order: Literal["asc", "desc"] = "asc",
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    items, total = list_maps(
        db,
        status=status,
        category=category,
        search=search,
        sort=sort,
        order=order,
        limit=limit,
        offset=offset,
    )
    return {"items": items, "total": total, "limit": limit, "offset": offset}
