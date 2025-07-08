import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Download {
  id: string
  url: string
  type: 'audio' | 'video'
  format: string
  quality: string
  status: 'pending' | 'downloading' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  downloadUrl?: string
  filename?: string
  fileSize?: number
  createdAt: string
  completedAt?: string
}

interface DownloadStore {
  downloads: Record<string, Download>
  history: Download[]
  currentDownload: Download | null
  startDownload: (id: string, download: Omit<Download, 'id'>) => Promise<void>
  updateDownload: (id: string, updates: Partial<Download>) => void
  setCurrentDownload: (download: Download | null) => void
  addToHistory: (download: Download) => void
  clearHistory: () => void
  removeDownload: (id: string) => void
}

export const useDownloadStore = create<DownloadStore>()(
  persist(
    (set, get) => ({
      downloads: {},
      history: [],
      currentDownload: null,
      
      startDownload: async (id, download) => {
        const newDownload = { ...download, id }
        set((state) => ({
          downloads: {
            ...state.downloads,
            [id]: newDownload,
          },
          currentDownload: newDownload,
        }))
        
        // Also add to history if not already there
        const currentHistory = get().history
        if (!currentHistory.find(item => item.id === id)) {
          set((state) => ({
            history: [newDownload, ...state.history],
          }))
        }
      },
      
      updateDownload: (id, updates) => {
        set((state) => {
          const updatedDownload = { ...state.downloads[id], ...updates }
          const updatedHistory = state.history.map(item => 
            item.id === id ? updatedDownload : item
          )
          
          return {
            downloads: {
              ...state.downloads,
              [id]: updatedDownload,
            },
            history: updatedHistory,
            currentDownload: state.currentDownload?.id === id 
              ? updatedDownload
              : state.currentDownload,
          }
        })
      },
      
      setCurrentDownload: (download) => {
        set({ currentDownload: download })
      },
      
      addToHistory: (download) => {
        set((state) => {
          const existingIndex = state.history.findIndex(item => item.id === download.id)
          if (existingIndex >= 0) {
            const updatedHistory = [...state.history]
            updatedHistory[existingIndex] = download
            return { history: updatedHistory }
          }
          return { history: [download, ...state.history] }
        })
      },
      
      clearHistory: () => {
        set({ history: [], downloads: {} })
      },
      
      removeDownload: (id) => {
        set((state) => {
          const { [id]: removed, ...restDownloads } = state.downloads
          return {
            downloads: restDownloads,
            history: state.history.filter((download) => download.id !== id),
            currentDownload: state.currentDownload?.id === id ? null : state.currentDownload,
          }
        })
      },
    }),
    {
      name: 'download-history',
      partialize: (state) => ({ 
        downloads: state.downloads, 
        history: state.history 
      }),
    }
  )
)
