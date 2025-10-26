"""
Vector search service for mental health services using OpenAI embeddings.
Uses httpx to match existing codebase patterns.
"""

import httpx
import structlog
from typing import List, Dict, Any, Optional
from openai import OpenAI

from app.config import get_settings

logger = structlog.get_logger(__name__)


class VectorSearchService:
    """Handles vector similarity search for mental health services."""
    
    def __init__(self):
        self.settings = get_settings()
        self._openai_client: Optional[OpenAI] = None
        self._http_client: Optional[httpx.Client] = None
    
    @property
    def openai_client(self) -> OpenAI:
        """Get or create OpenAI client."""
        if self._openai_client is None:
            self._openai_client = OpenAI(api_key=self.settings.openai_api_key)
        return self._openai_client
    
    @property
    def http_client(self) -> httpx.Client:
        """Get or create httpx client."""
        if self._http_client is None:
            self._http_client = httpx.Client(timeout=30.0)
        return self._http_client
    
    def _get_headers(self) -> Dict[str, str]:
        """Get Supabase REST API headers."""
        key = self.settings.supabase_service_key or self.settings.supabase_key
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
    
    def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for query text using OpenAI.
        
        Args:
            text: Text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        try:
            response = self.openai_client.embeddings.create(
                model=self.settings.embed_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error("Failed to generate embedding", error=str(e), exc_info=True)
            raise
    
    def vector_search(
        self,
        query: str,
        limit: int = 10,
        similarity_threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Perform vector similarity search using Supabase RPC function.
        
        Args:
            query: User's search query
            limit: Maximum number of results
            similarity_threshold: Minimum similarity score (0-1)
            
        Returns:
            List of matching services with similarity scores
        """
        try:
            logger.info("Starting vector search", query=query, limit=limit)
            
            # 1. Generate embedding for query
            query_embedding = self.get_embedding(query)
            
            # 2. Call Supabase RPC function for vector search
            url = f"{self.settings.supabase_url}/rest/v1/rpc/search_staging_services"
            
            payload = {
                "query_embedding": query_embedding,
                "match_threshold": similarity_threshold,
                "match_count": limit
            }
            
            response = self.http_client.post(
                url,
                headers=self._get_headers(),
                json=payload
            )
            response.raise_for_status()
            results = response.json()
            
            logger.info("Vector search completed",
                       query=query,
                       results_count=len(results),
                       avg_similarity=sum(r.get('similarity', 0) for r in results) / len(results) if results else 0)
            
            return results
            
        except httpx.HTTPStatusError as e:
            logger.error("Vector search HTTP error",
                        status_code=e.response.status_code,
                        response_text=e.response.text,
                        exc_info=True)
            raise Exception(f"Vector search failed: {e.response.text}")
        except Exception as e:
            logger.error("Vector search failed", query=query, error=str(e), exc_info=True)
            raise
    
    def hybrid_search(
        self,
        query: str,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Hybrid search combining vector similarity with optional filters.
        
        Args:
            query: User's search query
            limit: Maximum number of results
            filters: Optional filters (suburb, state, cost, etc.)
            
        Returns:
            Filtered and sorted list of services
        """
        # Start with vector search (get more results for filtering)
        initial_limit = limit * 3 if filters else limit
        results = self.vector_search(query, limit=initial_limit, similarity_threshold=0.3)
        
        # Apply filters if provided
        if filters:
            results = self._apply_filters(results, filters)
        
        # Sort by similarity and limit
        results = sorted(results, key=lambda x: x.get('similarity', 0), reverse=True)[:limit]
        
        return results
    
    def _apply_filters(self, results: List[Dict], filters: Dict[str, Any]) -> List[Dict]:
        """Apply post-search filters."""
        filtered = results
        
        if suburb := filters.get('suburb'):
            filtered = [r for r in filtered 
                       if suburb.lower() in (r.get('suburb') or '').lower()]
        
        if state := filters.get('state'):
            filtered = [r for r in filtered 
                       if state.lower() in (r.get('state') or '').lower()]
        
        if cost := filters.get('cost'):
            filtered = [r for r in filtered 
                       if cost.lower() in (r.get('cost') or '').lower()]
        
        if delivery := filters.get('delivery_method'):
            filtered = [r for r in filtered 
                       if delivery.lower() in (r.get('delivery_method') or '').lower()]
        
        return filtered
    
    def search_with_context(
        self,
        query: str,
        limit: int = 10,
        user_context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search with enhanced context understanding.
        
        Enriches query based on:
        - Crisis/urgency indicators
        - User location preferences
        - Cost preferences
        
        Args:
            query: User's search query
            limit: Maximum results
            user_context: Optional user context data
            
        Returns:
            Context-aware search results
        """
        # Detect urgency/crisis
        crisis_keywords = ['suicide', 'crisis', 'emergency', 'urgent', 'immediate', 
                          'help me', 'cant cope', "can't cope", 'desperate']
        is_crisis = any(word in query.lower() for word in crisis_keywords)
        
        # Enrich query with context
        enriched_query = query
        filters = {}
        
        if user_context:
            if location := user_context.get('preferred_location'):
                enriched_query = f"{query} in {location}"
                
            if cost_pref := user_context.get('cost_preference'):
                filters['cost'] = cost_pref
        
        # Adjust parameters for crisis situations
        if is_crisis:
            logger.warning("Crisis query detected", query=query)
            # Lower threshold for crisis to get more options
            similarity_threshold = 0.2
            # Prioritize immediate/online support
            filters['delivery_method'] = 'Online'
        else:
            similarity_threshold = 0.4
        
        # Perform search
        results = self.vector_search(
            enriched_query,
            limit=limit * 2,  # Get more for filtering
            similarity_threshold=similarity_threshold
        )
        
        # Apply filters
        if filters:
            results = self._apply_filters(results, filters)
        
        # For crisis, also boost free services
        if is_crisis:
            results = sorted(results, key=lambda x: (
                1 if 'free' in (x.get('cost') or '').lower() else 0,
                x.get('similarity', 0)
            ), reverse=True)
        
        return results[:limit]
    
    def close(self):
        """Close HTTP client."""
        if self._http_client:
            self._http_client.close()


# Singleton instance
_vector_search_service = None


def get_vector_search_service() -> VectorSearchService:
    """Get or create vector search service singleton."""
    global _vector_search_service
    if _vector_search_service is None:
        _vector_search_service = VectorSearchService()
    return _vector_search_service