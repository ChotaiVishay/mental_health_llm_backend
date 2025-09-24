"""
Mental Health LLM Backend - Main FastAPI Application
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings

# Import the simpler Supabase-only connection
try:
    from core.database.supabase_only import get_supabase_db, SupabaseOnlyConnection
    USE_SIMPLE_DB = True
except ImportError:
    # Fallback to the complex connection if the simple one doesn't exist
    from core.database.connection import get_db_connection, SupabaseConnection
    USE_SIMPLE_DB = False

# Import chat endpoints
from api.v1.endpoints.chat import router as chat_router

# Initialize settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Mental Health LLM Backend",
    description="LLM-powered chatbot with database querying for mental health applications",
    version="1.0.0",
    docs_url=f"/docs",
    redoc_url=f"/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=settings.allowed_methods_list,
    allow_headers=settings.allowed_headers_list,
)

# Include chat routes
app.include_router(chat_router, prefix="/api/v1/chat", tags=["chat"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Mental Health LLM Backend is running!",
        "environment": settings.environment,
        "api_version": settings.api_version,
        "chat_available": True,
        "endpoints": {
            "chat": "/api/v1/chat/chat",
            "suggested_questions": "/api/v1/chat/suggested-questions",
            "conversation_history": "/api/v1/chat/conversation/{session_id}",
            "api_docs": "/docs"
        }
    }


if USE_SIMPLE_DB:
    @app.get("/health")
    async def health_check(db: SupabaseOnlyConnection = Depends(get_supabase_db)):
        """Detailed health check using simple Supabase connection."""
        db_status = await db.test_connection()
        
        return {
            "status": "healthy",
            "environment": settings.environment,
            "openai_configured": bool(settings.openai_api_key),
            "supabase_configured": bool(settings.supabase_url and settings.supabase_key),
            "database": db_status
        }

    @app.get("/database/tables")
    async def get_database_tables(db: SupabaseOnlyConnection = Depends(get_supabase_db)):
        """Get available database tables and schema information."""
        tables = await db.get_available_tables()
        schema_info = await db.get_table_schema_info()
        
        return {
            "available_tables": tables,
            "table_count": len(tables),
            "connection_type": "supabase_rest_api",
            "schema_info": schema_info
        }

    @app.get("/database/query/{table_name}")
    async def query_table(table_name: str, limit: int = 10, db: SupabaseOnlyConnection = Depends(get_supabase_db)):
        """Query a specific table (limited for safety)."""
        data = await db.query_table(table_name, limit=limit)
        return {
            "table": table_name,
            "data": data,
            "count": len(data),
            "limit_applied": limit
        }
    
    @app.get("/database/sample-data")
    async def get_sample_data(db: SupabaseOnlyConnection = Depends(get_supabase_db)):
        """Get sample data from key tables to understand database content."""
        sample_data = await db.get_service_data_sample()
        return sample_data
    
    @app.get("/database/search")
    async def search_services(q: str, limit: int = 10, db: SupabaseOnlyConnection = Depends(get_supabase_db)):
        """Search for mental health services by text."""
        results = await db.search_services_by_text(q, limit)
        return {
            "query": q,
            "results": results,
            "count": len(results)
        }

else:
    @app.get("/health")
    async def health_check(db: SupabaseConnection = Depends(get_db_connection)):
        """Detailed health check using full connection."""
        db_status = await db.test_connection()
        
        return {
            "status": "healthy",
            "environment": settings.environment,
            "openai_configured": bool(settings.openai_api_key),
            "supabase_configured": bool(settings.supabase_url and settings.supabase_key),
            "database": db_status
        }

    @app.get("/database/tables")
    async def get_database_schema(db: SupabaseConnection = Depends(get_db_connection)):
        """Get database schema information."""
        tables = await db.get_table_info()
        return {
            "tables": tables,
            "table_count": len(tables)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.is_development
    )