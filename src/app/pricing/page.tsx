'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowLeft, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
import Footer from '@/components/Footer'

const FEATURES_COMMUNES = [
  'Carte de fidélité digitale illimitée',
  'Clients et scans illimités',
  'QR codes uniques par client',
  'Dashboard analytics complet',
  'Système de récompenses personnalisable',
  'Notifications realtime à chaque scan',
  'Export CSV des données clients',
  'PWA installable (commerçant + client)',
  'Support par email',
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
        {/* Hero */}
        <div className="text-center mb-16 max-w-xl">
          <h1 className="text-4xl font-bold text-[#1A1A23] mb-4">Une seule offre. Deux rythmes.</h1>
          <p className="text-[#6B7280] text-lg">
            Toutes les fonctionnalités incluses. Vous choisissez le rythme qui vous convient.
          </p>
        </div>

        {/* Bloc fonctionnalités partagé */}
        <div className="w-full max-w-2xl mb-16">
          <h2 className="text-xl font-bold text-[#1A1A23] text-center mb-8">
            Tout ce dont vous avez besoin, dans les 2 formules
          </h2>
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {FEATURES_COMMUNES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check size={17} className="mt-0.5 flex-shrink-0 text-[#F59E0B]" />
                  <span className="text-sm text-[#374151]">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {checkoutError && (
          <div className="w-full max-w-2xl mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {checkoutError}
          </div>
        )}

        {/* Cards prix */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl items-start">
          {/* Mensuel — secondaire, outline bleu */}
          <div className="rounded-2xl p-8 flex flex-col border border-gray-200 bg-white">
            <h2 className="text-2xl font-bold text-[#1A1A23] mb-2">Mensuel</h2>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-5xl font-bold text-[#1A1A23]">39€</span>
              <span className="text-base pb-1.5 text-[#6B7280]">/mois</span>
            </div>
            <p className="text-sm text-[#6B7280] mb-8">Sans engagement, résiliable à tout moment</p>
            <button
              onClick={() => handleCheckout('mensuel')}
              disabled={loading === 'mensuel' || checkingAuth}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-colors border-2 border-[#2D4A8A] text-[#2D4A8A] hover:bg-[#2D4A8A]/5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading === 'mensuel' ? 'Redirection...' : 'Démarrer en mensuel'}
            </button>
          </div>

          {/* Annuel — mise en avant, orange */}
          <div className="rounded-2xl p-8 relative flex flex-col border-2 border-[#F59E0B] bg-white shadow-md shadow-[#F59E0B]/10">
            <div className="absolute -top-3.5 right-4 bg-[#F59E0B] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              Économisez 120€/an
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A23] mb-2">Annuel</h2>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-bold text-[#1A1A23]">29€</span>
              <span className="text-base pb-1.5 text-[#6B7280]">/mois</span>
            </div>
            <p className="text-sm text-[#6B7280] mb-4">Soit 348€ facturés une fois par an</p>
            <div className="flex items-start gap-2 bg-[#FFF9EC] border border-[#F59E0B]/30 rounded-xl px-4 py-3 mb-8">
              <Star size={16} className="text-[#F59E0B] flex-shrink-0 mt-0.5" fill="currentColor" />
              <p className="text-sm text-[#92400e] font-medium">
                Bonus annuel&nbsp;: accès prioritaire au Wallet Apple &amp; Google dès leur sortie
              </p>
            </div>
            <button
              onClick={() => handleCheckout('annuel')}
              disabled={loading === 'annuel' || checkingAuth}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-colors bg-[#F59E0B] text-[#1B2B4B] hover:bg-[#e08900] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading === 'annuel' ? 'Redirection...' : 'Démarrer en annuel'}
            </button>
          </div>
        </div>

        <p className="mt-6 text-sm text-center text-[#9CA3AF] max-w-lg">
          Vous pouvez basculer du mensuel à l&apos;annuel à tout moment depuis votre espace, sans frais supplémentaires.
        </p>

        <p className="mt-4 text-sm text-[#6B7280]">
          Paiement sécurisé par{' '}
          <span className="font-semibold text-[#635BFF]">Stripe</span>.
          Annulable à tout moment pour le plan mensuel.
        </p>
      </div>

      <Footer />
    </div>
  )
}
