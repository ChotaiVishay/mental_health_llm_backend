"""
Supabase-only connection using direct RESTapi calls.
Enhanced search with better keyword extraction and context understanding.
"""

import httpx
import re
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
        """Extract location-specific keywords (suburbs, states, postcodes) conservatively.

        - Match state abbreviations only as standalone tokens (avoid 'vic' in 'services').
        - Prefer full state names and common phrases.
        - Postcodes: AU are 4 digits; ignore 1300/1800 (phone prefixes).
        """
        text_lower = text.lower()

        # Tokenize to words and 4-digit numbers only
        tokens = re.findall(r"[a-z]+|\d{4}", text_lower)
        token_set = set(tokens)

        # Full state names/phrases
        state_full = [
            'victoria', 'new south wales', 'queensland', 'western australia',
            'south australia', 'tasmania', 'northern territory', 'australian capital territory'
        ]

        # Safer abbreviations only (avoid ambiguous: sa/wa/nt/act/tas)
        state_abbrev_safe = ['vic', 'nsw', 'qld']

        # Common Victorian suburbs (expand as needed)
        melbourne_suburbs = [
            'carlton', 'fitzroy', 'richmond', 'collingwood', 'brunswick',
            'footscray', 'preston', 'thornbury', 'northcote', 'hawthorn',
            'south yarra', 'st kilda', 'elwood', 'caulfield', 'glen waverley',
            'box hill', 'dandenong', 'frankston', 'geelong', 'ballarat',
            'bendigo', 'shepparton', 'wangaratta', 'wodonga', 'melbourne'
        ]

        found: List[str] = []

        # Full state phrases as substrings
        for name in state_full:
            if name in text_lower:
                found.append(name)

        # Abbreviations as standalone tokens only
        for abbr in state_abbrev_safe:
            if abbr in token_set:
                found.append(abbr)

        # Suburbs as phrases
        for suburb in melbourne_suburbs:
            if suburb in text_lower:
                found.append(suburb)

        # Postcodes: exactly 4 digits, skip common phone prefixes
        for tok in tokens:
            if tok.isdigit() and len(tok) == 4 and tok not in {"1300", "1800"}:
                found.append(tok)

        # Deduplicate while preserving order
        seen = set()
        result: List[str] = []
        for item in found:
            if item not in seen:
                seen.add(item)
                result.append(item)
        return result

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
            
            # Build PostgREST boolean logic: OR within groups, AND across groups
            url = f"{self.settings.supabase_url}/rest/v1/staging_services"
            params: Dict[str, str] = {"select": "*", "limit": str(limit)}

            location_exprs: List[str] = []
            if locations:
                for loc in locations:
                    pattern = f"*{loc}*"
                    location_exprs.extend([
                        f"suburb.ilike.{pattern}",
                        f"state.ilike.{pattern}",
                        f"address.ilike.{pattern}",
                        f"postcode.eq.{loc}" if loc.isdigit() else None,
                    ])
                location_exprs = [f for f in location_exprs if f]

            service_exprs: List[str] = []
            if services:
                for service in services:
                    pattern = f"*{service}*"
                    service_exprs.extend([
                        f"service_name.ilike.{pattern}",
                        f"service_type.ilike.{pattern}",
                        f"notes.ilike.{pattern}",
                    ])

            cost_expr: Optional[str] = None
            if cost_filter:
                cost_expr = f"cost.ilike.*{cost_filter}*"

            # If no specific keywords found, do a general OR search across common fields
            if not location_exprs and not service_exprs and not cost_expr:
                pattern = f"*{search_term.strip()}*"
                params["or"] = (
                    f"(service_name.ilike.{pattern},"
                    f"organisation_name.ilike.{pattern},"
                    f"suburb.ilike.{pattern},"
                    f"service_type.ilike.{pattern},"
                    f"notes.ilike.{pattern})"
                )
            else:
                and_parts: List[str] = []
                if location_exprs:
                    and_parts.append(f"or=({','.join(location_exprs)})")
                if service_exprs:
                    and_parts.append(f"or=({','.join(service_exprs)})")
                if cost_expr:
                    and_parts.append(cost_expr)

                if len(and_parts) == 1:
                    only = and_parts[0]
                    if only.startswith("or="):
                        params["or"] = only[len("or="):]
                    else:
                        # field.op.value as top-level param: field=op.value
                        field, rest = only.split(".", 1)
                        params[field] = rest
                else:
                    params["and"] = f"({','.join(and_parts)})"
            
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
