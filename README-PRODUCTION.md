# Production-Ready YouTube Downloader

A modern, scalable YouTube downloader built with Next.js 14 frontend and FastAPI backend. Features real-time progress tracking, download history, Google AdSense integration, and production-ready deployment configurations.

## 🚀 Features

### Frontend (Next.js 14)
- ✅ Modern, mobile-responsive design with Tailwind CSS
- ✅ Real-time download progress with WebSockets
- ✅ Download history and user analytics
- ✅ Google AdSense placeholder integration
- ✅ SEO optimization for better search ranking
- ✅ TypeScript for type safety
- ✅ Zustand for state management

### Backend (FastAPI)
- ✅ Async download handling with yt-dlp
- ✅ PostgreSQL database for download tracking
- ✅ Redis for rate limiting and caching
- ✅ WebSocket support for real-time updates
- ✅ File caching system with automatic cleanup
- ✅ Health monitoring and comprehensive logging
- ✅ API authentication and rate limiting

### Deployment & DevOps
- ✅ Docker containers for easy deployment
- ✅ Docker Compose for local development
- ✅ Environment configuration for different stages
- ✅ Database migrations with Alembic
- ✅ Production-ready configurations

## 📁 Project Structure

```
youtube-downloader/
├── frontend/                   # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   └── stores/           # Zustand stores
│   ├── public/               # Static assets
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── backend/                   # FastAPI Backend
│   ├── main.py               # Main application
│   ├── requirements.txt      # Python dependencies
│   ├── alembic/             # Database migrations
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml        # Multi-service setup
├── .env.production          # Production environment
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- PostgreSQL (if running locally)
- Redis (if running locally)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd youtube-downloader
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start the backend
uvicorn main:app --reload --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start the development server
npm run dev
```

## 🚀 Deployment

### Vercel (Frontend)

1. **Connect your repository to Vercel**
2. **Configure environment variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com
   NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-xxxxxxxxxx
   ```
3. **Deploy**: Vercel will automatically deploy on git push

### Railway (Backend)

1. **Create a new Railway project**
2. **Connect your repository**
3. **Add services**:
   - PostgreSQL database
   - Redis
   - Web service (FastAPI)
4. **Configure environment variables**:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db
   REDIS_URL=redis://host:port
   DOWNLOAD_DIR=/app/downloads
   MAX_FILE_AGE_HOURS=48
   RATE_LIMIT_PER_MINUTE=10
   ENVIRONMENT=production
   ```
5. **Deploy**: Railway will automatically deploy your backend

### Alternative: DigitalOcean/AWS/GCP

Use the provided `docker-compose.yml` for production deployment:

```bash
# Production deployment
docker-compose -f docker-compose.yml up -d
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:port/database
REDIS_URL=redis://host:port
DOWNLOAD_DIR=./downloads
MAX_FILE_AGE_HOURS=48
RATE_LIMIT_PER_MINUTE=10
ENVIRONMENT=production
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-xxxxxxxxxx
```

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## 📊 Monitoring & Analytics

### Health Checks
- Backend: `GET /health`
- Database connection monitoring
- File system health checks

### Logging
- Structured JSON logging
- Error tracking and alerting
- Performance monitoring

### Metrics
- Download success/failure rates
- User engagement analytics
- System performance metrics

## 🔒 Security Features

- Rate limiting (10 requests per minute by default)
- Input validation and sanitization
- CORS configuration
- Environment-based configuration
- File cleanup and storage limits

## 💰 Monetization

### Google AdSense Integration
1. **Get your AdSense publisher ID**
2. **Add it to environment variables**
3. **Replace placeholder ads in components**
4. **Configure ad placement and sizes**

### Premium Features (Future)
- User accounts and authentication
- Download history persistence
- Higher quality downloads
- Batch downloads
- API access

## 🔧 API Documentation

### Download Endpoints

#### Start Download
```http
POST /api/download
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=...",
  "type": "audio",
  "format": "mp3",
  "quality": "192"
}
```

#### Get Download Status
```http
GET /api/download/{download_id}
```

#### Download File
```http
GET /api/download/{download_id}/file
```

#### WebSocket Progress
```
WS /ws/download/{download_id}
```

### Statistics
```http
GET /api/stats
```

## 🐛 Troubleshooting

### Common Issues

1. **Download fails**: Check if URL is valid and accessible
2. **WebSocket connection fails**: Verify WS_URL configuration
3. **Database connection issues**: Check DATABASE_URL and credentials
4. **File not found**: Files are automatically cleaned up after 48 hours

### Logs
```bash
# Backend logs
docker-compose logs backend

# Frontend logs  
docker-compose logs frontend

# Database logs
docker-compose logs postgres
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Legal Notice

This tool is for educational purposes only. Users are responsible for complying with YouTube's Terms of Service and applicable copyright laws. Only download content you have permission to download or that is in the public domain.

## 🔗 Links

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [Docker Documentation](https://docs.docker.com/)
- [Vercel Deployment](https://vercel.com/docs)
- [Railway Deployment](https://docs.railway.app/)
