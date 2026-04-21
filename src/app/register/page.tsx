'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft, Download, Share2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import type { Client } from '@/lib/types'

const QRCodeCanvas = dynamic(() => import('qrcode.react').then((m) => m.QRCodeCanvas), { ssr: false })

type Step = 'form' | 'card'

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({ nom: '', email: '' })
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()

      // Vérifier si le client existe déjà (maybeSingle évite le 406 si absent)
      const { data: existing, error: selectError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', form.email.toLowerCase())
        .maybeSingle()

      if (selectError) throw selectError

      if (existing) {
        setClient(existing)
        setStep('card')
        return
      }

      // Créer le client
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
          email: form.email.toLowerCase(),
          nom: form.nom,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setClient(newClient)
      setStep('card')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    const canvas = document.querySelector('#client-qr canvas') as HTMLCanvasElement
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `ma-carte-fidelite.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleShare = async () => {
    const canvas = document.querySelector('#client-qr canvas') as HTMLCanvasElement
    if (!canvas) return

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], 'ma-carte-fidelite.png', { type: 'image/png' })
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Ma carte de fidélité FidèlePro',
            text: 'Voici mon QR code de fidélité',
            files: [file],
          })
        } else {
          handleDownload()
        }
      })
    } catch {
      handleDownload()
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-4">
        <Link href="/" className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <Logo size="sm" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        {step === 'form' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#534AB7]/10 flex items-center justify-center mx-auto mb-4">
                <Logo size="sm" />
              </div>
              <h1 className="text-2xl font-bold">Créer ma carte de fidélité</h1>
              <p className="text-[#6B7280] text-sm mt-2">
                Inscrivez-vous une seule fois et utilisez votre QR code dans tous les commerces partenaires
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Votre nom</label>
                <input
                  type="text"
                  required
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: Marie Dupont"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Votre email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="vous@exemple.fr"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#534AB7] text-white font-bold py-3.5 rounded-xl hover:bg-[#3C3489] transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? 'Création...' : 'Obtenir mon QR code'}
              </button>
            </form>

            <p className="text-center text-xs text-[#6B7280] mt-6">
              Si vous avez déjà un compte, entrez le même email pour retrouver votre QR code.
            </p>
          </div>
        )}

        {step === 'card' && client && (
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 text-[#0F6E56] mb-2">
                <CheckCircle size={22} />
                <span className="font-semibold">Carte créée !</span>
              </div>
              <h1 className="text-2xl font-bold">Bonjour {client.nom} 👋</h1>
              <p className="text-[#6B7280] text-sm mt-2">
                Voici votre QR code personnel. Sauvegardez-le sur votre téléphone.
              </p>
            </div>

            {/* Carte QR */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-[#534AB7] to-[#3C3489] p-6 text-white text-center">
                <Logo white size="sm" />
                <p className="text-white/70 text-xs mt-1">Carte de fidélité</p>
                <p className="font-bold text-lg mt-2">{client.nom}</p>
              </div>

              <div id="client-qr" className="p-8 flex flex-col items-center">
                <QRCodeCanvas
                  value={client.qr_code_id}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#1A1A23"
                  level="H"
                  includeMargin={false}
                />
                <p className="text-xs text-[#6B7280] font-mono mt-4 break-all text-center">
                  {client.qr_code_id}
                </p>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <Share2 size={16} />
                  Partager
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#534AB7] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors"
                >
                  <Download size={16} />
                  Sauvegarder
                </button>
              </div>
            </div>

            <div className="mt-6 bg-[#534AB7]/5 border border-[#534AB7]/20 rounded-2xl p-5 text-sm text-[#6B7280]">
              <p className="font-semibold text-[#534AB7] mb-2">Comment ça marche ?</p>
              <ol className="space-y-1.5 list-decimal list-inside">
                <li>Sauvegardez ce QR code dans vos photos</li>
                <li>Présentez-le en caisse chez nos commerçants partenaires</li>
                <li>Le commerçant scanne votre code et vous gagnez des points</li>
                <li>Atteignez le palier pour débloquer une récompense !</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
