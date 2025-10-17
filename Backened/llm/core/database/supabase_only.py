"""
Supabase-only connection using direct REST API calls.
Bypasses the problematic supabase-py client library.
"""

import httpx
from typing import Any, Dict, List, Optional, Set
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
        """Get or create httpx client for direct API calls."""
        if self._http_client is None:
            self._http_client = httpx.Client(timeout=30.0)
        return self._http_client

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Supabase REST API."""
        key = self.settings.supabase_service_key or self.settings.supabase_key
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def _extract_search_keywords(self, text: str) -> List[str]:
        """Extract meaningful keywords from user query."""
        # Common stop words to remove
        stop_words = {
            'find', 'show', 'me', 'get', 'list', 'search', 'for', 'looking', 'need',
            'want', 'help', 'with', 'about', 'the', 'a', 'an', 'in', 'on', 'at',
            'to', 'of', 'and', 'or', 'mental', 'health', 'service', 'services',
            'can', 'you', 'please', 'i', 'my', 'are', 'is', 'there', 'any'
        }
        
        # Split and clean
        words = text.lower().split()
        keywords = [w.strip('.,!?;:') for w in words if w.lower() not in stop_words and len(w) > 2]
        
        # Return unique keywords
        return list(set(keywords))

    def query_table(
        self, 
        table_name: str, 
        select: str = "*", 
        filters: Optional[Dict[str, Any]] = None, 
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Query a specific table using direct REST API."""
        try:
            url = f"{self.settings.supabase_url}/rest/v1/{table_name}"
            params = {"select": select, "limit": limit}
            
            if filters:
                for key, value in filters.items():
                    params[key] = f"eq.{value}"
            
            response = self.http_client.get(url, headers=self._get_headers(), params=params)
            response.raise_for_status()
            
            data = response.json()
            logger.info("Query completed", table=table_name, results=len(data))
            return data
            
        except Exception as e:
            logger.error("Table query failed", table=table_name, error=str(e), exc_info=True)
            raise Exception(f"Failed to query table {table_name}: {str(e)}")

    def search_services_by_text(self, search_term: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for services using text search via REST API with keyword extraction."""
        try:
            logger.info("Searching for services", search_term=search_term, limit=limit)
            
            if not search_term or not search_term.strip():
                logger.warning("Empty search term provided")
                return []
            
            # Extract keywords from the search term
            keywords = self._extract_search_keywords(search_term)
            
            # If no meaningful keywords, fall back to original search term
            if not keywords:
                keywords = [search_term.strip()]
            
            logger.info("Extracted keywords", keywords=keywords)
            
            # Search for each keyword and collect unique results
            all_results = {}
            
            for keyword in keywords:
                pattern = f"*{keyword}*"
                or_filter = (
                    f"service_name.ilike.{pattern},"
                    f"organisation_name.ilike.{pattern},"
                    f"suburb.ilike.{pattern},"
                    f"address.ilike.{pattern},"
                    f"notes.ilike.{pattern},"
                    f"service_type.ilike.{pattern},"
                    f"state.ilike.{pattern}"
                )
                
                url = f"{self.settings.supabase_url}/rest/v1/staging_services"
                params = {
                    "select": "*",
                    "or": f"({or_filter})",
                    "limit": str(limit * 2)  # Get more results to filter
                }
                
                response = self.http_client.get(url, headers=self._get_headers(), params=params)
                response.raise_for_status()
                
                results = response.json()
                
                # Add to dictionary using ID as key to avoid duplicates
                for result in results:
                    result_id = result.get('id')
                    if result_id not in all_results:
                        all_results[result_id] = result
            
            # Convert back to list and limit
            final_results = list(all_results.values())[:limit]
            
            logger.info("Search completed", 
                       search_term=search_term, 
                       keywords=keywords,
                       results=len(final_results))
            
            return final_results

        except Exception as e:
            logger.error("Service text search failed", search_term=search_term, error=str(e), exc_info=True)
            raise Exception(f"Database search failed for '{search_term}': {str(e)}")

    def get_service_by_id(self, service_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific service by ID."""
        try:
            url = f"{self.settings.supabase_url}/rest/v1/staging_services"
            params = {"id": f"eq.{service_id}", "limit": 1}
            
            response = self.http_client.get(url, headers=self._get_headers(), params=params)
            response.raise_for_status()
            
            data = response.json()
            return data[0] if data else None
            
        except Exception as e:
            logger.error("Failed to get service by ID", service_id=service_id, error=str(e))
            raise Exception(f"Failed to retrieve service {service_id}: {str(e)}")

    def search_by_location(self, suburb: Optional[str] = None, state: Optional[str] = None, postcode: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for services by location."""
        try:
            url = f"{self.settings.supabase_url}/rest/v1/staging_services"
            params = {"select": "*", "limit": limit}
            
            filters = []
            if suburb:
                filters.append(f"suburb.ilike.*{suburb}*")
            if state:
                filters.append(f"state.ilike.*{state}*")
            if postcode:
                filters.append(f"postcode.eq.{postcode}")
            
            if filters:
                params["or"] = f"({','.join(filters)})"
            
            response = self.http_client.get(url, headers=self._get_headers(), params=params)
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            logger.error("Location search failed", suburb=suburb, state=state, postcode=postcode, error=str(e))
            raise Exception(f"Location search failed: {str(e)}")

    def search_by_cost(self, cost_type: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for services by cost type (e.g., 'Free', 'Bulk-billed')."""
        try:
            url = f"{self.settings.supabase_url}/rest/v1/staging_services"
            params = {
                "select": "*",
                "cost": f"ilike.*{cost_type}*",
                "limit": limit
            }
            
            response = self.http_client.get(url, headers=self._get_headers(), params=params)
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            logger.error("Cost search failed", cost_type=cost_type, error=str(e))
            raise Exception(f"Cost search failed: {str(e)}")

    async def test_connection(self) -> Dict[str, Any]:
        """Test Supabase connection using direct REST API."""
        try:
            # Test if we can query the table
            url = f"{self.settings.supabase_url}/rest/v1/staging_services"
            params = {"select": "id", "limit": 1}
            
            response = self.http_client.get(url, headers=self._get_headers(), params=params)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "status": "connected",
                "connection_type": "supabase_rest_api_direct",
                "ready_for_queries": True,
                "test_query_success": True,
                "sample_data_available": bool(data)
            }
            
        except Exception as e:
            logger.error("Supabase connection test failed", error=str(e), exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "ready_for_queries": False,
                "suggestion": "Check SUPABASE_URL and SUPABASE_KEY environment variables"
            }

    def get_table_sample(self, table_name: str = "staging_services", limit: int = 3) -> List[Dict[str, Any]]:
        """Get a sample of data from a table for debugging."""
        try:
            return self.query_table(table_name, limit=limit)
        except Exception as e:
            logger.error("Failed to get table sample", table=table_name, error=str(e))
            return []

    def close(self):
        """Close the HTTP client."""
        if self._http_client:
            self._http_client.close()


supabase_db = SupabaseOnlyConnection()

async def get_supabase_db() -> SupabaseOnlyConnection:
    return supabase_db