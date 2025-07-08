'use client';

import { useDownloadStore } from '@/stores/downloadStore';
import { useState } from 'react';

interface DownloadItem {
  id: string;
  url: string;
  type: 'audio' | 'video';
  quality: string;
  format: string;
  status: string;
  createdAt: string;
  filename?: string;
  fileSize?: number;
  downloadUrl?: string;
}

export default function DownloadHistory() {
  const { history, clearHistory } = useDownloadStore();
  const [filter, setFilter] = useState<'all' | 'completed' | 'error'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Use history array instead of downloads object
  const filteredHistory = history
    .filter((item) => {
      if (filter === 'all') return true;
      return item.status === (filter === 'error' ? 'failed' : filter);
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-3 py-1 text-xs font-bold rounded-full';
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case 'failed':
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
      case 'downloading':
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
      case 'processing':
        return `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };

  const handleDownload = (item: DownloadItem) => {
    if (item.downloadUrl) {
      const link = document.createElement('a');
      link.href = item.downloadUrl;
      link.download = item.filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all download history?')) {
      clearHistory();
    }
  };

  if (!history || history.length === 0) {
    return (
      <div className="glass-card p-12 text-center neon-glow">
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center border border-white/20">
            <span className="text-3xl">📄</span>
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-4">No downloads yet</h3>
        <p className="text-gray-300 text-lg leading-relaxed">Your download history will appear here once you start downloading content.</p>
        <div className="mt-8">
          <div className="inline-block bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-2xl border border-white/20">
            📁 History will appear here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-10 neon-glow">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-10">
        <div>
          <div className="inline-block bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold mb-6 shadow-2xl border border-white/20">
            📁 Download History
          </div>
          <h2 className="text-2xl md:text-3xl font-black mb-2">
            <span className="gradient-text animate-text-glow">Your Downloads</span>
          </h2>
          <p className="text-gray-300 text-lg">Manage and access your downloaded content</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8 lg:mt-0">
          {/* Filter */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'completed' | 'error')}
              className="px-4 py-3 border border-white/20 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400/50 bg-white/10 backdrop-blur-md transition-all duration-300 appearance-none text-white shadow-lg"
            >
              <option value="all" className="bg-slate-800 text-white">All Downloads</option>
              <option value="completed" className="bg-slate-800 text-white">Completed</option>
              <option value="error" className="bg-slate-800 text-white">Failed</option>
            </select>
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="px-4 py-3 border border-white/20 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400/50 bg-white/10 backdrop-blur-md transition-all duration-300 appearance-none text-white shadow-lg"
            >
              <option value="newest" className="bg-slate-800 text-white">Newest First</option>
              <option value="oldest" className="bg-slate-800 text-white">Oldest First</option>
            </select>
          </div>

          {/* Clear History */}
          <button
            onClick={handleClearHistory}
            className="px-6 py-3 text-sm text-white font-bold bg-red-500/20 hover:bg-red-500 rounded-xl transition-all duration-300 border border-red-500/30 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/25"
          >
            🗑️ Clear History
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-6">
        {filteredHistory.map((item, index) => (
          <div key={item.id} className="glass-card p-8 floating-card">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 min-w-0 mb-6 lg:mb-0">
                <div className="flex items-start lg:items-center mb-4 flex-col lg:flex-row gap-3">
                  <h3 className="text-xl font-bold text-white truncate flex items-center">
                    <span className="text-lg mr-2">{item.type === 'audio' ? '🎵' : '🎬'}</span>
                    {item.filename || 'Processing...'}
                  </h3>
                  <span className={`${getStatusBadge(item.status)} flex items-center space-x-2`}>
                    {item.status === 'completed' && <span>✅</span>}
                    {item.status === 'failed' && <span>❌</span>}
                    {item.status === 'downloading' && <span>⬇️</span>}
                    {item.status === 'processing' && <span>⚙️</span>}
                    <span className="capitalize font-bold">{item.status}</span>
                  </span>
                </div>
                
                <p className="text-sm text-gray-300 truncate mb-4 bg-white/10 px-4 py-3 rounded-xl border border-white/20">
                  🔗 {item.url}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
                  <div className="glass-card p-3">
                    <span className="text-blue-400 font-bold text-xs">Type</span>
                    <div className="text-white font-bold capitalize">{item.type}</div>
                  </div>
                  <div className="glass-card p-3">
                    <span className="text-green-400 font-bold text-xs">Format</span>
                    <div className="text-white font-bold uppercase">{item.format}</div>
                  </div>
                  <div className="glass-card p-3">
                    <span className="text-purple-400 font-bold text-xs">Quality</span>
                    <div className="text-white font-bold">{item.quality}</div>
                  </div>
                  {item.fileSize && (
                    <div className="glass-card p-3">
                      <span className="text-orange-400 font-bold text-xs">Size</span>
                      <div className="text-white font-bold">{formatFileSize(item.fileSize)}</div>
                    </div>
                  )}
                  <div className="glass-card p-3">
                    <span className="text-gray-400 font-bold text-xs">Date</span>
                    <div className="text-white font-bold text-xs">{formatDate(item.createdAt)}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-6 lg:mt-0">
                {item.status === 'completed' && item.downloadUrl && (
                  <button
                    onClick={() => handleDownload(item)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 transition-all duration-300 shadow-2xl hover:shadow-green-500/25 transform hover:scale-105"
                  >
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                )}
                
                {item.status === 'failed' && (
                  <button
                    onClick={() => {
                      // Re-attempt download by creating a new one with same parameters
                      const newUrl = `/?url=${encodeURIComponent(item.url)}&type=${item.type}&quality=${item.quality}&format=${item.format}`;
                      window.open(newUrl, '_self');
                    }}
                    className="inline-flex items-center px-6 py-3 bg-white/10 border-2 border-red-400/50 text-red-400 font-bold rounded-xl hover:bg-red-500/20 hover:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all duration-300 shadow-2xl hover:shadow-red-500/25 transform hover:scale-105"
                  >
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
            <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No downloads match the current filter</h3>
          <p className="text-gray-300 text-lg">Try adjusting your filter settings to see more results.</p>
        </div>
      )}
    </div>
  );
}
