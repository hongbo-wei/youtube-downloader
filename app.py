from flask import Flask, render_template, request, jsonify, Response
import yt_dlp
import os
import threading
import uuid
import tempfile
import socket
import requests

app = Flask(__name__)

# Store active downloads and their progress
downloads_progress = {}
downloads_files = {}

class ProgressHook:
    def __init__(self, download_id, video_title=None):
        self.download_id = download_id
        self.video_title = video_title
        
    def __call__(self, d):
        if d['status'] == 'downloading':
            # Calculate percentage if not provided
            percent_num = 0
            if d.get('total_bytes') and d.get('downloaded_bytes'):
                percent_num = (d.get('downloaded_bytes', 0) / d.get('total_bytes', 1)) * 100
            
            progress_data = {
                'status': 'downloading',
                'percent': d.get('_percent_str', '0%').replace('[0;94m', '').replace('[0m', '').strip(),
                'percent_num': round(percent_num, 1),
                'speed': d.get('speed', 0),
                'eta': d.get('eta', 0),
                'downloaded_bytes': d.get('downloaded_bytes', 0),
                'total_bytes': d.get('total_bytes', 0),
                'video_title': self.video_title,
            }
            downloads_progress[self.download_id] = progress_data
            
            # Format speed for display
            speed_str = ""
            if progress_data['speed']:
                if progress_data['speed'] > 1024*1024:
                    speed_str = f"{progress_data['speed']/(1024*1024):.1f}MB/s"
                elif progress_data['speed'] > 1024:
                    speed_str = f"{progress_data['speed']/1024:.1f}KB/s"
                else:
                    speed_str = f"{progress_data['speed']:.1f}B/s"
            
            # Format ETA for display
            eta_str = ""
            if progress_data['eta']:
                eta_min = int(progress_data['eta']) // 60
                eta_sec = int(progress_data['eta']) % 60
                eta_str = f"ETA: {eta_min:02d}:{eta_sec:02d}"
            
            print(f"Download {self.download_id}: {progress_data['percent']} - {speed_str} - {eta_str}")
            
        elif d['status'] == 'finished':
            progress_data = {
                'status': 'finished',
                'percent': '100%',
                'percent_num': 100
            }
            downloads_progress[self.download_id] = progress_data
            print(f"Download {self.download_id}: Completed!")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/download', methods=['POST'])
def download():
    url = request.form['url']
    download_id = str(uuid.uuid4())
    
    # Initialize progress
    downloads_progress[download_id] = {
        'status': 'starting',
        'message': 'Starting download...'
    }
    
    # Start download in background thread
    thread = threading.Thread(target=download_youtube_video, args=(url, download_id))
    thread.daemon = True
    thread.start()
    
    return jsonify({'download_id': download_id, 'status': 'started'})

@app.route('/progress/<download_id>')
def get_progress(download_id):
    """Get download progress for a specific download ID"""
    progress = downloads_progress.get(download_id, {'status': 'not_found'})
    return jsonify(progress)

@app.route('/stream/<download_id>')
def stream_file(download_id):
    """Stream the downloaded file directly to user's browser"""
    if download_id in downloads_files:
        file_info = downloads_files[download_id]
        filename = file_info['filename']
        video_title = file_info.get('video_title', 'video')
        
        if os.path.exists(filename):
            # Get file extension
            _, ext = os.path.splitext(filename)
            # Create a safe filename for download
            clean_title = video_title.replace('/', '_').replace('\\', '_').replace(':', '_').replace('?', '_').replace('*', '_').replace('"', '_').replace('<', '_').replace('>', '_').replace('|', '_')
            safe_filename = f"{clean_title}{ext}"
            
            def generate():
                with open(filename, 'rb') as f:
                    while True:
                        data = f.read(4096)  # Read in chunks
                        if not data:
                            break
                        yield data
                # Clean up file after streaming
                try:
                    os.remove(filename)
                    # Clean up temp directory if empty
                    temp_dir = os.path.dirname(filename)
                    if os.path.exists(temp_dir) and not os.listdir(temp_dir):
                        os.rmdir(temp_dir)
                except:
                    pass
            
            return Response(
                generate(),
                mimetype='application/octet-stream',
                headers={
                    'Content-Disposition': f'attachment; filename="{safe_filename}"',
                    'Content-Type': 'application/octet-stream'
                }
            )
    
    return "File not found", 404

def download_youtube_video(url, download_id):
    try:
        # Create temporary directory for this download
        temp_dir = tempfile.mkdtemp()
        
        # Update status
        downloads_progress[download_id] = {
            'status': 'starting',
            'message': 'Starting download...'
        }
        
        # Create progress hook
        progress_hook = ProgressHook(download_id)
        
        # Try different format options in order of preference
        format_options = [
            'best[ext=mp4]/best',  # First try best quality
            'best[height<=720][ext=mp4]/best[height<=720]',  # Then try 720p max
            'best[height<=480][ext=mp4]/best[height<=480]',  # Then try 480p max
            'worst[ext=mp4]/worst'  # Finally try worst quality
        ]
        
        last_error = None
        for i, format_selector in enumerate(format_options):
            try:
                # Update status with current attempt
                downloads_progress[download_id] = {
                    'status': 'starting',
                    'message': f'Trying quality option {i+1}/{len(format_options)}...'
                }
                
                # Simple, reliable configuration with better error handling
                ydl_opts = {
                    'format': format_selector,
                    'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
                    'noplaylist': True,
                    'progress_hooks': [progress_hook],
                    'no_cache_dir': True,
                    'extract_flat': False,
                    'retries': 5,
                    'fragment_retries': 5,
                    'socket_timeout': 30,
                    'http_chunk_size': 10485760,  # 10MB chunks
                }
                
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    # Extract video info first to get the title
                    info = ydl.extract_info(url, download=False)
                    video_title = info.get('title', 'Unknown Video')
                    
                    # Update progress hook with video title
                    progress_hook.video_title = video_title
                    
                    # Update progress with video title
                    downloads_progress[download_id] = {
                        'status': 'info_extracted',
                        'video_title': video_title,
                        'message': f'Found video: {video_title[:50]}{"..." if len(video_title) > 50 else ""}'
                    }
                    
                    # Now download to temporary directory
                    info = ydl.extract_info(url, download=True)
                    filename = ydl.prepare_filename(info)
                    
                    # Verify file was created and has content
                    if not os.path.exists(filename) or os.path.getsize(filename) < 1024:
                        raise Exception("Downloaded file is empty or corrupted")
                    
                    # Store download info for streaming
                    downloads_files[download_id] = {
                        'filename': filename,
                        'video_title': video_title,
                        'status': 'completed'
                    }
                    
                    downloads_progress[download_id] = {
                        'status': 'completed',
                        'video_title': video_title,
                        'message': 'Download completed! Starting automatic download...',
                        'download_url': f'/stream/{download_id}',
                        'auto_download': True
                    }
                    print(f"✅ Download completed: {video_title}")
                    return  # Success, exit function
                    
            except Exception as e:
                last_error = str(e)
                print(f"❌ Format option {i+1} failed: {last_error}")
                continue
        
        # All format options failed
        error_msg = last_error or "All download attempts failed"
        
        # Provide more specific error messages
        if "bytes read" in error_msg and "more expected" in error_msg:
            error_msg = "Download interrupted - network connection lost. Please try again."
        elif "Video unavailable" in error_msg:
            error_msg = "Video is unavailable or private"
        elif "Sign in to confirm" in error_msg:
            error_msg = "Video requires sign-in to confirm age"
        elif "blocked" in error_msg.lower():
            error_msg = "Video is blocked in your region"
        
        downloads_progress[download_id] = {
            'status': 'error',
            'message': f'Error: {error_msg}'
        }
        print(f"Download {download_id}: Error - {error_msg}")
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Download failed: {error_msg}")
        
        # Provide more specific error messages
        if "bytes read" in error_msg and "more expected" in error_msg:
            error_msg = "Download interrupted - network connection lost. Please try again."
        elif "Video unavailable" in error_msg:
            error_msg = "Video is unavailable or private"
        elif "Sign in to confirm" in error_msg:
            error_msg = "Video requires sign-in to confirm age"
        elif "blocked" in error_msg.lower():
            error_msg = "Video is blocked in your region"
        
        downloads_progress[download_id] = {
            'status': 'error',
            'message': f'Error: {error_msg}'
        }
        print(f"Download {download_id}: Error - {error_msg}")

@app.route('/health')
def health_check():
    """诊断端点，检查服务器状态"""
    try:
        # 检查服务器 IP
        ip_response = requests.get('https://api.ipify.org', timeout=5)
        server_ip = ip_response.text.strip()
        
        # 检查是否能访问 YouTube
        youtube_accessible = True
        youtube_error = None
        try:
            response = requests.get('https://www.youtube.com', timeout=10)
            if response.status_code != 200:
                youtube_accessible = False
                youtube_error = f"HTTP {response.status_code}"
        except Exception as e:
            youtube_accessible = False
            youtube_error = str(e)
        
        return jsonify({
            'status': 'healthy',
            'server_ip': server_ip,
            'youtube_accessible': youtube_accessible,
            'youtube_error': youtube_error,
            'environment': 'cloud' if server_ip and not server_ip.startswith(('192.168.', '10.', '172.')) else 'local'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Only run in debug mode when running directly
    app.run(debug=True, host='0.0.0.0', port=8000)
