import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Logo from '@/components/Logo'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#0F6E56]/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-[#0F6E56]" />
        </div>
        <div className="mb-4">
          <Logo size="sm" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A23] mb-3">Paiement réussi !</h1>
        <p className="text-[#6B7280] mb-8 leading-relaxed">
          Votre abonnement est actif. Vous pouvez maintenant utiliser toutes les
          fonctionnalités de FidèlePro.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 w-full bg-[#534AB7] text-white font-semibold py-3.5 rounded-xl hover:bg-[#3C3489] transition-colors"
        >
          Accéder à mon dashboard
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  )
}
