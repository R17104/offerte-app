'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

export interface SignaturePadHandle {
  isEmpty: () => boolean
  toDataURL: () => string
  clear: () => void
}

interface Props {
  width?: number
  height?: number
}

export const SignaturePad = forwardRef<SignaturePadHandle, Props>(
  function SignaturePad({ width = 480, height = 160 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const padRef = useRef<any>(null)

    useEffect(() => {
      let cancelled = false
      import('signature_pad').then(({ default: SP }) => {
        if (cancelled || !canvasRef.current) return
        padRef.current = new SP(canvasRef.current, {
          penColor: '#111113',
          minWidth: 1.5,
          maxWidth: 2.5,
        })
      })
      return () => {
        cancelled = true
        padRef.current?.off()
      }
    }, [])

    useImperativeHandle(ref, () => ({
      isEmpty:   () => padRef.current?.isEmpty() ?? true,
      toDataURL: () => padRef.current?.toDataURL('image/png') ?? '',
      clear:     () => padRef.current?.clear(),
    }))

    return (
      <div>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            border: '1px solid #d1d5db',
            borderRadius: 8,
            cursor: 'crosshair',
            background: '#ffffff',
            display: 'block',
            touchAction: 'none',
            width: '100%',
            maxWidth: width,
          }}
        />
      </div>
    )
  },
)
