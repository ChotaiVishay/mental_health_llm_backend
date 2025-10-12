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
