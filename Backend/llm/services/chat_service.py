"""
Enhanced chat service using vector search for semantic understanding.
"""

from typing import Dict, Any, List, Optional
import uuid
import structlog

from core.database.vector_search import get_vector_search_service
from core.database.supabase_only import get_supabase_db
from core.llm.openai_client import get_openai_client
from app.config import get_settings
from services.intent_router import detect_intent
from services.flows.service_creation import prepare_payload

logger = structlog.get_logger(__name__)


class MentalHealthChatService:
    """Enhanced chat service with vector search capabilities."""

    def __init__(self):
        self.settings = get_settings()

    async def insert_chat(self,*,user_id: str | None,session_id: str,user_text: str,assistant_text: str) -> None:
        if not user_id:
            return  # anonymous chat -> skip persistence

        cleaned_user = (user_text or "").strip()
        cleaned_assistant = (assistant_text or "").strip()
        if not cleaned_user and not cleaned_assistant:
            return

        try:
            supabase_db = await get_supabase_db()

            if cleaned_user:
                supabase_db.insert_chat_message(
                    session_id=session_id,
                    user_id=user_id,
                    role="user",
                    content=cleaned_user,
                )

            if cleaned_assistant:
                supabase_db.insert_chat_message(
                    session_id=session_id,
                    user_id=user_id,
                    role="assistant",
                    content=cleaned_assistant,
                )

            supabase_db.upsert_chat_session(
                user_id=user_id,
                session_id=session_id,
                title=cleaned_user[:40] or None,
                last_message=cleaned_assistant[:100],
                last_role="assistant",
            )

        except Exception as exc:
            logger.warning(
                "Could not persist chat messages",
                session_id=session_id,
                user_id=user_id,
                error=str(exc),
                exc_info=True,
            )

    async def process_message(self,message: str, user_id: Optional[str] = None, session_id: Optional[str] = None, user_context: Optional[Dict] = None) -> Dict[str, Any]:
        """Process user message using vector search for semantic understanding."""
        try:
            if not session_id:
                session_id = str(uuid.uuid4())

            logger.info("=== PROCESSING MESSAGE (VECTOR SEARCH) ===", 
                       message=message, 
                       session_id=session_id)

            openai_client = get_openai_client()
            flagged_self_harm = False
            if self.settings.openai_api_key:
                try:
                    moderation = openai_client.check_moderation(message)
                    categories = moderation.get("categories") or {}
                    flagged_self_harm = bool(
                        moderation.get("flagged")
                        and any(
                            key.startswith("self-harm") and categories.get(key)
                            for key in categories
                        )
                    )
                except Exception as moderation_error:
                    logger.error("Moderation check failed",
                                 error=str(moderation_error),
                                 exc_info=True)

            if flagged_self_harm:
                logger.warning("Crisis intent detected; halting chat", session_id=session_id)
                crisis_text = (
                    "It sounds like you might be in immediate danger. "
                    "I can't continue this conversation, but please reach out to emergency services or the crisis helplines below."
                )

                assistant_text = crisis_text
                await self.insert_chat(user_id=user_id,session_id=session_id,user_text=message,assistant_text=assistant_text)
                return {
                    "message": crisis_text,
                    "response": crisis_text,
                    "session_id": session_id,
                    "services_found": 0,
                    "query_successful": False,
                    "action": "crisis_halt",
                    "resources": [
                        {"label": "Call Emergency (000)", "href": "tel:000"},
                        {"label": "Call Lifeline 13 11 14", "href": "tel:131114"},
                        {"label": "Text Lifeline 0477 13 11 14", "href": "sms:0477131114"},
                        {"label": "Suicide Call Back Service 1300 659 467", "href": "tel:1300659467"},
                    ],
                }

            # Detect intent
            intent = detect_intent(message)

            if intent == "add_service":
                logger.info("Add service intent detected")
                
                assistant_text = "I can help add a new service. Please provide the details via the form."
                await self.insert_chat(
                    user_id=user_id,
                    session_id=session_id,
                    user_text=message,
                    assistant_text=assistant_text,
                )

                return {
                    "message": "I can help add a new service. Please provide the details via the form.",
                    "session_id": session_id,
                    "services_found": 0,
                    "query_successful": True,
                    "action": "request_service_form",
                }

            # Validate configuration
            if not self.settings.openai_api_key:
                logger.error("OpenAI API key not configured")
                return {
                    "message": "Configuration error: OpenAI API key missing.",
                    "session_id": session_id,
                    "services_found": 0,
                    "query_successful": False,
                    "error": "OPENAI_API_KEY not configured"
                }

            # Get vector search service
            try:
                vector_search = get_vector_search_service()
                logger.info("Vector search service initialized")
            except Exception as e:
                logger.error("Failed to initialize vector search", error=str(e), exc_info=True)
                return {
                    "message": "Failed to initialize search service.",
                    "session_id": session_id,
                    "services_found": 0,
                    "query_successful": False,
                    "error": f"Vector search init failed: {str(e)}"
                }

            # Perform vector search
            try:
                logger.info("Starting vector search...", query=message)
                
                search_results = vector_search.search_with_context(
                    query=message,
                    limit=10,
                    user_context=user_context
                )
                
                logger.info("Vector search completed",
                results_count=len(search_results),
                avg_similarity=sum(r.get('similarity', 0) for r in search_results) / len(search_results) if search_results else 0)
                
                # Log top result for debugging
                if search_results:
                    top = search_results[0]
                    logger.info("Top result",
                               service=top.get('service_name'),
                               similarity=f"{top.get('similarity', 0):.2%}",
                               location=f"{top.get('suburb')}, {top.get('state')}")
                
            except Exception as e:
                logger.error("Vector search failed", error=str(e), exc_info=True)
                
                # Fallback to keyword search if vector search fails
                logger.warning("Falling back to keyword search")
                try:
                    supabase_db = await get_supabase_db()
                    search_results = supabase_db.search_services_by_text(message, limit=10)
                    logger.info("Fallback keyword search completed", count=len(search_results))
                except Exception as e2:
                    logger.error("Fallback search also failed", error=str(e2))
                    return {
                        "message": "I'm having trouble searching for services right now. Please try again later.",
                        "session_id": session_id,
                        "services_found": 0,
                        "query_successful": False,
                        "error": f"Both vector and keyword search failed"
                    }

            # Generate AI response
            try:
                openai_client = get_openai_client()
                
                if search_results:
                    logger.info("Generating AI response", results_count=len(search_results))
                    
                    # Format top 5 results
                    formatted_services = []
                    for idx, service in enumerate(search_results[:5], 1):
                        similarity = service.get('similarity', 0)
                        
                        service_info = f"""
{idx}. {service.get('service_name', 'N/A')}"""
                        
                        if similarity:
                            service_info += f" (Relevance: {similarity:.0%})"
                        
                        service_info += f"""
   Organization: {service.get('organisation_name', 'N/A')}
   Location: {service.get('suburb', 'N/A')}, {service.get('state', 'N/A')}
   Cost: {service.get('cost', 'N/A')}
   Phone: {service.get('phone', 'N/A')}
   Delivery: {service.get('delivery_method', 'N/A')}
   Type: {service.get('service_type', 'N/A')}
"""
                        formatted_services.append(service_info)

                    # Check for crisis indicators
                    crisis_keywords = ['suicide', 'crisis', 'emergency', 'urgent', 'help me', 'desperate']
                    is_crisis = any(word in message.lower() for word in crisis_keywords)
                    
                    crisis_prompt = ""
                    if is_crisis:
                        crisis_prompt = """
IMPORTANT: This appears to be a crisis or urgent situation. 
- Prioritize immediate support options
- Include crisis helpline numbers (Lifeline 13 11 14, Beyond Blue 1300 22 4636)
- Emphasize 24/7 and free services
- Be empathetic and supportive
"""

                    prompt = f"""You are a compassionate mental health services assistant helping people in Australia.

User asked: "{message}"

I found these relevant services:
{''.join(formatted_services)}

{crisis_prompt}

Provide a helpful response that:
1. Directly answers their question with empathy and understanding
2. Highlights the 2-3 most relevant services with key details (name, location, cost, contact)
3. Mentions if services are free or bulk-billed
4. Includes phone numbers and how to access the service
5. Encourages them to reach out
6. Uses plain, clear language (no markdown formatting)
7. Keeps response under 300 words

Be warm, supportive, and practical in your response."""

                    logger.info("Calling OpenAI API...")
                    response = openai_client.client.chat.completions.create(
                        model=self.settings.openai_model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=self.settings.openai_temperature,
                        max_tokens=self.settings.max_response_tokens
                    )
                    
                    response_text = response.choices[0].message.content
                    
                    logger.info("✓ AI response generated", length=len(response_text))
                    
                    await self.insert_chat(user_id=user_id,session_id=session_id,user_text=message,assistant_text=response_text)
                            
                    return {
                        "message": response_text,
                        "session_id": session_id,
                        "services_found": len(search_results),
                        "raw_data": search_results[:3],
                        "query_successful": True,
                    }
                
                else:
                    # No results found
                    logger.info("No results found, generating helpful response")
                    
                    prompt = f"""The user asked: "{message}"

I couldn't find specific mental health services matching their request in the database.

Provide a supportive response that:
1. Acknowledges we couldn't find exact matches
2. Suggests alternative search terms (be specific - e.g., try "counseling" instead of "therapy", or specify a suburb)
3. Recommends calling these helplines for immediate support:
   - Lifeline: 13 11 14 (24/7 crisis support)
   - Beyond Blue: 1300 22 4636 (24/7 anxiety/depression support)
   - Suicide Call Back Service: 1300 659 467
4. Suggests contacting their GP for a mental health care plan
5. Remains warm, empathetic and helpful
6. Uses plain language (no markdown)
7. Keeps response under 200 words"""

                    response = openai_client.client.chat.completions.create(
                        model=self.settings.openai_model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=self.settings.openai_temperature,
                        max_tokens=self.settings.max_response_tokens
                    )

                    response_text = response.choices[0].message.content
                    await self.insert_chat(user_id=user_id,session_id=session_id,user_text=message,assistant_text=response_text)

                    return {
                        "message": response.choices[0].message.content,
                        "session_id": session_id,
                        "services_found": 0,
                        "query_successful": True,
                        "suggestion": "Try different search terms or call the helplines above for immediate support",
                    }
                    
            except Exception as e:
                logger.error("OpenAI API failed", error=str(e), exc_info=True)
                
                # Fallback if AI fails but we have results
                if search_results:
                    fallback_msg = f"I found {len(search_results)} mental health services. Here are the top results:\n\n"
                    for i, service in enumerate(search_results[:3], 1):
                        fallback_msg += f"{i}. {service.get('service_name', 'N/A')}\n"
                        fallback_msg += f"   {service.get('suburb', 'N/A')}, {service.get('state', 'N/A')}\n"
                        fallback_msg += f"   Phone: {service.get('phone', 'N/A')}\n"
                        fallback_msg += f"   Cost: {service.get('cost', 'N/A')}\n\n"
                    
                    return {
                        "message": fallback_msg,
                        "session_id": session_id,
                        "services_found": len(search_results),
                        "raw_data": search_results[:3],
                        "query_successful": True,
                        "warning": "Using fallback response (AI service unavailable)"
                    }
                else:
                    return {
                        "message": "I'm experiencing technical difficulties. Please try again or call Lifeline on 13 11 14 for support.",
                        "session_id": session_id,
                        "services_found": 0,
                        "query_successful": False,
                        "error": f"AI service failed: {str(e)}"
                    }

        except Exception as e:
            logger.error("✗ CHAT PROCESSING FAILED",
                        message=message,
                        error=str(e),
                        exc_info=True)
            return {
                "message": "I apologize, I'm experiencing technical difficulties. Please try again later or contact support.",
                "session_id": session_id or str(uuid.uuid4()),
                "services_found": 0,
                "query_successful": False,
                "error": str(e),
            }

    async def process_service_form(self,form_data: Dict[str, Any],session_id: Optional[str] = None) -> Dict[str, Any]:
        """Process service creation form submission."""
        if not session_id:
            session_id = str(uuid.uuid4())

        try:
            logger.info("=== SERVICE CREATION START ===", session_id=session_id)

            # Validate and normalize
            payload = prepare_payload(form_data)
            logger.info("Service form validated", keys=list(payload.keys()))

            # Insert into database
            supabase_db = await get_supabase_db()
            created = supabase_db.insert_service(payload)

            service_name = created.get("service_name") or payload.get("service_name")
            
            # TODO: Generate embedding for new service asynchronously
            # For now, embeddings will be generated in next batch run

            return {
                "message": f"Thanks! The service '{service_name}' has been submitted successfully. It will appear in search results shortly.",
                "session_id": session_id,
                "services_found": 0,
                "query_successful": True,
                "action": "service_created",
                "raw_data": [created],
            }
        except Exception as e:
            logger.error("Service creation failed", error=str(e), exc_info=True)
            return {
                "message": "I couldn't submit that service due to a validation or database error.",
                "session_id": session_id,
                "services_found": 0,
                "query_successful": False,
                "error": str(e),
            }

    async def get_conversation_history(self, session_id: str, user_id: str, limit: int = 20) -> List[Dict]:
        """Get conversation history for a session."""
        try:
            supabase_db = await get_supabase_db()
            return supabase_db.get_session_messages(
                session_id=session_id,
                user_id=user_id,
                limit=limit
            )
        except Exception as e:
            logger.error("Failed to get conversation history", session_id=session_id, user_id=user_id, error=str(e))
            raise
        
    async def list_sessions(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Return the latest chat sessions for a user, newest first."""
        supabase_db = await get_supabase_db()
        try:
            return supabase_db.list_chat_sessions(user_id=user_id, limit=limit)
        except Exception as exc:
            logger.error("Failed to list chat sessions", user_id=user_id, error=str(exc), exc_info=True)
            raise


    async def get_suggested_questions(self) -> List[str]:
        """Get suggested questions using relevant terminology."""
        return [
            "I need help with anxiety and depression",
            "Find free counseling services in Melbourne",
            "Online therapy for young adults",
            "Crisis support available now",
            "Bulk-billed psychology services near me",
            "Mental health services for teenagers",
        ]

    async def health_check(self) -> Dict[str, Any]:
        """Check health of all chat service components."""
        try:
            # Check configuration
            config_status = {
                "openai_api_key_set": bool(self.settings.openai_api_key),
                "supabase_url_set": bool(self.settings.supabase_url),
                "supabase_key_set": bool(self.settings.supabase_key),
                "openai_model": self.settings.openai_model,
                "embed_model": self.settings.embed_model,
            }
            
            # Check vector search
            try:
                vector_search = get_vector_search_service()
                test_embedding = vector_search.get_embedding("test query")
                test_results = vector_search.vector_search("mental health", limit=1)
                
                vector_status = {
                    "status": "healthy",
                    "embedding_dimension": len(test_embedding),
                    "search_functional": len(test_results) > 0,
                }
            except Exception as e:
                vector_status = {
                    "status": "error",
                    "error": str(e),
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
                openai_status.get("status") == "connected" and
                vector_status.get("status") == "healthy"
            )

            return {
                "status": "healthy" if all_healthy else "degraded",
                "configuration": config_status,
                "database": db_status,
                "openai": openai_status,
                "vector_search": vector_status,
                "ready_for_chat": all_healthy,
            }
        except Exception as e:
            logger.error("Health check failed", error=str(e), exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "ready_for_chat": False
            }


# Singleton instance
chat_service = MentalHealthChatService()


async def get_chat_service() -> MentalHealthChatService:
    """Get chat service singleton."""
    return chat_service
