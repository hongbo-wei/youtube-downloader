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
        
        # 尝试多种配置以绕过云端限制
        config_attempts = [
            {
                # 配置1: 最新浏览器模拟 + OAuth策略
                'format': 'best[height<=720][ext=mp4]/best[ext=mp4]/best',
                'merge_output_format': 'mp4',
                'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
                'noplaylist': True,
                'progress_hooks': [progress_hook],
                'rm_cachedir': True,
                'no_cache_dir': True,
                'overwrites': True,
                'age_limit': None,
                'geo_bypass': True,
                'geo_bypass_country': 'US',
                'socket_timeout': 30,
                'retries': 3,
                'fragment_retries': 3,
                'http_headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"Windows"',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Cache-Control': 'max-age=0',
                },
                'extractor_args': {
                    'youtube': {
                        'skip': ['hls', 'dash'],
                        'player_skip': ['js'],
                        'player_client': ['android', 'web'],
                    }
                },
            },
            {
                # 配置2: Android客户端模拟
                'format': 'best[height<=480][ext=mp4]/worst[ext=mp4]/worst',
                'merge_output_format': 'mp4',
                'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
                'noplaylist': True,
                'progress_hooks': [progress_hook],
                'rm_cachedir': True,
                'no_cache_dir': True,
                'overwrites': True,
                'geo_bypass': True,
                'socket_timeout': 20,
                'http_headers': {
                    'User-Agent': 'com.google.android.youtube/19.29.37 (Linux; U; Android 11; SM-G973F Build/RP1A.200720.012) gzip',
                    'X-YouTube-Client-Name': '3',
                    'X-YouTube-Client-Version': '19.29.37',
                },
                'extractor_args': {
                    'youtube': {
                        'player_client': ['android'],
                        'skip': ['webpage'],
                    }
                },
            },
            {
                # 配置3: iOS客户端模拟
                'format': 'worst[ext=mp4]/worst',
                'merge_output_format': 'mp4',
                'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
                'noplaylist': True,
                'progress_hooks': [progress_hook],
                'rm_cachedir': True,
                'no_cache_dir': True,
                'overwrites': True,
                'geo_bypass': True,
                'http_headers': {
                    'User-Agent': 'com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X)',
                    'X-YouTube-Client-Name': '5',
                    'X-YouTube-Client-Version': '19.29.1',
                },
                'extractor_args': {
                    'youtube': {
                        'player_client': ['ios'],
                        'skip': ['webpage'],
                    }
                },
            }
        ]
        
        last_error = None
        for i, ydl_opts in enumerate(config_attempts):
            try:
                downloads_progress[download_id] = {
                    'status': 'starting',
                    'message': f'Trying method {i+1}/3: {"Browser" if i==0 else "Android" if i==1 else "iOS"} mode...'
                }
                
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    # Extract video info first to get the title
                    info = ydl.extract_info(url, download=False)
                    video_title = info.get('title', 'Unknown Video')
                    
                    # Check if video is available
                    if not info.get('formats') and not info.get('url'):
                        raise Exception("Video has no available formats")
                    
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
                    print(f"✅ Success with method {i+1}: {video_title}")
                    return  # 成功，退出函数
                    
            except Exception as e:
                error_msg = str(e)
                print(f"❌ Method {i+1} failed: {error_msg}")
                
                # 检查是否是特定的YouTube错误
                if any(keyword in error_msg.lower() for keyword in [
                    'video unavailable', 'private video', 'removed', 'deleted',
                    'sign in to confirm', 'not available', 'blocked'
                ]):
                    last_error = f"YouTube Error: {error_msg}"
                    if i == len(config_attempts) - 1:  # 最后一次尝试
                        break
                else:
                    last_error = error_msg
                
                continue
        
        # 所有配置都失败了
        downloads_progress[download_id] = {
            'status': 'error',
            'message': f'❌ All download methods failed. YouTube may be blocking this server IP. Error: {last_error}. 💡 For reliable downloads, clone and run locally: https://github.com/hongbo-wei/youtube-downloader'
        }
            
    except Exception as e:
        downloads_progress[download_id] = {
            'status': 'error',
            'message': f'Error: {str(e)}'
        }
        print(f"Download {download_id}: Error - {str(e)}")

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
