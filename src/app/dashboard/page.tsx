'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Users, QrCode, TrendingUp, Search, Star, ScanLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Commercant, CarteFidelite } from '@/lib/types'

const ClientScannerModal = dynamic(() => import('@/components/ClientScannerModal'), { ssr: false })

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-[#6B7280] whitespace-nowrap">{value}/{max}</span>
    </div>
  )
}

export default function DashboardPage() {
  const [commercant, setCommercant] = useState<Commercant | null>(null)
  const [cartes, setCartes] = useState<CarteFidelite[]>([])
  const [scansCount, setScansCount] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [scannerOpen, setScannerOpen] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: comm }, { data: cartesData }, { count: scans }] = await Promise.all([
      supabase.from('commercants').select('*').eq('id', user.id).single(),
      supabase.from('cartes_fidelite').select('*').eq('commercant_id', user.id).order('derniere_visite', { ascending: false }),
      supabase.from('scans').select('*', { count: 'exact', head: true })
        .eq('commercant_id', user.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ])

    setCommercant(comm)
    setCartes(cartesData || [])
    setScansCount(scans || 0)
    setTotalPoints((cartesData || []).reduce((acc, c) => acc + (c.points_cumules_total || 0), 0))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const channel = supabase
        .channel('dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cartes_fidelite', filter: `commercant_id=eq.${user.id}` }, load)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'scans', filter: `commercant_id=eq.${user.id}` }, load)
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    })
  }, [load])

  const handleScannerClose = useCallback(() => {
    setScannerOpen(false)
    load()
  }, [load])

  const filtered = cartes.filter(
    (c) =>
      c.client_email.toLowerCase().includes(search.toLowerCase()) ||
      c.client_prenom.toLowerCase().includes(search.toLowerCase())
  )

  const mois = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date())

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 border-4 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {scannerOpen && <ClientScannerModal onClose={handleScannerClose} />}

      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A23]">
              Bonjour, {commercant?.nom_commerce} 👋
            </h1>
            <p className="text-[#6B7280] text-sm mt-1 capitalize">{mois}</p>
          </div>
          <button
            onClick={() => setScannerOpen(true)}
            className="sm:ml-auto flex items-center gap-2.5 bg-[#534AB7] text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#3C3489] transition-colors shadow-md shadow-[#534AB7]/20"
          >
            <ScanLine size={20} />
            Scanner un client
          </button>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#6B7280] font-medium">Clients fidèles</span>
              <div className="w-10 h-10 rounded-xl bg-[#534AB7]/10 flex items-center justify-center">
                <Users size={20} className="text-[#534AB7]" />
              </div>
            </div>
            <p className="text-3xl font-bold">{cartes.length}</p>
            <p className="text-xs text-[#6B7280] mt-1">Total inscrits</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#6B7280] font-medium">Scans ce mois</span>
              <div className="w-10 h-10 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center">
                <QrCode size={20} className="text-[#0F6E56]" />
              </div>
            </div>
            <p className="text-3xl font-bold">{scansCount}</p>
            <p className="text-xs text-[#6B7280] mt-1">Visites enregistrées</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#6B7280] font-medium">Points distribués</span>
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                <TrendingUp size={20} className="text-yellow-600" />
              </div>
            </div>
            <p className="text-3xl font-bold">{totalPoints.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-[#6B7280] mt-1">Points cumulés total</p>
          </div>
        </div>

        {/* Tableau clients */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <h2 className="font-semibold text-[#1A1A23]">Mes clients fidèles</h2>
              <p className="text-xs text-[#6B7280]">{cartes.length} client{cartes.length > 1 ? 's' : ''} inscrits</p>
            </div>
            <div className="sm:ml-auto relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] w-64"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-[#6B7280]">
              <ScanLine size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun client pour l&apos;instant</p>
              <p className="text-sm mt-1">Scannez le QR code d&apos;un client pour enregistrer sa visite</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-[#6B7280] border-b border-gray-100">
                    <th className="text-left px-6 py-3 font-medium">Client</th>
                    <th className="text-left px-6 py-3 font-medium">Progression</th>
                    <th className="text-left px-6 py-3 font-medium">Récompenses</th>
                    <th className="text-left px-6 py-3 font-medium">Dernière visite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((carte) => {
                    const initiales = carte.client_prenom.slice(0, 1).toUpperCase() + carte.client_email.slice(0, 1).toUpperCase()
                    return (
                      <tr key={carte.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#534AB7]/10 flex items-center justify-center text-[#534AB7] font-semibold text-sm">
                              {initiales}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{carte.client_prenom}</p>
                              <p className="text-xs text-[#6B7280]">{carte.client_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 min-w-[180px]">
                          <ProgressBar
                            value={carte.nombre_points}
                            max={commercant?.points_pour_recompense || 10}
                            color={commercant?.couleur_principale || '#534AB7'}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Star size={14} className="text-yellow-500" fill="currentColor" />
                            <span className="text-sm font-medium">{carte.recompenses_obtenues}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6B7280]">
                          {formatDate(carte.derniere_visite)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
