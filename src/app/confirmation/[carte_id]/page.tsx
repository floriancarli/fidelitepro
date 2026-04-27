'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Gift, Star, Clock, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CarteFidelite, Commercant, Scan } from '@/lib/types'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export default function ConfirmationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const carteId = params.carte_id as string
  const recompenseDeclenchee = searchParams.get('recompense') === '1'

  const [carte, setCarte] = useState<CarteFidelite | null>(null)
  const [commercant, setCommercant] = useState<Commercant | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('cartes_fidelite')
      .select('*, clients(nom)')
      .eq('id', carteId)
      .single()
      .then(async ({ data: carteData, error }) => {
        if (error || !carteData) { setNotFound(true); return }
        setCarte(carteData)

        const [{ data: comm }, { data: scansData }] = await Promise.all([
          supabase.from('commercants').select('*').eq('id', carteData.commercant_id).single(),
          supabase.from('scans').select('*').eq('carte_fidelite_id', carteId).order('created_at', { ascending: false }).limit(5),
        ])

        setCommercant(comm)
        setScans(scansData || [])
      })
  }, [carteId])

  if (notFound) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl mb-2">Carte introuvable</p>
          <p className="text-[#6B7280]">Cette carte de fidélité n&apos;existe pas.</p>
        </div>
      </div>
    )
  }

  if (!carte || !commercant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D4A8A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const couleur = commercant.couleur_principale || '#2D4A8A'
  type Palier = { points: number; libelle: string }
  const paliers: Palier[] = Array.isArray(commercant.paliers) && (commercant.paliers as Palier[]).length > 0
    ? [...(commercant.paliers as Palier[])].sort((a, b) => a.points - b.points)
    : [{ points: commercant.points_pour_recompense, libelle: commercant.libelle_recompense }]
  const nextPalier = paliers.find((p) => p.points > carte.nombre_points)
  const progressTarget = nextPalier?.points ?? paliers[paliers.length - 1].points
  const pointsRestants = progressTarget - carte.nombre_points
  const progressPct = Math.min(100, Math.round((carte.nombre_points / progressTarget) * 100))

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* Header */}
      <div className="text-white text-center py-10 px-6" style={{ background: `linear-gradient(135deg, ${couleur} 0%, ${couleur}cc 100%)` }}>
        <CheckCircle size={48} className="mx-auto mb-3 text-white" />
        <h1 className="text-2xl font-bold">Merci pour votre visite !</h1>
        <p className="text-white/80 mt-1">{commercant.nom_commerce}</p>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 space-y-4">
        {/* Récompense débloquée */}
        {recompenseDeclenchee && (
          <div className="bg-[#0F6E56] text-white rounded-2xl p-5 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Gift size={24} />
            </div>
            <div>
              <p className="font-bold text-lg">Félicitations !</p>
              <p className="text-white/90 text-sm mt-0.5">Vous avez débloqué : <strong>{commercant.libelle_recompense}</strong></p>
            </div>
          </div>
        )}

        {/* Carte de fidélité */}
        <div className="rounded-2xl text-white p-6 shadow-lg" style={{ background: `linear-gradient(135deg, ${couleur} 0%, ${couleur}cc 100%)` }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/70 text-sm font-medium">Carte de fidélité</p>
            <Star size={16} className="text-white/50" />
          </div>
          <h2 className="text-xl font-bold mb-4">Bonjour {carte.client_nom || carte.client_email} 👋</h2>

          <div className="text-center mb-4">
            <p className="text-5xl font-bold">{carte.nombre_points}</p>
            <p className="text-white/70 text-sm">/ {progressTarget} points</p>
          </div>

          {/* Barre de progression */}
          <div className="bg-white/20 rounded-full h-3 mb-2">
            <div
              className="h-3 rounded-full bg-white transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p className="text-center text-sm text-white/80">
            {pointsRestants > 0
              ? `Plus que ${pointsRestants} point${pointsRestants > 1 ? 's' : ''} pour votre récompense !`
              : `Vous avez atteint le palier !`
            }
          </p>

          <div className="flex justify-between mt-4 pt-4 border-t border-white/20 text-sm">
            <div>
              <p className="text-white/60">Récompenses obtenues</p>
              <p className="font-bold">{carte.recompenses_obtenues}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60">Points cumulés</p>
              <p className="font-bold">{carte.points_cumules_total}</p>
            </div>
          </div>
        </div>

        {/* Dernières visites */}
        {scans.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock size={16} className="text-[#6B7280]" />
              Dernières visites
            </h3>
            <div className="space-y-3">
              {scans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">{formatDate(scan.created_at)}</span>
                  <div className="flex items-center gap-2">
                    {scan.recompense_declenchee && (
                      <span className="bg-[#0F6E56]/10 text-[#0F6E56] text-xs px-2 py-0.5 rounded-full font-medium">
                        Récompense !
                      </span>
                    )}
                    <span className="font-medium text-[#2D4A8A]">+{scan.points_ajoutes} pt</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-sm text-[#6B7280]">
            Présentez cette page lors de votre prochaine visite, ou retrouvez votre carte en rescannant le QR code.
          </p>
        </div>
      </div>
    </div>
  )
}
