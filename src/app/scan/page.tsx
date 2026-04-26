'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, AlertCircle, Gift, Loader2, RotateCcw } from 'lucide-react'
import type { ScanResult } from '@/lib/types'

type State = 'checking' | 'scanning' | 'processing' | 'success' | 'error'

export default function ScanPage() {
  const router = useRouter()
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const isScannerRunning = useRef(false)
  const hasDecoded = useRef(false)
  const [state, setState] = useState<State>('checking')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [countdown, setCountdown] = useState(4)

  const stopScanner = useCallback(async () => {
    if (isScannerRunning.current && scannerRef.current) {
      await scannerRef.current.stop().catch(() => {})
      isScannerRunning.current = false
    }
  }, [])

  const handleDecode = useCallback(async (decodedText: string) => {
    if (hasDecoded.current) return
    hasDecoded.current = true
    setState('processing')
    await stopScanner()

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientQrCodeId: decodedText }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.detail ? `${data.error} — ${data.detail}` : (data.error || 'Erreur lors du scan'))
        setState('error')
        return
      }
      setResult(data as ScanResult)
      setCountdown(4)
      setState('success')
    } catch {
      setErrorMsg('Erreur réseau')
      setState('error')
    }
  }, [stopScanner])

  const launchScanner = useCallback(() => {
    hasDecoded.current = false
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          handleDecode,
          () => {}
        )
        .then(() => { isScannerRunning.current = true })
        .catch((err: Error) => {
          isScannerRunning.current = false
          setErrorMsg(`Caméra inaccessible : ${err.message}`)
          setState('error')
        })
    })
  }, [handleDecode])

  // Auth check on mount
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      setState('scanning')
    })
  }, [router])

  // Start/stop scanner with state
  useEffect(() => {
    if (state !== 'scanning') return
    launchScanner()
    return () => { stopScanner() }
  }, [state, launchScanner, stopScanner])

  // Auto-return after success
  useEffect(() => {
    if (state !== 'success') return
    if (countdown <= 0) { setResult(null); setState('scanning'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [state, countdown])

  const handleRetry = () => { setErrorMsg(''); setResult(null); setState('scanning') }

  const nextPalier = result?.paliers?.find(p => p.points > result.carte.nombre_points)
  const progressMax = nextPalier?.points ?? result?.pointsPourRecompense ?? 1
  const progressPct = result ? Math.min(100, Math.round((result.carte.nombre_points / progressMax) * 100)) : 0

  if (state === 'checking') return (
    <div className="fixed inset-0 bg-[#2D4A8A] flex items-center justify-center">
      <Loader2 size={36} className="text-white animate-spin" />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Override html5-qrcode default UI to fill screen */}
      <style>{`
        #qr-reader { width: 100% !important; height: 100% !important; border: none !important; padding: 0 !important; }
        #qr-reader video { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100dvh !important; object-fit: cover !important; }
        #qr-reader button { display: none !important; }
        #qr-reader select { display: none !important; }
        #qr-reader img { display: none !important; }
        #qr-reader > div:last-child { display: none !important; }
      `}</style>

      {/* Camera layer */}
      <div id="qr-reader" className="absolute inset-0" />

      {/* Scanning / Processing overlay */}
      {(state === 'scanning' || state === 'processing') && (
        <div className="absolute inset-0 flex flex-col pointer-events-none z-10">
          {/* Top bar */}
          <div className="h-28 bg-gradient-to-b from-black/80 to-transparent flex items-end px-5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-white rounded-lg p-1">
                <img src="/logo-orlyo.png" alt="Orlyo" width={28} height={28} style={{ objectFit: 'contain', display: 'block' }} />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">Orlyo Scan</span>
            </div>
          </div>

          {/* Viewfinder */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-56 h-56">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              {state === 'processing' && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                  <Loader2 size={48} className="text-white animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="h-32 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-10">
            <p className="text-white/80 text-sm font-medium">
              {state === 'processing' ? 'Traitement en cours…' : 'Pointez sur le QR code du client'}
            </p>
          </div>
        </div>
      )}

      {/* Success screen */}
      {state === 'success' && result && (
        <div className="absolute inset-0 bg-white z-20 flex flex-col overflow-y-auto">
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 min-h-full">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 ${
              result.recompenseDeclenchee ? 'bg-[#0F6E56]/10' : 'bg-[#2D4A8A]/10'
            }`}>
              {result.recompenseDeclenchee
                ? <Gift size={48} className="text-[#0F6E56]" />
                : <CheckCircle size={48} className="text-[#2D4A8A]" />
              }
            </div>

            <h2 className="text-3xl font-bold text-[#1A1A23] mb-1 text-center">
              {result.recompenseDeclenchee ? '🎉 Récompense !' : '✅ Point ajouté !'}
            </h2>
            <p className="text-[#6B7280] text-lg mb-6 text-center">
              Bonjour <span className="font-bold text-[#1A1A23]">{result.client.nom}</span> 👋
            </p>

            {result.recompenseDeclenchee && (
              <div className="w-full bg-[#0F6E56]/10 border-2 border-[#0F6E56]/30 rounded-2xl p-5 mb-5">
                <p className="text-[#0F6E56] font-bold text-lg text-center">🎁 {result.libelleRecompense}</p>
                <p className="text-[#0F6E56]/70 text-sm text-center mt-1">Remettez la récompense au client</p>
              </div>
            )}

            <div className="w-full bg-[#F3F4F6] rounded-2xl p-5 mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[#6B7280] text-sm">Points cumulés</span>
                <span className="font-bold text-[#2D4A8A]">{result.carte.nombre_points} / {progressMax}</span>
              </div>
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="h-4 rounded-full bg-[#2D4A8A] transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[#F59E0B] font-bold text-sm text-center mt-3">
                +{result.pointsAjoutes} point{result.pointsAjoutes > 1 ? 's' : ''} ajouté{result.pointsAjoutes > 1 ? 's' : ''}
              </p>
            </div>

            <button
              onClick={handleRetry}
              className="w-full bg-[#2D4A8A] text-white font-bold py-5 rounded-2xl text-xl mb-3 active:scale-95 transition-transform"
            >
              Scanner suivant
            </button>
            <p className="text-sm text-[#9CA3AF]">Retour automatique dans {countdown}s</p>
          </div>
        </div>
      )}

      {/* Error screen */}
      {state === 'error' && (
        <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center px-8">
          <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <AlertCircle size={48} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A23] mb-3 text-center">Scan échoué</h2>
          <p className="text-[#6B7280] text-center mb-10">{errorMsg}</p>
          <button
            onClick={handleRetry}
            className="w-full bg-[#2D4A8A] text-white font-bold py-5 rounded-2xl text-xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <RotateCcw size={24} />
            Réessayer
          </button>
        </div>
      )}
    </div>
  )
}
