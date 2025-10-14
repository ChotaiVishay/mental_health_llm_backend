from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os

from app.config import get_settings

router = APIRouter(prefix="/api", tags=["search"])

# ---- Pydantic models ----
class SearchIn(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = 10
    specialisation: Optional[str] = None
    suburb: Optional[str] = None
    state: Optional[str] = None

class SearchOutItem(BaseModel):
    id: str
    organisation_name: Optional[str] = None
    campus_name: Optional[str] = None
    service_name: Optional[str] = None
    region_name: Optional[str] = None
    score: float

class SearchOut(BaseModel):
    results: List[SearchOutItem]

# ---- Lazy helpers (no work at import) ----
def get_supabase_client():
    from supabase import create_client
    settings = get_settings()
    url = settings.supabase_url
    key = settings.supabase_service_key or settings.supabase_key
    if not url or not key:
        return None
    return create_client(url, key)

def get_openai_client():
    from openai import OpenAI
    settings = get_settings()
    if not settings.openai_api_key:
        return None
    return OpenAI(api_key=settings.openai_api_key)

def embed_query(text: str) -> List[float]:
    client = get_openai_client()
    if not client:
        # Allow server to run without OPENAI_API_KEY
        # Return a deterministic dummy vector (poor quality but prevents crashes)
        return [0.0] * 1536
    model = os.getenv("EMBED_MODEL", "text-embedding-3-large")
    resp = client.embeddings.create(model=model, input=text)
    return resp.data[0].embedding

@router.post("/search", response_model=SearchOut)
def search(in_: SearchIn):
    sb = get_supabase_client()
    if sb is None:
        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_KEY).",
        )

    # 1) Embed the query
    q_emb = embed_query(in_.query)

    # 2) Vector RPC
    try:
        vec_res = sb.rpc(
            "search_staging_services",
            {"query_embedding": q_emb, "top_k": max(5, in_.top_k)},
        ).execute()
        vec = vec_res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector RPC failed: {e}")

    # Convert cosine distance -> score
    merged_map: Dict[str, Dict[str, Any]] = {}
    for r in vec:
        dist = float(r.get("similarity", 1.0))
        score = max(0.0, 1.0 - dist)
        rid = str(r["id"])
        merged_map[rid] = {
            "id": rid,
            "organisation_name": r.get("organisation_name"),
            "campus_name": r.get("campus_name"),
            "service_name": r.get("service_name"),
            "region_name": r.get("region_name"),
            "score_vec": score,
        }

    # 3) Keyword RPC
    try:
        kw_res = sb.rpc(
            "keyword_search_staging_services",
            {"keyword": in_.query, "top_k": max(5, in_.top_k)},
        ).execute()
        kw = kw_res.data or []
    except Exception as e:
        # don’t fail the whole request if keyword RPC dies; just proceed with vector
        kw = []

    for r in kw:
        rid = str(r["id"])
        if rid not in merged_map:
            merged_map[rid] = {
                "id": rid,
                "organisation_name": r.get("organisation_name"),
                "campus_name": r.get("campus_name"),
                "service_name": r.get("service_name"),
                "region_name": r.get("region_name"),
            }
        merged_map[rid]["score_kw"] = 1.0

    # 4) Final scoring & shape
    items: List[SearchOutItem] = []
    for rid, r in merged_map.items():
        final_score = 0.75 * r.get("score_vec", 0.0) + 0.25 * r.get("score_kw", 0.0)
        items.append(
            SearchOutItem(
                id=rid,
                organisation_name=r.get("organisation_name"),
                campus_name=r.get("campus_name"),
                service_name=r.get("service_name"),
                region_name=r.get("region_name"),
                score=round(final_score, 4),
            )
        )
    items.sort(key=lambda x: x.score, reverse=True)
    return SearchOut(results=items[: in_.top_k])


@router.get("/services")
async def get_all_services(
    limit: int = 100,
    suburb: Optional[str] = None,
    state: Optional[str] = None
):
    """Get all services or filter by location"""
    from core.database.supabase_only import get_supabase_db
    
    try:
        db = await get_supabase_db()
        
        # If location filters provided, use location search
        if suburb or state:
            results = db.search_by_location(suburb=suburb, state=state, limit=limit)
        else:
            # Otherwise get all services
            results = db.query_table("staging_services", limit=limit)
        
        return results
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch services: {str(e)}"
        )
