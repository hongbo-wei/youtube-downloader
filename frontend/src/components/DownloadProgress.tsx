'use client';

import { useEffect, useState } from 'react';
import { useDownloadStore } from '@/stores/downloadStore';

interface DownloadProgressProps {
  downloadId: string;
}

export default function DownloadProgress({ downloadId }: DownloadProgressProps) {
  const { downloads, updateDownload } = useDownloadStore();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const download = downloads[downloadId];

  useEffect(() => {
    if (!downloadId) return;

    // Create WebSocket connection for real-time progress
    const websocket = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/download/${downloadId}`
    );

    websocket.onopen = () => {
      console.log('WebSocket connected for download:', downloadId);
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        updateDownload(downloadId, {
          status: data.status,
          progress: data.progress,
          error: data.error,
          downloadUrl: data.download_url,
          filename: data.filename,
          fileSize: data.file_size,
        });
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket closed for download:', downloadId);
      setWs(null);
    };

    // Cleanup on unmount
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [downloadId, updateDownload]);

  // Poll for status if WebSocket is not available
  useEffect(() => {
    if (!downloadId || ws || download?.status === 'completed' || download?.status === 'failed') {
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/download/${downloadId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          updateDownload(downloadId, {
            status: data.status,
            progress: data.progress,
            error: data.error,
            downloadUrl: data.download_url,
            filename: data.filename,
            fileSize: data.file_size,
          });
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [downloadId, ws, download?.status, updateDownload]);

  if (!download) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'downloading':
        return 'text-blue-600';
      case 'processing':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'downloading':
      case 'processing':
        return (
          <div className="w-5 h-5">
            <svg className="animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (download.downloadUrl) {
      const link = document.createElement('a');
      link.href = download.downloadUrl;
      link.download = download.filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-2">
            <span className="text-base mr-2">{download.type === 'audio' ? '🎵' : '🎬'}</span>
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {download.filename || 'Processing your request...'}
            </h3>
          </div>
          <p className="text-sm text-gray-600 truncate bg-gray-50 px-3 py-2 rounded-lg border">
            🔗 {download.url}
          </p>
        </div>
        <div className="flex items-center ml-6 bg-white rounded-xl p-3 border shadow-sm">
          {getStatusIcon(download.status)}
          <span className={`ml-3 text-sm font-bold capitalize ${getStatusColor(download.status)}`}>
            {download.status}
          </span>
        </div>
      </div>

      {/* Enhanced Progress Bar */}
      {(download.status === 'downloading' || download.status === 'processing') && (
        <div className="mb-8">
          <div className="flex justify-between items-center text-base font-semibold text-gray-700 mb-4">
            <span className="flex items-center">
              <span className="text-sm mr-2">⚡</span>
              {download.status === 'downloading' ? 'Downloading' : 'Processing'}
            </span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {Math.round(download.progress || 0)}%
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                style={{ width: `${download.progress || 0}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700 drop-shadow-sm">
                {Math.round(download.progress || 0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced File Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-sm mb-1">📁</div>
          <div className="text-xs text-blue-600 font-semibold">Type</div>
          <div className="text-sm font-bold text-blue-800 capitalize">{download.type}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <div className="text-sm mb-1">🎯</div>
          <div className="text-xs text-green-600 font-semibold">Format</div>
          <div className="text-sm font-bold text-green-800 uppercase">{download.format}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <div className="text-sm mb-1">⚡</div>
          <div className="text-xs text-purple-600 font-semibold">Quality</div>
          <div className="text-sm font-bold text-purple-800">{download.quality}</div>
        </div>
        {download.fileSize ? (
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="text-sm mb-1">📊</div>
            <div className="text-xs text-orange-600 font-semibold">Size</div>
            <div className="text-sm font-bold text-orange-800">{formatFileSize(download.fileSize)}</div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-sm mb-1">⏱️</div>
            <div className="text-xs text-gray-600 font-semibold">Status</div>
            <div className="text-sm font-bold text-gray-800 capitalize">{download.status}</div>
          </div>
        )}
      </div>

      {/* Enhanced Error Message */}
      {download.status === 'failed' && download.error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-base font-bold text-red-900 mb-2">Download Failed</h3>
              <p className="text-red-800 leading-relaxed">{download.error}</p>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Success State */}
      {download.status === 'completed' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-green-900 mb-2"><span className="text-base">🎉</span> Download Complete!</h3>
            <p className="text-green-800 mb-4">Your file is ready to download</p>
          </div>
        </div>
      )}

      {/* Enhanced Download Button */}
      {download.status === 'completed' && download.downloadUrl && (
        <div className="text-center">
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-base rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 focus:ring-offset-2 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download Your File</span>
            <span className="text-sm ml-2">🚀</span>
          </button>
        </div>
      )}
    </div>
  );
}
