'use client';

import { useState } from 'react';
import { useDownloadStore } from '@/stores/downloadStore';

interface DownloadFormProps {
  onDownloadStart?: (downloadId: string) => void;
}

export default function DownloadForm({ onDownloadStart }: DownloadFormProps) {
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'audio' | 'video'>('audio');
  const [quality, setQuality] = useState('192');
  const [format, setFormat] = useState('mp3');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { startDownload, addToHistory } = useDownloadStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      alert('Please enter a YouTube URL');
      return;
    }

    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
    if (!youtubeRegex.test(url)) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          type,
          quality,
          format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Download failed to start');
      }

      const data = await response.json();
      const downloadId = data.download_id;

      // Update store
      await startDownload(downloadId, {
        url,
        type,
        quality,
        format,
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
      });

      // Add to history
      addToHistory({
        id: downloadId,
        url,
        type,
        quality,
        format,
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
      });

      // Callback for parent component
      if (onDownloadStart) {
        onDownloadStart(downloadId);
      }

      // Reset form
      setUrl('');
      
    } catch (error) {
      console.error('Download start error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start download');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (newType: 'audio' | 'video') => {
    setType(newType);
    if (newType === 'audio') {
      setFormat('mp3');
      setQuality('192');
    } else {
      setFormat('mp4');
      setQuality('720p');
    }
  };

  return (
    <div className="glass-card p-6 lg:p-8 mb-8 lg:mb-10 neon-glow max-w-3xl mx-auto">
      <div className="text-center mb-6 lg:mb-8">
        <div className="inline-flex items-center bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 lg:px-6 py-2 rounded-full text-xs lg:text-sm font-bold mb-4 shadow-xl border border-white/20">
          <span className="text-sm mr-2">🎬</span>
          <span>Ultimate YouTube Downloader</span>
        </div>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-black mb-3">
          <span className="gradient-text animate-text-glow">Download YouTube Content</span>
        </h2>
        <p className="text-gray-300 text-sm">Enter any YouTube URL to get started with our premium downloader</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
        {/* URL Input */}
        <div className="relative">
          <label htmlFor="url" className="block text-sm font-bold text-white mb-3">
            YouTube URL
          </label>
          <div className="relative">
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 bg-white/10 backdrop-blur-md transition-all duration-300 text-white placeholder-white/60 text-sm shadow-lg"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Type Selection */}
        <div>
          <label className="block text-sm font-bold text-white mb-3">
            Download Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={`flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
              type === 'audio' 
                ? 'border-purple-400 bg-purple-500/20 text-white shadow-md shadow-purple-500/25' 
                : 'border-white/20 bg-white/10 text-gray-300 hover:border-white/30 hover:bg-white/20'
            }`}>
              <input
                type="radio"
                value="audio"
                checked={type === 'audio'}
                onChange={(e) => handleTypeChange(e.target.value as 'audio')}
                className="sr-only"
                disabled={isSubmitting}
              />
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  type === 'audio' ? 'border-purple-400' : 'border-white/40'
                }`}>
                  {type === 'audio' && <div className="w-2 h-2 bg-purple-400 rounded-full"></div>}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">🎵</span>
                  <span className="font-bold text-sm">Audio Only</span>
                </div>
              </div>
            </label>
            <label className={`flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
              type === 'video' 
                ? 'border-purple-400 bg-purple-500/20 text-white shadow-md shadow-purple-500/25' 
                : 'border-white/20 bg-white/10 text-gray-300 hover:border-white/30 hover:bg-white/20'
            }`}>
              <input
                type="radio"
                value="video"
                checked={type === 'video'}
                onChange={(e) => handleTypeChange(e.target.value as 'video')}
                className="sr-only"
                disabled={isSubmitting}
              />
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  type === 'video' ? 'border-purple-400' : 'border-white/40'
                }`}>
                  {type === 'video' && <div className="w-2 h-2 bg-purple-400 rounded-full"></div>}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">🎬</span>
                  <span className="font-bold text-sm">Video</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Format and Quality Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="format" className="block text-sm font-bold text-white mb-3">
              Format
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-sm">{type === 'audio' ? '🎧' : '📹'}</span>
              </div>
              <select
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 bg-white/10 backdrop-blur-md transition-all duration-300 text-white appearance-none shadow-lg text-sm"
                disabled={isSubmitting}
              >
                {type === 'audio' ? (
                  <>
                    <option value="mp3" className="bg-slate-800 text-white">MP3 (Most Compatible)</option>
                    <option value="m4a" className="bg-slate-800 text-white">M4A (Apple Devices)</option>
                    <option value="wav" className="bg-slate-800 text-white">WAV (Lossless)</option>
                  </>
                ) : (
                  <>
                    <option value="mp4" className="bg-slate-800 text-white">MP4 (Most Compatible)</option>
                    <option value="webm" className="bg-slate-800 text-white">WebM (Web Optimized)</option>
                    <option value="mkv" className="bg-slate-800 text-white">MKV (High Quality)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="quality" className="block text-sm font-bold text-white mb-3">
              Quality
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-sm">⚡</span>
              </div>
              <select
                id="quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 bg-white/10 backdrop-blur-md transition-all duration-300 text-white appearance-none shadow-lg text-sm"
                disabled={isSubmitting}
              >
                {type === 'audio' ? (
                  <>
                    <option value="128" className="bg-slate-800 text-white">128 kbps (Good)</option>
                    <option value="192" className="bg-slate-800 text-white">192 kbps (High)</option>
                    <option value="256" className="bg-slate-800 text-white">256 kbps (Very High)</option>
                    <option value="320" className="bg-slate-800 text-white">320 kbps (Maximum)</option>
                  </>
                ) : (
                  <>
                    <option value="360p" className="bg-slate-800 text-white">360p (Mobile)</option>
                    <option value="480p" className="bg-slate-800 text-white">480p (Standard)</option>
                    <option value="720p" className="bg-slate-800 text-white">720p (HD)</option>
                    <option value="1080p" className="bg-slate-800 text-white">1080p (Full HD)</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-6 rounded-xl text-white font-bold text-sm shadow-xl transition-all duration-300 transform relative overflow-hidden ${
            isSubmitting
              ? 'bg-gray-600 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 hover:shadow-purple-500/50 hover:scale-105 focus:ring-2 focus:ring-purple-500/50 neon-glow'
          }`}
        >
          {!isSubmitting && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full transition-transform duration-1000 hover:translate-x-full"></div>
          )}
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing Your Request...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 relative z-10">
              <span className="text-sm">🚀</span>
              <span>Start Download</span>
            </div>
          )}
        </button>
      </form>

      {/* Enhanced Tips */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center floating-card">
          <div className="text-sm mb-2">⚡</div>
          <h3 className="text-sm font-bold text-white mb-1">Lightning Fast</h3>
          <p className="text-xs text-gray-300">Optimized servers for ultra-quick downloads</p>
        </div>
        <div className="glass-card p-4 text-center floating-card animation-delay-200">
          <div className="text-sm mb-2">🔒</div>
          <h3 className="text-sm font-bold text-white mb-1">Bank-Level Security</h3>
          <p className="text-xs text-gray-300">Military-grade encryption, completely secure</p>
        </div>
        <div className="glass-card p-4 text-center floating-card animation-delay-400">
          <div className="text-sm mb-2">🏆</div>
          <h3 className="text-sm font-bold text-white mb-1">Premium Quality</h3>
          <p className="text-xs text-gray-300">Up to 4K video and 320kbps audio</p>
        </div>
      </div>
    </div>
  );
}
