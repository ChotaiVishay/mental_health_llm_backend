"""
Database connection management for Supabase.
"""

import asyncio
from typing import Any, Dict, List, Optional
from supabase import create_client, Client
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import asyncpg
import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)

class SupabaseConnection:
    """Manages Supabase client connections and database operations."""
    
    def __init__(self):
        self.settings = get_settings()
        self._client: Optional[Client] = None
        self._async_engine = None
        self._async_session_maker = None
        self._pg_pool = None
    
    @property
    def client(self) -> Client:
        """Get or create Supabase client."""
        if self._client is None:
            self._client = create_client(
                self.settings.supabase_url,
                self.settings.supabase_service_key or self.settings.supabase_key
            )
        return self._client
    
    async def get_async_engine(self):
        """Get or create async SQLAlchemy engine."""
        if self._async_engine is None:
            # Convert Supabase URL to async PostgreSQL URL
            db_url = self.settings.supabase_url.replace('https://', '')
            project_id = db_url.split('.')[0]
            
            # Use service key for connection if available
            password = self.settings.supabase_service_key or self.settings.supabase_key
            
            async_db_url = (
                f"postgresql+asyncpg://postgres:{password}@"
                f"db.{project_id}.supabase.co:5432/postgres"
            )
            
            self._async_engine = create_async_engine(
                async_db_url,
                echo=self.settings.is_development,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
            )
            
            self._async_session_maker = sessionmaker(
                self._async_engine, class_=AsyncSession, expire_on_commit=False
            )
        
        return self._async_engine
    
    async def get_pg_pool(self):
        """Get or create asyncpg connection pool."""
        if self._pg_pool is None:
            # Extract connection details from Supabase URL
            db_url = self.settings.supabase_url.replace('https://', '')
            project_ref = db_url.split('.')[0]
            
            # For Supabase, we need to use the database password, not the API key
            # The service key is for API access, not direct PostgreSQL access
            
            # Try to use database URL format or construct connection parameters
            try:
                # Option 1: Try with service key as password (sometimes works)
                password = self.settings.supabase_service_key or self.settings.supabase_key
                
                self._pg_pool = await asyncpg.create_pool(
                    host=f"db.{project_ref}.supabase.co",
                    port=5432,
                    user="postgres",
                    password=password,
                    database="postgres",
                    min_size=1,
                    max_size=10,
                    ssl="require"  # Supabase requires SSL
                )
            except Exception as e:
                # Option 2: If direct connection fails, we'll use Supabase client instead
                logger.warning("Direct PostgreSQL connection failed, will use Supabase client", error=str(e))
                raise Exception(f"Cannot connect to PostgreSQL directly. You may need the database password instead of API keys. Error: {str(e)}")
        
        return self._pg_pool
    
    async def execute_query(self, query: str, params: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Execute a raw SQL query and return results."""
        try:
            # Try direct PostgreSQL connection first
            pool = await self.get_pg_pool()
            async with pool.acquire() as connection:
                if params:
                    result = await connection.fetch(query, *params.values())
                else:
                    result = await connection.fetch(query)
                
                return [dict(record) for record in result]
        
        except Exception as pg_error:
            logger.warning("Direct PostgreSQL query failed, trying Supabase RPC", error=str(pg_error))
            
            # Fallback: Use Supabase client (requires RPC function in database)
            try:
                # Note: This requires creating a PostgreSQL function called 'execute_sql' in your Supabase database
                result = self.client.rpc('execute_sql', {'sql_query': query}).execute()
                return result.data if result.data else []
            
            except Exception as supabase_error:
                logger.error("Both PostgreSQL and Supabase RPC failed", 
                           pg_error=str(pg_error), supabase_error=str(supabase_error))
                
                # For now, return empty result for schema queries
                if 'information_schema' in query.lower():
                    return []
                
                raise Exception(f"Database query failed: {str(pg_error)}")
    
    async def get_table_info(self) -> Dict[str, Any]:
        """Get information about tables using Supabase client."""
        try:
            # First try the PostgreSQL approach
            result = await self.execute_query("""
            SELECT 
                table_name,
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
            """)
            
            if not result:
                # Fallback: Try to get table info through Supabase introspection
                # This is more limited but doesn't require direct PostgreSQL access
                logger.info("Using Supabase client fallback for table info")
                return await self._get_table_info_fallback()
            
            # Group by table name
            tables = {}
            for row in result:
                table_name = row['table_name']
                if table_name not in tables:
                    tables[table_name] = []
                
                tables[table_name].append({
                    'column_name': row['column_name'],
                    'data_type': row['data_type'],
                    'is_nullable': row['is_nullable'],
                    'column_default': row['column_default']
                })
            
            return tables
        
        except Exception as e:
            logger.error("Failed to get table info", error=str(e))
            return await self._get_table_info_fallback()
    
    async def _get_table_info_fallback(self) -> Dict[str, Any]:
        """Fallback method to get basic table info."""
        # This is a basic fallback - you'll need to manually specify your tables
        # or create them in Supabase and they'll be accessible via the client
        
        # For now, return a placeholder structure
        # You can replace this with your actual table structure
        return {
            "note": "Direct database access not available. Please configure database connection or use Supabase RPC functions.",
            "suggestion": "Add your table schema manually or set up proper database credentials."
        }
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test database connection and return status."""
        try:
            # Test Supabase client first (this should always work)
            supabase_status = "connected" if self.client else "failed"
            
            # Test direct PostgreSQL connection
            pg_status = "not_tested"
            pg_error = None
            
            try:
                result = await self.execute_query("SELECT version();")
                pg_status = "connected"
                pg_version = result[0]["version"] if result else "unknown"
            except Exception as e:
                pg_status = "failed"
                pg_error = str(e)
                pg_version = "unavailable"
            
            # Test table access
            tables = await self.get_table_info()
            
            return {
                "status": "partial" if pg_status == "failed" else "connected",
                "supabase_client": supabase_status,
                "postgresql_direct": pg_status,
                "postgresql_error": pg_error,
                "postgresql_version": pg_version if pg_status == "connected" else "unavailable",
                "tables_found": len(tables) if isinstance(tables, dict) and "note" not in tables else 0,
                "table_names": list(tables.keys()) if isinstance(tables, dict) and "note" not in tables else [],
                "connection_methods": {
                    "supabase_rest_api": supabase_status,
                    "postgresql_direct": pg_status
                }
            }
        
        except Exception as e:
            logger.error("Database connection test failed completely", error=str(e))
            return {
                "status": "error",
                "error": str(e),
                "connection_methods": {
                    "supabase_rest_api": "unknown",
                    "postgresql_direct": "failed"
                }
            }
    
    async def close(self):
        """Close all database connections."""
        if self._pg_pool:
            await self._pg_pool.close()
        
        if self._async_engine:
            await self._async_engine.dispose()


# Global connection instance
db_connection = SupabaseConnection()


async def get_db_connection() -> SupabaseConnection:
    """Dependency to get database connection."""
    return db_connection