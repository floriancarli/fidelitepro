'use client'

import { useEffect, useState, useCallback } from 'react'
import { Gift, Check, Clock, SkipForward, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isDemoEmail } from '@/lib/useDemo'
import DemoToast from '@/components/DemoToast'

interface RecompenseWithClient {
  id: string
  libelle: string
  utilisee: boolean
  date_obtention: string
  date_utilisation: string | null
  cartes_fidelite: {
    client_email: string
    client_nom: string
  } | null
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

export default function RecompensesPage() {
  const [recompenses, setRecompenses] = useState<RecompenseWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'used'>('pending')
  const [isDemo, setIsDemo] = useState(false)
  const [demoToast, setDemoToast] = useState(false)
  // IDs hidden for this session only (Reporter)
  const [deferred, setDeferred] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setIsDemo(isDemoEmail(user.email))

    const { data, error } = await supabase
      .from('recompenses')
      .select('*, cartes_fidelite(client_email, client_nom)')
      .eq('commercant_id', user.id)
      .order('date_obtention', { ascending: false })

    if (error) console.error('[recompenses] load error:', error)
    setRecompenses((data as RecompenseWithClient[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleValidate = async (id: string) => {
    if (isDemo) { setDemoToast(true); return }
    const res = await fetch('/api/recompenses/valider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recompenseId: id }),
    })
    if (res.ok) window.dispatchEvent(new CustomEvent('reward:validated'))
    load()
  }

  const handleUnmark = async (id: string) => {
    if (isDemo) { setDemoToast(true); return }
    const supabase = createClient()
    await supabase
      .from('recompenses')
      .update({ utilisee: false, date_utilisation: null })
      .eq('id', id)
    load()
  }

  // Hide from current session — no API call, reward stays pending in DB
  const handleDefer = (id: string) => {
    setDeferred((prev) => new Set(prev).add(id))
  }

  // Delete the reward — no point deduction, client keeps accumulating
  const handleIgnore = async (id: string) => {
    if (isDemo) { setDemoToast(true); return }
    const res = await fetch('/api/recompenses/ignorer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recompenseId: id }),
    })
    if (res.ok) window.dispatchEvent(new CustomEvent('reward:validated'))
    load()
  }

  const pendingCount = recompenses.filter((r) => !r.utilisee && !deferred.has(r.id)).length

  const filtered = recompenses.filter((r) => {
    if (deferred.has(r.id)) return false
    if (filter === 'pending') return !r.utilisee
    if (filter === 'used') return r.utilisee
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 border-4 border-[#2D4A8A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {demoToast && <DemoToast onClose={() => setDemoToast(false)} />}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Récompenses</h1>
        <p className="text-[#6B7280] text-sm mt-1">
          {pendingCount} récompense{pendingCount !== 1 ? 's' : ''} en attente de remise
        </p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {([['all', 'Toutes'], ['pending', 'À remettre'], ['used', 'Remises']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === val
                ? 'bg-[#2D4A8A] text-white'
                : 'bg-white border border-gray-200 text-[#6B7280] hover:border-[#2D4A8A] hover:text-[#2D4A8A]'
            }`}
          >
            {label}{val === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm text-center py-16 text-[#6B7280]">
          <Gift size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune récompense</p>
          <p className="text-sm mt-1">Les récompenses apparaîtront ici quand vos clients atteindront un palier</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${
                r.utilisee ? 'border-gray-200 opacity-60' : 'border-[#0F6E56]/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                r.utilisee ? 'bg-gray-100' : 'bg-[#0F6E56]/10'
              }`}>
                <Gift size={20} className={r.utilisee ? 'text-gray-400' : 'text-[#0F6E56]'} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{r.libelle}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {r.cartes_fidelite?.client_nom || r.cartes_fidelite?.client_email || '—'}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-[#6B7280]">
                  <Clock size={12} />
                  Obtenue le {formatDate(r.date_obtention)}
                  {r.utilisee && r.date_utilisation && ` · Remise le ${formatDate(r.date_utilisation)}`}
                </div>
              </div>

              {r.utilisee ? (
                <button
                  onClick={() => handleUnmark(r.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-[#6B7280] hover:border-[#2D4A8A] hover:text-[#2D4A8A] transition-colors flex-shrink-0"
                >
                  <Check size={14} />
                  Marquer non remise
                </button>
              ) : (
                <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                  <button
                    onClick={() => handleValidate(r.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#0F6E56] text-white hover:bg-[#0a5c47] transition-colors"
                  >
                    <Check size={14} />
                    Marquer comme remis
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDefer(r.id)}
                      title="Masquer pour cette session — la récompense reste en attente"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-[#6B7280] hover:border-[#2D4A8A] hover:text-[#2D4A8A] transition-colors"
                    >
                      <SkipForward size={12} />
                      Reporter
                    </button>
                    <button
                      onClick={() => handleIgnore(r.id)}
                      title="Le client ne veut pas — supprime la récompense sans déduire de points"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <X size={12} />
                      Ignorer
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
