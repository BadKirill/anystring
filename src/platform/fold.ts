import { useEffect, useState } from 'react'

import { Capacitor, registerPlugin } from '@capacitor/core'

export interface ReservedRect {
  readonly active: boolean
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

interface FoldBridge {
  read(): Promise<{ regions?: unknown }>
  addListener(
    event: 'change',
    handler: () => void,
  ): Promise<{ remove: () => Promise<void> }>
}

function foldBridge(): FoldBridge {
  return registerPlugin<FoldBridge>('Fold')
}

function iosNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
}

export function reservedRects(value: unknown): readonly ReservedRect[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter(isReservedRect)
}

function isReservedRect(value: unknown): value is ReservedRect {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const rect = value as Record<string, unknown>
  return (
    typeof rect.active === 'boolean' &&
    finite(rect.x) &&
    finite(rect.y) &&
    finite(rect.width) &&
    finite(rect.height)
  )
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export async function readReservedRegions(): Promise<readonly ReservedRect[]> {
  if (!iosNative()) {
    return []
  }
  try {
    const result = await foldBridge().read()
    return reservedRects(result.regions)
  } catch {
    return []
  }
}

export function subscribeReservedRegions(onChange: () => void): () => void {
  if (!iosNative()) {
    return () => undefined
  }
  let remove: (() => Promise<void>) | undefined
  let cancelled = false
  void foldBridge()
    .addListener('change', onChange)
    .then((handle) => {
      if (cancelled) {
        void handle.remove()
        return
      }
      remove = handle.remove
    })
    .catch(() => undefined)
  return () => {
    cancelled = true
    void remove?.()
  }
}

export function useReservedRegions(): readonly ReservedRect[] {
  const [regions, setRegions] = useState<readonly ReservedRect[]>([])
  useEffect(() => {
    let cancelled = false
    const refresh = (): void => {
      void readReservedRegions().then((next) => {
        if (!cancelled) {
          setRegions(next)
        }
      })
    }
    refresh()
    const unsubscribe = subscribeReservedRegions(refresh)
    window.addEventListener('resize', refresh)
    return () => {
      cancelled = true
      unsubscribe()
      window.removeEventListener('resize', refresh)
    }
  }, [])
  return regions
}
