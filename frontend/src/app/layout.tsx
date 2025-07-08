import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import { Analytics } from '@/components/Analytics'
import { GoogleAdsense } from '@/components/GoogleAdsense'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'YouTube Downloader - Free Audio & Video Download',
  description: 'Download YouTube videos and audio in high quality. Fast, free, and easy to use. Supports MP3, MP4, and more formats.',
  keywords: 'youtube downloader, video downloader, audio downloader, mp3, mp4, free download',
  authors: [{ name: 'YouTube Downloader' }],
  openGraph: {
    title: 'YouTube Downloader - Free Audio & Video Download',
    description: 'Download YouTube videos and audio in high quality. Fast, free, and easy to use.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'YouTube Downloader',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Downloader - Free Audio & Video Download',
    description: 'Download YouTube videos and audio in high quality. Fast, free, and easy to use.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <GoogleAdsense />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {children}
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
