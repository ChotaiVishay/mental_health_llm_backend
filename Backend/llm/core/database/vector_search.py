"""
Enhanced vector search with location re-ranking and dynamic result count.
"""

import httpx
import structlog
import re
from typing import List, Dict, Any, Optional, Tuple
from openai import OpenAI

from app.config import get_settings

logger = structlog.get_logger(__name__)


class VectorSearchService:
    """Enhanced vector search with intelligent location prioritization."""
    
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
        """Generate embedding for query text using OpenAI."""
        try:
            response = self.openai_client.embeddings.create(
                model=self.settings.embed_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error("Failed to generate embedding", error=str(e), exc_info=True)
            raise
    
    def extract_location_keywords(self, query: str) -> List[str]:
        """
        Extract location keywords from query.
        Returns list of location terms (suburbs, states, postcodes).
        """
        query_lower = query.lower()
        locations = []
        
        # Australian states (full names and abbreviations)
        states_map = {
            'victoria': 'vic', 'vic': 'vic',
            'new south wales': 'nsw', 'nsw': 'nsw',
            'queensland': 'qld', 'qld': 'qld',
            'western australia': 'wa', 'south australia': 'sa',
            'tasmania': 'tas', 'northern territory': 'nt',
            'australian capital territory': 'act', 'act': 'act'
        }
        
        # Check for states
        for state_name, abbrev in states_map.items():
            if state_name in query_lower:
                locations.append(abbrev)
                break
        
        # Common Melbourne suburbs (expand based on your data)
        melbourne_suburbs = [
            'carlton', 'fitzroy', 'richmond', 'collingwood', 'brunswick',
            'footscray', 'preston', 'thornbury', 'northcote', 'hawthorn',
            'south yarra', 'st kilda', 'elwood', 'caulfield', 'glen waverley',
            'box hill', 'dandenong', 'frankston', 'geelong', 'ballarat',
            'bendigo', 'melbourne', 'coburg', 'essendon', 'moonee ponds',
            'newport', 'williamstown', 'yarraville', 'seddon', 'altona',
            'north melbourne', 'west melbourne', 'kensington', 'flemington',
            'parkville', 'princes hill', 'east melbourne', 'docklands', 'toorak',
            'malvern', 'armadale', 'brighton', 'hampton', 'sandringham',
            'mordialloc', 'mentone', 'cheltenham', 'clayton', 'oakleigh',
            'ashburton', 'burwood', 'camberwell', 'surrey hills', 'balwyn',
            'doncaster', 'templestowe', 'bulleen', 'heidelberg', 'rosanna',
            'greensborough', 'montmorency', 'eltham', 'warrandyte', 'ringwood',
            'croydon', 'mitcham', 'nunawading', 'blackburn', 'vermont',
            'forest hill', 'wheelers hill', 'mulgrave', 'springvale', 'noble park',
            'keysborough', 'cranbourne', 'berwick', 'narre warren', 'pakenham',
            'rowville', 'knoxfield', 'boronia', 'ferntree gully', 'wantirna',
            'scoresby', 'bayswater', 'croydon south', 'donvale', 'glen iris',
            'chadstone', 'mount waverley', 'ashwood', 'huntingdale', 'hughesdale',
            'murrumbeena', 'carnegie', 'ormond', 'bentleigh', 'mckinnon',
            'hampton east', 'highett', 'beaumaris', 'black rock', 'edithvale',
            'chelsea', 'bonbeach', 'seaford', 'langwarrin', 'mornington',
            'mount martha', 'rosebud', 'rye', 'sorrento', 'port melbourne',
            'south melbourne', 'albert park', 'middle park', 'kensington',
            'ascot vale', 'avondale heights', 'sunshine', 'albion', 'ar.deer park',
            'st albans', 'keilor', 'taylors lakes', 'sydenham', 'caroline springs',
            'burnside', 'hillside', 'melton', 'rockbank', 'tarneit',
            'werribee', 'hoppers crossing', 'point cook', 'laverton',
            'seabrook', 'truganina', 'williams landing', 'manor lakes'
        ]

        
        # Check for suburbs
        for suburb in melbourne_suburbs:
            if suburb in query_lower:
                locations.append(suburb)
        
        # Extract 4-digit postcodes (but not phone numbers)
        postcodes = re.findall(r'\b3\d{3}\b', query)
        locations.extend(postcodes)
        
        # Deduplicate
        locations = list(dict.fromkeys(locations))
        
        logger.info("Extracted locations from query", 
                   query=query, 
                   locations=locations)
        
        return locations
    
    def calculate_location_boost(
        self, 
        result: Dict[str, Any], 
        location_keywords: List[str]
    ) -> float:
        """
        Calculate location boost for a search result.
        
        Boost hierarchy:
        - Exact suburb match: +0.15
        - Postcode match: +0.15
        - Region match: +0.10
        - State match: +0.08
        """
        if not location_keywords:
            return 0.0
        
        max_boost = 0.0
        
        # Get result location fields
        suburb = (result.get('suburb') or '').lower()
        state = (result.get('state') or '').lower()
        postcode = (result.get('postcode') or '').lower()
        region = (result.get('region_name') or '').lower()
        
        for keyword in location_keywords:
            keyword_lower = keyword.lower()
            
            # Check suburb (highest priority)
            if keyword_lower in suburb or suburb in keyword_lower:
                max_boost = max(max_boost, 0.15)
                logger.debug("Suburb match", keyword=keyword, suburb=suburb, boost=0.15)
            
            # Check postcode
            elif keyword_lower in postcode:
                max_boost = max(max_boost, 0.15)
                logger.debug("Postcode match", keyword=keyword, postcode=postcode, boost=0.15)
            
            # Check region
            elif keyword_lower in region:
                max_boost = max(max_boost, 0.10)
                logger.debug("Region match", keyword=keyword, region=region, boost=0.10)
            
            # Check state (lowest priority)
            elif keyword_lower in state:
                max_boost = max(max_boost, 0.08)
                logger.debug("State match", keyword=keyword, state=state, boost=0.08)
        
        return max_boost
    
    def determine_result_count(self, top_similarity: float) -> int:
        """
        Determine how many results to return based on top similarity score.
        
        Quality-gated approach:
        - High confidence (>70%): 3 results
        - Medium confidence (50-70%): 5 results
        - Low confidence (<50%): 7 results
        """
        if top_similarity > 0.75:
            count = 3
            confidence = "high"
        elif top_similarity > 0.55:
            count = 5
            confidence = "medium"
        else:
            count = 7
            confidence = "low"
        
        logger.info("Determined result count",
                   top_similarity=f"{top_similarity:.2%}",
                   confidence=confidence,
                   result_count=count)
        
        return count
    
    def vector_search(
        self,
        query: str,
        limit: int = 10,
        similarity_threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """Perform basic vector similarity search."""
        try:
            logger.info("Starting vector search", query=query, limit=limit)
            
            # Generate embedding for query
            query_embedding = self.get_embedding(query)
            
            # Call Supabase RPC function for vector search
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
    
    def smart_search(
        self,
        query: str,
        user_context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Enhanced search with location re-ranking and dynamic result count.
        
        Process:
        1. Get 30 candidates from vector search (cast wide net)
        2. Extract location keywords from query
        3. Boost scores for location matches
        4. Re-sort by adjusted scores
        5. Determine optimal result count based on top score
        6. Return top N results
        """
        try:
            logger.info("Starting smart search", query=query)
            
            # Check for crisis keywords
            crisis_keywords = ['suicide', 'crisis', 'emergency', 'urgent', 
                             'immediate', 'help me', "can't cope", 'desperate']
            is_crisis = any(word in query.lower() for word in crisis_keywords)
            
            if is_crisis:
                logger.warning("Crisis query detected", query=query)
                similarity_threshold = 0.2  # Lower threshold for crisis
                candidate_count = 40  # Get more options
            else:
                similarity_threshold = 0.40
                candidate_count = 30
            
            # Step 1: Get candidate results (cast wide net)
            candidates = self.vector_search(
                query=query,
                limit=candidate_count,
                similarity_threshold=similarity_threshold
            )
            
            if not candidates:
                logger.warning("No candidates found", query=query)
                return []
            
            # Step 2: Extract location keywords
            location_keywords = self.extract_location_keywords(query)
            
            # Step 3: Apply location boosting
            for result in candidates:
                base_score = result.get('similarity', 0)
                location_boost = self.calculate_location_boost(result, location_keywords)
                
                # Calculate adjusted score (cap at 1.0)
                adjusted_score = min(1.0, base_score + location_boost)
                
                result['base_similarity'] = base_score
                result['location_boost'] = location_boost
                result['similarity'] = adjusted_score  # Override with adjusted score
            
            # Step 4: Re-sort by adjusted similarity
            candidates.sort(key=lambda x: x['similarity'], reverse=True)
            
            # Log top result for debugging
            if candidates:
                top = candidates[0]
                logger.info("Top result after re-ranking",
                           service=top.get('service_name'),
                           location=f"{top.get('suburb')}, {top.get('state')}",
                           base_score=f"{top.get('base_similarity', 0):.2%}",
                           boost=f"{top.get('location_boost', 0):.2%}",
                           final_score=f"{top.get('similarity', 0):.2%}")
            
            # Step 5: Determine how many results to return
            top_score = candidates[0]['similarity']
            result_count = self.determine_result_count(top_score)
            
            # Step 6: Return optimal number of results
            final_results = candidates[:result_count]
            
            logger.info("Smart search completed",
                       query=query,
                       total_candidates=len(candidates),
                       returned_results=len(final_results),
                       top_score=f"{top_score:.2%}",
                       had_location_filter=bool(location_keywords))
            
            return final_results
            
        except Exception as e:
            logger.error("Smart search failed", query=query, error=str(e), exc_info=True)
            raise
    
    def search_with_context(
        self,
        query: str,
        limit: int = 10,
        user_context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Main search interface - uses smart search with all enhancements.
        Kept for backward compatibility with existing code.
        """
        return self.smart_search(query, user_context)
    
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