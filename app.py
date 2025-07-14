from flask import Flask, render_template, request, send_file, jsonify, Response
import yt_dlp
import os
import threading
import uuid
import json
import time
import io
import tempfile

app = Flask(__name__)

# Store active downloads and their progress
downloads_progress = {}
downloads_files = {}

class ProgressHook:
    def __init__(self, download_id):
        self.download_id = download_id
        
    def __call__(self, d):
        if d['status'] == 'downloading':
            # Extract progress information
            progress_data = {
                'status': 'downloading',
                'filename': os.path.basename(d.get('filename', 'Unknown')),
                'downloaded_bytes': d.get('downloaded_bytes', 0),
                'total_bytes': d.get('total_bytes', 0),
                'speed': d.get('speed', 0),
                'eta': d.get('eta', 0),
                'percent': d.get('_percent_str', '0%'),
            }
            
            # Calculate percentage if not provided
            if progress_data['total_bytes'] and progress_data['total_bytes'] > 0:
                percent = (progress_data['downloaded_bytes'] / progress_data['total_bytes']) * 100
                progress_data['percent_num'] = round(percent, 1)
            else:
                progress_data['percent_num'] = 0
                
            # Store progress
            downloads_progress[self.download_id] = progress_data
            
        elif d['status'] == 'finished':
            progress_data = {
                'status': 'finished',
                'filename': os.path.basename(d.get('filename', 'Unknown')),
                'percent_num': 100,
                'percent': '100%'
            }
            downloads_progress[self.download_id] = progress_data

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
    """Stream the downloaded file directly to user"""
    if download_id in downloads_files:
        file_info = downloads_files[download_id]
        filename = file_info['filename']
        video_title = file_info.get('video_title', 'video')
        
        if os.path.exists(filename):
            # Get file extension
            _, ext = os.path.splitext(filename)
            # Create a safe filename for download
            clean_title = video_title.replace('/', '_').replace('\\', '_')
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
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Update status
            if retry_count > 0:
                downloads_progress[download_id] = {
                    'status': 'retrying',
                    'message': f'Retrying download (attempt {retry_count + 1}/{max_retries})...'
                }
                time.sleep(2)  # Wait before retry
            else:
                downloads_progress[download_id] = {
                    'status': 'extracting',
                    'message': 'Extracting video information...'
                }
            
            # Use temporary directory
            temp_dir = tempfile.mkdtemp()
            
            # Create progress hook
            progress_hook = ProgressHook(download_id)
            
            ydl_opts = {
                'format': 'best[height<=720]/best',  # Limit quality for faster download
                'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
                'noplaylist': True,
                'progress_hooks': [progress_hook],
                'extractor_retries': 3,
                'fragment_retries': 3,
                'retry_sleep_functions': {'http': lambda n: 2 ** n},
                'http_headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-us,en;q=0.5',
                    'Sec-Fetch-Mode': 'navigate',
                },
                'sleep_interval_requests': 1,
                'sleep_interval_subtitles': 1,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Extract info first
                info = ydl.extract_info(url, download=False)
                video_title = info.get('title', 'Unknown Video')
                
                downloads_progress[download_id] = {
                    'status': 'info_extracted',
                    'video_title': video_title,
                    'message': f'Starting download: {video_title}'
                }
                
                # Now download
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                
                # Store download info
                downloads_files[download_id] = {
                    'filename': filename,
                    'video_title': video_title,
                    'status': 'completed'
                }
                
                downloads_progress[download_id] = {
                    'status': 'completed',
                    'filename': os.path.basename(filename),
                    'video_title': video_title,
                    'message': 'Download completed! Starting automatic download...',
                    'download_url': f'/stream/{download_id}',
                    'auto_download': True
                }
                return  # Success, exit retry loop
                
        except Exception as e:
            error_msg = str(e)
            retry_count += 1
            
            # Check if it's a specific YouTube error
            if 'Video unavailable' in error_msg or 'Private video' in error_msg:
                if retry_count < max_retries:
                    downloads_progress[download_id] = {
                        'status': 'retrying',
                        'message': f'Video access issue, retrying with different settings (attempt {retry_count}/{max_retries})...'
                    }
                    # Try different format on retry
                    continue
                else:
                    downloads_progress[download_id] = {
                        'status': 'error',
                        'message': 'Video unavailable: This might be a private video, geo-blocked content, or temporarily unavailable. Please try a different video.'
                    }
                    return
            elif 'Sign in' in error_msg:
                downloads_progress[download_id] = {
                    'status': 'error',
                    'message': 'This video requires authentication. Please try a public video instead.'
                }
                return
            else:
                if retry_count < max_retries:
                    downloads_progress[download_id] = {
                        'status': 'retrying',
                        'message': f'Connection error, retrying (attempt {retry_count}/{max_retries})...'
                    }
                    continue
                else:
                    downloads_progress[download_id] = {
                        'status': 'error',
                        'message': f'Download failed after {max_retries} attempts: {error_msg}'
                    }
                    return

if __name__ == '__main__':
    # Only run in debug mode when running directly
    app.run(debug=True, host='0.0.0.0', port=8000)
