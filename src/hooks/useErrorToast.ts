import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'

export function useErrorToast(message?: string | null) {
  const lastMessageRef = useRef('')

  useEffect(() => {
    const normalized = message?.trim() || ''

    if (!normalized) {
      lastMessageRef.current = ''
      return
    }

    if (normalized === lastMessageRef.current) {
      return
    }

    toast.error(normalized)
    lastMessageRef.current = normalized
  }, [message])
}
