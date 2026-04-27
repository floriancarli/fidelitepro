'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { usePathname } from 'next/navigation'

export default function NavbarLanding() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close on navigation
  useEffect(() => { setOpen(false) }, [pathname])

  // Lock scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    // Fragment so the drawer is a sibling of <header>, not inside it.
    // backdrop-filter on <header> would create a containing block for position:fixed
    // descendants, clipping the drawer to the header's bounds.
    <>
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="md" />

          {/* Desktop nav */}
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
      </header>

      {/* Mobile drawer — sibling of header, NOT inside it */}
      {open && (
        <div className="sm:hidden fixed inset-0 top-16 z-[60] flex flex-col bg-white border-t border-gray-100 shadow-xl px-6 pt-6 gap-3">
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
    </>
  )
}
