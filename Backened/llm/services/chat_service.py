"""
Main chat service orchestrating mental health chatbot functionality.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
import structlog

from core.database.supabase_only import get_supabase_db
from core.llm.openai_client import get_openai_client
from app.config import get_settings

logger = structlog.get_logger(__name__)

class MentalHealthChatService:
    """Main service for handling mental health chatbot conversations."""

    def __init__(self):
        self.settings = get_settings()

    async def process_message(self, message: str, session_id: Optional[str] = None, user_context: Optional[Dict] = None) -> Dict[str, Any]:
        """Process a user message and return a response."""
        try:
            if not session_id:
                session_id = str(uuid.uuid4())

            logger.info("Processing message", message=message, session_id=session_id)

            # Get clients
            openai_client = get_openai_client()
            supabase_db = await get_supabase_db()

            # Search for services
            search_results = supabase_db.search_services_by_text(message, limit=10)

            # Generate response using OpenAI
            if search_results:
                prompt = f"""The user asked: "{message}"

I found these mental health services:
{search_results[:3]}

Please provide a helpful response that:
1. Answers their question
2. Lists the relevant services with key details
3. Is empathetic and supportive
4. Keeps response under 200 words

Respond as a helpful mental health services assistant."""

                response = openai_client.client.chat.completions.create(
                    model=self.settings.openai_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=self.settings.openai_temperature,
                    max_tokens=self.settings.max_response_tokens
                )
                
                response_text = response.choices[0].message.content
                
                return {
                    "message": response_text,
                    "session_id": session_id,
                    "services_found": len(search_results),
                    "raw_data": search_results[:3],
                    "query_successful": True,
                }
            else:
                prompt = f"""The user asked: "{message}"

I couldn't find specific mental health services matching their request.

Please provide a supportive response that acknowledges this and suggests contacting their GP or mental health helplines. Keep response under 150 words."""

                response = openai_client.client.chat.completions.create(
                    model=self.settings.openai_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=self.settings.openai_temperature,
                    max_tokens=self.settings.max_response_tokens
                )
                
                return {
                    "message": response.choices[0].message.content,
                    "session_id": session_id,
                    "services_found": 0,
                    "query_successful": True,
                    "suggestion": "Try different search terms or contact your GP",
                }

        except Exception as e:
            logger.error("Chat processing failed", message=message, error=str(e), exc_info=True)
            return {
                "message": "I apologize, but I'm experiencing technical difficulties. Please try again later.",
                "session_id": session_id or str(uuid.uuid4()),
                "services_found": 0,
                "query_successful": False,
                "error": str(e),
            }

    async def get_suggested_questions(self) -> List[str]:
        """Get suggested questions to help users get started."""
        return [
            "Find mental health services near me in Melbourne",
            "What free counseling services are available?",
            "I need help with anxiety - what services can help?",
            "Show me telehealth therapy options",
        ]

    async def health_check(self) -> Dict[str, Any]:
        """Check the health of chat service components."""
        try:
            supabase_db = await get_supabase_db()
            db_status = await supabase_db.test_connection()
            
            openai_client = get_openai_client()
            openai_status = await openai_client.test_connection()

            return {
                "status": "healthy",
                "database": db_status,
                "openai": openai_status,
                "ready_for_chat": True,
            }
        except Exception as e:
            logger.error("Chat service health check failed", error=str(e))
            return {"status": "error", "error": str(e), "ready_for_chat": False}


chat_service = MentalHealthChatService()

async def get_chat_service() -> MentalHealthChatService:
    return chat_service
