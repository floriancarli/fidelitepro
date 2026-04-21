'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Save, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Commercant, Palier } from '@/lib/types'

type FormState = {
  points_par_visite: number
  nom_programme: string
  message_bienvenue: string
  paliers: Palier[]
}

export default function ConfigurationPage() {
  const [commercant, setCommercant] = useState<Commercant | null>(null)
  const [form, setForm] = useState<FormState>({
    points_par_visite: 1,
    nom_programme: '',
    message_bienvenue: '',
    paliers: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('commercants').select('*').eq('id', user.id).single()
    if (data) {
      setCommercant(data)
      setForm({
        points_par_visite: data.points_par_visite ?? 1,
        nom_programme: data.nom_programme ?? '',
        message_bienvenue: data.message_bienvenue ?? '',
        paliers: Array.isArray(data.paliers) && data.paliers.length > 0
          ? data.paliers
          : [{ points: data.points_pour_recompense ?? 10, libelle: data.libelle_recompense ?? 'Offre spéciale' }],
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    setSaved(false)

    if (form.paliers.length === 0) {
      setError('Ajoutez au moins un palier de récompense.')
      setSaving(false)
      return
    }
    if (form.paliers.some((p) => !p.libelle.trim() || p.points < 1)) {
      setError('Chaque palier doit avoir un libellé et un nombre de points ≥ 1.')
      setSaving(false)
      return
    }

    const sortedPaliers = [...form.paliers].sort((a, b) => a.points - b.points)
    const palierMin = sortedPaliers[0]

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('commercants')
        .update({
          points_par_visite: form.points_par_visite,
          nom_programme: form.nom_programme,
          message_bienvenue: form.message_bienvenue,
          paliers: sortedPaliers,
          // Sync legacy fields to lowest tier
          points_pour_recompense: palierMin.points,
          libelle_recompense: palierMin.libelle,
        })
        .eq('id', commercant!.id)

      if (updateError) throw updateError
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const addPalier = () => {
    const lastPoints = form.paliers.length > 0 ? form.paliers[form.paliers.length - 1].points : 0
    setForm((f) => ({ ...f, paliers: [...f.paliers, { points: lastPoints + 10, libelle: '' }] }))
  }

  const updatePalier = (index: number, field: keyof Palier, value: string | number) => {
    setForm((f) => {
      const updated = [...f.paliers]
      updated[index] = { ...updated[index], [field]: value }
      return { ...f, paliers: updated }
    })
  }

  const removePalier = (index: number) => {
    setForm((f) => ({ ...f, paliers: f.paliers.filter((_, i) => i !== index) }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 border-4 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A23]">Configuration</h1>
        <p className="text-[#6B7280] text-sm mt-1">Personnalisez votre programme de fidélité</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-[#0F6E56]/10 border border-[#0F6E56]/20 text-[#0F6E56] rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
          <CheckCircle size={16} />
          Configuration sauvegardée
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Programme */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#1A1A23]">Programme</h2>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">
              Nom du programme
            </label>
            <input
              type="text"
              value={form.nom_programme}
              onChange={(e) => setForm({ ...form, nom_programme: e.target.value })}
              placeholder="Ex: Club Fidélité Martin"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">
              Message de bienvenue
            </label>
            <textarea
              value={form.message_bienvenue}
              onChange={(e) => setForm({ ...form, message_bienvenue: e.target.value })}
              placeholder="Ex: Bienvenue dans notre programme de fidélité !"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Points */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-[#1A1A23] mb-4">Points</h2>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">
              Points par visite
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={100}
                required
                value={form.points_par_visite}
                onChange={(e) => setForm({ ...form, points_par_visite: parseInt(e.target.value) || 1 })}
                className="w-28 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
              />
              <span className="text-sm text-[#6B7280]">point{form.points_par_visite > 1 ? 's' : ''} crédité{form.points_par_visite > 1 ? 's' : ''} à chaque scan</span>
            </div>
          </div>
        </div>

        {/* Paliers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-[#1A1A23]">Paliers de récompense</h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Quand un client atteint le seuil de points, il débloque la récompense correspondante
              </p>
            </div>
            <button
              type="button"
              onClick={addPalier}
              className="flex items-center gap-1.5 text-sm text-[#534AB7] font-medium hover:bg-[#534AB7]/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Ajouter
            </button>
          </div>

          {form.paliers.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280] text-sm border border-dashed border-gray-200 rounded-xl">
              Aucun palier défini — cliquez sur &quot;Ajouter&quot;
            </div>
          ) : (
            <div className="space-y-3">
              {form.paliers.map((palier, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="number"
                      min={1}
                      required
                      value={palier.points}
                      onChange={(e) => updatePalier(index, 'points', parseInt(e.target.value) || 1)}
                      className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors bg-white"
                    />
                    <span className="text-xs text-[#6B7280] whitespace-nowrap">pts</span>
                  </div>
                  <span className="text-[#6B7280] text-sm">→</span>
                  <input
                    type="text"
                    required
                    value={palier.libelle}
                    onChange={(e) => updatePalier(index, 'libelle', e.target.value)}
                    placeholder="Ex: Café offert"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removePalier(index)}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#534AB7] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#3C3489] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#534AB7]/20"
        >
          <Save size={18} />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </form>
    </div>
  )
}
