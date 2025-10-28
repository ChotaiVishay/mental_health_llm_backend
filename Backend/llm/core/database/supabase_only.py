"""
Supabase-only connection using direct RESTapi calls.
Enhanced search with better keyword extraction and context understanding.
"""

import httpx
import re
import uuid
from datetime import datetime, timezone
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
            "Prefer": "return=representation,resolution=merge-duplicates",
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
            'counseling': ['counseling', 'counselling', 'counselor', 'therapist', 'therapy', 'psychotherapy'],
            'psychology': ['psychology', 'psychologist', 'psych'],
            'psychiatry': ['psychiatry', 'psychiatrist'],
            'crisis': ['crisis', 'emergency', 'urgent', 'suicide'],
            'youth': ['youth', 'young people', 'adolescent', 'teen', 'teenager'],
            'family': ['family', 'couples', 'relationship'],
            'addiction': ['addiction', 'alcohol', 'drugs', 'substance'],
            'general': ['mental health', 'mental-health', 'wellbeing', 'well-being'],
        }
        
        found_services = []
        for service_category, keywords in service_types.items():
            if any(kw in text_lower for kw in keywords):
                found_services.extend(keywords)
        
        return found_services

    def _has_location_intent(self, text: str, locations: List[str]) -> bool:
        """Detect whether the user is asking for location-based results."""
        if locations:
            return True
        tl = text.lower()
        markers = [" near ", " in ", " around ", " nearby ", " close to ", " within "]
        return any(m in f" {tl} " for m in markers)

    def _extract_cost_keywords(self, text: str) -> Optional[str]:
        """Extract cost-related keywords."""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['free', 'no cost', 'bulk bill', 'bulk-bill', 'medicare']):
            return 'free'
        elif any(word in text_lower for word in ['paid', 'private', 'fee', 'cost']):
            return 'paid'
        
        return None

    def _normalize_service_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize incoming service form payload for Supabase insert.

        - Trims strings
        - Converts empty strings to None
        - Keeps arrays as JSON arrays (works for text[]/jsonb columns)
        - Coerces booleans if provided as strings
        """
        def _trim(v: Any) -> Any:
            if isinstance(v, str):
                s = v.strip()
                return s if s != "" else None
            return v

        cleaned: Dict[str, Any] = {}
        for k, v in payload.items():
            if isinstance(v, list):
                cleaned[k] = [ _trim(x) for x in v ]
            elif isinstance(v, bool):
                cleaned[k] = v
            elif isinstance(v, (int, float)):
                cleaned[k] = v
            elif isinstance(v, str):
                # common boolean-like strings
                low = v.strip().lower()
                if low in {"true", "false"}:
                    cleaned[k] = (low == "true")
                else:
                    cleaned[k] = _trim(v)
            else:
                cleaned[k] = v

        # Optional: normalize postcode to string of digits or None
        pc = cleaned.get("postcode")
        if pc is not None:
            if isinstance(pc, (int, float)):
                cleaned["postcode"] = str(int(pc))
            elif isinstance(pc, str):
                digits = re.sub(r"\D", "", pc)
                cleaned["postcode"] = digits if digits else None

        return cleaned

    def insert_service(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new service row into Supabase staging_services.

        Returns the created row as a dict. Raises on failure.
        """
        try:
            if not isinstance(data, dict):
                raise ValueError("Service payload must be a JSON object")

            # Basic validation for essential fields (adjust as needed)
            required = ["service_name", "organisation_name"]
            missing = [k for k in required if not data.get(k)]
            if missing:
                raise ValueError(f"Missing required fields: {', '.join(missing)}")

            cleaned = self._normalize_service_payload(data)

            url = f"{self.settings.supabase_url}/rest/v1/staging_services"
            logger.info("Inserting new service", table="staging_services", payload_keys=list(cleaned.keys()))

            response = self.http_client.post(
                url,
                headers=self._get_headers(),
                json=cleaned,
            )
            response.raise_for_status()

            created = response.json()
            # PostgREST returns a list when Prefer:return=representation; handle both shapes
            if isinstance(created, list):
                if not created:
                    raise Exception("Insert succeeded but no row returned")
                created_row = created[0]
            elif isinstance(created, dict):
                created_row = created
            else:
                raise Exception("Unexpected insert response shape")

            logger.info("Service insert completed", id=created_row.get("id"))
            return created_row

        except httpx.HTTPStatusError as e:
            body = None
            try:
                body = e.response.json()
            except Exception:
                try:
                    body = e.response.text
                except Exception:
                    body = None
            logger.error("Service insert failed (HTTP)", status=e.response.status_code, body=body)
            raise
        except Exception as e:
            logger.error("Service insert failed", error=str(e), exc_info=True)
            raise

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
            
            # Helper to build AND/OR boolean params
            def build_params(location_conditions: List[str], service_conditions: List[str], cost: Optional[str], exclude_online: bool, fetch_limit: int) -> Dict[str, str]:
                url_params: Dict[str, str] = {"select": "*", "limit": str(fetch_limit)}
                and_parts: List[str] = []
                if location_conditions:
                    and_parts.append(f"or=({','.join(location_conditions)})")
                if service_conditions:
                    and_parts.append(f"or=({','.join(service_conditions)})")
                if cost:
                    and_parts.append(f"cost.ilike.*{cost}*")
                if exclude_online:
                    and_parts.append("delivery_method.not.ilike.*Online*")

                if not and_parts:
                    # General OR across common fields
                    pattern = f"*{search_term.strip()}*"
                    url_params["or"] = (
                        f"(service_name.ilike.{pattern},"
                        f"organisation_name.ilike.{pattern},"
                        f"suburb.ilike.{pattern},"
                        f"service_type.ilike.{pattern},"
                        f"notes.ilike.{pattern})"
                    )
                    return url_params

                if len(and_parts) == 1:
                    only = and_parts[0]
                    if only.startswith("or="):
                        url_params["or"] = only[len("or="):]
                    else:
                        field, rest = only.split(".", 1)
                        url_params[field] = rest
                else:
                    url_params["and"] = f"({','.join(and_parts)})"
                return url_params

            url = f"{self.settings.supabase_url}/rest/v1/staging_services"

            # Build service conditions from extracted keywords (broad contains)
            service_exprs: List[str] = []
            if services:
                for service in services:
                    pattern = f"*{service}*"
                    service_exprs.extend([
                        f"service_name.ilike.{pattern}",
                        f"service_type.ilike.{pattern}",
                        f"notes.ilike.{pattern}",
                    ])

            # Determine if we should prefer local/in-person results
            location_intent = self._has_location_intent(search_term, locations)
            online_requested = any(w in search_term.lower() for w in ["online", "telehealth", "virtual"])
            exclude_online = bool(location_intent and not online_requested)

            results: List[Dict[str, Any]] = []

            # Stage A: Strict suburb/postcode match if we have location intent
            if locations and location_intent:
                strict_location_exprs: List[str] = []
                for loc in locations:
                    if loc.isdigit():
                        strict_location_exprs.append(f"postcode.eq.{loc}")
                    else:
                        # Case-insensitive exact by using ILIKE without wildcards
                        strict_location_exprs.append(f"suburb.ilike.{loc}")

                params_a = build_params(strict_location_exprs, service_exprs, cost_filter, exclude_online, limit)
                logger.info("Executing search (stage A: strict)", url=url, params=params_a)
                resp_a = self.http_client.get(url, headers=self._get_headers(), params=params_a)
                resp_a.raise_for_status()
                results = resp_a.json()

            # Stage B: Fallback to broader contains if not enough results
            if len(results) < limit:
                broad_location_exprs: List[str] = []
                for loc in locations:
                    pattern = f"*{loc}*"
                    broad_location_exprs.extend([
                        f"suburb.ilike.{pattern}",
                        f"state.ilike.{pattern}",
                        f"address.ilike.{pattern}",
                        f"postcode.eq.{loc}" if loc.isdigit() else None,
                    ])
                broad_location_exprs = [f for f in broad_location_exprs if f]

                remaining = max(0, limit - len(results))
                params_b = build_params(broad_location_exprs, service_exprs, cost_filter, exclude_online, remaining or limit)
                logger.info("Executing search (stage B: broad)", url=url, params=params_b)
                resp_b = self.http_client.get(url, headers=self._get_headers(), params=params_b)
                resp_b.raise_for_status()
                more = resp_b.json()

                # Merge with de-duplication by id if present
                if more:
                    seen_ids = {r.get('id') for r in results if isinstance(r, dict) and 'id' in r}
                    for r in more:
                        rid = r.get('id') if isinstance(r, dict) else None
                        if rid is None or rid not in seen_ids:
                            results.append(r)

                # Trim to limit
                results = results[:limit]

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

    def _timestamp(self) -> str:
        """Return an ISO-8601 UTC timestamp without microseconds."""
        return datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    
    def upsert_chat_session(self, *, user_id: str, session_id: str | None, title: str | None, last_message: str, last_role: str) -> dict:
        payload = {
            "id": session_id or str(uuid.uuid4()),
            "user_id": user_id,
            "title": title,
            "last_message": last_message,
            "last_message_role": last_role,
            "updated_at": self._timestamp(),
        }
        url = f"{self.settings.supabase_url}/rest/v1/chat_sessions"
        params = {
            "on_conflict": "id",
            "select": "id,user_id,title,last_message,last_message_role,created_at,updated_at",
        }

        response = self.http_client.post(
            url,
            headers=self._get_headers(),
            params=params,
            json=payload,
        )
        response.raise_for_status()

        data = response.json()
        if isinstance(data, list):
            if not data:
                raise RuntimeError("Supabase upsert returned an empty list")
            return data[0]
        return data

    def insert_chat_message(self, *, session_id: str, user_id: str, role: str, content: str) -> dict:
        payload = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "user_id": user_id,
            "role": role,
            "content": content,
            "created_at": self._timestamp(),
        }
        # POST to chat_messages
        url = f"{self.settings.supabase_url}/rest/v1/chat_messages"
        response = self.http_client.post(
            url,
            headers=self._get_headers(),
            json=payload,
        )
        response.raise_for_status()

        data = response.json()
        if isinstance(data, list):
            if not data:
                raise RuntimeError("Supabase insert returned an empty list")
            return data[0]
        return data

    def list_chat_sessions(self, *, user_id: str, limit: int) -> list[dict]:
        # GET /chat_sessions?select=...&user_id=eq.{user_id}&order=updated_at.desc&limit=...
        url = f"{self.settings.supabase_url}/rest/v1/chat_sessions"
        params = {
            "select": "id,user_id,title,last_message,last_message_role,created_at,updated_at",
            "user_id": f"eq.{user_id}",
            "order": "updated_at.desc",
            "limit": str(limit),
        }

        response = self.http_client.get(
            url,
            headers=self._get_headers(),
            params=params,
        )
        response.raise_for_status()
        return response.json()

    def get_session_messages(self, *, session_id: str, user_id: str, limit: int) -> list[dict]:
        # GET /chat_messages?select=...&session_id=eq...&user_id=eq...
        url = f"{self.settings.supabase_url}/rest/v1/chat_messages"
        params = {
            "select": "id,session_id,user_id,role,content,created_at",
            "session_id": f"eq.{session_id}",
            "user_id": f"eq.{user_id}",
            "order": "created_at.asc",
            "limit": str(limit),
        }

        response = self.http_client.get(
            url,
            headers=self._get_headers(),
            params=params,
        )
        response.raise_for_status()
        return response.json()

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
