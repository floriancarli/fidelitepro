'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'

const LS_KEY = 'fidelite_client'

type CommercantInfo = {
  nom_commerce: string
  secteur_activite: string
  couleur_principale: string
  logo_url: string | null
}

export default function JoinPage() {
  const params = useParams()
  const merchantId = params.merchant_id as string
  const router = useRouter()

  const [commercant, setCommercant] = useState<CommercantInfo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState({ nom: '', email: '', password: '', confirm: '', cgu: false })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Already logged in → redirect to their QR code
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: client } = await supabase
        .from('clients')
        .select('qr_code_id')
        .eq('email', user.email!)
        .maybeSingle()
      if (client) router.replace(`/mon-qr-code/${client.qr_code_id}`)
    })
  }, [router])

  // Load merchant info
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('commercants')
      .select('nom_commerce, secteur_activite, couleur_principale, logo_url')
      .eq('id', merchantId)
      .single()
      .then(({ data }) => {
        if (data) setCommercant(data as CommercantInfo)
        else setNotFound(true)
      })
  }, [merchantId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.cgu) {
      setError('Vous devez accepter la politique de confidentialité pour vous inscrire.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)
    try {
      const email = form.email.toLowerCase().trim()
      const nom = form.nom.trim()

      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: merchantId, email, password: form.password, nom, cgu_accepted: form.cgu }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (json.error === 'EMAIL_TAKEN') {
          setError('Cet email est déjà utilisé.')
        } else {
          setError(json.error || 'Une erreur est survenue.')
        }
        return
      }

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      })

      if (signInError) {
        setError('Compte créé mais connexion échouée. Connectez-vous sur la page de connexion.')
        return
      }

      localStorage.setItem(LS_KEY, JSON.stringify({ qr_code_id: json.qr_code_id, email }))
      router.replace(`/mon-qr-code/${json.qr_code_id}`)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[#6B7280]">Commerce introuvable.</p>
        <Link href="/" className="text-[#2D4A8A] font-medium hover:underline text-sm">
          Retour à l&apos;accueil →
        </Link>
      </div>
    )
  }

  const color = commercant?.couleur_principale || '#2D4A8A'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <Logo size="sm" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-md">

          {/* Merchant header */}
          <div className="text-center mb-7">
            {!commercant ? (
              <div className="w-8 h-8 border-4 border-[#2D4A8A] border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              <>
                {commercant.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/logo/${merchantId}`}
                    alt={commercant.nom_commerce}
                    className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3"
                    style={{ backgroundColor: color }}
                  >
                    {commercant.nom_commerce.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <h1 className="text-xl font-bold text-[#1A1A23]">{commercant.nom_commerce}</h1>
                <p className="text-[#6B7280] text-sm">{commercant.secteur_activite}</p>
                <p className="text-sm mt-3 font-medium text-[#1A1A23]">
                  Créez votre carte de fidélité gratuite
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
              {error.includes('déjà utilisé') && (
                <>
                  {' '}
                  <Link
                    href={`/login?next=/mon-qr-code`}
                    className="underline font-medium"
                  >
                    Se connecter
                  </Link>
                </>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Prénom</label>
              <input
                type="text"
                required
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Marie"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="vous@exemple.fr"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="8 caractères minimum"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A23] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="Répétez votre mot de passe"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A23] transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-1">
              <input
                id="cgu-consent"
                type="checkbox"
                checked={form.cgu}
                onChange={(e) => setForm({ ...form, cgu: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 cursor-pointer flex-shrink-0 accent-[#2D4A8A]"
              />
              <label htmlFor="cgu-consent" className="text-sm text-[#6B7280] cursor-pointer leading-relaxed">
                J&apos;accepte la{' '}
                <Link
                  href="/politique-confidentialite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2D4A8A] hover:underline font-medium"
                >
                  politique de confidentialité
                </Link>
                {' '}et les{' '}
                <Link
                  href="/mentions-legales"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2D4A8A] hover:underline font-medium"
                >
                  mentions légales
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !commercant || !form.cgu}
              className="w-full text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: color }}
            >
              {loading ? 'Création…' : 'Obtenir ma carte de fidélité'}
            </button>
          </form>

          <p className="text-center text-xs text-[#6B7280] mt-6">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-[#2D4A8A] font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
