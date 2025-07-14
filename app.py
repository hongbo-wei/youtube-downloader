from flask import Flask, render_template, request, send_file, jsonify, session
import yt_dlp
import os
import threading
import uuid
import json
import time

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

def download_youtube_video(url, download_id):
    try:
        # Update status
        downloads_progress[download_id] = {
            'status': 'extracting',
            'message': 'Extracting video information...'
        }
        
        os.makedirs('downloads', exist_ok=True)
        
        # Create progress hook
        progress_hook = ProgressHook(download_id)
        
        ydl_opts = {
            'format': 'best',
            'outtmpl': 'downloads/%(title)s.%(ext)s',
            'noplaylist': True,
            'progress_hooks': [progress_hook],
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
                'message': 'Download completed successfully!',
                'download_url': f'/get_file/{download_id}'
            }
            
    except Exception as e:
        downloads_progress[download_id] = {
            'status': 'error',
            'message': f'Error: {str(e)}'
        }

@app.route('/get_file/<download_id>')
def get_file(download_id):
    if download_id in downloads_files:
        filename = downloads_files[download_id]['filename']
        if os.path.exists(filename):
            return send_file(filename, as_attachment=True)
    return "File not found", 404

if __name__ == '__main__':
    # Only run in debug mode when running directly
    app.run(debug=True, host='0.0.0.0', port=8000)
