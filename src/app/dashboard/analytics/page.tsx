'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Users, Gift, Star, ArrowRight, AlertTriangle, Heart } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Commercant, CarteFidelite, Scan } from '@/lib/types'

function fmt(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(iso))
}

// Fake data shown as blurred preview for non-annual users
const DEMO_SCANS_BY_DAY = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i))
  return { day: fmt(d.toISOString()), scans: Math.floor(Math.random() * 12) + 1 }
})
const DEMO_POINTS_BY_WEEK = [
  { week: '28 oct.', points: 142 },
  { week: '4 nov.', points: 198 },
  { week: '11 nov.', points: 175 },
  { week: '18 nov.', points: 231 },
  { week: '25 nov.', points: 189 },
  { week: '2 déc.', points: 267 },
  { week: '9 déc.', points: 245 },
  { week: '16 déc.', points: 312 },
]
const DEMO_TOP10: CarteFidelite[] = [
  { id: '1', commercant_id: '', client_id: '', client_email: 'sophie.m@example.com', client_nom: 'Sophie M.', nombre_points: 8, points_cumules_total: 210, derniere_visite: new Date().toISOString(), recompenses_obtenues: 7, created_at: '' },
  { id: '2', commercant_id: '', client_id: '', client_email: 'thomas.b@example.com', client_nom: 'Thomas B.', nombre_points: 5, points_cumules_total: 184, derniere_visite: new Date().toISOString(), recompenses_obtenues: 6, created_at: '' },
  { id: '3', commercant_id: '', client_id: '', client_email: 'claire.d@example.com', client_nom: 'Claire D.', nombre_points: 3, points_cumules_total: 157, derniere_visite: new Date().toISOString(), recompenses_obtenues: 5, created_at: '' },
  { id: '4', commercant_id: '', client_id: '', client_email: 'marc.l@example.com', client_nom: 'Marc L.', nombre_points: 9, points_cumules_total: 132, derniere_visite: new Date().toISOString(), recompenses_obtenues: 4, created_at: '' },
  { id: '5', commercant_id: '', client_id: '', client_email: 'julie.r@example.com', client_nom: 'Julie R.', nombre_points: 2, points_cumules_total: 118, derniere_visite: new Date().toISOString(), recompenses_obtenues: 3, created_at: '' },
]

export default function AnalyticsPage() {
  const [commercant, setCommercant] = useState<Commercant | null>(null)
  const [loading, setLoading] = useState(true)

  const [scansByDay, setScansByDay] = useState<{ day: string; scans: number }[]>([])
  const [pointsByWeek, setPointsByWeek] = useState<{ week: string; points: number }[]>([])
  const [top10, setTop10] = useState<CarteFidelite[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [inactiveCount, setInactiveCount] = useState(0)
  const [rewardsMois, setRewardsMois] = useState(0)
  const [fidelisationRate, setFidelisationRate] = useState(0)
  const [fidelisesCount, setFidelisesCount] = useState(0)
  const [passageUniqueCount, setPassageUniqueCount] = useState(0)

  const [isDemoLive, setIsDemoLive] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const demoLive = user.email === 'demo-live@getorlyo.com'
    setIsDemoLive(demoLive)

    const { data: comm } = await supabase.from('commercants').select('*').eq('id', user.id).single()
    setCommercant(comm)

    if (demoLive || comm?.plan_actif === 'annuel') {
      const now = new Date()
      const day30ago = new Date(now); day30ago.setDate(now.getDate() - 30)
      const week8ago = new Date(now); week8ago.setDate(now.getDate() - 56)
      const month1ago = new Date(now.getFullYear(), now.getMonth(), 1)

      const [{ data: scans30 }, { data: scans8w }, { data: cartes }, { data: scansMonth }, { data: allScans }] = await Promise.all([
        supabase.from('scans').select('created_at').eq('commercant_id', user.id).gte('created_at', day30ago.toISOString()),
        supabase.from('scans').select('created_at, points_ajoutes').eq('commercant_id', user.id).gte('created_at', week8ago.toISOString()),
        supabase.from('cartes_fidelite').select('*').eq('commercant_id', user.id).order('points_cumules_total', { ascending: false }),
        supabase.from('scans').select('recompense_declenchee').eq('commercant_id', user.id).gte('created_at', month1ago.toISOString()),
        supabase.from('scans').select('carte_id').eq('commercant_id', user.id),
      ])

      const dayMap: Record<string, number> = {}
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i)
        dayMap[d.toISOString().slice(0, 10)] = 0
      }
      ;(scans30 ?? []).forEach((s: Pick<Scan, 'created_at'>) => {
        const k = s.created_at.slice(0, 10)
        if (k in dayMap) dayMap[k]++
      })
      setScansByDay(Object.entries(dayMap).map(([day, scans]) => ({ day: fmt(day + 'T12:00:00'), scans })))

      const weekMap: Record<string, number> = {}
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i * 7)
        const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
        weekMap[mon.toISOString().slice(0, 10)] = 0
      }
      ;(scans8w ?? []).forEach((s: Pick<Scan, 'created_at' | 'points_ajoutes'>) => {
        const d = new Date(s.created_at)
        const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
        const k = mon.toISOString().slice(0, 10)
        if (k in weekMap) weekMap[k] += s.points_ajoutes
      })
      setPointsByWeek(Object.entries(weekMap).map(([week, points]) => ({ week: fmt(week + 'T12:00:00'), points })))

      setTop10((cartes ?? []).slice(0, 10))

      const threshold = day30ago.toISOString()
      const active = (cartes ?? []).filter((c: CarteFidelite) => c.derniere_visite >= threshold).length
      setActiveCount(active)
      setInactiveCount((cartes ?? []).length - active)
      setRewardsMois((scansMonth ?? []).filter((s: Pick<Scan, 'recompense_declenchee'>) => s.recompense_declenchee).length)

      const scanCountByCarte: Record<string, number> = {}
      for (const s of allScans ?? []) {
        if (s.carte_id) scanCountByCarte[s.carte_id] = (scanCountByCarte[s.carte_id] ?? 0) + 1
      }
      const fidelises = Object.values(scanCountByCarte).filter((n) => n >= 2).length
      const passageUnique = Object.values(scanCountByCarte).filter((n) => n === 1).length
      const totalFid = fidelises + passageUnique
      setFidelisesCount(fidelises)
      setPassageUniqueCount(passageUnique)
      setFidelisationRate(totalFid > 0 ? Math.round((fidelises / totalFid) * 100) : 0)
    } else {
      // Use demo data for preview
      setScansByDay(DEMO_SCANS_BY_DAY)
      setPointsByWeek(DEMO_POINTS_BY_WEEK)
      setTop10(DEMO_TOP10)
      setActiveCount(34)
      setInactiveCount(12)
      setRewardsMois(18)
      setFidelisesCount(28)
      setPassageUniqueCount(18)
      setFidelisationRate(61)
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-[#2D4A8A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isPro = isDemoLive || commercant?.plan_actif === 'annuel'
  const totalCartes = activeCount + inactiveCount
  const activePct = totalCartes > 0 ? Math.round((activeCount / totalCartes) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Sticky upsell banner — non-annual users */}
      {!isPro && (
        <div className="sticky top-0 z-20 bg-[#F59E0B] px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-md">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg">⭐</span>
            <p className="font-bold text-white text-sm">Fonctionnalité réservée au plan annuel</p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-white text-[#2D4A8A] font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors text-sm flex-shrink-0"
          >
            Passer au plan annuel
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="px-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A23]">Analytics</h1>
        <p className="text-[#6B7280] text-sm mt-1">Données des 30 derniers jours</p>
      </div>

      {/* Métriques */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${!isPro ? 'opacity-60 pointer-events-none select-none' : ''}`}>
        {[
          { label: 'Clients actifs', value: `${activePct}%`, sub: `${activeCount} / ${totalCartes}`, icon: Users, color: 'text-[#2D4A8A]', bg: 'bg-[#2D4A8A]/10' },
          { label: 'Clients inactifs', value: inactiveCount, sub: '+30 jours sans scan', icon: Users, color: 'text-[#6B7280]', bg: 'bg-gray-100' },
          { label: 'Récompenses ce mois', value: rewardsMois, sub: 'débloquées', icon: Gift, color: 'text-[#0F6E56]', bg: 'bg-[#0F6E56]/10' },
          { label: 'Points / client', value: totalCartes > 0 ? Math.round(top10.reduce((a, c) => a + c.points_cumules_total, 0) / Math.max(totalCartes, 1)) : 0, sub: 'moyenne cumulée', icon: TrendingUp, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#6B7280] font-medium">{label}</span>
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Taux de fidélisation + Clients inactifs */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!isPro ? 'opacity-60 pointer-events-none select-none' : ''}`}>
        {/* Taux de fidélisation */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1A1A23]">Taux de fidélisation</p>
              <p className="text-xs text-[#6B7280] mt-0.5">clients fidélisés vs passage unique</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#2D4A8A]/10 flex items-center justify-center flex-shrink-0">
              <Heart size={18} className="text-[#2D4A8A]" />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className={`text-5xl font-bold tabular-nums ${fidelisationRate >= 60 ? 'text-green-600' : fidelisationRate >= 30 ? 'text-[#F59E0B]' : 'text-red-500'}`}>
              {fidelisationRate}%
            </span>
            <span className={`mb-1.5 text-sm font-semibold px-2 py-0.5 rounded-full ${fidelisationRate >= 60 ? 'bg-green-100 text-green-700' : fidelisationRate >= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
              {fidelisationRate >= 60 ? 'Excellent' : fidelisationRate >= 30 ? 'Moyen' : 'À améliorer'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              <span className="text-[#6B7280]">{fidelisesCount} fidélisés</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
              <span className="text-[#6B7280]">{passageUniqueCount} passage unique</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${fidelisationRate >= 60 ? 'bg-green-500' : fidelisationRate >= 30 ? 'bg-[#F59E0B]' : 'bg-red-500'}`}
              style={{ width: `${fidelisationRate}%` }}
            />
          </div>
        </div>

        {/* Clients inactifs */}
        <div className={`rounded-2xl border shadow-sm p-6 flex flex-col gap-4 ${inactiveCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1A1A23]">Clients inactifs</p>
              <p className="text-xs text-[#6B7280] mt-0.5">clients à risque de perdre</p>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${inactiveCount > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <AlertTriangle size={18} className={inactiveCount > 0 ? 'text-orange-500' : 'text-gray-400'} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className={`text-5xl font-bold tabular-nums ${inactiveCount > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
              {inactiveCount}
            </span>
            {inactiveCount > 0 && (
              <span className="mb-1.5 text-sm font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                +30j sans scan
              </span>
            )}
          </div>
          <p className="text-sm text-[#6B7280]">
            {inactiveCount === 0
              ? 'Tous vos clients sont actifs — bravo !'
              : `${inactiveCount} client${inactiveCount > 1 ? 's' : ''} n'ont pas scanné depuis plus de 30 jours.`}
          </p>
          {inactiveCount > 0 && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors self-start"
            >
              Voir les clients inactifs
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Charts wrapper — blurred overlay for non-pro */}
      <div className={`space-y-8 ${!isPro ? 'relative' : ''}`}>
        {!isPro && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-[#F59E0B]/30 px-8 py-6 flex flex-col items-center gap-3 text-center">
              <span className="text-3xl">⭐</span>
              <p className="font-bold text-[#1A1A23]">Graphiques réservés au plan annuel</p>
              <p className="text-sm text-[#6B7280] max-w-xs">Ces graphiques afficheront vos vraies données une fois votre abonnement annuel activé.</p>
              <Link
                href="/pricing"
                className="mt-1 inline-flex items-center gap-2 bg-[#F59E0B] text-[#1B2B4B] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#e08900] transition-colors text-sm"
              >
                Passer au plan annuel
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}

        {/* Scans par jour */}
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 ${!isPro ? 'blur-sm' : ''}`}>
          <h2 className="font-semibold text-[#1A1A23] mb-6">Scans par jour — 30 derniers jours</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scansByDay} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
              <Line type="monotone" dataKey="scans" stroke="#2D4A8A" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Points par semaine */}
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 ${!isPro ? 'blur-sm' : ''}`}>
          <h2 className="font-semibold text-[#1A1A23] mb-6">Points distribués par semaine — 8 dernières semaines</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pointsByWeek} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
              <Bar dataKey="points" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 clients */}
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${!isPro ? 'blur-sm' : ''}`}>
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="font-semibold text-[#1A1A23]">Top 10 clients</h2>
            <p className="text-xs text-[#6B7280]">Classés par points cumulés total</p>
          </div>
          <div className="divide-y divide-gray-50">
            {top10.map((c, i) => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-3">
                <span className={`w-6 text-sm font-bold tabular-nums ${i < 3 ? 'text-[#F59E0B]' : 'text-[#9CA3AF]'}`}>
                  {i + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-[#2D4A8A]/10 text-[#2D4A8A] text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {(c.client_nom || c.client_email).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.client_nom || c.client_email}</p>
                  <p className="text-xs text-[#6B7280] truncate">{c.client_email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-[#2D4A8A]">{c.points_cumules_total} pts</p>
                  <div className="flex items-center gap-1 justify-end">
                    <Star size={10} className="text-yellow-500" fill="currentColor" />
                    <span className="text-xs text-[#6B7280]">{c.recompenses_obtenues}</span>
                  </div>
                </div>
              </div>
            ))}
            {top10.length === 0 && (
              <p className="text-center text-[#6B7280] text-sm py-10">Aucune donnée disponible</p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
