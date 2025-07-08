from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import asynccontextmanager
import asyncio
import os
import uuid
import json
import redis
import yt_dlp
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import logging
from pathlib import Path
import aiofiles
import shutil

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/youtube_downloader")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR", "./downloads")
MAX_FILE_AGE_HOURS = int(os.getenv("MAX_FILE_AGE_HOURS", "48"))
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "10"))

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create download directory
Path(DOWNLOAD_DIR).mkdir(exist_ok=True)

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis setup
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
except:
    redis_client = None
    logger.warning("Redis not available, rate limiting disabled")

# Models
class DownloadRecord(Base):
    __tablename__ = "downloads"
    
    id = Column(String, primary_key=True, index=True)
    url = Column(String, nullable=False)
    title = Column(String)
    type = Column(String, nullable=False)  # 'audio' or 'video'
    format = Column(String, nullable=False)
    quality = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, downloading, processing, completed, failed
    progress = Column(Float, default=0.0)
    file_path = Column(String)
    file_size = Column(Integer)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    ip_address = Column(String)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class DownloadRequest(BaseModel):
    url: str
    type: str  # 'audio' or 'video'
    format: str
    quality: str

class DownloadResponse(BaseModel):
    download_id: str
    message: str

class DownloadStatus(BaseModel):
    id: str
    status: str
    progress: float
    title: Optional[str] = None
    filename: Optional[str] = None
    file_size: Optional[int] = None
    error: Optional[str] = None
    download_url: Optional[str] = None
    created_at: datetime

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, download_id: str):
        await websocket.accept()
        self.active_connections[download_id] = websocket

    def disconnect(self, download_id: str):
        if download_id in self.active_connections:
            del self.active_connections[download_id]

    async def send_progress(self, download_id: str, data: dict):
        if download_id in self.active_connections:
            try:
                await self.active_connections[download_id].send_text(json.dumps(data))
            except Exception as e:
                logger.error(f"WebSocket send error for {download_id}: {e}")
                self.disconnect(download_id)

manager = ConnectionManager()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Rate limiting
def check_rate_limit(client_ip: str) -> bool:
    if not redis_client:
        return True
    
    try:
        key = f"rate_limit:{client_ip}"
        current = redis_client.get(key)
        if current is None:
            redis_client.setex(key, 60, 1)
            return True
        elif int(current) < RATE_LIMIT_PER_MINUTE:
            redis_client.incr(key)
            return True
        return False
    except Exception as e:
        logger.error(f"Rate limiting error: {e}")
        return True  # Allow if Redis fails

# Download progress hook
def progress_hook(d, download_id: str):
    if d['status'] == 'downloading':
        try:
            total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
            downloaded = d.get('downloaded_bytes', 0)
            progress = (downloaded / total * 100) if total > 0 else 0
            
            # Update database
            with SessionLocal() as db:
                record = db.query(DownloadRecord).filter(DownloadRecord.id == download_id).first()
                if record:
                    record.progress = progress
                    record.status = "downloading"
                    db.commit()
            
            # Send WebSocket update (safe async task creation)
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(manager.send_progress(download_id, {
                    'status': 'downloading',
                    'progress': progress,
                    'downloaded_bytes': downloaded,
                    'total_bytes': total
                }))
            except RuntimeError:
                # No event loop running, skip WebSocket update
                pass
        except Exception as e:
            logger.error(f"Progress hook error: {e}")

# Background download task
async def download_media(download_id: str, request: DownloadRequest, client_ip: str):
    db = SessionLocal()
    try:
        record = db.query(DownloadRecord).filter(DownloadRecord.id == download_id).first()
        if not record:
            return

        # Update status
        record.status = "downloading"
        db.commit()

        # Configure yt-dlp options
        output_path = os.path.join(DOWNLOAD_DIR, download_id)
        os.makedirs(output_path, exist_ok=True)

        ydl_opts = {
            'outtmpl': f'{output_path}/%(title)s.%(ext)s',
            'progress_hooks': [lambda d: progress_hook(d, download_id)],
        }

        if request.type == 'audio':
            ydl_opts.update({
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': request.format,
                    'preferredquality': request.quality,
                }],
            })
        else:
            # Video format selection
            if request.quality == '1080p':
                format_selector = 'best[height<=1080]'
            elif request.quality == '720p':
                format_selector = 'best[height<=720]'
            elif request.quality == '480p':
                format_selector = 'best[height<=480]'
            else:
                format_selector = 'best[height<=360]'
            
            ydl_opts['format'] = format_selector

        # Download with yt-dlp
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info first
            info = ydl.extract_info(request.url, download=False)
            title = info.get('title', 'Unknown')
            
            # Update record with title
            record.title = title
            record.status = "processing"
            db.commit()

            # Send WebSocket update
            await manager.send_progress(download_id, {
                'status': 'processing',
                'progress': 50,
                'title': title
            })

            # Download the media
            ydl.download([request.url])

        # Find the downloaded file
        files = list(Path(output_path).glob('*'))
        if not files:
            raise Exception("No file found after download")

        downloaded_file = files[0]
        file_size = downloaded_file.stat().st_size

        # Update record
        record.status = "completed"
        record.progress = 100.0
        record.file_path = str(downloaded_file)
        record.file_size = file_size
        record.completed_at = datetime.utcnow()
        db.commit()

        # Send completion WebSocket update
        await manager.send_progress(download_id, {
            'status': 'completed',
            'progress': 100,
            'filename': downloaded_file.name,
            'file_size': file_size,
            'download_url': f'/api/download/{download_id}/file'
        })

        logger.info(f"Download completed: {download_id}")

    except Exception as e:
        logger.error(f"Download failed for {download_id}: {e}")
        
        # Update record with error
        record.status = "failed"
        record.error_message = str(e)
        db.commit()

        # Send error WebSocket update
        await manager.send_progress(download_id, {
            'status': 'failed',
            'progress': 0,
            'error': str(e)
        })

    finally:
        db.close()

# Cleanup old files
async def cleanup_old_files():
    """Remove files older than MAX_FILE_AGE_HOURS"""
    try:
        cutoff_time = datetime.utcnow() - timedelta(hours=MAX_FILE_AGE_HOURS)
        
        db = SessionLocal()
        old_records = db.query(DownloadRecord).filter(
            DownloadRecord.completed_at < cutoff_time,
            DownloadRecord.status == "completed"
        ).all()

        for record in old_records:
            if record.file_path and os.path.exists(record.file_path):
                # Remove file
                os.remove(record.file_path)
                # Remove directory if empty
                try:
                    os.rmdir(os.path.dirname(record.file_path))
                except OSError:
                    pass  # Directory not empty
            
            # Remove record from database
            db.delete(record)
        
        db.commit()
        db.close()
        
        logger.info(f"Cleaned up {len(old_records)} old files")
    except Exception as e:
        logger.error(f"Cleanup error: {e}")

# Startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting YouTube Downloader API")
    
    # Schedule cleanup task
    async def periodic_cleanup():
        while True:
            await cleanup_old_files()
            await asyncio.sleep(3600)  # Run every hour
    
    cleanup_task = asyncio.create_task(periodic_cleanup())
    
    yield
    
    # Shutdown
    cleanup_task.cancel()
    logger.info("Shutting down YouTube Downloader API")

# FastAPI app
app = FastAPI(
    title="YouTube Downloader API",
    description="A production-ready YouTube downloader with FastAPI backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to get client IP
def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

# Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.post("/api/download", response_model=DownloadResponse)
async def start_download(
    request: DownloadRequest,
    background_tasks: BackgroundTasks,
    req: Request,
    db: Session = Depends(get_db)
):
    """Start a new download"""
    
    client_ip = get_client_ip(req)
    
    # Rate limiting
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Validate URL
    if not request.url.startswith(('https://www.youtube.com', 'https://youtu.be')):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
    
    # Generate download ID
    download_id = str(uuid.uuid4())
    
    # Create database record
    record = DownloadRecord(
        id=download_id,
        url=request.url,
        type=request.type,
        format=request.format,
        quality=request.quality,
        status="pending",
        ip_address=client_ip
    )
    db.add(record)
    db.commit()
    
    # Start background download
    background_tasks.add_task(download_media, download_id, request, client_ip)
    
    return DownloadResponse(
        download_id=download_id,
        message="Download started successfully"
    )

@app.get("/api/download/{download_id}", response_model=DownloadStatus)
async def get_download_status(download_id: str, db: Session = Depends(get_db)):
    """Get download status"""
    record = db.query(DownloadRecord).filter(DownloadRecord.id == download_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Download not found")
    
    return DownloadStatus(
        id=record.id,
        status=record.status,
        progress=record.progress,
        title=record.title,
        filename=os.path.basename(record.file_path) if record.file_path else None,
        file_size=record.file_size,
        error=record.error_message,
        download_url=f"/api/download/{download_id}/file" if record.status == "completed" else None,
        created_at=record.created_at
    )

@app.get("/api/download/{download_id}/file")
async def download_file(download_id: str, db: Session = Depends(get_db)):
    """Download the completed file"""
    record = db.query(DownloadRecord).filter(DownloadRecord.id == download_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Download not found")
    
    if record.status != "completed":
        raise HTTPException(status_code=400, detail="Download not completed")
    
    if not record.file_path or not os.path.exists(record.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=record.file_path,
        filename=os.path.basename(record.file_path),
        media_type='application/octet-stream'
    )

@app.websocket("/ws/download/{download_id}")
async def websocket_endpoint(websocket: WebSocket, download_id: str):
    """WebSocket endpoint for real-time progress updates"""
    await manager.connect(websocket, download_id)
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(download_id)

@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get download statistics"""
    total_downloads = db.query(DownloadRecord).count()
    completed_downloads = db.query(DownloadRecord).filter(DownloadRecord.status == "completed").count()
    failed_downloads = db.query(DownloadRecord).filter(DownloadRecord.status == "failed").count()
    
    return {
        "total_downloads": total_downloads,
        "completed_downloads": completed_downloads,
        "failed_downloads": failed_downloads,
        "success_rate": (completed_downloads / total_downloads * 100) if total_downloads > 0 else 0
    }

# Analytics tracking model
class AnalyticsEvent(BaseModel):
    event_type: str
    metadata: dict = {}

@app.post("/api/analytics")
async def track_analytics(event: AnalyticsEvent, request: Request):
    """Track analytics events"""
    try:
        client_ip = request.headers.get("x-forwarded-for", request.client.host)
        
        # Log the analytics event
        logger.info(f"Analytics event: {event.event_type} from {client_ip} - {event.metadata}")
        
        # Here you could store analytics data in database or send to external service
        # For now, just log it
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Analytics tracking error: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
