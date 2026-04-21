'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft, Download, Share2, CheckCircle, Gift, Star, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import type { Client, Palier } from '@/lib/types'

const QRCodeCanvas = dynamic(() => import('qrcode.react').then((m) => m.QRCodeCanvas), { ssr: false })

type Step = 'form' | 'card'

type CarteAvecCommercant = {
  id: string
  client_email: string
  nombre_points: number
  points_cumules_total: number
  recompenses_obtenues: number
  derniere_visite: string
  commercants: {
    nom_commerce: string
    couleur_principale: string
    paliers: Palier[] | null
    points_pour_recompense: number
    libelle_recompense: string
    nom_programme: string | null
  }
}

function getPaliers(c: CarteAvecCommercant['commercants']): Palier[] {
  if (Array.isArray(c.paliers) && c.paliers.length > 0) {
    return [...c.paliers].sort((a, b) => a.points - b.points)
  }
  return [{ points: c.points_pour_recompense, libelle: c.libelle_recompense }]
}

function RecompensesSection({ cartes }: { cartes: CarteAvecCommercant[] }) {
  if (cartes.length === 0) {
    return (
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#534AB7]/10 flex items-center justify-center mx-auto mb-3">
          <Gift size={22} className="text-[#534AB7]" />
        </div>
        <p className="font-medium text-[#1A1A23] text-sm">Pas encore de points</p>
        <p className="text-xs text-[#6B7280] mt-1">
          Présentez votre QR code en caisse chez un commerçant partenaire pour commencer à accumuler des points
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      <h2 className="font-semibold text-[#1A1A23]">Mes récompenses</h2>
      {cartes.map((carte) => {
        const paliers = getPaliers(carte.commercants)
        const color = carte.commercants.couleur_principale || '#534AB7'
        const nom = carte.commercants.nom_programme || carte.commercants.nom_commerce
        const maxPalier = paliers[paliers.length - 1]
        const points = carte.nombre_points
        const nextPalier = paliers.find((p) => p.points > points)
        const pctProgress = Math.min(100, Math.round((points / maxPalier.points) * 100))

        return (
          <div key={carte.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header commerce */}
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                style={{ backgroundColor: color }}
              >
                {carte.commercants.nom_commerce.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1A1A23] truncate">{carte.commercants.nom_commerce}</p>
                <p className="text-xs text-[#6B7280]">{nom !== carte.commercants.nom_commerce ? nom : 'Programme de fidélité'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold" style={{ color }}>{points}</p>
                <p className="text-xs text-[#6B7280]">pts</p>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Barre de progression */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#6B7280]">Progression</span>
                  <span className="text-xs font-medium text-[#1A1A23]">{points} / {maxPalier.points} pts</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pctProgress}%`, backgroundColor: color }}
                  />
                </div>
              </div>

              {/* Prochaine récompense mise en avant */}
              {nextPalier && (
                <div
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ backgroundColor: `${color}10`, borderColor: `${color}30`, border: '1px solid' }}
                >
                  <Star size={16} style={{ color }} className="flex-shrink-0" />
                  <p className="text-sm" style={{ color }}>
                    <span className="font-semibold">Plus que {nextPalier.points - points} point{nextPalier.points - points > 1 ? 's' : ''}</span>
                    {' '}pour{' '}
                    <span className="font-semibold">{nextPalier.libelle}</span>
                  </p>
                </div>
              )}

              {!nextPalier && (
                <div className="rounded-xl bg-[#0F6E56]/10 border border-[#0F6E56]/20 px-4 py-3 flex items-center gap-3">
                  <CheckCircle size={16} className="text-[#0F6E56] flex-shrink-0" />
                  <p className="text-sm text-[#0F6E56] font-medium">Vous avez atteint le palier maximum !</p>
                </div>
              )}

              {/* Liste des paliers */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Paliers</p>
                {paliers.map((palier) => {
                  const reached = points >= palier.points
                  return (
                    <div
                      key={palier.points}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        reached ? 'bg-[#0F6E56]/5' : 'bg-gray-50'
                      }`}
                    >
                      <span className="text-base flex-shrink-0">{reached ? '✅' : '🎁'}</span>
                      <span className={`font-semibold tabular-nums flex-shrink-0 ${reached ? 'text-[#0F6E56]' : 'text-[#6B7280]'}`}>
                        {palier.points} pts
                      </span>
                      <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                      <span className={reached ? 'text-[#0F6E56] font-medium' : 'text-[#1A1A23]'}>
                        {palier.libelle}
                      </span>
                      {reached && (
                        <span className="ml-auto text-xs text-[#0F6E56] font-medium flex-shrink-0">Atteint !</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Total récompenses obtenues */}
              {carte.recompenses_obtenues > 0 && (
                <p className="text-xs text-[#6B7280] text-center pt-1">
                  🏆 {carte.recompenses_obtenues} récompense{carte.recompenses_obtenues > 1 ? 's' : ''} obtenue{carte.recompenses_obtenues > 1 ? 's' : ''} au total
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({ nom: '', email: '', rgpd: false })
  const [client, setClient] = useState<Client | null>(null)
  const [cartes, setCartes] = useState<CarteAvecCommercant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch cartes when on card step
  useEffect(() => {
    if (step !== 'card' || !client) return
    const supabase = createClient()
    supabase
      .from('cartes_fidelite')
      .select(`
        id, client_email, nombre_points, points_cumules_total, recompenses_obtenues, derniere_visite,
        commercants (
          nom_commerce, couleur_principale, paliers,
          points_pour_recompense, libelle_recompense, nom_programme
        )
      `)
      .eq('client_email', client.email)
      .order('derniere_visite', { ascending: false })
      .then(({ data }) => {
        if (data) setCartes(data as unknown as CarteAvecCommercant[])
      })
  }, [step, client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()

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

      const qrCodeId = 'QR-' + crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()

      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
          email: form.email.toLowerCase(),
          nom: form.nom,
          qr_code_id: qrCodeId,
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
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={form.rgpd}
                  onChange={(e) => setForm({ ...form, rgpd: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#534AB7] focus:ring-[#534AB7]/30 flex-shrink-0"
                />
                <span className="text-sm text-[#6B7280] leading-snug">
                  J&apos;accepte la{' '}
                  <Link href="/politique-confidentialite" target="_blank" className="text-[#534AB7] hover:underline font-medium">
                    politique de confidentialité
                  </Link>{' '}
                  et le traitement de mes données personnelles dans le cadre du programme de fidélité.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !form.rgpd}
                className="w-full bg-[#534AB7] text-white font-bold py-3.5 rounded-xl hover:bg-[#3C3489] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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

            {/* Mes récompenses */}
            <RecompensesSection cartes={cartes} />

            {/* Instructions */}
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
      <Footer />
    </div>
  )
}
