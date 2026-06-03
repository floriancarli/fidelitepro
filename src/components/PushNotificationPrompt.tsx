'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCircle } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
  return arr.buffer as ArrayBuffer
}

type Status = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

export default function PushNotificationPrompt() {
  const [status, setStatus] = useState<Status>('loading')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setStatus(sub ? 'subscribed' : 'unsubscribed')
      })
    })
  }, [])

  const subscribe = useCallback(async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return

    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/pwa/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })

      setStatus('subscribed')
    } finally {
      setLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) { setStatus('unsubscribed'); return }

      await fetch('/api/pwa/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
      setStatus('unsubscribed')
    } finally {
      setLoading(false)
    }
  }, [])

  if (status === 'loading' || status === 'unsupported' || status === 'denied') return null

  if (status === 'subscribed') {
    return (
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center flex-shrink-0">
            <Bell size={20} className="text-[#0F6E56]" />
          </div>
          <div>
            <p className="font-semibold text-sm text-[#1A1A23]">Notifications activées</p>
            <p className="text-xs text-[#6B7280]">Vous serez alerté avant chaque récompense</p>
          </div>
        </div>
        <CheckCircle size={18} className="text-[#0F6E56] flex-shrink-0" />
      </div>
    )
  }

  return (
    <button
      onClick={subscribe}
      disabled={loading}
      className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm hover:border-[#2D4A8A]/40 transition-colors disabled:opacity-50"
    >
      <div className="w-10 h-10 rounded-xl bg-[#2D4A8A]/10 flex items-center justify-center flex-shrink-0">
        <Bell size={20} className="text-[#2D4A8A]" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-semibold text-sm text-[#1A1A23]">
          {loading ? 'Activation…' : 'Activer les notifications'}
        </p>
        <p className="text-xs text-[#6B7280]">Soyez alerté quand une récompense approche</p>
      </div>
    </button>
  )
}
