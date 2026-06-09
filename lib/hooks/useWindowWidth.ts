'use client'

import { useEffect, useState } from 'react'

export function useWindowWidth(): number {
  const [width, setWidth] = useState(1280)

  useEffect(() => {
    setWidth(window.innerWidth)
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return width
}
