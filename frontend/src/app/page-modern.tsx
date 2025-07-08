'use client';

import { useState, useEffect } from 'react';
import DownloadForm from '@/components/DownloadForm';
import DownloadProgress from '@/components/DownloadProgress';
import DownloadHistory from '@/components/DownloadHistory';
import { useDownloadStore } from '@/stores/downloadStore';

export default function HomePage() {
  const [currentDownloadId, setCurrentDownloadId] = useState<string | null>(null);
  const { downloads, currentDownload } = useDownloadStore();

  // Handle new download start
  const handleDownloadStart = (downloadId: string) => {
    setCurrentDownloadId(downloadId);
  };

  // Auto-hide current download when completed
  useEffect(() => {
    if (currentDownload && 
        (currentDownload.status === 'completed' || currentDownload.status === 'failed')) {
      const timer = setTimeout(() => {
        setCurrentDownloadId(null);
      }, 10000); // Hide after 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [currentDownload?.status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-8 -left-4 w-32 h-32 bg-gradient-to-br from-pink-400 to-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-block mb-6">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg transform hover:scale-105 transition-transform duration-200">
              ✨ Free & Fast Downloads
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-6 animate-gradient">
            YouTube Downloader
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transform your favorite YouTube content into high-quality downloads.
            <span className="block mt-2 text-lg text-blue-600 font-medium">Fast • Reliable • Beautiful</span>
          </p>
        </div>

        {/* Ad Banner - Top */}
        <div className="mb-12 animate-fade-in-up animation-delay-200">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-2xl">💰</span>
              <p className="text-gray-600 font-medium">Premium Advertisement Space</p>
            </div>
            <p className="text-gray-500 text-sm">728x90 • Google AdSense Banner</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Download Form */}
          <div className="animate-fade-in-up animation-delay-400">
            <DownloadForm onDownloadStart={handleDownloadStart} />
          </div>

          {/* Current Download Progress */}
          {currentDownloadId && (
            <div className="mb-12 animate-slide-in-up">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                  Current Download
                </h2>
                <DownloadProgress downloadId={currentDownloadId} />
              </div>
            </div>
          )}

          {/* Ad Banner - Middle */}
          <div className="mb-12 animate-fade-in-up animation-delay-600">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-xl">📊</span>
                <p className="text-blue-700 font-medium">Advertisement Space</p>
              </div>
              <p className="text-blue-600 text-sm">728x90 • Google AdSense Banner</p>
            </div>
          </div>

          {/* Download History */}
          <div className="mb-12 animate-fade-in-up animation-delay-800">
            <DownloadHistory />
          </div>

          {/* Features Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12 mb-12 animate-fade-in-up animation-delay-1000">
            <div className="text-center mb-12">
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4 shadow-lg">
                ⚡ Powerful Features
              </div>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent mb-4">
                Why Choose Our Downloader?
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Experience the most advanced YouTube downloading platform with cutting-edge features
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 w-12 h-12 mx-auto mb-6 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
                <p className="text-gray-600 leading-relaxed">Ultra-high speed downloads with optimized servers ensuring you get your content in seconds, not minutes.</p>
              </div>
              
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-4 w-12 h-12 mx-auto mb-6 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Premium Quality</h3>
                <p className="text-gray-600 leading-relaxed">Download in crystal clear quality from 360p to 4K video and up to 320kbps lossless audio formats.</p>
              </div>
              
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-4 w-12 h-12 mx-auto mb-6 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">100% Secure</h3>
                <p className="text-gray-600 leading-relaxed">Bank-level encryption protects your privacy. Zero data storage means your downloads stay completely private.</p>
              </div>
            </div>
          </div>

          {/* Ad Banner - Bottom */}
          <div className="mb-12 animate-fade-in-up animation-delay-1200">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-xl">🎯</span>
                <p className="text-purple-700 font-medium">Premium Advertisement</p>
              </div>
              <p className="text-purple-600 text-sm">728x90 • Google AdSense Banner</p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12 animate-fade-in-up animation-delay-1400">
            <div className="text-center mb-12">
              <div className="inline-block bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4 shadow-lg">
                ❓ Got Questions?
              </div>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-red-800 bg-clip-text text-transparent mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Everything you need to know about our YouTube downloader
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/50 rounded-2xl p-6 hover:bg-white/80 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Is it legal to download YouTube videos?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You should only download videos that you have permission to download or that are in the public domain. 
                  Always respect copyright laws and YouTube's terms of service.
                </p>
              </div>
              
              <div className="bg-white/50 rounded-2xl p-6 hover:bg-white/80 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  What formats are supported?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  We support popular video formats (MP4, WebM, MKV) and audio formats (MP3, M4A, WAV) 
                  in various quality levels to suit your needs.
                </p>
              </div>
              
              <div className="bg-white/50 rounded-2xl p-6 hover:bg-white/80 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  How long are files stored?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Downloaded files are temporarily cached on our servers for quick access. 
                  Files are automatically cleaned up after a certain period to save storage space.
                </p>
              </div>

              <div className="bg-white/50 rounded-2xl p-6 hover:bg-white/80 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Is there a download limit?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Our service is completely free with reasonable usage limits to ensure quality service for all users. 
                  No registration required!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
