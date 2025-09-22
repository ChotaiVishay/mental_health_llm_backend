"""
Mental Health LLM Backend - Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings

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


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Mental Health LLM Backend is running!",
        "environment": settings.environment,
        "api_version": settings.api_version
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "environment": settings.environment,
        "openai_configured": bool(settings.openai_api_key),
        "supabase_configured": bool(settings.supabase_url and settings.supabase_key),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.is_development
    )