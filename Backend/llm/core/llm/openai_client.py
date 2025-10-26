"""
OpenAI client configuration for the mental health LLM backend.
Key updated on: 15/09/25, 17/10/25, 22/10/25
"""

from typing import Optional, Dict, Any
import openai
import structlog

from app.config import get_settings

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

    def check_moderation(self, text: str) -> Dict[str, Any]:
        """Run text through OpenAI's moderation endpoint."""
        if not text or not text.strip():
            return {"flagged": False, "categories": {}}

        if not self.settings.openai_api_key:
            logger.warning("OpenAI moderation attempted without API key")
            return {"flagged": False, "categories": {}}

        response = self.client.moderations.create(
            model="omni-moderation-latest",
            input=text
        )
        result = response.results[0]
        return {
            "flagged": bool(result.flagged),
            "categories": result.categories if hasattr(result, "categories") else {}
        }
    
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
