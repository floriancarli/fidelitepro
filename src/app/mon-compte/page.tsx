'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Check, AlertTriangle, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Commercant } from '@/lib/types'

export default function MonComptePage() {
  const router = useRouter()
  const [commercant, setCommercant] = useState<Commercant | null>(null)
  const [form, setForm] = useState({
    nom_commerce: '',
    secteur_activite: '',
    libelle_recompense: '',
    points_par_visite: 1,
    points_pour_recompense: 10,
    couleur_principale: '#2D4A8A',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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
        couleur_principale: (data.couleur_principale ?? '#2D4A8A').replace(/^#534ab7$/i, '#2D4A8A'),
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER' || !deletePassword) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/account/delete-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })
      const json = await res.json()
      if (!res.ok) {
        setDeleteError(json.error || 'Une erreur est survenue.')
        return
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      router.replace('/')
    } catch {
      setDeleteError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!commercant) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 border-4 border-[#2D4A8A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Supprimer mon compte</h3>
            <p className="text-sm text-[#6B7280] text-center mb-5 leading-relaxed">
              Cette action est <strong className="text-[#1A1A23]">irréversible</strong>. Toutes vos données, votre programme de fidélité et votre historique seront définitivement supprimés.
            </p>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
                {deleteError}
              </div>
            )}

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">
                  Confirmez votre mot de passe
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Votre mot de passe actuel"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">
                  Tapez <span className="font-mono font-bold">SUPPRIMER</span> pour confirmer
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletePassword('')
                  setDeleteConfirmText('')
                  setDeleteError('')
                }}
                className="flex-1 border border-gray-200 text-[#1A1A23] font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'SUPPRIMER' || !deletePassword || deleteLoading}
                className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold">Informations du commerce</h2>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Nom du commerce</label>
            <input
              type="text"
              required
              value={form.nom_commerce}
              onChange={(e) => setForm({ ...form, nom_commerce: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Secteur d&apos;activité</label>
            <input
              type="text"
              value={form.secteur_activite}
              onChange={(e) => setForm({ ...form, secteur_activite: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] transition-colors"
            />
          </div>

        </div>

        {/* Programme fidélité */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold">Programme de fidélité</h2>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Libellé de la récompense</label>
            <input
              type="text"
              value={form.libelle_recompense}
              onChange={(e) => setForm({ ...form, libelle_recompense: e.target.value })}
              placeholder="Ex: Croissant offert, Café gratuit..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] transition-colors"
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
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] transition-colors"
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
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] transition-colors"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 text-sm text-[#6B7280]">
            Avec cette configuration, vos clients auront besoin de{' '}
            <strong className="text-[#1A1A23]">
              {Math.ceil(form.points_pour_recompense / form.points_par_visite)} visite{Math.ceil(form.points_pour_recompense / form.points_par_visite) > 1 ? 's' : ''}
            </strong>{' '}
            pour obtenir <strong className="text-[#1A1A23]">{form.libelle_recompense || 'leur récompense'}</strong>.
          </div>
        </div>

        {/* Personnalisation */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
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
                placeholder="#2D4A8A"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] transition-colors"
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
          className="w-full flex items-center justify-center gap-2 bg-[#2D4A8A] text-white font-semibold py-3.5 rounded-xl hover:bg-[#1e3a6e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
        </button>
      </form>

      {/* Zone de danger */}
      <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <h2 className="font-semibold text-[#1A1A23]">Zone de danger</h2>
            <p className="text-sm text-[#6B7280] mt-0.5 leading-relaxed">
              La suppression de votre compte est définitive et irréversible. Toutes vos données,
              votre programme de fidélité et vos clients seront effacés conformément au RGPD Art. 17.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 border border-red-300 text-red-600 font-medium px-4 py-2.5 rounded-xl hover:bg-red-100 transition-colors text-sm"
        >
          <Trash2 size={15} />
          Supprimer mon compte définitivement
        </button>
      </div>
    </div>
    </>
  )
}
