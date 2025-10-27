
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import get_settings
from core.database.supabase_only import get_supabase_db, SupabaseOnlyConnection
from services.chat_service import get_chat_service

settings = get_settings()

# FastAPI application setup - Pre-production setup
app = FastAPI(
    title="Mental Health LLM Backend",
    description="LLM-powered chatbot",
    version="1.0.0",
)

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

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    display_message: Optional[str] = None


class ChatSessionSummary(BaseModel):
    id: str
    user_id: str
    title: Optional[str] = None
    last_message: Optional[str] = None
    last_message_role: Optional[str] = None
    created_at: str
    updated_at: str


class ChatMessageRecord(BaseModel):
    id: str
    session_id: str
    user_id: str
    role: str
    content: str
    created_at: str

@app.post("/api/v1/chat/chat")
async def chat(request: ChatRequest):
    chat_service = await get_chat_service()
    result = await chat_service.process_message(
        message=request.message,
        session_id=request.session_id,
        user_id=request.user_id,
        display_message=request.display_message
    )
    return result


@app.get("/api/v1/chat/sessions", response_model=List[ChatSessionSummary])
async def list_chat_sessions(
    user_id: str = Query(..., description="User identifier whose sessions should be listed"),
    limit: int = Query(20, ge=1, le=100),
):
    if not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id is required")

    chat_service = await get_chat_service()
    sessions = await chat_service.list_sessions(user_id=user_id, limit=limit)
    return sessions


@app.get("/api/v1/chat/conversation/{session_id}", response_model=List[ChatMessageRecord])
async def get_chat_conversation(
    session_id: str,
    user_id: str = Query(..., description="User identifier"),
    limit: int = Query(100, ge=1, le=500),
):
    if not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id is required")

    chat_service = await get_chat_service()
    messages = await chat_service.get_conversation_history(session_id=session_id, user_id=user_id, limit=limit)
    return messages
