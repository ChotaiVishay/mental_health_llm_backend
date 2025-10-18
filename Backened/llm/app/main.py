from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from app.config import get_settings
from core.database.supabase_only import get_supabase_db, SupabaseOnlyConnection
from services.chat_service import get_chat_service

settings = get_settings()

app = FastAPI(
    title="Mental Health LLM Backend",
    description="LLM-powered chatbot",
    version="1.0.0",
)

# Fixed CORS - allow all Vercel domains
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Mental Health LLM Backend is running!", "chat_available": True}

@app.get("/health")
async def health_check(db: SupabaseOnlyConnection = Depends(get_supabase_db)):
    db_status = await db.test_connection()
    return {"status": "healthy", "database": db_status}

# DEBUG ENDPOINT - Test search directly
@app.get("/debug/search")
async def debug_search(q: str = "melbourne", limit: int = 5):
    """Test search functionality directly."""
    db = await get_supabase_db()
    try:
        results = db.search_services_by_text(q, limit=limit)
        return {
            "query": q,
            "results_count": len(results),
            "results": results,
            "search_worked": len(results) > 0
        }
    except Exception as e:
        return {
            "error": str(e),
            "query": q
        }

# DEBUG ENDPOINT - Get raw data
@app.get("/debug/raw-data")
async def get_raw_data(limit: int = 5):
    """Get raw data from staging_services to verify table has data."""
    db = await get_supabase_db()
    try:
        url = f"{db.settings.supabase_url}/rest/v1/staging_services"
        params = {
            "select": "id,suburb,service_name,organisation_name",
            "limit": str(limit)
        }
        
        response = db.http_client.get(url, headers=db._get_headers(), params=params)
        response.raise_for_status()
        
        data = response.json()
        
        return {
            "count": len(data),
            "sample_data": data
        }
    except Exception as e:
        return {"error": str(e)}

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

@app.post("/api/v1/chat/chat")
async def chat(request: ChatRequest):
    chat_service = await get_chat_service()
    result = await chat_service.process_message(
        message=request.message,
        session_id=request.session_id
    )
    return result
