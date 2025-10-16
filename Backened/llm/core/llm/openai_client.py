"""
OpenAI client configuration for the mental health LLM backend.
"""

from typing import Optional, Dict, Any
import openai
from langchain_openai import ChatOpenAI
import structlog

from ...app.config import get_settings

logger = structlog.get_logger(__name__)

class OpenAIClient:
    """Manages OpenAI API connections and LLM instances."""
    
    def __init__(self):
        self.settings = get_settings()
        self._chat_llm: Optional[ChatOpenAI] = None
        self._client: Optional[openai.OpenAI] = None
        
        # Configure OpenAI
        openai.api_key = self.settings.openai_api_key
    
    @property
    def client(self) -> openai.OpenAI:
        """Get or create OpenAI client."""
        if self._client is None:
            self._client = openai.OpenAI(api_key=self.settings.openai_api_key)
        return self._client
    
    @property
    def chat_llm(self) -> ChatOpenAI:
        """Get or create LangChain ChatOpenAI instance."""
        if self._chat_llm is None:
            self._chat_llm = ChatOpenAI(
                model=self.settings.openai_model,
                temperature=self.settings.openai_temperature,
                api_key=self.settings.openai_api_key,
                max_tokens=self.settings.max_response_tokens
            )
        return self._chat_llm
    
    def create_chat_llm_with_params(self, temperature: float = None, max_tokens: int = None) -> ChatOpenAI:
        """Create a ChatOpenAI instance with custom parameters."""
        return ChatOpenAI(
            model=self.settings.openai_model,
            temperature=temperature or self.settings.openai_temperature,
            api_key=self.settings.openai_api_key,
            max_tokens=max_tokens or self.settings.max_response_tokens
        )
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test OpenAI API connection."""
        try:
            # Test with a simple completion
            response = self.chat_llm.invoke("Hello, this is a connection test.")
            
            return {
                "status": "connected",
                "model": self.settings.openai_model,
                "test_response_length": len(response.content) if hasattr(response, 'content') else 0,
                "api_configured": True
            }
            
        except Exception as e:
            logger.error("OpenAI connection test failed", error=str(e))
            return {
                "status": "error",
                "error": str(e),
                "model": self.settings.openai_model,
                "api_configured": bool(self.settings.openai_api_key)
            }


# Global OpenAI client instance
openai_client = OpenAIClient()

def get_openai_client() -> OpenAIClient:
    """Dependency to get OpenAI client."""
    return openai_client

def get_chat_llm() -> ChatOpenAI:
    """Dependency to get ChatOpenAI instance."""
    return openai_client.chat_llm