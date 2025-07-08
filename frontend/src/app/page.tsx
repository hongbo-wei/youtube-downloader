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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-8 -left-4 w-32 h-32 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white/20 rounded-full animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-purple-400/30 rounded-full animate-float animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-3/4 w-3 h-3 bg-violet-400/40 rounded-full animate-float animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16 animate-fade-in-up">
          <div className="inline-block mb-6">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl border border-white/20 animate-pulse-slow">
              ✨ Free & Premium Downloads
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 animate-gradient animate-text-glow">
            <span className="gradient-text">YouTube Downloader</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-4">
            Transform your favorite YouTube content into high-quality downloads.
            <span className="block mt-2 text-base text-purple-300 font-medium">Fast • Reliable • Beautiful</span>
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Download Form */}
          <div className="animate-fade-in-up animation-delay-400">
            <DownloadForm onDownloadStart={handleDownloadStart} />
          </div>

          {/* Current Download Progress */}
          {currentDownloadId && (
            <div className="mb-8 lg:mb-12 animate-slide-in-up">
              <div className="glass-card p-6 lg:p-8 neon-glow max-w-3xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                  Current Download
                </h2>
                <DownloadProgress downloadId={currentDownloadId} />
              </div>
            </div>
          )}

          {/* Ad Banner - Middle */}
          <div className="mb-8 lg:mb-12 animate-fade-in-up animation-delay-600">
            <div className="glass-card p-6 lg:p-8 text-center hover:scale-[1.02] transition-all duration-300 max-w-3xl mx-auto">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <span className="text-lg">📊</span>
                <p className="text-purple-300 text-sm font-medium">Enhanced visibility • Premium placement</p>
              </div>
              <p className="text-purple-400 text-xs">Advertisement Space Available</p>
            </div>
          </div>

          {/* Download History */}
          <div className="mb-8 lg:mb-12 animate-fade-in-up animation-delay-800">
            <DownloadHistory />
          </div>

          {/* Features Section */}
          <div className="glass-card p-8 lg:p-12 mb-8 lg:mb-12 animate-fade-in-up animation-delay-1000 max-w-4xl mx-auto">
            <div className="text-center mb-8 lg:mb-12">
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4 shadow-xl border border-white/20">
                ⚡ Powerful Features
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-4">
                <span className="gradient-text">Why Choose Our Downloader?</span>
              </h2>
              <p className="text-gray-300 text-base max-w-2xl mx-auto">
                Experience the fastest, most reliable YouTube downloader with cutting-edge features
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 w-12 h-12 mx-auto mb-6 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">Lightning Fast</h3>
                <p className="text-gray-300 leading-relaxed text-sm">Ultra-high speed downloads with optimized servers ensuring you get your content in seconds, not minutes.</p>
              </div>
              
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-4 w-12 h-12 mx-auto mb-6 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">Premium Quality</h3>
                <p className="text-gray-300 leading-relaxed text-sm">Download in crystal clear quality from 360p to 4K video and up to 320kbps lossless audio formats.</p>
              </div>
              
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-4 w-12 h-12 mx-auto mb-6 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">100% Secure</h3>
                <p className="text-gray-300 leading-relaxed text-sm">Bank-level encryption protects your privacy. Zero data storage means your downloads stay completely private.</p>
              </div>
            </div>
          </div>

          {/* Ad Banner - Bottom */}
          <div className="mb-8 lg:mb-12 animate-fade-in-up animation-delay-1200">
            <div className="glass-card p-6 lg:p-8 text-center hover:scale-[1.02] transition-all duration-300 max-w-3xl mx-auto">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <span className="text-lg">🎯</span>
                <p className="text-purple-300 text-sm font-medium">Premium Advertisement Space</p>
              </div>
              <p className="text-purple-400 text-xs">High-conversion placement • Target tech-savvy audience</p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="glass-card p-8 lg:p-12 animate-fade-in-up animation-delay-1400 max-w-4xl mx-auto">
            <div className="text-center mb-8 lg:mb-12">
              <div className="inline-block bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4 shadow-xl border border-white/20">
                ❓ Got Questions?
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-4">
                <span className="gradient-text">Frequently Asked Questions</span>
              </h2>
              <p className="text-gray-300 text-base max-w-2xl mx-auto">
                Everything you need to know about our YouTube downloader
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              <div className="glass-card p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <h3 className="text-base font-bold text-white mb-3 flex items-center">
                  <span className="text-blue-400 mr-2">Q:</span>
                  Is this service free to use?
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Yes! Our basic YouTube downloader is completely free. We offer premium features for users who need advanced functionality.
                </p>
              </div>
              <div className="glass-card p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <h3 className="text-base font-bold text-white mb-3 flex items-center">
                  <span className="text-green-400 mr-2">Q:</span>
                  What video qualities are supported?
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  We support all YouTube qualities from 360p up to 4K (2160p), plus audio-only downloads in multiple formats.
                </p>
              </div>
              <div className="glass-card p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <h3 className="text-base font-bold text-white mb-3 flex items-center">
                  <span className="text-purple-400 mr-2">Q:</span>
                  Is it safe and legal?
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Our service is safe and respects YouTube's terms. Please ensure you have permission to download content you don't own.
                </p>
              </div>
              <div className="glass-card p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <h3 className="text-base font-bold text-white mb-3 flex items-center">
                  <span className="text-orange-400 mr-2">Q:</span>
                  How fast are downloads?
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Download speeds depend on the video size and your internet connection. Most downloads complete within seconds to minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
