'use client'

import { useEffect, useState, useCallback } from 'react'
import { Gift, Check, Clock } from 'lucide-react'
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
    clients: { nom: string } | null
  }
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

export default function RecompensesPage() {
  const [recompenses, setRecompenses] = useState<RecompenseWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'used'>('all')
  const [isDemo, setIsDemo] = useState(false)
  const [demoToast, setDemoToast] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setIsDemo(isDemoEmail(user.email))

    const { data } = await supabase
      .from('recompenses')
      .select('*, cartes_fidelite(client_email, clients(nom))')
      .eq('commercant_id', user.id)
      .order('date_obtention', { ascending: false })

    setRecompenses((data as RecompenseWithClient[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (id: string, utilisee: boolean) => {
    if (isDemo) {
      setDemoToast(true)
      return
    }
    if (!utilisee) {
      // Validate via API — deducts points from loyalty card
      await fetch('/api/recompenses/valider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recompenseId: id }),
      })
    } else {
      // Un-mark as used directly
      const supabase = createClient()
      await supabase
        .from('recompenses')
        .update({ utilisee: false, date_utilisation: null })
        .eq('id', id)
    }
    load()
  }

  const filtered = recompenses.filter((r) => {
    if (filter === 'pending') return !r.utilisee
    if (filter === 'used') return r.utilisee
    return true
  })

  const pendingCount = recompenses.filter((r) => !r.utilisee).length

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
          {pendingCount} récompense{pendingCount > 1 ? 's' : ''} en attente de remise
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
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm text-center py-16 text-[#6B7280]">
          <Gift size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune récompense</p>
          <p className="text-sm mt-1">Les récompenses apparaîtront ici quand vos clients atteindront le palier</p>
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
                  {r.cartes_fidelite?.clients?.nom ?? r.cartes_fidelite?.client_email}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-[#6B7280]">
                  <Clock size={12} />
                  Obtenue le {formatDate(r.date_obtention)}
                  {r.utilisee && r.date_utilisation && ` · Remise le ${formatDate(r.date_utilisation)}`}
                </div>
              </div>

              <button
                onClick={() => handleToggle(r.id, r.utilisee)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0 ${
                  r.utilisee
                    ? 'border border-gray-200 text-[#6B7280] hover:border-[#2D4A8A] hover:text-[#2D4A8A]'
                    : 'bg-[#0F6E56] text-white hover:bg-[#0a5c47]'
                }`}
              >
                <Check size={14} />
                {r.utilisee ? 'Marquer non remise' : 'Marquer remise'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
