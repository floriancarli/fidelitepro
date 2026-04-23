'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'

const secteurs = [
  'Boulangerie / Pâtisserie',
  'Restauration',
  'Café / Bar',
  'Épicerie / Alimentation',
  'Coiffure / Beauté',
  'Sport / Bien-être',
  'Librairie / Papeterie',
  'Mode / Vêtements',
  'Pharmacie / Parapharmacie',
  'Autre',
]

function generateQrCodeId(nomCommerce: string): string {
  const letters = nomCommerce
    .replace(/[^a-zA-ZÀ-ÿ]/g, '')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X')
  const nums = Math.floor(100 + Math.random() * 900).toString()
  return `QR-${letters}-${nums}`
}

function InscriptionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') // 'mensuel' | 'annuel' | null
  const [form, setForm] = useState({
    nomCommerce: '',
    secteur: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Erreur lors de la création du compte')

      const qrCodeId = generateQrCodeId(form.nomCommerce)

      const { error: dbError } = await supabase.from('commercants').insert({
        id: authData.user.id,
        nom_commerce: form.nomCommerce,
        secteur_activite: form.secteur,
        qr_code_id: qrCodeId,
        points_par_visite: 1,
        points_pour_recompense: 10,
        libelle_recompense: 'Offre spéciale',
        couleur_principale: '#534AB7',
        abonnement_actif: false,
      })

      if (dbError) throw dbError

      // Redirect to pricing for payment (keep plan param if present)
      router.push(plan ? `/pricing` : '/pricing')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo size="lg" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Créer votre compte</h1>
        <p className="text-[#6B7280] text-sm mb-6">Commencez à fidéliser vos clients en quelques minutes</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">
              Nom de votre commerce
            </label>
            <input
              type="text"
              required
              value={form.nomCommerce}
              onChange={(e) => setForm({ ...form, nomCommerce: e.target.value })}
              placeholder="Ex: Boulangerie Martin"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">
              Secteur d&apos;activité
            </label>
            <select
              required
              value={form.secteur}
              onChange={(e) => setForm({ ...form, secteur: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors bg-white"
            >
              <option value="">Choisir un secteur</option>
              {secteurs.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="vous@exemple.fr"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 caractères"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#534AB7] text-white font-semibold py-3 rounded-xl hover:bg-[#3C3489] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-[#534AB7] font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
      </div>
      <Footer />
    </div>
  )
}

export default function InscriptionPage() {
  return (
    <Suspense>
      <InscriptionForm />
    </Suspense>
  )
}
