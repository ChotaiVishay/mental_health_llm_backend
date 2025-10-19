
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

@app.post("/api/v1/chat/chat")
async def chat(request: ChatRequest):
    chat_service = await get_chat_service()
    result = await chat_service.process_message(
        message=request.message,
        session_id=request.session_id
    )
    return result