'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    gtag: any
    adsbygoogle: any
  }
}

export function GoogleAdsense() {
  const adsenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID

  useEffect(() => {
    if (adsenseId && typeof window !== 'undefined') {
      // Load AdSense script
      const script = document.createElement('script')
      script.async = true
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`
      script.crossOrigin = 'anonymous'
      document.head.appendChild(script)

      return () => {
        document.head.removeChild(script)
      }
    }
  }, [adsenseId])

  if (!adsenseId) {
    return null
  }

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
      crossOrigin="anonymous"
    />
  )
}

// Ad component for displaying ads
export function AdBanner({ 
  slot, 
  format = 'auto',
  responsive = true,
  className = ''
}: {
  slot: string
  format?: string
  responsive?: boolean
  className?: string
}) {
  const adsenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID

  useEffect(() => {
    if (adsenseId && typeof window !== 'undefined' && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (error) {
        console.error('AdSense error:', error)
      }
    }
  }, [adsenseId])

  if (!adsenseId) {
    // Show placeholder in development
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 ${className}`}>
        <p className="text-sm">Ad Placeholder</p>
        <p className="text-xs mt-1">AdSense will appear here</p>
      </div>
    )
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client={adsenseId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive.toString()}
    />
  )
}
