'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, QrCode, Gift, UserCircle, LogOut, BadgeCheck, Settings, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isDemoEmail } from '@/lib/useDemo'
import type { Commercant } from '@/lib/types'

export default function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [commercant, setCommercant] = useState<Commercant | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [pendingRewards, setPendingRewards] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setIsDemo(isDemoEmail(user.email))
      const [{ data: comm }, { count }] = await Promise.all([
        supabase.from('commercants').select('*').eq('id', user.id).single(),
        supabase.from('recompenses').select('*', { count: 'exact', head: true }).eq('commercant_id', user.id).eq('utilisee', false),
      ])
      setCommercant(comm)
      setPendingRewards(count ?? 0)
    })
  }, [])

  useEffect(() => {
    const handleValidated = () => setPendingRewards((n) => Math.max(0, n - 1))
    window.addEventListener('reward:validated', handleValidated)
    return () => window.removeEventListener('reward:validated', handleValidated)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const initiales = commercant?.nom_commerce?.slice(0, 2).toUpperCase() || '??'

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, proOnly: false, badge: 0 },
    { href: '/dashboard/qr-code', label: 'Mon QR Code', icon: QrCode, proOnly: false, badge: 0 },
    { href: '/dashboard/recompenses', label: 'Récompenses', icon: Gift, proOnly: false, badge: pendingRewards },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2, proOnly: true, badge: 0 },
    { href: '/dashboard/configuration', label: 'Configuration', icon: Settings, proOnly: false, badge: 0 },
    { href: '/mon-compte', label: 'Mon Compte', icon: UserCircle, proOnly: false, badge: 0 },
  ]

  return (
    <aside className="w-64 min-h-screen bg-[#2D4A8A] flex flex-col text-white">
      <div className="px-6 py-6">
        <Link href="/">
          <div style={{ background: 'white', borderRadius: '8px', padding: '4px', display: 'inline-block' }}>
            <img src="/logo-orlyo.png" alt="Orlyo" width={50} height={50} style={{ objectFit: 'contain', display: 'block' }} />
          </div>
        </Link>
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
        {isDemo ? (
          <Link href="/pricing" className="mt-3 flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 rounded-lg px-3 py-1.5 text-xs hover:bg-amber-400/30 transition-colors">
            <span className="text-amber-300 font-medium">🎭 Mode démo — Créer un compte</span>
          </Link>
        ) : commercant?.abonnement_actif ? (
          <div className="mt-3 flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-xs">
            <BadgeCheck size={14} className="text-green-300" />
            <span className="text-green-300 font-medium">Abonnement actif</span>
          </div>
        ) : commercant && (
          <Link href="/pricing" className="mt-3 flex items-center gap-1.5 bg-yellow-400/20 border border-yellow-400/30 rounded-lg px-3 py-1.5 text-xs hover:bg-yellow-400/30 transition-colors">
            <span className="text-yellow-300 font-medium">⚡ Activer mon compte</span>
          </Link>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, proOnly, badge }) => {
          const active = pathname === href
          const isPro = commercant?.plan_actif === 'annuel'
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-white/10 text-white border-l-2 border-[#F59E0B]' : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="text-[10px] font-bold bg-[#F59E0B] text-white px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center">
                  {badge}
                </span>
              )}
              {proOnly && !isPro && !badge && (
                <span className="text-[10px] font-semibold bg-[#F59E0B] text-white px-1.5 py-0.5 rounded-full leading-none">Annuel</span>
              )}
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
