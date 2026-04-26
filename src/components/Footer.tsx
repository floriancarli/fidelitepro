import Link from 'next/link'
import { Logo } from './Logo'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-6 px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo size="sm" />
        <p className="text-[#6B7280] text-xs">© 2026 Orlyo. Tous droits réservés.</p>
        <div className="flex gap-5 text-xs text-[#6B7280]">
          <Link href="/mentions-legales" className="hover:text-[#2D4A8A] transition-colors">Mentions légales</Link>
          <Link href="/politique-confidentialite" className="hover:text-[#2D4A8A] transition-colors">Politique de confidentialité</Link>
        </div>
      </div>
    </footer>
  )
}
