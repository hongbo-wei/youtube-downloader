# Render.com Deployment Configuration

## Service Configuration
- **Service Type**: Web Service
- **Environment**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn --config gunicorn.conf.py wsgi:app`

## Environment Variables
Set these in Render dashboard:
- `PYTHON_VERSION`: 3.11
- `PORT`: (automatically set by Render)

## Auto-Deploy
- ✅ Connected to GitHub repository
- ✅ Auto-deploy from main branch
- ✅ Build on every push

## URLs
- Development: http://127.0.0.1:8000
- Production: https://your-app-name.onrender.com

## Notes
- The app will automatically use the PORT environment variable provided by Render
- Downloads folder will be created automatically
- Progress bar works via AJAX polling (no WebSocket needed)
