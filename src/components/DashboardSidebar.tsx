'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, QrCode, Gift, UserCircle, LogOut, BadgeCheck, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Logo from './Logo'
import type { Commercant } from '@/lib/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/qr-code', label: 'Mon QR Code', icon: QrCode },
  { href: '/dashboard/recompenses', label: 'Récompenses', icon: Gift },
  { href: '/dashboard/configuration', label: 'Configuration', icon: Settings },
  { href: '/mon-compte', label: 'Mon Compte', icon: UserCircle },
]

export default function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [commercant, setCommercant] = useState<Commercant | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('commercants')
        .select('*')
        .eq('id', user.id)
        .single()
      setCommercant(data)
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const initiales = commercant?.nom_commerce?.slice(0, 2).toUpperCase() || '??'

  return (
    <aside className="w-64 min-h-screen bg-[#534AB7] flex flex-col text-white">
      <div className="px-6 py-6 border-b border-white/10">
        <Logo white size="md" />
      </div>

      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
            {initiales}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-sm">{commercant?.nom_commerce || '...'}</p>
            <p className="text-white/60 text-xs truncate">{commercant?.secteur_activite || ''}</p>
          </div>
        </div>
        {commercant?.abonnement_actif ? (
          <div className="mt-3 flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-xs">
            <BadgeCheck size={14} className="text-green-300" />
            <span className="text-green-300 font-medium">Abonnement actif</span>
          </div>
        ) : commercant && (
          <Link
            href="/pricing"
            className="mt-3 flex items-center gap-1.5 bg-yellow-400/20 border border-yellow-400/30 rounded-lg px-3 py-1.5 text-xs hover:bg-yellow-400/30 transition-colors"
          >
            <span className="text-yellow-300 font-medium">⚡ Activer mon compte</span>
          </Link>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
