from flask import Flask, render_template, request, jsonify, Response
import yt_dlp
import os
import threading
import uuid
import tempfile

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
        
        # Configuration for server-based downloading with streaming
        ydl_opts = {
            'format': 'best[ext=mp4]/best',  # Prefer mp4 format for better compatibility
            'merge_output_format': 'mp4',
            'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
            'noplaylist': True,
            'progress_hooks': [progress_hook],
            # Clear cache to allow re-downloading deleted files
            'rm_cachedir': True,
            'no_cache_dir': True,
            # Force overwrite if file exists
            'overwrites': True,
            # Ensure QuickTime compatibility
            'postprocessors': [{
                'key': 'FFmpegVideoConvertor',
                'preferedformat': 'mp4',
            }],
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
                'message': f'Starting download: {video_title}'
            }
            
            # Now download to temporary directory
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            
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
            
    except Exception as e:
        downloads_progress[download_id] = {
            'status': 'error',
            'message': f'Error: {str(e)}'
        }
        print(f"Download {download_id}: Error - {str(e)}")

if __name__ == '__main__':
    # Only run in debug mode when running directly
    app.run(debug=True, host='0.0.0.0', port=8000)
