"""
Main chat service orchestrating mental health chatbot functionality.
Enhanced with comprehensive debug logging.
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

            logger.info("=== CHAT SERVICE START ===", message=message, session_id=session_id)

            # Validate configuration
            if not self.settings.openai_api_key:
                logger.error("OpenAI API key not configured")
                return {
                    "message": "Configuration error: OpenAI API key is missing. Please set OPENAI_API_KEY environment variable.",
                    "session_id": session_id,
                    "services_found": 0,
                    "query_successful": False,
                    "error": "OPENAI_API_KEY not configured"
                }
            
            if not self.settings.supabase_url or not self.settings.supabase_key:
                logger.error("Supabase not configured")
                return {
                    "message": "Configuration error: Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY.",
                    "session_id": session_id,
                    "services_found": 0,
                    "query_successful": False,
                    "error": "Supabase not configured"
                }

            # Get clients
            try:
                logger.info("Initializing clients...")
                openai_client = get_openai_client()
                supabase_db = await get_supabase_db()
                logger.info("✓ Clients initialized successfully")
            except Exception as e:
                logger.error("Failed to initialize clients", error=str(e), exc_info=True)
                return {
                    "message": "Failed to initialize services. Please check configuration.",
                    "session_id": session_id,
                    "services_found": 0,
                    "query_successful": False,
                    "error": f"Client initialization failed: {str(e)}"
                }

            # Search for services with comprehensive logging
            try:
                logger.info("Starting database search", search_term=message, limit=10)
                
                search_results = supabase_db.search_services_by_text(message, limit=10)
                
                logger.info("✓ Database search completed", 
                           results_count=len(search_results),
                           search_term=message)
                
                # Log details of first result for verification
                if search_results:
                    first = search_results[0]
                    logger.info("First result details:", 
                               service_name=first.get('service_name'),
                               organisation=first.get('organisation_name'),
                               suburb=first.get('suburb'),
                               state=first.get('state'))
                else:
                    logger.warning("Search returned zero results", search_term=message)
                    
            except Exception as e:
                logger.error("Database search FAILED", 
                            error=str(e), 
                            search_term=message,
                            exc_info=True)
                return {
                    "message": "I apologise, but I'm having trouble accessing the service database right now. Please try again later or contact support.",
                    "session_id": session_id,
                    "services_found": 0,
                    "query_successful": False,
                    "error": f"Database search failed: {str(e)}"
                }

            # Generate response using OpenAI
            try:
                if search_results:
                    logger.info("Generating AI response for results", count=len(search_results))
                    
                    # Format search results for better readability
                    formatted_services = []
                    for service in search_results[:5]:  # Top 5 results
                        service_info = f"""
- Service: {service.get('service_name', 'N/A')}
  Organization: {service.get('organisation_name', 'N/A')}
  Location: {service.get('suburb', 'N/A')}, {service.get('state', 'N/A')}
  Cost: {service.get('cost', 'N/A')}
  Phone: {service.get('phone', 'N/A')}
  Delivery: {service.get('delivery_method', 'N/A')}
"""
                        formatted_services.append(service_info)

                    prompt = f"""The user asked: "{message}"

I found these mental health services:
{''.join(formatted_services)}

Please provide a helpful response that:
1. Directly answers their question
2. Lists the relevant services with key details (name, location, cost, contact)
3. Is empathetic and supportive
4. Keeps response under 250 words
5. Encourages them to contact the services for more information

Respond as a helpful mental health services assistant."""

                    logger.info("Calling OpenAI API...")
                    response = openai_client.client.chat.completions.create(
                        model=self.settings.openai_model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=self.settings.openai_temperature,
                        max_tokens=self.settings.max_response_tokens
                    )
                    
                    response_text = response.choices[0].message.content
                    logger.info("✓ OpenAI response generated", length=len(response_text))
                    
                    return {
                        "message": response_text,
                        "session_id": session_id,
                        "services_found": len(search_results),
                        "raw_data": search_results[:3],
                        "query_successful": True,
                    }
                else:
                    logger.info("No results found, generating fallback response")
                    
                    prompt = f"""The user asked: "{message}"

I couldn't find specific mental health services matching their request in the database.

Please provide a supportive response that:
1. Acknowledges we couldn't find specific matches
2. Suggests they try different search terms (be specific about what to try)
3. Recommends contacting their GP or calling mental health helplines (Lifeline 13 11 14, Beyond Blue 1300 22 4636)
4. Is empathetic and helpful
5. Keeps response under 150 words"""

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
                        "suggestion": "Try different search terms like 'counseling', 'therapy', or specify a location",
                    }
                    
            except Exception as e:
                logger.error("✗ OpenAI API call failed", error=str(e), exc_info=True)
                
                # Fallback response if OpenAI fails
                if search_results:
                    fallback_msg = f"I found {len(search_results)} mental health services, but I'm having trouble generating a detailed response. Here are the first few results:\n\n"
                    for i, service in enumerate(search_results[:3], 1):
                        fallback_msg += f"{i}. {service.get('service_name', 'N/A')} - {service.get('suburb', 'N/A')}, {service.get('state', 'N/A')}\n"
                        fallback_msg += f"   Organization: {service.get('organisation_name', 'N/A')}\n"
                        fallback_msg += f"   Phone: {service.get('phone', 'N/A')}\n"
                        fallback_msg += f"   Cost: {service.get('cost', 'N/A')}\n\n"
                    
                    return {
                        "message": fallback_msg,
                        "session_id": session_id,
                        "services_found": len(search_results),
                        "raw_data": search_results[:3],
                        "query_successful": True,
                        "warning": "Using fallback response due to AI service issue"
                    }
                else:
                    return {
                        "message": "I apologize, but I'm experiencing technical difficulties with the AI service. Please try again later.",
                        "session_id": session_id,
                        "services_found": 0,
                        "query_successful": False,
                        "error": f"OpenAI API failed: {str(e)}"
                    }

        except Exception as e:
            logger.error("✗ CHAT PROCESSING COMPLETELY FAILED", 
                        message=message, 
                        error=str(e), 
                        exc_info=True)
            return {
                "message": "I apologize, but I'm experiencing technical difficulties. Please try again later or contact support.",
                "session_id": session_id or str(uuid.uuid4()),
                "services_found": 0,
                "query_successful": False,
                "error": str(e),
            }

    async def get_conversation_history(self, session_id: str, limit: int = 20) -> List[Dict]:
        """Get conversation history for a session."""
        try:
            supabase_db = await get_supabase_db()
            messages = supabase_db.query_table(
                "messages",
                filters={"session_id": session_id},
                limit=limit
            )
            return messages
        except Exception as e:
            logger.error("Failed to get conversation history", error=str(e))
            return []

    async def get_suggested_questions(self) -> List[str]:
        """Get suggested questions to help users get started."""
        return [
            "Find mental health services in Melbourne",
            "What free counseling services are available?",
            "I need help with anxiety - what services can help?",
            "Show me telehealth therapy options",
            "Are there services for young people with depression?",
        ]

    async def health_check(self) -> Dict[str, Any]:
        """Check the health of chat service components."""
        try:
            # Check configuration
            config_status = {
                "openai_api_key_set": bool(self.settings.openai_api_key),
                "supabase_url_set": bool(self.settings.supabase_url),
                "supabase_key_set": bool(self.settings.supabase_key),
                "openai_model": self.settings.openai_model,
            }
            
            # Check database
            supabase_db = await get_supabase_db()
            db_status = await supabase_db.test_connection()
            
            # Check OpenAI
            openai_client = get_openai_client()
            openai_status = await openai_client.test_connection()

            all_healthy = (
                config_status["openai_api_key_set"] and
                config_status["supabase_url_set"] and
                config_status["supabase_key_set"] and
                db_status.get("status") == "connected" and
                openai_status.get("status") == "connected"
            )

            return {
                "status": "healthy" if all_healthy else "degraded",
                "configuration": config_status,
                "database": db_status,
                "openai": openai_status,
                "ready_for_chat": all_healthy,
            }
        except Exception as e:
            logger.error("Chat service health check failed", error=str(e), exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "ready_for_chat": False
            }


chat_service = MentalHealthChatService()

async def get_chat_service() -> MentalHealthChatService:
    return chat_service