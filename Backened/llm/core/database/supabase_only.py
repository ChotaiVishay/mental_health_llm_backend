"""
Supabase-only connection with corrected wildcard syntax.
Uses % wildcards (PostgREST standard) not * wildcards.
"""

import httpx
from typing import Any, Dict, List, Optional
import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)


class SupabaseOnlyConnection:
    """Manages Supabase connections using direct REST API."""

    def __init__(self):
        self.settings = get_settings()
        self._http_client: Optional[httpx.Client] = None

    @property
    def http_client(self) -> httpx.Client:
        if self._http_client is None:
            self._http_client = httpx.Client(timeout=30.0)
        return self._http_client

    def _get_headers(self) -> Dict[str, str]:
        key = self.settings.supabase_service_key or self.settings.supabase_key
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def search_services_by_text(self, search_term: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Search with correct Supabase PostgREST syntax.
        Uses % for wildcards (not *).
        """
        try:
            logger.info("=== SEARCH START ===", query=search_term, limit=limit)
            
            if not search_term or not search_term.strip():
                logger.warning("Empty search term")
                return []
            
            search_lower = search_term.lower().strip()
            
            # CORRECT wildcard format for Supabase: %keyword%
            pattern = f"%{search_lower}%"
            
            url = f"{self.settings.supabase_url}/rest/v1/staging_services"
            
            # Build comprehensive OR search across all relevant fields
            params = {
                "select": "*",
                "or": (
                    f"service_name.ilike.{pattern},"
                    f"service_type.ilike.{pattern},"
                    f"suburb.ilike.{pattern},"
                    f"state.ilike.{pattern},"
                    f"organisation_name.ilike.{pattern},"
                    f"notes.ilike.{pattern},"
                    f"target_population.ilike.{pattern},"
                    f"delivery_method.ilike.{pattern},"
                    f"address.ilike.{pattern},"
                    f"cost.ilike.{pattern}"
                ),
                "limit": str(limit)
            }
            
            logger.info("Executing search", url=url, pattern=pattern)
            
            response = self.http_client.get(url, headers=self._get_headers(), params=params)
            response.raise_for_status()
            
            results = response.json()
            
            logger.info("=== SEARCH COMPLETE ===", 
                       query=search_term,
                       results_count=len(results))
            
            if results:
                # Log first result for debugging
                first = results[0]
                logger.info("First result", 
                           service=first.get('service_name'),
                           suburb=first.get('suburb'),
                           org=first.get('organisation_name'))
            
            return results

        except Exception as e:
            logger.error("Search failed", error=str(e), exc_info=True)
            return []

    async def test_connection(self) -> Dict[str, Any]:
        """Test Supabase connection."""
        try:
            url = f"{self.settings.supabase_url}/rest/v1/staging_services"
            response = self.http_client.get(
                url, 
                headers=self._get_headers(), 
                params={"select": "id", "limit": "1"}
            )
            response.raise_for_status()
            
            return {
                "status": "connected",
                "connection_type": "supabase_rest_api_direct",
                "ready_for_queries": True,
            }
        except Exception as e:
            logger.error("Connection test failed", error=str(e))
            return {"status": "error", "error": str(e)}

    def close(self):
        if self._http_client:
            self._http_client.close()


supabase_db = SupabaseOnlyConnection()

async def get_supabase_db() -> SupabaseOnlyConnection:
    return supabase_db
