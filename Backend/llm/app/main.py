from typing import Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import get_settings
from core.database.supabase_only import get_supabase_db, SupabaseOnlyConnection
from services.chat_service import get_chat_service

settings = get_settings()

app = FastAPI(
    title="Mental Health LLM Backend",
    description="LLM-powered chatbot with service submission",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_origins=[
        "https://comp-30022-group-30-mental-health-s.vercel.app",
        "https://support-atlas-pxrnqxr9-gurshan-singh-nandas-projects.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "Mental Health LLM Backend is running!",
        "chat_available": True,
        "service_submission_available": True
    }


@app.get("/health")
async def health_check(db: SupabaseOnlyConnection = Depends(get_supabase_db)):
    db_status = await db.test_connection()
    return {
        "status": "healthy",
        "database": db_status
    }


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


# Service submission endpoint
@app.post("/api/v1/chat/service-draft")
async def submit_service_draft(data: Dict[Any, Any]):
    """
    Submit a service draft from the chat form.
    """
    try:
        from services.flows.service_creation import submit_service_form
        
        session_id = data.get("session_id")
        form_data = data.get("data", {})
        
        result = await submit_service_form(form_data, session_id)
        
        return {
            "message": "Thank you! Your service has been submitted for review. Our team will review it and add it to the directory soon.",
            "data": result
        }
    
    except Exception as e:
        logger.error("Service submission failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit service: {str(e)}"
        )


# Get form configuration
@app.get("/api/v1/services/form-config")
async def get_service_form_config():
    """Get service form field configuration."""
    try:
        from services.flows.service_creation import (
            SERVICE_FORM_FIELDS,
            SERVICE_FORM_OPTION_SETS
        )
        return {
            "fields": SERVICE_FORM_FIELDS,
            "options": SERVICE_FORM_OPTION_SETS
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get form config: {str(e)}"
        )