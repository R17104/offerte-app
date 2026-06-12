'use client'

import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

export function useWindowWidth(): number {
  // 1280 als server-snapshot, zodat SSR dezelfde eerste render geeft als voorheen.
  return useSyncExternalStore(subscribe, () => window.innerWidth, () => 1280)
}
