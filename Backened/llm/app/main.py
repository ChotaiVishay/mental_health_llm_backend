"""
Mental Health LLM Backend - Main FastAPI Application
"""

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
    description="LLM-powered chatbot with database querying for mental health applications",
    version="1.0.0",
    docs_url=f"/docs",
    redoc_url=f"/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://comp-30022-group-30-mental-health-s.vercel.app",
        "https://*.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Mental Health LLM Backend is running!",
        "environment": settings.environment,
        "chat_available": True,
    }

@app.get("/health")
async def health_check(db: SupabaseOnlyConnection = Depends(get_supabase_db)):
    db_status = await db.test_connection()
    return {
        "status": "healthy",
        "environment": settings.environment,
        "openai_configured": bool(settings.openai_api_key),
        "supabase_configured": bool(settings.supabase_url and settings.supabase_key),
        "database": db_status
    }

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

@app.post("/api/v1/chat/chat")
async def chat(request: ChatRequest):
    """Chat endpoint."""
    chat_service = await get_chat_service()
    result = await chat_service.process_message(
        message=request.message,
        session_id=request.session_id
    )
    return result

@app.get("/debug/versions")
async def get_versions():
    import supabase
    import openai
    import fastapi
    try:
        import httpx
        httpx_version = httpx.__version__
    except:
        httpx_version = "not installed"
    
    return {
        "supabase": supabase.__version__ if hasattr(supabase, '__version__') else "unknown",
        "openai": openai.__version__ if hasattr(openai, '__version__') else "unknown", 
        "fastapi": fastapi.__version__ if hasattr(fastapi, '__version__') else "unknown",
        "httpx": httpx_version,
    }

@app.get("/debug/code-version")
async def code_version():
    """Check which version of the code is running"""
    return {
        "timestamp": "2025-10-13-v6",
        "chat_service_file": "updated_with_logging_v2",
        "test": "New code is deployed with chat-debug endpoint"
    }

@app.get("/debug/supabase-test")
async def test_supabase_connection():
    """Test different ways to connect to Supabase"""
    results = {}
    
    # Test 1: Check environment variables
    results["env_vars"] = {
        "SUPABASE_URL": bool(settings.supabase_url),
        "SUPABASE_KEY": bool(settings.supabase_key),
        "url_value": settings.supabase_url[:30] + "..." if settings.supabase_url else None
    }
    
    # Test 2: Try creating client with minimal parameters
    try:
        from supabase import create_client
        test_client = create_client(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_key
        )
        results["client_creation"] = "success"
        
        # Test 3: Try a simple query
        try:
            query_result = test_client.table("staging_services").select("id").limit(1).execute()
            results["query_test"] = {
                "status": "success",
                "has_data": bool(query_result.data)
            }
        except Exception as e:
            results["query_test"] = {
                "status": "error",
                "error": str(e)
            }
            
    except Exception as e:
        results["client_creation"] = {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }
    
    return results

@app.get("/debug/test-search")
async def test_search(query: str = "Melbourne"):
    """Test search functionality directly"""
    try:
        from core.database.supabase_only import get_supabase_db
        db = await get_supabase_db()
        
        # Test the search
        results = db.search_services_by_text(query, limit=5)
        
        return {
            "query": query,
            "results_count": len(results),
            "results": results[:2] if results else [],
            "search_worked": len(results) > 0
        }
    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__
        }

@app.post("/api/v1/chat/chat-debug")
async def chat_debug(request: ChatRequest):
    """Debug version of chat endpoint - shows what chat service sees"""
    from services.chat_service import get_chat_service
    from core.database.supabase_only import get_supabase_db
    
    # Test 1: Direct database call in this endpoint
    db = await get_supabase_db()
    direct_results = db.search_services_by_text(request.message, limit=5)
    
    # Test 2: Call through chat service
    chat_service = await get_chat_service()
    result = await chat_service.process_message(
        message=request.message,
        session_id=request.session_id
    )
    
    # Return comparison
    return {
        "direct_search_in_endpoint": {
            "count": len(direct_results),
            "sample": direct_results[0] if direct_results else None
        },
        "chat_service_result": result,
        "mismatch": len(direct_results) > 0 and result.get("services_found", 0) == 0
    }
