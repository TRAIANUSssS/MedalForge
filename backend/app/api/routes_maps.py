from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.maps_repository import get_map_collections, get_maps_meta, list_maps
from app.schemas.maps import MapCollectionsResponse, MapsMetaResponse, MapsResponse


router = APIRouter(prefix="/api/maps", tags=["maps"])


@router.get("/meta", response_model=MapsMetaResponse)
def get_maps_metadata(
    category: str | None = None,
    campaign_name: str | None = None,
    search: str | None = None,
    difficulty_tier: str | None = None,
    tmx_style_name: str | None = None,
    pb_state: Literal["any", "has_pb", "no_pb"] = "any",
    position_min: int | None = Query(default=None, ge=1, le=10000),
    position_max: int | None = Query(default=None, ge=1, le=10000),
    db: Session = Depends(get_db),
) -> dict:
    return get_maps_meta(
        db,
        category=category,
        campaign_name=campaign_name,
        search=search,
        difficulty_tier=difficulty_tier,
        tmx_style_name=tmx_style_name,
        pb_state=pb_state,
        position_min=position_min,
        position_max=position_max,
    )


@router.get("/collections", response_model=MapCollectionsResponse)
def get_maps_collections(db: Session = Depends(get_db)) -> dict:
    return {"items": get_map_collections(db)}


@router.get("", response_model=MapsResponse)
def get_maps(
    status: Literal["all", "earned", "missing", "close", "not_played"] = "all",
    category: str | None = None,
    campaign_name: str | None = None,
    search: str | None = None,
    difficulty_tier: str | None = None,
    tmx_style_name: str | None = None,
    pb_state: Literal["any", "has_pb", "no_pb"] = "any",
    position_min: int | None = Query(default=None, ge=1, le=10000),
    position_max: int | None = Query(default=None, ge=1, le=10000),
    sort: str = "name",
    order: Literal["asc", "desc"] = "asc",
    limit: int = Query(default=100, ge=1, le=10000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    items, total = list_maps(
        db,
        status=status,
        category=category,
        campaign_name=campaign_name,
        search=search,
        difficulty_tier=difficulty_tier,
        tmx_style_name=tmx_style_name,
        pb_state=pb_state,
        position_min=position_min,
        position_max=position_max,
        sort=sort,
        order=order,
        limit=limit,
        offset=offset,
    )
    return {"items": items, "total": total, "limit": limit, "offset": offset}
