# Mental Health LLM Backend

A Python backend service that provides an LLM-powered chatbot for mental health applications, with exclusive database querying capabilities using LangChain and OpenAI.

## Features

- 🤖 **LLM-Powered Chat**: OpenAI integration for natural language processing
- 🗃️ **Database-Only Responses**: Queries exclusively from Supabase Postgres database
- 🔗 **LangChain Integration**: Advanced text-to-SQL capabilities
- 🛡️ **Security First**: SQL injection prevention and query validation
- 🚀 **FastAPI Framework**: High-performance async API
- 📊 **Mental Health Focus**: Specialized for mental health domain

## Tech Stack

- **Backend**: Python 3.9+, FastAPI
- **Database**: Supabase (Postgres)
- **LLM**: OpenAI GPT-4
- **Framework**: LangChain
- **Security**: SQL validation, rate limiting

## Quick Start

### Prerequisites
- Python 3.9+
- OpenAI API key
- Supabase project with database

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd mental_health_llm_backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your actual API keys and database credentials.

5. **Run the application:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### API Documentation

Once running, visit:
- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
mental_health_llm_backend/
├── app/                    # FastAPI application
├── core/                   # Core business logic
│   ├── database/          # Database connections & models
│   ├── llm/               # OpenAI integration
│   ├── langchain/         # LangChain components
│   └── security/          # Security & validation
├── services/              # Business logic services
├── api/                   # API endpoints & schemas
├── utils/                 # Utilities & helpers
├── data/                  # Schema definitions & prompts
└── tests/                 # Test suites
```

## Development

### Running Tests
```bash
pytest tests/ -v
```

### Code Formatting
```bash
black .
isort .
flake8 .
```

### Environment Variables

Key environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon key
- `OPENAI_API_KEY`: Your OpenAI API key
- `SECRET_KEY`: JWT secret key
- `ENVIRONMENT`: development/production

## Security Considerations

- All SQL queries are validated and sanitized
- Rate limiting implemented
- No direct database access from user input
- JWT-based authentication ready
- CORS properly configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please contact the development team or create an issue in this repository.