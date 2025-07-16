from flask import Flask, render_template, request, send_file, jsonify
import yt_dlp
import os
import tempfile
import threading
import uuid

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
            
            percent = d.get('_percent_str', '0%').replace('[0;94m', '').replace('[0m', '').strip()
            
            progress_data = {
                'status': 'downloading',
                'percent': percent,
                'percent_num': round(percent_num, 1),
                'speed': d.get('speed', 0),
                'eta': d.get('eta', 0),
                'downloaded_bytes': d.get('downloaded_bytes', 0),
                'total_bytes': d.get('total_bytes', 0),
                'video_title': self.video_title,
                'message': f'Downloading... {percent}'
            }
            downloads_progress[self.download_id] = progress_data
            
        elif d['status'] == 'finished':
            downloads_progress[self.download_id] = {
                'status': 'finished',
                'percent': '100%',
                'percent_num': 100,
                'message': 'Download completed!'
            }

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
            # Clean up after sending
            def cleanup():
                try:
                    os.remove(filename)
                    temp_dir = os.path.dirname(filename)
                    if os.path.exists(temp_dir) and not os.listdir(temp_dir):
                        os.rmdir(temp_dir)
                except:
                    pass
            
            # Send file and cleanup
            response = send_file(filename, as_attachment=True, download_name=f"{video_title}.mp4")
            threading.Thread(target=cleanup).start()
            return response
    
    return "File not found", 404

def download_youtube_video(url, download_id):
    try:
        # Create temporary directory for this download
        temp_dir = tempfile.mkdtemp()
        
        # Create progress hook
        progress_hook = ProgressHook(download_id)
        
        # Simple, reliable configuration - back to basics
        ydl_opts = {
            'format': 'best',  # Just use best available format
            'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
            'noplaylist': True,
            'progress_hooks': [progress_hook],
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract video info first
            info = ydl.extract_info(url, download=False)
            video_title = info.get('title', 'Unknown Video')
            
            # Update progress hook with video title
            progress_hook.video_title = video_title
            
            # Update progress
            downloads_progress[download_id] = {
                'status': 'info_extracted',
                'video_title': video_title,
                'message': f'Found video: {video_title[:50]}{"..." if len(video_title) > 50 else ""}'
            }
            
            # Now download
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            
            # Verify file exists
            if not os.path.exists(filename):
                raise Exception("Downloaded file not found")
            
            # Store download info
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
        error_msg = str(e)
        
        # Provide user-friendly error messages
        if "Video unavailable" in error_msg or "content isn't available" in error_msg:
            error_msg = "Video is unavailable, private, or blocked in your region. Please try a different video."
        elif "Sign in to confirm" in error_msg:
            error_msg = "Video requires sign-in to confirm age. Please try a different video."
        elif "blocked" in error_msg.lower():
            error_msg = "Video is blocked in your region. Please try a different video."
        elif "Private video" in error_msg:
            error_msg = "This is a private video. Please try a public video."
        
        downloads_progress[download_id] = {
            'status': 'error',
            'message': f'Error: {error_msg}'
        }
        print(f"Download {download_id}: Error - {error_msg}")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
