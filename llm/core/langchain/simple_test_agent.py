"""
Simplified test agent to debug the chatbot issues.
"""

from typing import Any, Dict
import structlog
from core.llm.openai_client import get_chat_llm
from core.database.supabase_only import get_supabase_db

logger = structlog.get_logger(__name__)

class SimpleTestAgent:
    """Simplified agent for debugging."""
    
    async def test_components(self) -> Dict[str, Any]:
        """Test all components individually."""
        results = {}
        
        # Test 1: OpenAI LLM
        try:
            llm = get_chat_llm()
            response = llm.invoke("Hello, this is a test.")
            results["openai"] = {
                "status": "success",
                "response_length": len(response.content) if hasattr(response, 'content') else 0
            }
        except Exception as e:
            results["openai"] = {
                "status": "error",
                "error": str(e)
            }
        
        # Test 2: Database
        try:
            db = await get_supabase_db()
            search_results = await db.search_services_by_text("mental health", limit=3)
            results["database"] = {
                "status": "success",
                "results_count": len(search_results)
            }
        except Exception as e:
            results["database"] = {
                "status": "error", 
                "error": str(e)
            }
        
        # Test 3: Combined query
        try:
            if results["openai"]["status"] == "success" and results["database"]["status"] == "success":
                llm = get_chat_llm()
                db = await get_supabase_db()
                
                # Simple test query
                search_results = db.search_services_by_text("Melbourne", limit=5)
                
                if search_results:
                    prompt = f"Based on these mental health services: {search_results[:2]}, provide a brief helpful response about mental health services in Melbourne."
                    llm_response = llm.invoke(prompt)
                    
                    results["combined"] = {
                        "status": "success",
                        "services_found": len(search_results),
                        "response": llm_response.content[:100] + "..." if hasattr(llm_response, 'content') else str(llm_response)[:100] + "..."
                    }
                else:
                    results["combined"] = {
                        "status": "no_data",
                        "message": "Database query returned no results"
                    }
            else:
                results["combined"] = {
                    "status": "skipped",
                    "reason": "Prerequisites failed"
                }
                
        except Exception as e:
            results["combined"] = {
                "status": "error",
                "error": str(e)
            }
        
        return results
    
    async def simple_query(self, user_message: str) -> Dict[str, Any]:
        """Process a simple query without complex logic."""
        try:
            # Step 1: Get components
            llm = get_chat_llm()
            db = await get_supabase_db()
            
            # Step 2: Search database
            search_results = await db.search_services_by_text(user_message, limit=10)
            
            # Step 3: Generate response
            if search_results:
                prompt = f"""
The user asked: "{user_message}"

I found these mental health services:
{search_results[:3]}

Please provide a helpful response that:
1. Answers their question
2. Lists the relevant services with key details
3. Is empathetic and supportive
4. Keeps response under 200 words

Respond as a helpful mental health services assistant.
"""
                response = llm.invoke(prompt)
                
                return {
                    "status": "success",
                    "message": response.content if hasattr(response, 'content') else str(response),
                    "services_found": len(search_results),
                    "raw_results": search_results[:2]  # Include some raw data
                }
            else:
                # No results
                prompt = f"""
The user asked: "{user_message}"

I couldn't find specific mental health services matching their request.

Please provide a supportive response that:
1. Acknowledges we couldn't find specific matches
2. Suggests they contact their GP or mental health helplines
3. Is empathetic and helpful
4. Keeps response under 150 words
"""
                response = llm.invoke(prompt)
                
                return {
                    "status": "no_results",
                    "message": response.content if hasattr(response, 'content') else str(response),
                    "services_found": 0
                }
                
        except Exception as e:
            logger.error("Simple query failed", error=str(e))
            return {
                "status": "error",
                "error": str(e),
                "message": "Technical error occurred"
            }


# Global instance
simple_agent = SimpleTestAgent()

async def get_simple_agent() -> SimpleTestAgent:
    return simple_agent