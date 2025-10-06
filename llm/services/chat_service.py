"""
Main chat service orchestrating mental health chatbot functionality.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
import structlog

# Use simple agent for debugging
try:
    from core.langchain.simple_test_agent import get_simple_agent

    USE_SIMPLE_AGENT = True
except ImportError:
    from ..core.langchain.sql_agent import get_sql_agent

    USE_SIMPLE_AGENT = False

from ..core.database.supabase_only import get_supabase_db
from ..app.config import get_settings

logger = structlog.get_logger(__name__)


class MentalHealthChatService:
    """Main service for handling mental health chatbot conversations."""

    def __init__(self):
        self.settings = get_settings()

    async def process_message(
        self,
        message: str,
        session_id: Optional[str] = None,
        user_context: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Process a user message and return a response."""
        try:
            # Generate session ID if not provided
            if not session_id:
                session_id = str(uuid.uuid4())

            logger.info("Processing message", message=message, session_id=session_id)

            # Store user message first
            await self._store_message(session_id, "user", message)

            if USE_SIMPLE_AGENT:
                # Use simplified agent for debugging
                agent = await get_simple_agent()
                result = await agent.simple_query(message)

                if result["status"] == "success":
                    response_text = result["message"]
                    response_data = {
                        "message": response_text,
                        "session_id": session_id,
                        "services_found": result["services_found"],
                        "raw_data": result.get("raw_results", []),
                        "query_successful": True,
                    }
                elif result["status"] == "no_results":
                    response_text = result["message"]
                    response_data = {
                        "message": response_text,
                        "session_id": session_id,
                        "services_found": 0,
                        "query_successful": True,
                        "suggestion": "Try different search terms or contact your GP",
                    }
                else:
                    # Error in simple agent
                    response_text = "I'm experiencing some technical difficulties. Please try again later."
                    response_data = {
                        "message": response_text,
                        "session_id": session_id,
                        "services_found": 0,
                        "query_successful": False,
                        "error": result.get("error", "Unknown error"),
                    }
            else:
                # Use complex SQL agent
                agent = await get_sql_agent()
                result = await agent.query(message)

                if result["status"] == "success":
                    response_text = result["response"]
                    response_data = {
                        "message": response_text,
                        "session_id": session_id,
                        "services_found": result["result_count"],
                        "raw_data": result.get("raw_results", [])[:3],
                        "query_successful": True,
                    }
                elif result["status"] == "no_results":
                    response_text = result["response"]
                    response_data = {
                        "message": response_text,
                        "session_id": session_id,
                        "services_found": 0,
                        "query_successful": True,
                        "suggestion": "Try different search terms or contact your GP",
                    }
                else:
                    response_text = (
                        "I'm sorry, I'm having some technical difficulties right now."
                    )
                    response_data = {
                        "message": response_text,
                        "session_id": session_id,
                        "services_found": 0,
                        "query_successful": False,
                        "error": "Technical error occurred",
                    }

            # Store assistant response
            await self._store_message(session_id, "assistant", response_data["message"])

            logger.info(
                "Message processed successfully",
                session_id=session_id,
                successful=response_data["query_successful"],
            )

            return response_data

        except Exception as e:
            logger.error(
                "Chat processing failed", message=message, error=str(e), exc_info=True
            )

            error_response = "I apologize, but I'm experiencing technical difficulties. Please try again later."

            if session_id:
                try:
                    await self._store_message(session_id, "assistant", error_response)
                except:
                    pass  # Don't fail on storage error

            return {
                "message": error_response,
                "session_id": session_id or str(uuid.uuid4()),
                "services_found": 0,
                "query_successful": False,
                "error": str(e),
            }

    async def _store_message(self, session_id: str, role: str, content: str):
        """Store a message in the database."""
        try:
            supabase_db = await get_supabase_db()

            message_data = {
                "session_id": session_id,
                "role": role,
                "content": content,
                "created_at": datetime.now().isoformat(),
            }

            # Insert message into messages table
            result = supabase_db.client.table("messages").insert(message_data).execute()

            if result.data:
                logger.debug(
                    "Message stored successfully", session_id=session_id, role=role
                )
            else:
                logger.warning(
                    "Message storage returned no data", session_id=session_id
                )

        except Exception as e:
            logger.warning(
                "Failed to store message (non-critical)",
                session_id=session_id,
                role=role,
                error=str(e),
            )
            # Don't fail the chat if message storage fails

    async def get_conversation_history(
        self, session_id: str, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Retrieve conversation history for a session."""
        try:
            supabase_db = await get_supabase_db()

            messages = supabase_db.query_table(
                "messages",
                select="role,content,created_at",
                filters={"session_id": session_id},
                limit=limit,
            )

            # Sort by created_at
            messages.sort(key=lambda x: x.get("created_at", ""))

            return messages

        except Exception as e:
            logger.error(
                "Failed to get conversation history",
                session_id=session_id,
                error=str(e),
            )
            return []

    async def get_suggested_questions(self) -> List[str]:
        """Get suggested questions to help users get started."""
        return [
            "Find mental health services near me in Melbourne",
            "What free counseling services are available?",
            "I need help with anxiety - what services can help?",
            "Show me telehealth therapy options",
            "What are the costs for psychology services?",
            "Find crisis support services",
            "I need a referral - what services accept GP referrals?",
            "What services are available for young people?",
        ]

    async def health_check(self) -> Dict[str, Any]:
        """Check the health of chat service components."""
        try:
            if USE_SIMPLE_AGENT:
                # Test simple agent
                agent = await get_simple_agent()
                component_tests = await agent.test_components()

                return {
                    "status": (
                        "healthy"
                        if component_tests.get("openai", {}).get("status") == "success"
                        and component_tests.get("database", {}).get("status")
                        == "success"
                        else "degraded"
                    ),
                    "agent_type": "simple_test_agent",
                    "components": component_tests,
                    "ready_for_chat": component_tests.get("openai", {}).get("status")
                    == "success"
                    and component_tests.get("database", {}).get("status") == "success",
                }
            else:
                # Test complex SQL agent
                agent = await get_sql_agent()
                agent_status = await agent.test_agent()

                # Test database connection
                supabase_db = await get_supabase_db()
                db_status = await supabase_db.test_connection()

                return {
                    "status": (
                        "healthy"
                        if agent_status.get("status") == "success"
                        and db_status.get("status") == "connected"
                        else "degraded"
                    ),
                    "agent_type": "sql_agent",
                    "sql_agent": agent_status,
                    "database": db_status,
                    "ready_for_chat": agent_status.get("status") == "success"
                    and db_status.get("status") == "connected",
                }

        except Exception as e:
            logger.error("Chat service health check failed", error=str(e))
            return {"status": "error", "error": str(e), "ready_for_chat": False}


# Global chat service instance
chat_service = MentalHealthChatService()


async def get_chat_service() -> MentalHealthChatService:
    """Dependency to get chat service."""
    return chat_service
