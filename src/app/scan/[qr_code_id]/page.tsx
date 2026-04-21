'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Gift, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Commercant } from '@/lib/types'

export default function ScanPage() {
  const params = useParams()
  const router = useRouter()
  const qrCodeId = params.qr_code_id as string

  const [commercant, setCommercant] = useState<Commercant | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState({ prenom: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('commercants')
      .select('*')
      .eq('qr_code_id', qrCodeId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setCommercant(data)
      })
  }, [qrCodeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commercant) return
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()

      // Chercher carte existante
      const { data: existing } = await supabase
        .from('cartes_fidelite')
        .select('*')
        .eq('commercant_id', commercant.id)
        .eq('client_email', form.email.toLowerCase())
        .single()

      let carteId: string
      let newPoints: number
      let recompenseDeclenchee = false

      if (!existing) {
        // Nouvelle carte
        newPoints = commercant.points_par_visite
        const { data: newCarte, error: insertError } = await supabase
          .from('cartes_fidelite')
          .insert({
            commercant_id: commercant.id,
            client_email: form.email.toLowerCase(),
            client_prenom: form.prenom,
            nombre_points: newPoints,
            points_cumules_total: newPoints,
            derniere_visite: new Date().toISOString(),
            recompenses_obtenues: 0,
          })
          .select()
          .single()

        if (insertError) throw insertError
        carteId = newCarte.id
      } else {
        // Mise à jour
        newPoints = existing.nombre_points + commercant.points_par_visite
        carteId = existing.id

        let pointsFinal = newPoints
        let recompensesObtenues = existing.recompenses_obtenues

        if (newPoints >= commercant.points_pour_recompense) {
          recompenseDeclenchee = true
          pointsFinal = newPoints - commercant.points_pour_recompense
          recompensesObtenues += 1

          // Créer la récompense
          await supabase.from('recompenses').insert({
            carte_fidelite_id: carteId,
            commercant_id: commercant.id,
            libelle: commercant.libelle_recompense,
            utilisee: false,
            date_obtention: new Date().toISOString(),
          })
        }

        const { error: updateError } = await supabase
          .from('cartes_fidelite')
          .update({
            nombre_points: pointsFinal,
            points_cumules_total: existing.points_cumules_total + commercant.points_par_visite,
            derniere_visite: new Date().toISOString(),
            recompenses_obtenues: recompensesObtenues,
          })
          .eq('id', carteId)

        if (updateError) throw updateError
        newPoints = pointsFinal
      }

      // Enregistrer le scan
      await supabase.from('scans').insert({
        carte_fidelite_id: carteId,
        commercant_id: commercant.id,
        points_ajoutes: commercant.points_par_visite,
        points_apres_scan: newPoints,
        recompense_declenchee: recompenseDeclenchee,
      })

      router.push(`/confirmation/${carteId}${recompenseDeclenchee ? '?recompense=1' : ''}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl mb-2">QR code invalide</p>
          <p className="text-[#6B7280]">Ce QR code ne correspond à aucun commerce.</p>
        </div>
      </div>
    )
  }

  if (!commercant) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const couleur = commercant.couleur_principale || '#534AB7'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${couleur} 0%, ${couleur}cc 100%)` }}>
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
          <Star size={28} className="text-white" fill="white" />
        </div>
        <h1 className="text-2xl font-bold">Bienvenue chez</h1>
        <h2 className="text-3xl font-bold mt-1">{commercant.nom_commerce}</h2>

        <div className="mt-4 bg-white/10 border border-white/20 rounded-xl px-4 py-3 inline-flex items-center gap-2 text-sm">
          <Gift size={16} />
          <span>
            {commercant.points_par_visite} point{commercant.points_par_visite > 1 ? 's' : ''} par visite · {commercant.points_pour_recompense} points = <strong>{commercant.libelle_recompense}</strong>
          </span>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10">
        <h3 className="text-xl font-bold text-center mb-2">Valider ma visite</h3>
        <p className="text-[#6B7280] text-sm text-center mb-8">Entrez vos informations pour gagner vos points</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Votre prénom</label>
            <input
              type="text"
              required
              value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              placeholder="Ex: Marie"
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
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
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: couleur }}
            className="w-full text-white font-bold py-4 rounded-xl text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Validation...' : 'Valider ma visite 🎯'}
          </button>
        </form>

        <p className="text-center text-xs text-[#6B7280] mt-8">
          Vos données sont uniquement utilisées pour votre carte de fidélité.
        </p>
      </div>
    </div>
  )
}
