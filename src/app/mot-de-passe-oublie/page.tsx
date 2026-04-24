'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/nouveau-mot-de-passe`,
      })
      if (resetError) throw resetError
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-8">
          <Logo size="lg" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-md">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#1A1A23] transition-colors mb-6"
          >
            <ArrowLeft size={15} />
            Retour à la connexion
          </Link>

          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={40} className="text-[#0F6E56] mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">Email envoyé</h1>
              <p className="text-[#6B7280] text-sm leading-relaxed">
                Un lien de réinitialisation a été envoyé à{' '}
                <strong className="text-[#1A1A23]">{email}</strong>.
                Vérifiez aussi vos spams.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2">Mot de passe oublié</h1>
              <p className="text-[#6B7280] text-sm mb-6">
                Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.fr"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2D4A8A] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a6e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Envoi…' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
