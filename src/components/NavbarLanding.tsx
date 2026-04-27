'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function NavbarLanding() {
  const [open, setOpen] = useState(false)

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo size="md" />

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-[#2D4A8A] transition-colors">
            Connexion
          </Link>
          <Link
            href="/pricing"
            className="bg-[#2D4A8A] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1e3a6e] transition-colors"
          >
            Commencer
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl text-[#1A1A23] hover:bg-gray-100 transition-colors"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="sm:hidden fixed inset-x-0 top-16 bottom-0 bg-white z-40 flex flex-col gap-3 p-6 border-t border-gray-100">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center py-4 rounded-2xl text-base font-medium text-[#1A1A23] border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center py-4 rounded-2xl text-base font-semibold bg-[#2D4A8A] text-white hover:bg-[#1e3a6e] transition-colors"
          >
            Commencer — voir les tarifs
          </Link>
        </div>
      )}
    </header>
  )
}
