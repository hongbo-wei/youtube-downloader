#!/usr/bin/env python3
"""
Test script for YouTube Downloader features
Tests basic functionality without requiring external dependencies
"""

import unittest
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

class TestYouTubeDownloader(unittest.TestCase):
    """Basic tests for YouTube Downloader functionality"""
    
    def test_download_directory_creation(self):
        """Test that download directory can be created"""
        test_dir = Path("test_downloads")
        test_dir.mkdir(exist_ok=True)
        self.assertTrue(test_dir.exists())
        test_dir.rmdir()  # Cleanup
    
    def test_environment_variables(self):
        """Test that environment variables are properly handled"""
        # Test default values
        from main import DOWNLOAD_DIR, MAX_FILE_AGE_HOURS, RATE_LIMIT_PER_MINUTE
        
        self.assertIsInstance(DOWNLOAD_DIR, str)
        self.assertIsInstance(MAX_FILE_AGE_HOURS, int)
        self.assertIsInstance(RATE_LIMIT_PER_MINUTE, int)
        
        # Test that defaults are reasonable
        self.assertGreater(MAX_FILE_AGE_HOURS, 0)
        self.assertGreater(RATE_LIMIT_PER_MINUTE, 0)
    
    def test_youtube_url_validation(self):
        """Test YouTube URL validation patterns"""
        valid_urls = [
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://youtube.com/watch?v=dQw4w9WgXcQ",
            "https://youtu.be/dQw4w9WgXcQ",
            "http://www.youtube.com/watch?v=dQw4w9WgXcQ"
        ]
        
        invalid_urls = [
            "https://example.com/video",
            "not-a-url",
            "",
            "https://youtube.com"
        ]
        
        import re
        youtube_regex = re.compile(r'^(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/)')
        
        for url in valid_urls:
            self.assertTrue(youtube_regex.match(url), f"Should match: {url}")
        
        for url in invalid_urls:
            self.assertFalse(youtube_regex.match(url), f"Should not match: {url}")

class TestBasicFunctionality(unittest.TestCase):
    """Test basic application functionality"""
    
    def test_imports(self):
        """Test that all required modules can be imported"""
        try:
            import fastapi
            import sqlalchemy
            import pydantic
        except ImportError as e:
            self.skipTest(f"Required dependencies not installed: {e}")
    
    def test_file_structure(self):
        """Test that required files exist"""
        required_files = [
            "backend/main.py",
            "backend/Dockerfile",
            "backend/requirements.txt",
            "frontend/package.json",
            "frontend/Dockerfile",
            "docker-compose.yml"
        ]
        
        for file_path in required_files:
            self.assertTrue(Path(file_path).exists(), f"Required file missing: {file_path}")

def run_basic_tests():
    """Run basic tests that don't require external dependencies"""
    print("🧪 Running YouTube Downloader Tests...")
    print("=" * 50)
    
    # Run the tests
    unittest.main(argv=[''], exit=False, verbosity=2)

if __name__ == "__main__":
    run_basic_tests()
