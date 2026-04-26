'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
import Footer from '@/components/Footer'

const LS_KEY = 'fidelite_client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (authError) throw authError

      // Redirect priority: next param → merchant dashboard → client QR code
      if (next) {
        router.push(next)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Check if merchant
      const { data: commercant } = await supabase
        .from('commercants')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (commercant) {
        router.push('/dashboard')
        return
      }

      // Client — check localStorage first
      try {
        const stored = localStorage.getItem(LS_KEY)
        if (stored) {
          const { qr_code_id } = JSON.parse(stored)
          if (qr_code_id) { router.push(`/mon-qr-code/${qr_code_id}`); return }
        }
      } catch { /* ignore */ }

      // Fallback: look up client record by email
      const { data: client } = await supabase
        .from('clients')
        .select('qr_code_id')
        .eq('email', user.email!)
        .maybeSingle()

      if (client) {
        localStorage.setItem(LS_KEY, JSON.stringify({ qr_code_id: client.qr_code_id, email: user.email }))
        router.push(`/mon-qr-code/${client.qr_code_id}`)
      } else {
        router.push('/register')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-md">
      <h1 className="text-2xl font-bold mb-2">Connexion</h1>
      <p className="text-[#6B7280] text-sm mb-6">Accédez à votre espace</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1A1A23] mb-1.5">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="vous@exemple.fr"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-[#1A1A23]">Mot de passe</label>
            <Link
              href="/mot-de-passe-oublie"
              className="text-xs text-[#2D4A8A] hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Votre mot de passe"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2D4A8A] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3a6e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <p className="text-center text-sm text-[#6B7280] mt-6">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="text-[#2D4A8A] font-medium hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-8">
          <Logo size="lg" />
        </div>
        <Suspense fallback={
          <div className="w-8 h-8 border-4 border-[#2D4A8A] border-t-transparent rounded-full animate-spin" />
        }>
          <LoginForm />
        </Suspense>
      </div>
      <Footer />
    </div>
  )
}
