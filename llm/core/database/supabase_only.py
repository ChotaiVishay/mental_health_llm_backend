"""
Supabase-only connection using direct REST API calls.
Enhanced search with better keyword extraction and context understanding.
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

    def _extract_location_keywords(self, text: str) -> List[str]:
        """Extract location-specific keywords (suburbs, states, postcodes)."""
        text_lower = text.lower()
        
        # Australian states and territories
        states = ['victoria', 'nsw', 'queensland', 'wa', 'sa', 'tas', 'act', 'nt',
                 'vic', 'qld', 'western australia', 'south australia', 'tasmania',
                 'northern territory', 'australian capital territory']
        
        # Common Victorian suburbs (expand this list)
        melbourne_suburbs = ['carlton', 'fitzroy', 'richmond', 'collingwood', 'brunswick',
                            'footscray', 'preston', 'thornbury', 'northcote', 'hawthorn',
                            'south yarra', 'st kilda', 'elwood', 'caulfield', 'glen waverley',
                            'box hill', 'dandenong', 'frankston', 'geelong', 'ballarat',
                            'bendigo', 'shepparton', 'wangaratta', 'wodonga', 'melbourne']
        
        locations = []
        
        # Check for states
        for state in states:
            if state in text_lower:
                locations.append(state)
        
        # Check for suburbs
        for suburb in melbourne_suburbs:
            if suburb in text_lower:
                locations.append(suburb)
        
        # Check for postcodes (3-4 digits)
        words = text.split()
        for word in words:
            if word.isdigit() and 3 <= len(word) <= 4:
                locations.append(word)
        
        return locations

    def _extract_service_keywords(self, text: str) -> List[str]:
        """Extract service-type keywords."""
        text_lower = text.lower()
        
        service_types = {
            'anxiety': ['anxiety', 'anxious', 'panic', 'worry'],
            'depression': ['depression', 'depressed', 'sad', 'low mood'],
            'counseling': ['counseling', 'counselling', 'therapy', 'therapist'],
            'psychology': ['psychology', 'psychologist', 'psych'],
            'psychiatry': ['psychiatry', 'psychiatrist'],
            'crisis': ['crisis', 'emergency', 'urgent', 'suicide'],
            'youth': ['youth', 'young people', 'adolescent', 'teen', 'teenager'],
            'family': ['family', 'couples', 'relationship'],
            'addiction': ['addiction', 'alcohol', 'drugs', 'substance'],
        }
        
        found_services = []
        for service_category, keywords in service_types.items():
            if any(kw in text_lower for kw in keywords):
                found_services.extend(keywords)
        
        return found_services

    def _extract_cost_keywords(self, text: str) -> Optional[str]:
        """Extract cost-related keywords."""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['free', 'no cost', 'bulk bill', 'bulk-bill', 'medicare']):
            return 'free'
        elif any(word in text_lower for word in ['paid', 'private', 'fee', 'cost']):
            return 'paid'
        
        return None

    def search_services_by_text(self, search_term: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Enhanced search with intelligent keyword extraction and context understanding.
        """
        try:
            logger.info("Starting enhanced search", search_term=search_term)
            
            if not search_term or not search_term.strip():
                logger.warning("Empty search term")
                return []
            
            # Extract different types of keywords
            locations = self._extract_location_keywords(search_term)
            services = self._extract_service_keywords(search_term)
            cost_filter = self._extract_cost_keywords(search_term)
            
            logger.info("Extracted keywords", 
                       locations=locations,
                       services=services,
                       cost_filter=cost_filter)
            
            # Build search filters based on what we found
            filters = []
            
            # Location filters (highest priority)
            if locations:
                location_filters = []
                for loc in locations:
                    pattern = f"*{loc}*"
                    location_filters.extend([
                        f"suburb.ilike.{pattern}",
                        f"state.ilike.{pattern}",
                        f"postcode.eq.{loc}" if loc.isdigit() else None,
                        f"address.ilike.{pattern}"
                    ])
                location_filters = [f for f in location_filters if f]  # Remove None
                if location_filters:
                    filters.append(f"({','.join(location_filters)})")
            
            # Service type filters
            if services:
                service_filters = []
                for service in services:
                    pattern = f"*{service}*"
                    service_filters.extend([
                        f"service_name.ilike.{pattern}",
                        f"service_type.ilike.{pattern}",
                        f"notes.ilike.{pattern}"
                    ])
                if service_filters:
                    filters.append(f"({','.join(service_filters)})")
            
            # If no specific keywords found, do a general search
            if not filters:
                pattern = f"*{search_term.strip()}*"
                filters.append(
                    f"(service_name.ilike.{pattern},"
                    f"organisation_name.ilike.{pattern},"
                    f"suburb.ilike.{pattern},"
                    f"service_type.ilike.{pattern},"
                    f"notes.ilike.{pattern})"
                )
            
            # Combine all filters with AND logic
            combined_filter = ",".join(filters)
            
            url = f"{self.settings.supabase_url}/rest/v1/staging_services"
            params = {
                "select": "*",
                "or": combined_filter,
                "limit": str(limit)
            }
            
            # Add cost filter if specified
            if cost_filter:
                params["cost"] = f"ilike.*{cost_filter}*"
            
            logger.info("Executing search", url=url, params=params)
            
            response = self.http_client.get(url, headers=self._get_headers(), params=params)
            response.raise_for_status()
            
            results = response.json()
            
            logger.info("Search completed", 
                       search_term=search_term,
                       results_count=len(results),
                       had_location_filter=bool(locations),
                       had_service_filter=bool(services))
            
            return results

        except Exception as e:
            logger.error("Enhanced search failed", 
                        search_term=search_term, 
                        error=str(e), 
                        exc_info=True)
            raise Exception(f"Database search failed: {str(e)}")

    async def test_connection(self) -> Dict[str, Any]:
        """Test Supabase connection."""
        try:
            url = f"{self.settings.supabase_url}/rest/v1/staging_services"
            params = {"select": "id", "limit": 1}
            
            response = self.http_client.get(url, headers=self._get_headers(), params=params)
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
        """Close HTTP client."""
        if self._http_client:
            self._http_client.close()


supabase_db = SupabaseOnlyConnection()

async def get_supabase_db() -> SupabaseOnlyConnection:
    return supabase_db
