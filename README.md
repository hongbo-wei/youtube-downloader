# YouTube Downloader - Production Ready

A comprehensive YouTube downloader built with modern web technologies, featuring a Next.js 14 frontend and FastAPI backend, designed for production deployment with scalability and monetization in mind.

## ✨ Features

### 🎯 Core Functionality
- **High-Quality Downloads**: Support for various video and audio formats (MP4, WebM, MP3, M4A, etc.)
- **Quality Selection**: Choose from multiple quality options (360p to 1080p for video, 128kbps to 320kbps for audio)
- **Real-Time Progress**: WebSocket-powered live download progress tracking
- **Download History**: Persistent storage of download history with filtering and sorting
- **File Management**: Automatic cleanup of old files to manage storage

### 🚀 Frontend (Next.js 14)
- **Modern Design**: Responsive, mobile-first design with Tailwind CSS
- **Real-Time Updates**: WebSocket integration for live progress updates
- **State Management**: Zustand for efficient state management
- **SEO Optimized**: Built for search engine optimization
- **AdSense Ready**: Google AdSense integration placeholders
- **TypeScript**: Full type safety and better developer experience

### ⚡ Backend (FastAPI)
- **Async Operations**: Non-blocking download processing
- **Database Integration**: PostgreSQL for reliable data persistence
- **Caching Layer**: Redis for rate limiting and performance optimization
- **Rate Limiting**: Built-in protection against abuse
- **Health Monitoring**: Comprehensive health checks and logging
- **Auto Cleanup**: Scheduled cleanup of old files

### 🏗️ DevOps & Deployment
- **Docker Ready**: Complete containerization for all services
- **Production Configs**: Environment-specific configurations
- **CI/CD Pipeline**: GitHub Actions workflow for automated deployment
- **Database Migrations**: Alembic for database schema management
- **Health Checks**: Built-in monitoring and health endpoints

## 📁 Project Structure

```
youtube-downloader/
├── 📱 frontend/                 # Next.js 14 Frontend Application
│   ├── src/
│   │   ├── app/                # App Router (Pages)
│   │   ├── components/         # Reusable React Components
│   │   └── stores/            # Zustand State Management
│   ├── public/                # Static Assets
│   ├── Dockerfile             # Frontend Container Config
│   └── package.json           # Dependencies & Scripts
│
├── 🔧 backend/                 # FastAPI Backend Application  
│   ├── main.py               # Main Application Entry Point
│   ├── requirements.txt      # Python Dependencies
│   ├── alembic/             # Database Migration Scripts
│   ├── Dockerfile           # Backend Container Config
│   └── .env.example         # Environment Variables Template
│
├── 🐳 Docker & Deployment
│   ├── docker-compose.yml   # Multi-Service Orchestration
│   ├── deploy.sh           # Automated Deployment Script
│   └── .env.production     # Production Environment Config
│
├── 🔄 CI/CD
│   └── .github/workflows/  # GitHub Actions Pipelines
│
├── 📚 Documentation
│   ├── README.md           # This file (Getting Started)
│   └── README-PRODUCTION.md # Detailed Production Guide
│
└── 🎯 Legacy Files (for reference)
    ├── app.py              # Original Flask App
    ├── youtube_downloader.py # Core Download Logic
    └── requirements.txt    # Original Dependencies
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd youtube-downloader

# Start all services with Docker Compose
docker compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

#### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL
- Redis

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your database and Redis URLs

# Run migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install

# Copy and configure environment
cp .env.example .env.local
# Edit .env.local with your API URLs

# Start development server
npm run dev
```

## 🌐 Production Deployment

### Vercel (Frontend) + Railway (Backend)

This is the recommended setup for production:

1. **Frontend on Vercel**:
   - Connect your GitHub repository
   - Set environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app
     NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
     ```
   - Deploy automatically on push

2. **Backend on Railway**:
   - Create PostgreSQL and Redis services
   - Deploy FastAPI service from GitHub
   - Configure environment variables

### Self-Hosted with Docker

```bash
# Use the deployment script
./deploy.sh

# Or manually with docker-compose
docker compose -f docker-compose.yml up -d
```

## 🔧 Configuration

### Environment Variables

#### Backend
```env
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
DOWNLOAD_DIR=./downloads
MAX_FILE_AGE_HOURS=48
RATE_LIMIT_PER_MINUTE=10
ENVIRONMENT=production
```

#### Frontend
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-xxxxxxxxxx
```

## 📊 API Documentation

The FastAPI backend provides comprehensive API documentation:

- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

```http
POST /api/download              # Start new download
GET  /api/download/{id}         # Get download status  
GET  /api/download/{id}/file    # Download completed file
WS   /ws/download/{id}          # Real-time progress updates
GET  /api/stats                 # Download statistics
GET  /health                    # Health check
```

## 💰 Monetization Features

### Google AdSense Integration
- Pre-configured ad placement slots
- Environment variable configuration
- Mobile-responsive ad units

### Premium Features (Future Roadmap)
- User authentication and accounts
- Download history cloud sync
- Higher quality download options
- Batch download capabilities
- API access for developers

## 🔒 Security Features

- **Rate Limiting**: Configurable request limits per IP
- **Input Validation**: Comprehensive URL and parameter validation  
- **CORS Protection**: Configurable cross-origin policies
- **Environment Isolation**: Separate configs for dev/staging/prod
- **Health Monitoring**: Automated health checks and alerting

## 📈 Monitoring & Analytics

### Built-in Metrics
- Download success/failure rates
- User engagement analytics
- System performance monitoring
- Error tracking and logging

### Health Checks
- Database connectivity
- Redis availability  
- File system health
- API endpoint status

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests  
cd frontend
npm test
```

### Database Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

### Code Quality
```bash
# Backend linting
black . && flake8 .

# Frontend linting
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Legal Notice

This tool is for educational and personal use only. Users must comply with:
- YouTube's Terms of Service
- Applicable copyright laws
- Content creator rights

Only download content you have permission to download or that is in the public domain.

## 🔗 Additional Resources

- **[Production Deployment Guide](README-PRODUCTION.md)**: Detailed production setup
- **[FastAPI Documentation](https://fastapi.tiangolo.com/)**
- **[Next.js Documentation](https://nextjs.org/docs)**
- **[Docker Documentation](https://docs.docker.com/)**

## 🆘 Support

If you encounter issues:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Review the logs: `docker compose logs [service-name]`
3. Consult the production deployment guide
4. Create a new issue with detailed information

---

**Made with ❤️ for the developer community**
