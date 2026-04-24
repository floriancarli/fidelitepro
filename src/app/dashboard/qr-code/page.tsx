'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Printer, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Commercant } from '@/lib/types'

export default function QrCodePage() {
  const [commercant, setCommercant] = useState<Commercant | null>(null)
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('commercants').select('*').eq('id', user.id).single()
    setCommercant(data)
  }, [])

  useEffect(() => { load() }, [load])

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const joinUrl = commercant ? `${appUrl}/join/${commercant.id}` : ''

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qrcode-inscription-${commercant?.nom_commerce}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handlePrint = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>QR Code inscription — ${commercant?.nom_commerce}</title>
      <style>
        body { margin: 0; display: flex; flex-direction: column; align-items: center;
               justify-content: center; min-height: 100vh; font-family: sans-serif; }
        img  { width: 280px; height: 280px; }
        h1   { margin: 20px 0 6px; font-size: 22px; text-align: center; }
        p    { color: #6b7280; margin: 0; font-size: 13px; text-align: center; }
        .badge { margin-top: 12px; background: #f0fdf4; border: 1px solid #bbf7d0;
                 color: #166534; font-size: 12px; padding: 4px 12px; border-radius: 999px; }
      </style>
      </head><body>
        <img src="${dataUrl}" />
        <h1>${commercant?.nom_commerce}</h1>
        <p>Scannez pour créer votre carte de fidélité gratuite</p>
        <div class="badge">Inscription en 30 secondes</div>
        <script>window.onload = () => { window.print(); window.close() }</script>
      </body></html>
    `)
    win.document.close()
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!commercant) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 border-4 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">QR code d&apos;inscription</h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Affichez ce QR code en caisse — vos clients le scannent pour créer leur carte de fidélité
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">

        {/* QR Code */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center">
          <div ref={qrRef} className="p-5 bg-white rounded-2xl shadow-inner border border-gray-100 mb-6">
            <QRCodeCanvas
              value={joinUrl}
              size={230}
              bgColor="#FFFFFF"
              fgColor="#1A1A23"
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center mb-6 w-full">
            <p className="text-sm font-semibold text-[#1A1A23]">{commercant.nom_commerce}</p>
            <p className="text-xs text-[#6B7280] mt-1">Scannez pour créer votre carte de fidélité</p>
            <div className="mt-3 flex items-center gap-2 bg-[#F9F9FB] border border-gray-200 rounded-xl px-3 py-2">
              <span className="flex-1 text-xs text-[#6B7280] font-mono truncate">{joinUrl}</span>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 text-[#534AB7] hover:text-[#3C3489] transition-colors"
                title="Copier le lien"
              >
                {copied ? <Check size={14} className="text-[#0F6E56]" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-[#1A1A23] hover:bg-gray-50 transition-colors"
            >
              <Printer size={16} />
              Imprimer
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-[#534AB7] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#3C3489] transition-colors"
            >
              <Download size={16} />
              Télécharger
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold mb-4">Comment ça marche ?</h2>
            <ol className="space-y-3">
              {[
                { n: '1', t: 'Affichez ce QR code en caisse', d: 'Imprimez-le ou posez-le sur votre comptoir.' },
                { n: '2', t: 'Le client le scanne', d: 'Avec l\'appareil photo de son téléphone — aucune app nécessaire.' },
                { n: '3', t: 'Il crée son compte en 30s', d: 'Prénom, email, mot de passe. C\'est tout.' },
                { n: '4', t: 'Il reçoit son QR code personnel', d: 'Il vous le présente à chaque visite pour gagner des points.' },
              ].map(({ n, t, d }) => (
                <li key={n} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#534AB7] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {n}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A23]">{t}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold mb-3">Votre programme</h2>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Points par visite</span>
                <span className="font-semibold">
                  {commercant.points_par_visite} pt{commercant.points_par_visite > 1 ? 's' : ''}
                </span>
              </div>
              {(commercant.paliers?.length > 0 ? commercant.paliers : [{ points: commercant.points_pour_recompense, libelle: commercant.libelle_recompense }])
                .sort((a, b) => a.points - b.points)
                .map((p) => (
                  <div key={p.points} className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">{p.points} pts</span>
                    <span className="font-semibold text-[#0F6E56]">🎁 {p.libelle}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
