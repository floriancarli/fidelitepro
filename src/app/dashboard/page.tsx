'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Users, QrCode, TrendingUp, Search, Star, ScanLine, CheckCircle, Gift, Trash2, Download, ArrowRight, RefreshCw, Smartphone } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isDemoEmail } from '@/lib/useDemo'
import DemoToast from '@/components/DemoToast'
import type { Commercant, CarteFidelite, ScanResult } from '@/lib/types'

const DEMO_LIVE_EMAIL = 'demo-live@getorlyo.com'

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

function ScanSuccessBanner({ result, onDismiss }: { result: ScanResult; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const isReward = result.recompenseDeclenchee
  const bgClass = isReward ? 'bg-[#0F6E56]' : 'bg-[#2D4A8A]'

  return (
    <div className={`${bgClass} text-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-lg mb-6 animate-in slide-in-from-top-2 duration-300`}>
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
        {isReward ? <Gift size={20} /> : <CheckCircle size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">
          {isReward ? `🎁 Récompense débloquée pour ${result.client.nom} !` : `✓ Point ajouté — ${result.client.nom}`}
        </p>
        <p className="text-white/80 text-sm mt-0.5">
          {isReward
            ? `Remettez : ${result.libelleRecompense}`
            : `${result.carte.nombre_points} / ${result.pointsPourRecompense} points`}
        </p>
      </div>
      <button onClick={onDismiss} className="text-white/60 hover:text-white text-xs flex-shrink-0">
        ✕
      </button>
    </div>
  )
}

const DEMO_SCAN_RESULT: ScanResult = {
  client: {
    id: 'demo-client-01',
    email: 'marie.dupont@gmail.com',
    nom: 'Marie Dupont',
    qr_code_id: 'QR-DEMO-CLI-01',
    created_at: new Date().toISOString(),
  },
  carte: {
    id: 'demo-carte-01',
    commercant_id: 'demo',
    client_id: 'demo-client-01',
    client_email: 'marie.dupont@gmail.com',
    client_nom: 'Marie Dupont',
    nombre_points: 9,
    points_cumules_total: 24,
    derniere_visite: new Date().toISOString(),
    recompenses_obtenues: 1,
    created_at: new Date().toISOString(),
  },
  pointsAjoutes: 1,
  recompenseDeclenchee: false,
  libelleRecompense: '',
  pointsPourRecompense: 10,
  paliers: [
    { points: 5, libelle: 'Café offert' },
    { points: 10, libelle: 'Croissant offert' },
    { points: 20, libelle: 'Baguette offerte' },
  ],
}

export default function DashboardPage() {
  const [commercant, setCommercant] = useState<Commercant | null>(null)
  const [cartes, setCartes] = useState<CarteFidelite[]>([])
  const [scansCount, setScansCount] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [isDemoLive, setIsDemoLive] = useState(false)
  const [demoToast, setDemoToast] = useState(false)
  const [resetting, setResetting] = useState(false)
  // Maps carte_fidelite_id → recompense_id for pending rewards
  const [pendingMap, setPendingMap] = useState<Map<string, string>>(new Map())
  const bannerDismissRef = useRef<(() => void) | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: comm }, { data: cartesData }, { count: scans }, { data: pendingRecompenses }] = await Promise.all([
      supabase.from('commercants').select('*').eq('id', user.id).single(),
      supabase.from('cartes_fidelite').select('*').eq('commercant_id', user.id).order('derniere_visite', { ascending: false }),
      supabase.from('scans').select('*', { count: 'exact', head: true })
        .eq('commercant_id', user.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase.from('recompenses').select('id, carte_fidelite_id').eq('commercant_id', user.id).eq('utilisee', false),
    ])

    setIsDemo(isDemoEmail(user.email))
    setIsDemoLive(user.email === DEMO_LIVE_EMAIL)
    setCommercant(comm)
    setCartes(cartesData || [])
    setScansCount(scans || 0)
    setTotalPoints((cartesData || []).reduce((acc, c) => acc + (c.points_cumules_total || 0), 0))
    // Keep only the first pending reward per carte (oldest first = natural insert order)
    const map = new Map<string, string>()
    for (const r of (pendingRecompenses || [])) {
      if (!map.has(r.carte_fidelite_id)) map.set(r.carte_fidelite_id, r.id)
    }
    setPendingMap(map)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()

    const supabase = createClient()
    let channelRef: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      channelRef = supabase
        .channel('dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cartes_fidelite', filter: `commercant_id=eq.${user.id}` }, load)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'scans', filter: `commercant_id=eq.${user.id}` }, load)
        .subscribe()
    })

    return () => {
      if (channelRef) supabase.removeChannel(channelRef)
    }
  }, [load])

  // Fermeture du modal : résultat optionnel transmis par le scanner
  const handleScannerClose = useCallback((result?: ScanResult) => {
    setScannerOpen(false)
    if (result) {
      setLastScanResult(result)
    }
    load()
  }, [load])

  const dismissBanner = useCallback(() => setLastScanResult(null), [])
  bannerDismissRef.current = dismissBanner

  const handleDemoLiveReset = async () => {
    setResetting(true)
    await fetch('/api/demo-live/reset', { method: 'POST' })
    await load()
    setResetting(false)
  }

  const handleValidateReward = async (carteId: string) => {
    if (isDemo) { setDemoToast(true); return }
    const recompenseId = pendingMap.get(carteId)
    if (!recompenseId) return
    // Optimistically remove the gift icon for this client
    setPendingMap((prev) => { const next = new Map(prev); next.delete(carteId); return next })
    const res = await fetch('/api/recompenses/valider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recompenseId }),
    })
    if (res.ok) {
      window.dispatchEvent(new CustomEvent('reward:validated'))
    } else {
      // Restore on failure
      setPendingMap((prev) => { const next = new Map(prev); next.set(carteId, recompenseId); return next })
    }
    load()
  }

  const handleDeleteClient = async (carteId: string) => {
    const supabase = createClient()
    await supabase.from('cartes_fidelite').delete().eq('id', carteId)
    setDeleteConfirm(null)
    load()
  }

  const exportCSV = () => {
    const header = 'Nom,Email,Points actuels,Points cumulés,Récompenses,Date inscription,Dernière visite'
    const rows = cartes.map((c) =>
      [
        `"${c.client_nom || ''}"`,
        `"${c.client_email}"`,
        c.nombre_points,
        c.points_cumules_total,
        c.recompenses_obtenues,
        `"${formatDate(c.created_at)}"`,
        `"${formatDate(c.derniere_visite)}"`,
      ].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = cartes.filter(
    (c) =>
      c.client_email.toLowerCase().includes(search.toLowerCase()) ||
      c.client_nom.toLowerCase().includes(search.toLowerCase())
  )

  const brandColor = (commercant?.couleur_principale ?? '#2D4A8A').replace(/^#534ab7$/i, '#2D4A8A')

  type Palier = { points: number; libelle: string }
  const paliers: Palier[] = Array.isArray(commercant?.paliers) && (commercant.paliers as Palier[]).length > 0
    ? [...(commercant.paliers as Palier[])].sort((a, b) => a.points - b.points)
    : [{ points: commercant?.points_pour_recompense || 10, libelle: '' }]

  const getProgressMax = (currentPoints: number) => {
    const next = paliers.find((p) => p.points > currentPoints)
    return next?.points ?? paliers[paliers.length - 1].points
  }

  const mois = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date())

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 border-4 border-[#2D4A8A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {demoToast && <DemoToast onClose={() => setDemoToast(false)} />}
      {scannerOpen && (
        <ClientScannerModal
          onClose={handleScannerClose}
          demoResult={isDemo ? DEMO_SCAN_RESULT : undefined}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Supprimer ce client ?</h3>
            <p className="text-sm text-[#6B7280] text-center mb-6">
              Toutes les données de ce client seront supprimées (points, historique, récompenses).
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 text-[#1A1A23] font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteClient(deleteConfirm)}
                className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A23]">
              Bonjour, {commercant?.nom_commerce} 👋
            </h1>
            <p className="text-[#6B7280] text-sm mt-1 capitalize">{mois}</p>
          </div>
          <div className="sm:ml-auto flex items-center gap-3">
            {isDemoLive && (
              <button
                onClick={handleDemoLiveReset}
                disabled={resetting}
                className="flex items-center gap-2 border border-gray-200 bg-white text-[#6B7280] text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 hover:text-[#1A1A23] transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={15} className={resetting ? 'animate-spin' : ''} />
                {resetting ? 'Réinitialisation…' : 'Réinitialiser la démo'}
              </button>
            )}
            <button
              onClick={() => setScannerOpen(true)}
              className="flex items-center gap-2.5 bg-[#F59E0B] text-[#1B2B4B] font-semibold px-5 py-3 rounded-xl hover:bg-[#e08900] transition-colors shadow-md shadow-[#F59E0B]/20"
            >
              <ScanLine size={20} />
              Scanner un client
            </button>
          </div>
        </div>


        {/* Bannière résultat scan */}
        {lastScanResult && (
          <ScanSuccessBanner result={lastScanResult} onDismiss={dismissBanner} />
        )}

        {/* Métriques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#6B7280] font-medium">Clients fidèles</span>
              <div className="w-10 h-10 rounded-xl bg-[#2D4A8A]/10 flex items-center justify-center">
                <Users size={20} className="text-[#2D4A8A]" />
              </div>
            </div>
            <p className="text-3xl font-bold">{cartes.length}</p>
            <p className="text-xs text-[#6B7280] mt-1">Total inscrits</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#6B7280] font-medium">Scans ce mois</span>
              <div className="w-10 h-10 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center">
                <QrCode size={20} className="text-[#0F6E56]" />
              </div>
            </div>
            <p className="text-3xl font-bold">{scansCount}</p>
            <p className="text-xs text-[#6B7280] mt-1">Visites enregistrées</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <h2 className="font-semibold text-[#1A1A23]">Mes clients fidèles</h2>
              <p className="text-xs text-[#6B7280]">{cartes.length} client{cartes.length > 1 ? 's' : ''} inscrits</p>
            </div>
            <div className="sm:ml-auto flex items-center gap-3">
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 border border-gray-200 text-[#1A1A23] text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={15} />
                Exporter CSV
              </button>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A] w-64"
                />
              </div>
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
                  <tr className="text-xs text-[#6B7280] border-b border-gray-200">
                    <th className="text-left px-6 py-3 font-medium">Client</th>
                    <th className="text-left px-6 py-3 font-medium">Progression</th>
                    <th className="text-left px-6 py-3 font-medium">Récompenses</th>
                    <th className="text-left px-6 py-3 font-medium">Dernière visite</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((carte) => {
                    const nom = carte.client_nom || carte.client_email
                    const initiales = nom.slice(0, 2).toUpperCase()
                    const hasPending = pendingMap.has(carte.id)
                    return (
                      <tr key={carte.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-full bg-[#2D4A8A]/10 flex items-center justify-center text-[#2D4A8A] font-semibold text-sm">
                                {initiales}
                              </div>
                              {hasPending && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F59E0B] rounded-full flex items-center justify-center">
                                  <Gift size={9} className="text-white" />
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{nom}</p>
                              <p className="text-xs text-[#6B7280]">{carte.client_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 min-w-[180px]">
                          <ProgressBar
                            value={carte.nombre_points}
                            max={getProgressMax(carte.nombre_points)}
                            color={brandColor}
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
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            {hasPending && (
                              <button
                                onClick={() => handleValidateReward(carte.id)}
                                title="Remettre la récompense et déduire les points"
                                className="flex items-center gap-1.5 bg-[#0F6E56] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#0a5c47] transition-colors whitespace-nowrap"
                              >
                                <Gift size={13} />
                                Remettre
                              </button>
                            )}
                            <button
                              onClick={() => isDemo ? setDemoToast(true) : setDeleteConfirm(carte.id)}
                              title="Supprimer les données de ce client (RGPD)"
                              className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Scan mobile PWA */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 flex items-center gap-6">
          <QRCodeSVG value="https://getorlyo.com/scan" size={72} fgColor="#2D4A8A" bgColor="transparent" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Smartphone size={16} className="text-[#2D4A8A]" />
              <span className="font-semibold text-[#1A1A23] text-sm">Scanner depuis votre téléphone</span>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Scannez ce QR code avec votre téléphone pour installer l&apos;app de scan en caisse.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
