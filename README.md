# 🧠 Mental Health Services Navigator with LLM

## 📌 Project Overview

A conversational AI assistant that helps people discover mental health services in Victoria, Australia through natural language chat. The system combines vector search, intelligent keyword extraction, and GPT-4 to provide personalized, location-aware service recommendations.

**Key Features:**
- 💬 Natural language conversation interface
- 📍 Location-aware search (suburbs, postcodes, regions)
- 🎯 Smart service matching using vector embeddings
- 🔍 Dynamic result ranking based on confidence scores
- 📋 Service submission system for providers
- 🚨 Crisis detection and immediate support resources

---

## 🏗️ Architecture

### **Technology Stack**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | Chat interface and service display |
| **Backend** | FastAPI + Python 3.11 | LLM orchestration and API |
| **Database** | Supabase (PostgreSQL) | Service data and vector storage |
| **AI/ML** | OpenAI GPT-4o-mini | Conversation and response generation |
| **Embeddings** | text-embedding-3-small | Vector search for service matching |
| **Frontend Hosting** | Vercel | Frontend deployment |
| **Backend Hosting** | AWS Elastic Beanstalk | Backend API deployment |
| **CDN** | AWS CloudFront | API caching and distribution |

### **System Flow**

```
User Query → Frontend → CloudFront → AWS EB Backend
                                           ↓
                        Vector Embeddings (OpenAI)
                                           ↓
                        Vector Search (Supabase pgvector)
                                           ↓
                        Location Boosting & Re-ranking
                                           ↓
                        Response Generation (GPT-4o-mini)
                                           ↓
                        Frontend Display with Service Cards
```

---

## 📁 Project Structure

```
COMP30022-Group-30-Mental-Health-Services-with-LLM/
├── Backend/
│   └── llm/
│       ├── app/
│       │   ├── main.py              # FastAPI application & endpoints
│       │   └── config.py            # Configuration management
│       ├── core/
│       │   └── database/
│       │       ├── supabase_only.py # Supabase connection & queries
│       │       └── vector_search.py # Vector search implementation
│       ├── services/
│       │   ├── chat_service.py      # Main chat logic & intent detection
│       │   └── flows/
│       │       └── service_creation.py # Service submission handling
│       ├── requirements.txt         # Python dependencies
│       ├── .ebignore               # EB deployment ignore rules
│       └── .elasticbeanstalk/      # AWS EB configuration
├── Frontend/
│   └── Mental-Health-Chatbot/
│       ├── src/
│       │   ├── components/         # React components
│       │   ├── pages/              # Page components
│       │   └── services/           # API service calls
│       ├── package.json            # Node dependencies
│       └── vite.config.ts          # Vite configuration
├── .env.example                    # Environment variables template
└── README.md                       # This file
```

---

## 🚀 Quick Start Guide

### **Prerequisites**

- Node.js 18+ and npm/yarn
- Python 3.11+
- Git
- Supabase account
- OpenAI API key
- AWS account (for backend deployment)
- Vercel account (for frontend deployment)

### **1. Clone the Repository**

```bash
git clone https://github.com/yilingsu1/COMP30022-Group-30-Mental-Health-Services-with-LLM.git
cd COMP30022-Group-30-Mental-Health-Services-with-LLM
```

### **2. Environment Setup**

Create a `.env` file in `Backend/llm/` with the following:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4o-mini
EMBED_MODEL=text-embedding-3-small

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Application Configuration
ENVIRONMENT=development
LOG_LEVEL=INFO
```

---

## 🖥️ Backend Setup (FastAPI)

### **Local Development**

```bash
# Navigate to backend directory
cd Backend/llm

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:** `http://localhost:8000`

**API Documentation:** `http://localhost:8000/docs`

### **Key Endpoints**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Health check |
| `/api/v1/chat/chat` | POST | Main chat endpoint |
| `/api/v1/services/submit` | POST | Submit new service |
| `/api/v1/services/form-config` | GET | Get form configuration |

### **AWS Deployment (Elastic Beanstalk)**

```bash
# Initialize EB (first time only)
cd Backend/llm
eb init -p python-3.11 mental-health-backend --region us-east-1

# Create environment
eb create mental-health-prod-v2 --instance-type t3.small

# Set environment variables
eb setenv \
  OPENAI_API_KEY="your-key" \
  OPENAI_MODEL="gpt-4o-mini" \
  EMBED_MODEL="text-embedding-3-small" \
  SUPABASE_URL="your-url" \
  SUPABASE_KEY="your-key" \
  SUPABASE_SERVICE_KEY="your-service-key" \
  ENVIRONMENT="production"

# Deploy updates
git add .
git commit -m "Deploy update"
eb deploy mental-health-prod-v2

# View logs
eb logs

# SSH into instance
eb ssh
```

**Production API:** `http://mental-health-prod-v2.eba-xxxxx.us-east-1.elasticbeanstalk.com`

### **CloudFront Setup**

1. Create CloudFront distribution in AWS Console
2. Set origin to your EB environment URL
3. Configure allowed HTTP methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
4. Set CORS headers
5. Note the CloudFront domain: `https://d1hfq1dvtow5bt.cloudfront.net`

---

## 🎨 Frontend Setup (React + Vite)

### **Local Development**

```bash
# Navigate to frontend directory
cd Frontend/Mental-Health-Chatbot

# Install dependencies
npm install

# Create .env.local file
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
```

**Frontend will be available at:** `http://localhost:5173`

### **Environment Variables**

Create `.env.local` (development) and `.env.production` (production):

```bash
# Development
VITE_API_URL=http://localhost:8000

# Production
VITE_API_URL=https://d1hfq1dvtow5bt.cloudfront.net
```

### **Vercel Deployment**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from frontend directory)
cd Frontend/Mental-Health-Chatbot
vercel --prod

# Set environment variable in Vercel dashboard
# Settings → Environment Variables
# VITE_API_URL = https://d1hfq1dvtow5bt.cloudfront.net
```

**Production URL:** `https://comp-30022-group-30-mental-health-s.vercel.app`

---

## 🗄️ Database Setup (Supabase)

### **1. Create Supabase Project**

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and API keys



## 🧪 Testing

### **Backend Tests**

```bash
cd Backend/llm

# Test health endpoint
curl http://localhost:8000/

# Test chat endpoint
curl -X POST http://localhost:8000/api/v1/chat/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "anxiety counselling in Carlton"}'

# Test service creation intent
curl -X POST http://localhost:8000/api/v1/chat/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to add a service"}'

# Test service submission
curl -X POST http://localhost:8000/api/v1/services/submit \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "Test Service",
    "organisation_name": "Test Org",
    "campus_name": "Main",
    "region_name": "Melbourne",
    "service_type": ["Counselling"],
    "delivery_method": "In person",
    "level_of_care": "Moderate intensity",
    "address": "123 Test St",
    "suburb": "Carlton",
    "state": "VIC",
    "postcode": "3053",
    "referral_pathway": "General bookings",
    "cost": "Free",
    "target_population": ["Adults"],
    "workforce_type": "Tertiary qualified"
  }'
```

### **Frontend Tests**

```bash
cd Frontend/Mental-Health-Chatbot

# Run type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔧 Configuration

### **Backend Configuration (`app/config.py`)**

```python
class Settings(BaseSettings):
    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"
    embed_model: str = "text-embedding-3-small"
    
    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_key: str
    
    # Application
    environment: str = "development"
    log_level: str = "INFO"
```

### **Vector Search Configuration**

- **Similarity Threshold:** 0.40 (adjustable in `vector_search.py`)
- **Max Results:** 3-7 (based on confidence score)
- **Embedding Model:** text-embedding-3-small (1536 dimensions)
- **Location Boost:** +0.15 for suburb matches, +0.10 for postcode matches

---

## 📊 Features

### **1. Intelligent Service Search**

- **Vector embeddings** capture semantic meaning of queries
- **Location-aware** boosting for suburb/postcode matches
- **Confidence-based** result count (3-7 services)
- **Multi-keyword** extraction (service types, locations, cost filters)

### **2. Natural Language Understanding**

- Crisis detection with immediate support resources
- Service creation intent detection
- Context-aware responses using GPT-4o-mini
- Full service details (address, website, phone, cost)

### **3. Service Submission System**

- Form-based service submission
- Validation and normalization
- Pending review queue
- Admin approval workflow

### **4. Response Quality**

- Always includes full addresses and websites
- Highlights free/bulk-billed services
- Provides multiple contact methods
- Crisis resources on every relevant query

---

## 🚨 Crisis Handling

The system automatically detects crisis-related queries and provides:

```
🆘 Emergency: 000
📞 Lifeline: 13 11 14 (24/7)
💬 Lifeline Text: 0477 13 11 14
🌐 Lifeline Chat: www.lifeline.org.au/crisis-chat

Other services:
- Beyond Blue: 1300 22 4636
- Suicide Call Back Service: 1300 659 467
- Kids Helpline (under 25): 1800 55 1800
```

---

## 🐛 Troubleshooting

### **Backend Issues**

**502 Bad Gateway:**
```bash
# Check EB logs
eb logs | tail -100

# Verify environment variables
eb printenv

# SSH and check application
eb ssh
sudo tail -100 /var/log/web.stdout.log
```

**Import Errors:**
```bash
# Check file structure
eb ssh
ls -la /var/app/current/

# Verify Python packages
pip list
```

**Database Connection:**
```bash
# Test Supabase connection
curl http://localhost:8000/health
```

### **Frontend Issues**

**API Not Connecting:**
- Check `VITE_API_URL` environment variable
- Verify CORS settings in backend
- Check network tab in browser dev tools

**Build Failures:**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📈 Performance

- **Average Response Time:** 2-4 seconds
- **Vector Search:** <100ms
- **LLM Generation:** 1-3 seconds
- **Concurrent Users:** Scales with AWS EB instance size

---

## 🔒 Security

- API keys stored in environment variables
- Service role key for admin operations only
- CORS restricted to known origins
- Input validation on all endpoints
- Crisis queries logged for safety monitoring

---

## 🚀 Deployment Checklist

### **Backend Deployment**

- [ ] Set all environment variables in AWS EB
- [ ] Deploy to Elastic Beanstalk
- [ ] Configure CloudFront distribution
- [ ] Test all endpoints via CloudFront URL
- [ ] Monitor logs for errors

### **Frontend Deployment**

- [ ] Set production API URL in Vercel
- [ ] Deploy to Vercel
- [ ] Test chat functionality
- [ ] Test service submission
- [ ] Verify mobile responsiveness

### **Database Setup**

- [ ] Create Supabase project
- [ ] Run all SQL migrations
- [ ] Populate initial service data
- [ ] Generate embeddings for services
- [ ] Test vector search function

---

## 📝 API Documentation

Full API documentation available at:
- **Local:** `http://localhost:8000/docs`
- **Production:** `https://d1hfq1dvtow5bt.cloudfront.net/docs`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 👥 Team

| Role | Name | GitHub | Email |
|------|------|--------|-------|
| Product Owner | Manya Garg | @username | manyagarg312@gmail.com |
| Scrum Master | Gurshan Singh | @gurshan2604 | gurshan2604@gmail.com |
| Developer | Suhas Agarwal | @username | Suhas.agrawal86@gmail.com |
| Developer | Yiling Su | @yilingsu1 | yilingsu1@gmail.com |
| Developer | Vishay Chotai | @ChotaiVishay | chotai.vishay@gmail.com |

---

## 📄 License

This project is part of COMP30022 at the University of Melbourne.

---

## 🙏 Acknowledgments

- University of Melbourne COMP30022 teaching team
- OpenAI for GPT-4 and embeddings API
- Supabase for database and vector search
- AWS and Vercel for hosting infrastructure

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API documentation at `/docs`
3. Contact the team via email
4. Open an issue on GitHub

---

**Last Updated:** October 27, 2025