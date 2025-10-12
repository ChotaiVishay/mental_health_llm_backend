"""
Chat API endpoints for the mental health chatbot.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from services.chat_service import get_chat_service, MentalHealthChatService

router = APIRouter()

class ChatRequest(BaseModel):
    """Request model for chat messages."""
    message: str = Field(..., description="User's message to the chatbot", min_length=1, max_length=1000)
    session_id: Optional[str] = Field(None, description="Optional session ID to continue conversation")

class ChatResponse(BaseModel):
    """Response model for chat messages."""
    message: str = Field(..., description="Chatbot's response")
    session_id: str = Field(..., description="Session ID for this conversation")
    services_found: int = Field(..., description="Number of services found")
    query_successful: bool = Field(..., description="Whether the query was processed successfully")
    raw_data: Optional[List] = Field(None, description="Raw service data (limited)")
    suggestion: Optional[str] = Field(None, description="Additional suggestion for the user")
    error: Optional[str] = Field(None, description="Error message if something went wrong")

class ConversationHistoryResponse(BaseModel):
    """Response model for conversation history."""
    session_id: str
    messages: List[dict]
    total_messages: int

class SuggestedQuestionsResponse(BaseModel):
    """Response model for suggested questions."""
    questions: List[str]

@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(
    request: ChatRequest,
    chat_service: MentalHealthChatService = Depends(get_chat_service)
):
    """
    Send a message to the mental health chatbot and get a response.
    
    The chatbot can help you find mental health services, answer questions about
    costs, locations, service types, and provide information about accessing care.
    """
    try:
        result = await chat_service.process_message(
            message=request.message,
            session_id=request.session_id
        )
        
        return ChatResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat processing failed: {str(e)}"
        )

@router.get("/conversation/{session_id}", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    session_id: str,
    limit: int = 20,
    chat_service: MentalHealthChatService = Depends(get_chat_service)
):
    """
    Get the conversation history for a specific session.
    """
    try:
        messages = await chat_service.get_conversation_history(session_id, limit)
        
        return ConversationHistoryResponse(
            session_id=session_id,
            messages=messages,
            total_messages=len(messages)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve conversation history: {str(e)}"
        )

@router.get("/suggested-questions", response_model=SuggestedQuestionsResponse)
async def get_suggested_questions(
    chat_service: MentalHealthChatService = Depends(get_chat_service)
):
    """
    Get suggested questions to help users get started with the chatbot.
    """
    try:
        questions = await chat_service.get_suggested_questions()
        
        return SuggestedQuestionsResponse(questions=questions)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get suggested questions: {str(e)}"
        )

@router.get("/health")
async def chat_health_check(
    chat_service: MentalHealthChatService = Depends(get_chat_service)
):
    """
    Check the health status of the chat service and its components.
    """
    try:
        health_status = await chat_service.health_check()
        return health_status
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        )