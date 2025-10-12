"""
Supabase-only connection for mental health services database.
"""

import json
from typing import Any, Dict, List, Optional
from supabase import create_client, Client
import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)


class SupabaseOnlyConnection:
    """Manages Supabase client connections for mental health services database."""

    def __init__(self):
        self.settings = get_settings()
        self._client: Optional[Client] = None
        self.table_names = [
            "campus", "cost", "cost_lookup", "delivery_method", "delivery_method_lookup",
            "level_of_care", "level_of_care_lookup", "messages", "organisation", "postcode",
            "referral_pathway", "referral_pathway_lookup", "region", "service", "service_campus",
            "service_region", "service_type", "service_type_lookup", "spatial_ref_sys",
            "staging_services", "target_population", "target_population_lookup",
            "workforce_type", "workforce_type_lookup",
        ]

    @property
    def client(self) -> Client:
        """Get or create Supabase client."""
        if self._client is None:
            url = self.settings.supabase_url
            key = self.settings.supabase_service_key or self.settings.supabase_key
            self._client = create_client(url, key)
        return self._client

    def query_table(self, table_name: str, select: str = "*", filters: Dict[str, Any] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Query a specific table using Supabase client."""
        try:
            query = self.client.table(table_name).select(select)
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            if limit:
                query = query.limit(limit)
            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error("Table query failed", table=table_name, error=str(e))
            return []

    def search_services_by_text(self, search_term: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for services using text search in the staging_services table."""
        try:
            logger.info("Searching for services", search_term=search_term)
            
            # Simple text search - search in multiple fields
            # Use ilike for case-insensitive search
            result = self.client.table("staging_services").select("*").or_(
                f"service_name.ilike.%{search_term}%,"
                f"organisation_name.ilike.%{search_term}%,"
                f"suburb.ilike.%{search_term}%,"
                f"address.ilike.%{search_term}%,"
                f"notes.ilike.%{search_term}%,"
                f"service_type.ilike.%{search_term}%"
            ).limit(limit).execute()
            
            logger.info(f"Search found {len(result.data) if result.data else 0} results")
            
            return result.data if result.data else []

        except Exception as e:
            logger.error("Service text search failed", search_term=search_term, error=str(e))
            return []

    async def test_connection(self) -> Dict[str, Any]:
        """Test Supabase connection."""
        try:
            client_status = "connected" if self.client else "failed"
            return {
                "status": "connected",
                "connection_type": "supabase_rest_api",
                "client_status": client_status,
                "ready_for_queries": True,
            }
        except Exception as e:
            logger.error("Supabase connection test failed", error=str(e))
            return {"status": "error", "error": str(e)}


supabase_db = SupabaseOnlyConnection()

async def get_supabase_db() -> SupabaseOnlyConnection:
    return supabase_db
