'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    gtag: any
  }
}

export function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    // Google Analytics
    const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID
    
    if (GA_TRACKING_ID && typeof window !== 'undefined') {
      // Load GA script
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`
      document.head.appendChild(script)

      const configScript = document.createElement('script')
      configScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_TRACKING_ID}', {
          page_path: window.location.pathname,
        });
      `
      document.head.appendChild(configScript)

      return () => {
        document.head.removeChild(script)
        document.head.removeChild(configScript)
      }
    }
  }, [])

  useEffect(() => {
    // Track page views
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: pathname,
      })
    }

    // Track custom analytics events to our backend
    trackEvent('page_view', {
      page: pathname,
      timestamp: new Date().toISOString(),
    })
  }, [pathname])

  return null
}

// Helper function to track custom events
export function trackEvent(eventType: string, metadata: Record<string, any> = {}) {
  // Track to Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventType, {
      event_category: 'engagement',
      event_label: eventType,
      ...metadata,
    })
  }

  // Track to our backend
  if (typeof window !== 'undefined') {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventType,
        metadata,
      }),
    }).catch((error) => {
      console.error('Analytics tracking error:', error)
    })
  }
}
