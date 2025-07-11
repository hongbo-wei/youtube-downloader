# YouTube Downloader Production Deployment Guide

## Overview
This guide will help you deploy the YouTube Downloader application to a production server using Gunicorn as the WSGI server.

## Prerequisites
- Python 3.8+
- Virtual environment (recommended)
- Linux/Unix server (Ubuntu/CentOS/RHEL)
- Nginx (optional, for reverse proxy)

## Quick Start

### 1. Setup the Application
```bash
# Make the deployment script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

### 2. Start the Production Server
```bash
# Option 1: Using the configuration file
gunicorn --config gunicorn.conf.py wsgi:app

# Option 2: With custom parameters
gunicorn --bind 0.0.0.0:8000 --workers 4 wsgi:app

# Option 3: Run in background
nohup gunicorn --config gunicorn.conf.py wsgi:app &
```

### 3. Access the Application
- The application will be available at `http://your-server-ip:8000`
- If using nginx, it will be available at `http://your-domain.com`

## Advanced Deployment Options

### Option 1: Using Systemd (Recommended)
1. Copy the service file:
   ```bash
   sudo cp youtube-downloader.service /etc/systemd/system/
   ```

2. Edit the service file and update the paths:
   ```bash
   sudo nano /etc/systemd/system/youtube-downloader.service
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable youtube-downloader
   sudo systemctl start youtube-downloader
   ```

4. Check the status:
   ```bash
   sudo systemctl status youtube-downloader
   ```

### Option 2: Using Nginx Reverse Proxy
1. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Copy the configuration:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/youtube-downloader
   ```

3. Edit the configuration and update paths/domain:
   ```bash
   sudo nano /etc/nginx/sites-available/youtube-downloader
   ```

4. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/youtube-downloader /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Configuration Options

### Gunicorn Configuration
Edit `gunicorn.conf.py` to customize:
- `bind`: IP and port to bind to
- `workers`: Number of worker processes
- `timeout`: Request timeout
- `max_requests`: Maximum requests per worker

### Environment Variables
Set these environment variables for production:
```bash
export FLASK_ENV=production
export FLASK_DEBUG=False
```

## Security Considerations

1. **File Permissions**: Ensure proper file permissions
2. **Firewall**: Configure firewall to allow only necessary ports
3. **SSL/TLS**: Use HTTPS in production (configure SSL certificates)
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **User Permissions**: Run the application with limited user privileges

## Monitoring and Logs

### View Application Logs
```bash
# If using systemd
sudo journalctl -u youtube-downloader -f

# If running manually
tail -f /var/log/gunicorn/access.log
```

### Check Process Status
```bash
# Check if gunicorn is running
ps aux | grep gunicorn

# Check port usage
netstat -tlnp | grep 8000
```

## Troubleshooting

### Common Issues
1. **Port already in use**: Change the port in `gunicorn.conf.py`
2. **Permission denied**: Check file permissions and user privileges
3. **Module not found**: Ensure virtual environment is activated
4. **Downloads not working**: Check downloads directory permissions

### Health Check
```bash
# Test the application
curl http://localhost:8000/

# Check response headers
curl -I http://localhost:8000/
```

## Scaling

### Horizontal Scaling
- Use multiple servers behind a load balancer
- Shared storage for downloads (NFS, S3, etc.)

### Vertical Scaling
- Increase worker count based on CPU cores
- Adjust memory settings
- Use async workers for better concurrency

## Backup and Maintenance

### Regular Maintenance
1. Update dependencies regularly
2. Monitor disk space (downloads directory)
3. Implement log rotation
4. Monitor system resources

### Backup Strategy
- Application code (version control)
- Configuration files
- Downloaded files (if needed)
- Database (if added later)

## Performance Optimization

1. **Use a CDN** for static files
2. **Enable gzip compression** in Nginx
3. **Implement caching** for frequently accessed content
4. **Monitor resource usage** and adjust worker count
5. **Use async workers** for I/O intensive operations

## Support

For issues and support:
- Check the logs first
- Review the configuration
- Test with a minimal setup
- Check system resources
