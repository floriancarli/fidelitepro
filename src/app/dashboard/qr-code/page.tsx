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
  const scanUrl = commercant ? `${appUrl}/scan/${commercant.qr_code_id}` : ''

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qrcode-${commercant?.qr_code_id}.png`
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
      <html><head><title>QR Code — ${commercant?.nom_commerce}</title>
      <style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif}
      img{width:300px;height:300px}h1{margin:20px 0 8px;font-size:24px}p{color:#6b7280;margin:0}</style>
      </head><body>
      <img src="${dataUrl}" />
      <h1>${commercant?.nom_commerce}</h1>
      <p>${commercant?.qr_code_id}</p>
      <script>window.onload=()=>{window.print();window.close()}</script>
      </body></html>
    `)
    win.document.close()
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(scanUrl)
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
        <h1 className="text-2xl font-bold">Mon QR Code</h1>
        <p className="text-[#6B7280] text-sm mt-1">Affichez ce QR code en caisse pour que vos clients scannent</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* QR Code */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center">
          <div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-inner border border-gray-100 mb-6">
            <QRCodeCanvas
              value={scanUrl}
              size={220}
              bgColor="#FFFFFF"
              fgColor="#1A1A23"
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center mb-6">
            <p className="text-sm font-medium text-[#1A1A23]">{commercant.nom_commerce}</p>
            <p className="text-xs text-[#6B7280] mt-1 font-mono">{commercant.qr_code_id}</p>
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

        {/* Infos */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold mb-4">Lien de scan</h2>
            <div className="flex items-center gap-2 bg-[#F9F9FB] border border-gray-200 rounded-xl px-4 py-3">
              <span className="flex-1 text-xs text-[#6B7280] font-mono truncate">{scanUrl}</span>
              <button onClick={handleCopy} className="flex-shrink-0 text-[#534AB7] hover:text-[#3C3489] transition-colors">
                {copied ? <Check size={16} className="text-[#0F6E56]" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold mb-4">Configuration fidélité</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Points par visite</span>
                <span className="font-semibold">{commercant.points_par_visite} pt{commercant.points_par_visite > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Palier récompense</span>
                <span className="font-semibold">{commercant.points_pour_recompense} pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Récompense</span>
                <span className="font-semibold">{commercant.libelle_recompense}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#534AB7]/5 border border-[#534AB7]/20 rounded-2xl p-6">
            <h3 className="font-semibold text-[#534AB7] mb-2">Comment utiliser ?</h3>
            <ol className="text-sm text-[#6B7280] space-y-2 list-decimal list-inside">
              <li>Téléchargez ou imprimez votre QR code</li>
              <li>Affichez-le à votre caisse</li>
              <li>Vos clients le scannent avec leur téléphone</li>
              <li>Ils saisissent leur prénom et email</li>
              <li>Leurs points sont automatiquement ajoutés</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
