'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ScanLine, CheckCircle, AlertCircle, Gift, Loader2 } from 'lucide-react'
import type { ScanResult } from '@/lib/types'

interface Props {
  onClose: (result?: ScanResult) => void
}

type State = 'scanning' | 'processing' | 'success' | 'error'

export default function ClientScannerModal({ onClose }: Props) {
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const isScannerRunning = useRef(false)
  const hasDecoded = useRef(false)
  const [state, setState] = useState<State>('scanning')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [countdown, setCountdown] = useState(4)

  const stopScanner = async () => {
    if (isScannerRunning.current && scannerRef.current) {
      await scannerRef.current.stop().catch(() => {})
      isScannerRunning.current = false
    }
  }

  const startScanner = (onDecode: (text: string) => void) => {
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          onDecode,
          () => {}
        )
        .then(() => { isScannerRunning.current = true })
        .catch((err: Error) => {
          isScannerRunning.current = false
          setErrorMsg(`Caméra inaccessible : ${err.message}`)
          setState('error')
        })
    })
  }

  const handleDecode = async (decodedText: string) => {
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
  }

  // Lancer le scanner au montage
  useEffect(() => {
    startScanner(handleDecode)
    return () => { stopScanner() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Compte à rebours une fois en état succès
  useEffect(() => {
    if (state !== 'success' || !result) return

    if (countdown <= 0) {
      onClose(result)
      return
    }

    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [state, countdown, result, onClose])

  const handleRetry = () => {
    hasDecoded.current = false
    setErrorMsg('')
    setState('scanning')
    startScanner(handleDecode)
  }

  const progressPct = result
    ? Math.min(100, Math.round((result.carte.nombre_points / result.pointsPourRecompense) * 100))
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ScanLine size={20} className="text-[#534AB7]" />
            <span className="font-semibold">Scanner un client</span>
          </div>
          <button
            onClick={() => stopScanner().then(() => onClose(result ?? undefined))}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6">

          {/* Scanning / Processing */}
          {(state === 'scanning' || state === 'processing') && (
            <div>
              <p className="text-sm text-[#6B7280] text-center mb-4">
                Pointez la caméra sur le QR code du client
              </p>
              <div className="relative rounded-2xl overflow-hidden bg-black">
                <div id="qr-reader" className="w-full" style={{ minHeight: 280 }} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white/70 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
                  </div>
                </div>
              </div>
              {state === 'processing' && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[#534AB7]">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm font-medium">Traitement en cours...</span>
                </div>
              )}
            </div>
          )}

          {/* Succès */}
          {state === 'success' && result && (
            <div className="text-center">
              {result.recompenseDeclenchee ? (
                <div className="w-16 h-16 rounded-full bg-[#0F6E56]/10 flex items-center justify-center mx-auto mb-4">
                  <Gift size={32} className="text-[#0F6E56]" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#534AB7]/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-[#534AB7]" />
                </div>
              )}

              <h3 className="text-xl font-bold mb-1">
                {result.recompenseDeclenchee ? 'Récompense débloquée !' : 'Point ajouté !'}
              </h3>
              <p className="text-[#6B7280] text-sm mb-5">
                Bonjour <strong>{result.client.nom}</strong> 👋
              </p>

              {result.recompenseDeclenchee && (
                <div className="bg-[#0F6E56]/10 border border-[#0F6E56]/20 rounded-2xl p-4 mb-5">
                  <p className="text-[#0F6E56] font-semibold">🎁 {result.libelleRecompense}</p>
                  <p className="text-[#0F6E56]/80 text-xs mt-1">Remettez la récompense au client</p>
                </div>
              )}

              <div className="bg-[#F9F9FB] rounded-2xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#6B7280]">Points</span>
                  <span className="font-bold text-[#534AB7]">
                    +{result.pointsAjoutes} → {result.carte.nombre_points} / {result.pointsPourRecompense}
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-[#534AB7] transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-[#6B7280] mt-2">
                  {result.pointsPourRecompense - result.carte.nombre_points > 0
                    ? `Plus que ${result.pointsPourRecompense - result.carte.nombre_points} point(s) pour la prochaine récompense`
                    : 'Palier atteint !'}
                </p>
              </div>

              <p className="text-xs text-[#6B7280] mt-4">
                Fermeture dans {countdown}s…
              </p>
            </div>
          )}

          {/* Erreur */}
          {state === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Scan échoué</h3>
              <p className="text-[#6B7280] text-sm mb-6">{errorMsg}</p>
              <button
                onClick={handleRetry}
                className="w-full bg-[#534AB7] text-white font-semibold py-3 rounded-xl hover:bg-[#3C3489] transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
