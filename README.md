# 📺 YouTube Downloader

A simple, modern web application for downloading YouTube videos with a clean interface and robust cloud deployment support.

![YouTube Downloader](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

- 🎯 **Simple Interface**: Clean, modern UI with minimal design
- 📊 **Real-time Progress**: Dynamic progress bar with color indication
- 🔄 **Multiple Fallbacks**: Browser, Android, and iOS client simulation
- 🛡️ **Anti-Detection**: Advanced techniques to bypass YouTube restrictions
- 🌐 **Cloud Ready**: Optimized for cloud deployment (Render, Heroku, etc.)
- 📱 **Responsive**: Works on desktop and mobile devices
- 🔍 **Diagnostics**: Built-in server status checking

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/hongbo-wei/youtube-downloader.git
   cd youtube-downloader
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Open your browser**
   ```
   http://localhost:8000
   ```

### 🌐 Cloud Deployment

#### Render.com (Recommended)
1. Fork this repository
2. Connect to Render.com
3. Create a new Web Service
4. Use these settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --config gunicorn.conf.py wsgi:app`
   - **Environment**: `Python 3`

#### Other Platforms
- **Heroku**: Use the included `Procfile`
- **Railway**: Auto-detects Python and uses `Procfile`
- **DigitalOcean**: Use the production deployment guide below

## 🏗️ Project Structure

```
youtube-downloader/
├── app.py                 # Main Flask application
├── wsgi.py               # WSGI entry point
├── requirements.txt      # Python dependencies
├── runtime.txt          # Python version
├── Procfile             # Process file for cloud platforms
├── gunicorn.conf.py     # Gunicorn configuration
├── templates/
│   └── index.html       # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css    # Application styles
│   └── js/
│       └── app.js       # Application JavaScript
└── downloads/           # Temporary download storage
```

## 🛠️ Production Deployment

### Using Systemd (Linux)
```bash
sudo cp youtube-downloader.service /etc/systemd/system/
sudo systemctl enable youtube-downloader
sudo systemctl start youtube-downloader
```

### Using Nginx (Reverse Proxy)
```bash
sudo cp nginx.conf /etc/nginx/sites-available/youtube-downloader
sudo ln -s /etc/nginx/sites-available/youtube-downloader /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

### Quick Deploy Script
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🐛 Troubleshooting

### Common Issues

**"Video unavailable" errors**
- This usually happens on cloud servers due to YouTube's IP blocking
- Solution: Run locally or try the diagnostic tool

**Static files not loading**
- Check if CSS/JS files exist in `static/` folder
- Verify Flask static file configuration
- Clear browser cache

**Port already in use**
- Change port in `app.py` or `gunicorn.conf.py`
- Kill existing processes: `pkill -f python`

### Diagnostic Tools
- Use the "🔍 Check Status" button in the app
- Check server logs for detailed error information
- Test endpoints manually

## 🆘 Support

Having issues? Here are your options:

1. **Check this README** - Most common issues are covered here
2. **Use the diagnostic tool** - Built into the app
3. **Run locally** - Most reliable for consistent downloads
4. **Open an issue** - For bugs or feature requests

## 📄 License

This project is licensed under the MIT License.

---

**Note**: YouTube may block cloud server IPs. For the most reliable experience, clone and run locally.
