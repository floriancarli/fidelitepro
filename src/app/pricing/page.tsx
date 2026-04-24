'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowLeft, Zap, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'

const PLANS = [
  {
    id: 'mensuel' as const,
    nom: 'Mensuel',
    badge: null,
    prix: 39,
    prixLabel: '39€',
    periode: '/mois',
    sousTitre: 'Sans engagement',
    facturation: null,
    highlight: false,
    features: [
      'Clients illimités',
      '1 programme de fidélité',
      'Notifications email automatiques',
      'Support email',
    ],
    cta: 'Commencer',
  },
  {
    id: 'annuel' as const,
    nom: 'Annuel',
    badge: 'Économisez 25%',
    prix: 29,
    prixLabel: '29€',
    periode: '/mois',
    sousTitre: 'Engagement annuel',
    facturation: 'Facturé 348€/an',
    highlight: true,
    features: [
      'Clients illimités',
      'Programmes de fidélité multiples',
      'Notifications email automatiques',
      'Analytics avancés',
      'Export CSV clients',
      'Support prioritaire',
    ],
    wallet: true,
    cta: 'Commencer',
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'mensuel' | 'annuel' | null>(null)
  const [checkoutError, setCheckoutError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
      setCheckingAuth(false)
    })
  }, [])

  const handleCheckout = async (plan: 'mensuel' | 'annuel') => {
    if (!isLoggedIn) {
      router.push(`/inscription?plan=${plan}`)
      return
    }
    setLoading(plan)
    setCheckoutError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || `Erreur ${res.status}`)
      }
      window.location.href = data.url
    } catch (err) {
      console.error('[checkout]', err)
      setCheckoutError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <Logo size="sm" />
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-16">
        <div className="text-center mb-12 max-w-xl">
          <h1 className="text-4xl font-bold text-[#1A1A23] mb-4">Tarifs simples et transparents</h1>
          <p className="text-[#6B7280] text-lg">
            Choisissez le plan qui correspond à votre activité. Pas de frais cachés.
          </p>
        </div>

        {checkoutError && (
          <div className="w-full max-w-3xl mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {checkoutError}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-8 relative flex flex-col ${
                plan.highlight
                  ? 'bg-[#2D4A8A] text-white shadow-2xl shadow-[#2D4A8A]/25 ring-2 ring-[#2D4A8A]'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  ⭐ {plan.badge}
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  {plan.highlight
                    ? <Zap size={16} className="text-yellow-300" />
                    : <Clock size={16} className="text-[#6B7280]" />
                  }
                  <span className={`text-sm font-semibold ${plan.highlight ? 'text-white/80' : 'text-[#6B7280]'}`}>
                    {plan.sousTitre}
                  </span>
                </div>
                <h2 className={`text-2xl font-bold ${plan.highlight ? 'text-white' : 'text-[#1A1A23]'}`}>
                  {plan.nom}
                </h2>
              </div>

              {/* Prix */}
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className={`text-5xl font-bold ${plan.highlight ? 'text-white' : 'text-[#1A1A23]'}`}>
                    {plan.prixLabel}
                  </span>
                  <span className={`text-base pb-1.5 ${plan.highlight ? 'text-white/70' : 'text-[#6B7280]'}`}>
                    {plan.periode}
                  </span>
                </div>
                {plan.facturation && (
                  <p className={`text-sm mt-1 ${plan.highlight ? 'text-white/60' : 'text-[#6B7280]'}`}>
                    {plan.facturation}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check
                      size={17}
                      className={`mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-green-300' : 'text-[#0F6E56]'}`}
                    />
                    <span className={`text-sm ${plan.highlight ? 'text-white/90' : 'text-[#374151]'}`}>{f}</span>
                  </li>
                ))}
                {plan.wallet && (
                  <li className="flex items-start gap-3">
                    <span className="text-base flex-shrink-0 mt-[-1px]">🔜</span>
                    <span className="text-sm text-white/70 italic">Wallet Apple &amp; Google — Bientôt disponible</span>
                  </li>
                )}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading === plan.id || checkingAuth}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  plan.highlight
                    ? 'bg-white text-[#2D4A8A] hover:bg-gray-50'
                    : 'bg-[#2D4A8A] text-white hover:bg-[#1e3a6e]'
                }`}
              >
                {loading === plan.id ? 'Redirection...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-[#6B7280]">
          Paiement sécurisé par{' '}
          <span className="font-semibold text-[#635BFF]">Stripe</span>.
          Annulable à tout moment pour le plan mensuel.
        </p>
      </div>

      <Footer />
    </div>
  )
}
