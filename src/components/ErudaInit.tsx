'use client'

import { useEffect } from 'react'

export default function ErudaInit() {
  useEffect(() => {
    // Chỉ bật khi có query param ?debug=true
    const urlParams = new URLSearchParams(window.location.search);
    const shouldDebug = urlParams.get('debug') === 'true';

    if (process.env.NODE_ENV === 'development' && shouldDebug && typeof window !== 'undefined') {
      import('eruda').then((eruda) => {
        eruda.default.init()
      })
    }
  }, [])

  return null
}