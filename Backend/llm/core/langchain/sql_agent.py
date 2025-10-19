"""
LangChain SQL Agent for querying the mental health services database.
"""

from typing import Any, Dict, List, Optional
import yaml
import os
from pathlib import Path

from langchain.agents import create_sql_agent
from langchain.agents.agent_toolkits import SQLDatabaseToolkit
from langchain.agents.agent_types import AgentType
from langchain.sql_database import SQLDatabase
from langchain_openai import ChatOpenAI
import structlog

from ...app.config import get_settings
from ...core.llm.openai_client import get_chat_llm
from ...core.database.supabase_only import get_supabase_db

logger = structlog.get_logger(__name__)


class MentalHealthSQLAgent:
    """SQL Agent specialized for mental health services database queries."""

    def __init__(self):
        self.settings = get_settings()
        self._agent = None
        self._db = None
        self._toolkit = None
        self._schema_info = None

        # Load schema information
        self._load_schema_info()

    def _load_schema_info(self):
        """Load database schema information from YAML file."""
        try:
            schema_path = (
                Path(__file__).parent.parent.parent
                / "data"
                / "schema_definitions"
                / "mental_health_schema.yaml"
            )

            if schema_path.exists():
                with open(schema_path, "r") as file:
                    self._schema_info = yaml.safe_load(file)
                logger.info("Schema information loaded successfully")
            else:
                logger.warning("Schema YAML file not found, using basic schema info")
                self._schema_info = self._get_basic_schema_info()

        except Exception as e:
            logger.error("Failed to load schema info", error=str(e))
            self._schema_info = self._get_basic_schema_info()

    def _get_basic_schema_info(self) -> Dict:
        """Fallback basic schema information."""
        return {
            "database_info": {
                "name": "Mental Health Services Directory",
                "description": "Database of mental health services and providers",
            },
            "recommendations": {"primary_query_table": "staging_services"},
        }

    async def _get_database_connection(self):
        """Get database connection for LangChain SQL operations."""
        if self._db is None:
            try:
                # For now, we'll create a mock connection since we're using Supabase REST API
                # In a full implementation, you'd use the direct PostgreSQL connection

                # This is a placeholder - you'd need actual PostgreSQL connection string
                # For demonstration purposes, we'll work with the Supabase client
                logger.info("SQL Agent initialized with Supabase backend")

                # Since we don't have direct SQL access, we'll use a hybrid approach
                self._db = "supabase_backend"  # Placeholder

            except Exception as e:
                logger.error(
                    "Failed to create database connection for SQL agent", error=str(e)
                )
                raise

        return self._db

    def _create_custom_prompt(self) -> str:
        """Create a specialized prompt for mental health services queries."""

        schema_description = ""
        if self._schema_info:
            db_info = self._schema_info.get("database_info", {})
            schema_description = f"""
Database: {db_info.get('name', 'Mental Health Services')}
Description: {db_info.get('description', 'Mental health services directory')}

Key Tables for Queries:
- staging_services: Complete service information (RECOMMENDED for most queries)
- organisation: Healthcare organizations
- service: Mental health services
- service_campus: Service locations with contact details
- Various lookup tables for detailed information

Primary Query Table: Use 'staging_services' for most user questions as it contains comprehensive service information including:
- Service names, types, and descriptions
- Organization information
- Location details (address, suburb, postcode, state)
- Contact information (phone, email, website)
- Cost information
- Delivery methods (telehealth, in-person, etc.)
- Target populations and eligibility
- Wait times and notes
"""

        return f"""
You are a helpful assistant specialized in answering questions about mental health services in Australia.

{schema_description}

When answering questions:
1. Focus on providing helpful, accurate information about mental health services
2. Use the staging_services table for most queries as it has comprehensive information
3. Include relevant details like location, contact information, cost, and eligibility when available
4. Be empathetic and understanding when discussing mental health topics
5. If you can't find specific information, suggest general mental health resources or recommend contacting services directly

For location-based queries, search by suburb, postcode, state, or region_name.
For service-type queries, search service_type, service_name, or notes fields.
For cost queries, filter by the cost field.

Always prioritize user safety and well-being in your responses.
"""

    async def create_agent(self) -> Any:
        """Create the SQL agent with custom configuration."""
        if self._agent is None:
            try:
                # Get LLM
                llm = get_chat_llm()

                # Since we're using Supabase REST API, we'll create a hybrid agent
                # that combines LangChain capabilities with our custom database methods

                logger.info("Creating hybrid mental health SQL agent")

                # Store for later use
                self._agent = {
                    "type": "hybrid",
                    "llm": llm,
                    "prompt": self._create_custom_prompt(),
                    "schema_info": self._schema_info,
                }

            except Exception as e:
                logger.error("Failed to create SQL agent", error=str(e))
                raise

        return self._agent

    async def query(self, user_question: str) -> Dict[str, Any]:
        """Process a user question and return results."""
        try:
            # Get agent and database connection
            agent = await self.create_agent()
            supabase_db = await get_supabase_db()

            # For now, we'll use a hybrid approach:
            # 1. Use the LLM to understand the query and determine search strategy
            # 2. Use our Supabase client to execute the query
            # 3. Use the LLM to format the response

            # Step 1: Analyze the user question
            llm = agent["llm"]
            analysis_prompt = f"""
Given this user question about mental health services: "{user_question}"

Determine:
1. What type of information are they looking for? (service type, location, cost, etc.)
2. What search terms should be used?
3. What filters should be applied?

Respond with a JSON object containing:
{{
    "query_type": "location/service_type/cost/general",
    "search_terms": ["term1", "term2"],
    "location_filter": "location if specified",
    "service_filter": "service type if specified",
    "cost_filter": "cost preference if specified"
}}
"""

            analysis_response = llm.invoke(analysis_prompt)
            logger.info(
                "Query analysis completed again",
                question=user_question,
                analysis_json=analysis_response.content,
            )

            # Step 2: Execute search using Supabase
            # For now, we'll do a simple text search
            search_results = supabase_db.search_services_by_text(
                analysis_response.content, limit=10
            )

            # Step 3: Format response using LLM
            if search_results:
                response_prompt = f"""
Based on the user question: "{user_question}"

Here are the mental health services I found:
{search_results}

Please provide a helpful, empathetic response that:
1. Directly answers their question
2. Lists relevant services with key details (name, location, contact info)
3. Includes important information like costs, eligibility, and how to access services
4. Is formatted in a clear, user-friendly way
5. Shows understanding of mental health sensitivity

Format your response as if you're a knowledgeable mental health support assistant.
"""

                formatted_response = llm.invoke(response_prompt)

                return {
                    "status": "success",
                    "user_question": user_question,
                    "response": formatted_response.content,
                    "raw_results": search_results,
                    "result_count": len(search_results),
                }
            else:
                # No results found
                no_results_prompt = f"""
The user asked: "{user_question}"

I couldn't find specific services matching their request in the database.

Please provide a helpful response that:
1. Acknowledges I couldn't find specific matching services
2. Suggests alternative approaches or general mental health resources
3. Recommends they contact their GP or call mental health helplines
4. Is empathetic and supportive
5. Includes some general mental health service options if appropriate

Be understanding and helpful even though we couldn't find exact matches.
"""

                no_results_response = llm.invoke(no_results_prompt)

                return {
                    "status": "no_results",
                    "user_question": user_question,
                    "response": no_results_response.content,
                    "raw_results": [],
                    "result_count": 0,
                }

        except Exception as e:
            logger.error(
                "Query processing failed", question=user_question, error=str(e)
            )
            return {"status": "error", "error": str(e), "user_question": user_question}

    async def test_agent(self) -> Dict[str, Any]:
        """Test the SQL agent functionality."""
        try:
            agent = await self.create_agent()

            # Test with a simple question
            test_result = await self.query("Find mental health services in Melbourne")

            return {
                "status": "success",
                "agent_type": agent.get("type"),
                "test_query_successful": test_result.get("status") == "success",
                "schema_loaded": bool(self._schema_info),
            }

        except Exception as e:
            logger.error("Agent test failed", error=str(e))
            return {"status": "error", "error": str(e)}


# Global SQL agent instance
sql_agent = MentalHealthSQLAgent()


async def get_sql_agent() -> MentalHealthSQLAgent:
    """Dependency to get SQL agent."""
    return sql_agent
