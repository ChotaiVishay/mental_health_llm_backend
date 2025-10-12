"""
Supabase-only connection for mental health services database.
"""

import json
from typing import Any, Dict, List, Optional
from supabase import create_client, Client
import structlog

from ...app.config import get_settings

logger = structlog.get_logger(__name__)


class SupabaseOnlyConnection:
    """Manages Supabase client connections for mental health services database."""

    def __init__(self):
        self.settings = get_settings()
        self._client: Optional[Client] = None

        # Your actual table names from the schema
        self.table_names = [
            "campus",
            "cost",
            "cost_lookup",
            "delivery_method",
            "delivery_method_lookup",
            "level_of_care",
            "level_of_care_lookup",
            "messages",
            "organisation",
            "postcode",
            "referral_pathway",
            "referral_pathway_lookup",
            "region",
            "service",
            "service_campus",
            "service_region",
            "service_type",
            "service_type_lookup",
            "spatial_ref_sys",
            "staging_services",
            "target_population",
            "target_population_lookup",
            "workforce_type",
            "workforce_type_lookup",
        ]

    @property
    def client(self) -> Client:
        """Get or create Supabase client in a version-safe way."""
        if self._client is None:
            url = self.settings.supabase_url
            key = self.settings.supabase_service_key or self.settings.supabase_key

            # Ensure only supported args are passed to create_client
            try:
                logger.info("Creating Supabase client", url=url)
                logger.info("print key", key=key)
                self._client = create_client(url, key)
            except TypeError as e:
                logger.error("Supabase client creation failed", error=str(e))
                raise

        return self._client

    def query_table(
        self,
        table_name: str,
        select: str = "*",
        filters: Dict[str, Any] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
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

    def get_available_tables(self) -> List[str]:
        """Get list of tables that are accessible via Supabase API."""
        available_tables = []

        for table in self.table_names:
            try:
                # Try to query just one row to see if table exists and is accessible
                result = self.client.table(table).select("*").limit(1).execute()
                available_tables.append(table)
                logger.info(f"Table '{table}' is accessible")
            except Exception as e:
                logger.warning(f"Table '{table}' is not accessible", error=str(e))
                continue

        return available_tables

    def get_table_schema_info(self) -> Dict[str, Any]:
        """Get schema information about your mental health services database."""
        return {
            "database_type": "Mental Health Services Directory",
            "main_entities": {
                "organisations": "Healthcare organizations providing mental health services",
                "services": "Mental health services offered by organizations",
                "campuses": "Physical locations where services are provided",
                "service_campus": "Main junction table linking services to locations with details",
                "staging_services": "Comprehensive staging table with all service information",
            },
            "lookup_tables": {
                "cost_lookup": "Cost categories for services",
                "delivery_method_lookup": "How services are delivered (in-person, online, etc.)",
                "level_of_care_lookup": "Intensity levels of care provided",
                "referral_pathway_lookup": "How users can access services",
                "service_type_lookup": "Types of mental health services",
                "target_population_lookup": "Demographics services are designed for",
                "workforce_type_lookup": "Types of healthcare professionals",
            },
            "geographic_tables": {
                "region": "Geographic regions",
                "postcode": "Postal codes linked to regions",
                "service_region": "Which regions each service covers",
            },
            "system_tables": {
                "messages": "Chat messages for the mental health chatbot",
                "spatial_ref_sys": "Spatial reference system data",
            },
            "total_tables": len(self.table_names),
        }

    def get_service_data_sample(self) -> Dict[str, Any]:
        """Get a sample of actual service data to understand the database content."""
        try:
            # Get sample data from key tables
            organisations = self.query_table("organisation", limit=5)
            services = self.query_table("service", limit=5)
            service_campus = self.query_table("service_campus", limit=3)
            staging_services = self.query_table("staging_services", limit=3)

            return {
                "sample_data": {
                    "organisations": organisations,
                    "services": services,
                    "service_campus": service_campus,
                    "staging_services": staging_services,
                },
                "record_counts": {
                    "organisations": len(organisations),
                    "services": len(services),
                    "service_campus": len(service_campus),
                    "staging_services": len(staging_services),
                },
            }

        except Exception as e:
            logger.error("Failed to get sample service data", error=str(e))
            return {"error": str(e)}

    def search_services_by_text(
        self, search_term: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search for services using text search in the staging_services table."""
        try:

            parsed = json.loads(search_term)

            search_term = parsed.get("search_term", [])
            location_filter = parsed.get("location_filter")  # >>> changed
            service_filter = parsed.get("service_filter")  # >>> changed
            cost_filter = parsed.get("cost_filter")

            logger.info("Performing service text search", search_term=search_term)
            
            filters = []

            if location_filter:
                filters.append(f"suburb.ilike.%{location_filter}%")

            if service_filter:
                filters.append(f"service_type.ilike.%{service_filter}%")

            if cost_filter:
                filters.append(f"cost.ilike.%{cost_filter}%")

            for term in search_term:
                filters.extend([
                    f"service_name.ilike.%{term}%",
                    f"organisation_name.ilike.%{term}%",
                    f"notes.ilike.%{term}%",
                    f"address.ilike.%{term}%",
                ])

            if not filters:
                logger.warning("No valid search parameters provided")
                return []
            
            or_clause = ",".join(filters)

            result = (
                self.client.table("staging_services")
                .select("*")
                .or_(or_clause)
                .limit(limit)
                .execute()


                # Search in the stagin  g_services table which has comprehensive service information
            # result = self.client.table("staging_services").select("*").or_(
            #         ",".join([
            #             f"service_name.ilike.%{search_term}%",
            #             f"organisation_name.ilike.%{search_term}%",
            #             f"notes.ilike.%{search_term}%",
            #             f"address.ilike.%{search_term}%",
            #             "suburb.ilike.%Carlton%",
            #             f"service_type.ilike.%{search_term}%"
            #         ])).limit(limit).execute()
            )

            return result.data if result.data else []

        except Exception as e:
            logger.error(
                "Service text search failed", search_term=search_term, error=str(e)
            )
            return []

    def test_connection(self) -> Dict[str, Any]:
        """Test Supabase connection and get database overview."""
        try:
            # Test basic client initialization
            client_status = "connected" if self.client else "failed"

            # Try to get available tables
            tables = self.get_available_tables()

            # Get sample data to verify we can read actual content
            sample_data = self.get_service_data_sample()

            return {
                "status": "connected",
                "connection_type": "supabase_rest_api",
                "client_status": client_status,
                "accessible_tables": tables,
                "table_count": len(tables),
                "database_description": "Mental Health Services Directory Database",
                "sample_data_available": "sample_data" in sample_data,
                "ready_for_queries": len(tables) > 0,
            }

        except Exception as e:
            logger.error("Supabase connection test failed", error=str(e))
            return {
                "status": "error",
                "error": str(e),
                "connection_type": "supabase_rest_api",
            }


# Global connection instance
supabase_db = SupabaseOnlyConnection()


async def get_supabase_db() -> SupabaseOnlyConnection:
    """Dependency to get Supabase database connection."""
    return supabase_db
