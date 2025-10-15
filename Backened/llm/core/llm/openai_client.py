"""
OpenAI client configuration for the mental health LLM backend.
"""

from typing import Optional, Dict, Any
import openai
import structlog

from ...app.config import get_settings

logger = structlog.get_logger(__name__)

class OpenAIClient:
    """Manages OpenAI API connections."""
    
    def __init__(self):
        self.settings = get_settings()
        self._client: Optional[openai.OpenAI] = None
    
    @property
    def client(self) -> openai.OpenAI:
        """Get or create OpenAI client."""
        if self._client is None:
            self._client = openai.OpenAI(api_key=self.settings.openai_api_key)
        return self._client
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test OpenAI API connection."""
        try:
            response = self.client.chat.completions.create(
                model=self.settings.openai_model,
                messages=[{"role": "user", "content": "Test"}],
                max_tokens=10
            )
            return {
                "status": "connected",
                "model": self.settings.openai_model,
                "api_configured": True
            }
        except Exception as e:
            logger.error("OpenAI connection test failed", error=str(e))
            return {
                "status": "error",
                "error": str(e),
                "api_configured": bool(self.settings.openai_api_key)
            }

openai_client = OpenAIClient()

def get_openai_client() -> OpenAIClient:
    return openai_client
