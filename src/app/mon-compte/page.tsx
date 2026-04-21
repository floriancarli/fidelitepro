'use client'

import { useEffect, useState, useCallback } from 'react'
import { Save, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Commercant } from '@/lib/types'

export default function MonComptePage() {
  const [commercant, setCommercant] = useState<Commercant | null>(null)
  const [form, setForm] = useState({
    nom_commerce: '',
    secteur_activite: '',
    libelle_recompense: '',
    points_par_visite: 1,
    points_pour_recompense: 10,
    couleur_principale: '#534AB7',
  })
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
        nom_commerce: data.nom_commerce,
        secteur_activite: data.secteur_activite,
        libelle_recompense: data.libelle_recompense,
        points_par_visite: data.points_par_visite,
        points_pour_recompense: data.points_pour_recompense,
        couleur_principale: data.couleur_principale,
      })
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commercant) return
    setError('')
    setSaving(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('commercants')
        .update(form)
        .eq('id', commercant.id)

      if (updateError) throw updateError
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      load()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !commercant) return
    const file = e.target.files[0]
    const supabase = createClient()

    const ext = file.name.split('.').pop()
    const path = `logos/${commercant.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true })

    if (uploadError) { setError('Erreur upload logo'); return }

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)

    await supabase
      .from('commercants')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', commercant.id)

    load()
  }

  if (!commercant) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 border-4 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mon Compte</h1>
        <p className="text-[#6B7280] text-sm mt-1">Configurez votre programme de fidélité</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-[#0F6E56]/10 border border-[#0F6E56]/20 text-[#0F6E56] rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
          <Check size={16} />
          Modifications sauvegardées !
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Infos commerce */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold">Informations du commerce</h2>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Nom du commerce</label>
            <input
              type="text"
              required
              value={form.nom_commerce}
              onChange={(e) => setForm({ ...form, nom_commerce: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Secteur d&apos;activité</label>
            <input
              type="text"
              value={form.secteur_activite}
              onChange={(e) => setForm({ ...form, secteur_activite: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#534AB7]/10 file:text-[#534AB7] hover:file:bg-[#534AB7]/20"
            />
            {commercant.logo_url && (
              <img src={commercant.logo_url} alt="Logo" className="mt-2 h-16 object-contain rounded-lg border border-gray-100" />
            )}
          </div>
        </div>

        {/* Programme fidélité */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold">Programme de fidélité</h2>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Libellé de la récompense</label>
            <input
              type="text"
              value={form.libelle_recompense}
              onChange={(e) => setForm({ ...form, libelle_recompense: e.target.value })}
              placeholder="Ex: Croissant offert, Café gratuit..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Points par visite</label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.points_par_visite}
                onChange={(e) => setForm({ ...form, points_par_visite: parseInt(e.target.value) || 1 })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Points pour récompense</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={form.points_pour_recompense}
                onChange={(e) => setForm({ ...form, points_pour_recompense: parseInt(e.target.value) || 10 })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
              />
            </div>
          </div>

          <div className="bg-[#F9F9FB] rounded-xl p-4 text-sm text-[#6B7280]">
            Avec cette configuration, vos clients auront besoin de{' '}
            <strong className="text-[#1A1A23]">
              {Math.ceil(form.points_pour_recompense / form.points_par_visite)} visite{Math.ceil(form.points_pour_recompense / form.points_par_visite) > 1 ? 's' : ''}
            </strong>{' '}
            pour obtenir <strong className="text-[#1A1A23]">{form.libelle_recompense || 'leur récompense'}</strong>.
          </div>
        </div>

        {/* Personnalisation */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold">Personnalisation</h2>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Couleur principale</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.couleur_principale}
                onChange={(e) => setForm({ ...form, couleur_principale: e.target.value })}
                className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1"
              />
              <input
                type="text"
                value={form.couleur_principale}
                onChange={(e) => setForm({ ...form, couleur_principale: e.target.value })}
                placeholder="#534AB7"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
              />
            </div>
            <div className="mt-2 rounded-xl p-3 text-white text-sm font-medium" style={{ backgroundColor: form.couleur_principale }}>
              Aperçu de votre couleur
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-[#534AB7] text-white font-semibold py-3.5 rounded-xl hover:bg-[#3C3489] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
        </button>
      </form>
    </div>
  )
}
