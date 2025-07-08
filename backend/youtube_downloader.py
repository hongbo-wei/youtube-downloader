#!/usr/bin/env python3
"""
YouTube Audio/Video Downloader
A simple script to download audio or video from YouTube videos using yt-dlp
Supports downloading audio and video with customizable formats and quality
"""

import os
import sys
from pathlib import Path

try:
    import yt_dlp
except ImportError:
    print("yt-dlp is not installed. Please install it with: pip install yt-dlp")
    sys.exit(1)


def download_audio(url, output_dir="downloads", audio_format="mp3", quality="192", keep_video=False):
    """
    Download audio from a YouTube video
    
    Args:
        url (str): YouTube video URL
        output_dir (str): Directory to save the audio file
        audio_format (str): Audio format (mp3, wav, m4a, etc.)
        quality (str): Audio quality in kbps (96, 128, 192, 320)
        keep_video (bool): Whether to keep the original video file after audio extraction
    """
    
    # Create output directory if it doesn't exist
    Path(output_dir).mkdir(exist_ok=True)
    
    # Configure yt-dlp options
    ydl_opts = {
        'format': 'bestaudio/best',  # Download best quality audio
        'outtmpl': f'{output_dir}/%(title)s.%(ext)s',  # Output filename template
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': audio_format,
            'preferredquality': quality,  # Audio quality in kbps
        }],
        'extractaudio': True,
        'audioformat': audio_format,
        'embed_subs': False,
        'writesubtitles': False,
        'keepvideo': keep_video,  # Keep original video file if requested
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"Downloading audio from: {url}")
            print(f"Output directory: {os.path.abspath(output_dir)}")
            print(f"Audio format: {audio_format}")
            print(f"Audio quality: {quality} kbps")
            if keep_video:
                print("Note: Original video file will be preserved")
            else:
                print("Note: Original video file will be deleted after audio extraction")
            print("-" * 50)
            
            # Download the audio
            ydl.download([url])
            
            print("-" * 50)
            print("Download completed successfully!")
            
    except yt_dlp.DownloadError as e:
        print(f"Download error: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")


def download_video(url, output_dir="downloads", video_format="mp4", quality="720p"):
    """
    Download video from a YouTube video
    
    Args:
        url (str): YouTube video URL
        output_dir (str): Directory to save the video file
        video_format (str): Video format (mp4, mkv, webm, etc.)
        quality (str): Video quality (720p, 1080p, 480p, best, worst)
    """
    
    # Create output directory if it doesn't exist
    Path(output_dir).mkdir(exist_ok=True)
    
    # Configure quality format
    if quality.lower() == 'best':
        format_selector = 'best[ext=mp4]/best'
    elif quality.lower() == 'worst':
        format_selector = 'worst[ext=mp4]/worst'
    else:
        # Extract resolution number (e.g., "720" from "720p")
        resolution = quality.replace('p', '')
        format_selector = f'best[height<={resolution}][ext=mp4]/best[height<={resolution}]/best'
    
    # Configure yt-dlp options for video
    ydl_opts = {
        'format': format_selector,
        'outtmpl': f'{output_dir}/%(title)s.%(ext)s',  # Output filename template
        'writesubtitles': False,
        'writeautomaticsub': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"Downloading video from: {url}")
            print(f"Output directory: {os.path.abspath(output_dir)}")
            print(f"Video format: {video_format}")
            print(f"Video quality: {quality}")
            print("-" * 50)
            
            # Download the video
            ydl.download([url])
            
            print("-" * 50)
            print("Video download completed successfully!")
            
    except yt_dlp.DownloadError as e:
        print(f"Download error: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")


def show_help():
    """Display usage help"""
    help_text = """
YouTube Audio/Video Downloader Usage Guide

Usage:
    python youtube_downloader.py [URL] [output_dir] [format] [type] [quality] [keep_video]

Parameters:
    URL          - YouTube video link (optional, has default value)
    output_dir   - Directory to save files (default: downloads)
    format       - Audio formats: mp3, wav, m4a OR Video formats: mp4, mkv, webm (default: mp3)
    type         - 'audio' or 'video' (default: audio)
    quality      - Audio: 96, 128, 192, 320 (kbps) OR Video: 480p, 720p, 1080p, best, worst (default: 192 for audio, 720p for video)
    keep_video   - For audio downloads: 'keep' to preserve original video file (default: delete)

Examples:
    # Download audio (default)
    python youtube_downloader.py
    
    # Download specified URL audio as mp3 format
    python youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" downloads mp3 audio 192
    
    # Download video as 720p mp4 format
    python youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" downloads mp4 video 720p
    
    # Download highest quality video
    python youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" downloads mp4 video best
    
    # Download audio and keep original video file
    python youtube_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID" downloads mp3 audio 192 keep
    
    # Show help
    python youtube_downloader.py --help
"""
    print(help_text)


def main():
    """Main function to handle command line arguments and run the downloader"""
    
    # Check for help flag
    if len(sys.argv) > 1 and sys.argv[1] in ['--help', '-h', 'help']:
        show_help()
        return
    
    # Default YouTube URL (the one you provided)
    default_url = "https://www.youtube.com/watch?v=2bYtFBJajI0"
    
    # Get URL from command line argument or use default
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        url = default_url
        print(f"No URL provided, using default: {url}")
    
    # Get output directory from command line or use default
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "downloads"
    
    # Get format from command line or use default
    file_format = sys.argv[3] if len(sys.argv) > 3 else "mp3"
    
    # Get download type from command line or use default
    download_type = sys.argv[4] if len(sys.argv) > 4 else "audio"
    
    # Get quality from command line or use default
    if download_type.lower() == "video":
        quality = sys.argv[5] if len(sys.argv) > 5 else "720p"
    else:
        quality = sys.argv[5] if len(sys.argv) > 5 else "192"
    
    # Get keep_video flag for audio downloads
    keep_video = False
    if len(sys.argv) > 6 and sys.argv[6].lower() == "keep":
        keep_video = True
    
    print("YouTube Audio/Video Downloader")
    print("=" * 35)
    print(f"Download type: {'Video' if download_type.lower() == 'video' else 'Audio'}")
    if download_type.lower() == "audio" and keep_video:
        print("Note: Original video file will be kept after audio extraction")
    
    # Validate URL
    if not url.startswith(('http://', 'https://')):
        print("Error: Please provide a valid URL starting with http:// or https://")
        sys.exit(1)
    
    # Download based on type
    if download_type.lower() == "video":
        download_video(url, output_dir, file_format, quality)
    elif download_type.lower() == "audio":
        download_audio(url, output_dir, file_format, quality, keep_video)
    else:
        print("Error: Invalid type specified. Use 'audio' or 'video'.")
        print("Run with --help to see usage instructions.")
        sys.exit(1)


if __name__ == "__main__":
    # If --help is in the arguments, show help and exit
    if "--help" in sys.argv:
        show_help()
        sys.exit(0)
    
    main()
