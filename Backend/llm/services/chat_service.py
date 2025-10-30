"""
Minimal working chat service.
"""

import uuid
import structlog
from typing import Dict, Any, List, Optional
from openai import OpenAI

from app.config import get_settings
from core.database.vector_search import get_vector_search_service

logger = structlog.get_logger(__name__)


class MentalHealthChatService:
    """Simple chat service with vector search."""
    
    def __init__(self):
        self.settings = get_settings()
        self._openai_client: Optional[OpenAI] = None
        self._vector_search = None
    
    @property
    def openai_client(self) -> OpenAI:
        """Get or create OpenAI client."""
        if self._openai_client is None:
            self._openai_client = OpenAI(api_key=self.settings.openai_api_key)
        return self._openai_client
    
    @property
    def vector_search(self):
        """Get vector search service."""
        if self._vector_search is None:
            self._vector_search = get_vector_search_service()
        return self._vector_search
    
    def _generate_ai_response(
        self,
        query: str,
        search_results: List[Dict[str, Any]]
    ) -> str:
        """Generate AI response using OpenAI."""
        try:
            # Build context from search results
            context_parts = []
            for idx, service in enumerate(search_results[:5], 1):
                service_info = (
                    f"{idx}. {service.get('service_name', 'Unknown')}\n"
                    f"   Org: {service.get('organisation_name', 'N/A')}\n"
                    f"   Location: {service.get('suburb', 'N/A')}, {service.get('state', 'N/A')}\n"
                    f"   Type: {service.get('service_type', 'N/A')}\n"
                    f"   Cost: {service.get('cost', 'N/A')}\n"
                    f"   Phone: {service.get('phone', 'N/A')}\n"
                )
                context_parts.append(service_info)
            
            context = "\n".join(context_parts) if context_parts else "No services found."
            
            # System prompt
            system_prompt = """You are a helpful mental health support assistant for Victoria, Australia.
Help people find mental health services based on their needs.

Guidelines:
- Be empathetic and supportive
- Provide clear information
- Include contact details
- Mention if services are free
- For crisis: Lifeline 13 11 14 or 000"""
            
            # Generate response
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Query: {query}\n\nServices:\n{context}"}
            ]
            
            response = self.openai_client.chat.completions.create(
                model=self.settings.openai_model,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            logger.error("Failed to generate AI response", error=str(e))
            
            # Fallback
            if search_results:
                return (
                    f"I found {len(search_results)} services. "
                    f"Top result: {search_results[0].get('service_name')} "
                    f"in {search_results[0].get('suburb')}."
                )
            else:
                return (
                    "I'm having trouble right now. For support:\n"
                    "- Lifeline: 13 11 14 (24/7)\n"
                    "- Beyond Blue: 1300 22 4636\n"
                    "- Emergency: 000"
                )
    
    async def process_message(
        self,
        message: str,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process a user message and return response."""
        try:
            # Generate session_id if not provided
            if not session_id:
                session_id = str(uuid.uuid4())
            
            logger.info("Processing message", session_id=session_id)
            
            # Crisis check
            crisis_keywords = ['suicide', 'kill myself', 'want to die']
            if any(keyword in message.lower() for keyword in crisis_keywords):
                logger.warning("Crisis query detected")
                return {
                    "message": (
                        "I'm concerned about what you've shared. Please reach out:\n\n"
                        "🆘 Emergency: 000\n"
                        "📞 Lifeline: 13 11 14 (24/7)\n"
                        "💬 Lifeline Text: 0477 13 11 14\n\n"
                        "You don't have to face this alone."
                    ),
                    "session_id": session_id,
                    "services_found": 0,
                    "query_successful": True,
                    "action": "crisis_halt"
                }
            
            # Vector search
            try:
                search_results = self.vector_search.smart_search(query=message)
            except Exception as e:
                logger.error("Vector search failed", error=str(e))
                search_results = []
            
            # Generate AI response
            ai_response = self._generate_ai_response(message, search_results)
            
            return {
                "message": ai_response,
                "session_id": session_id,
                "services_found": len(search_results),
                "query_successful": True,
                "raw_data": search_results[:3] if search_results else []
            }
        
        except Exception as e:
            logger.error("Failed to process message", error=str(e))
            
            return {
                "message": "I encountered an error. Please try again.",
                "session_id": session_id or str(uuid.uuid4()),
                "services_found": 0,
                "query_successful": False
            }


# Singleton
_chat_service: Optional[MentalHealthChatService] = None


async def get_chat_service() -> MentalHealthChatService:
    """Get chat service singleton."""
    global _chat_service
    if _chat_service is None:
        _chat_service = MentalHealthChatService()
    return _chat_service