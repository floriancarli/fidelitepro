'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users, QrCode, TrendingUp, Search, Star, ScanLine,
  LayoutDashboard, Gift, Settings, UserCircle, ArrowRight, X,
} from 'lucide-react'
import Logo from '@/components/Logo'

// ── Données fictives ──────────────────────────────────────────────────────────

const DEMO_COMMERCE = {
  nom_commerce: 'Boulangerie Martin',
  secteur_activite: 'Boulangerie / Pâtisserie',
  couleur_principale: '#534AB7',
  points_pour_recompense: 10,
  paliers: [
    { points: 5, libelle: 'Café offert' },
    { points: 10, libelle: 'Croissant offert' },
    { points: 20, libelle: 'Baguette offerte' },
  ],
}

const DEMO_CLIENTS = [
  { id: '1', nom: 'Marie Dupont',    email: 'marie.d@email.fr',    points: 8,  total: 23, recompenses: 1, visite: '2026-04-22' },
  { id: '2', nom: 'Thomas Bernard',  email: 'thomas.b@email.fr',   points: 4,  total: 14, recompenses: 1, visite: '2026-04-21' },
  { id: '3', nom: 'Sophie Leclerc',  email: 'sophie.l@email.fr',   points: 9,  total: 19, recompenses: 0, visite: '2026-04-20' },
  { id: '4', nom: 'Lucas Petit',     email: 'lucas.p@email.fr',    points: 2,  total: 32, recompenses: 3, visite: '2026-04-23' },
  { id: '5', nom: 'Emma Rousseau',   email: 'emma.r@email.fr',     points: 6,  total: 16, recompenses: 1, visite: '2026-04-18' },
  { id: '6', nom: 'Nathan Leblanc',  email: 'nathan.l@email.fr',   points: 1,  total: 6,  recompenses: 0, visite: '2026-04-10' },
  { id: '7', nom: 'Camille Moreau',  email: 'camille.m@email.fr',  points: 7,  total: 27, recompenses: 2, visite: '2026-04-22' },
  { id: '8', nom: 'Julien Garcia',   email: 'julien.g@email.fr',   points: 3,  total: 8,  recompenses: 0, visite: '2026-04-15' },
]

const SCANS_CE_MOIS = 47
const TOTAL_POINTS = DEMO_CLIENTS.reduce((a, c) => a + c.total, 0)

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-[#6B7280] whitespace-nowrap">{value}/{max}</span>
    </div>
  )
}

// ── Sidebar démo ──────────────────────────────────────────────────────────────

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Mon QR Code', icon: QrCode },
  { label: 'Récompenses', icon: Gift },
  { label: 'Configuration', icon: Settings },
  { label: 'Mon Compte', icon: UserCircle },
]

function DemoSidebar() {
  return (
    <aside className="w-64 min-h-screen bg-[#534AB7] flex flex-col text-white flex-shrink-0">
      <div className="px-6 py-6 border-b border-white/10">
        <Logo white size="md" />
      </div>

      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
            BM
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-sm">{DEMO_COMMERCE.nom_commerce}</p>
            <p className="text-white/60 text-xs">{DEMO_COMMERCE.secteur_activite}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-green-300 font-medium">Abonnement actif</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAV.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-default ${
              active ? 'bg-white/20 text-white' : 'text-white/60'
            }`}
          >
            <Icon size={18} />
            {label}
          </div>
        ))}
      </nav>

      <div className="px-4 py-5 border-t border-white/10">
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-2 w-full bg-white text-[#534AB7] font-semibold text-sm px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Créer mon compte
          <ArrowRight size={15} />
        </Link>
      </div>
    </aside>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function DemoPage() {
  const [search, setSearch] = useState('')
  const [ctaOpen, setCtaOpen] = useState(false)

  const filtered = DEMO_CLIENTS.filter(
    (c) =>
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.nom.toLowerCase().includes(search.toLowerCase())
  )

  const mois = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date())

  return (
    <div className="flex min-h-screen bg-[#F9F9FB]">
      <DemoSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Bandeau démo */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-4">
          <p className="text-amber-800 text-sm font-medium">
            🎭 <strong>Mode démo</strong> — Données fictives. Aucune action n&apos;est enregistrée.
          </p>
          <Link
            href="/pricing"
            className="flex-shrink-0 flex items-center gap-1.5 bg-[#534AB7] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#3C3489] transition-colors"
          >
            Créer mon compte
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A23]">
                Bonjour, {DEMO_COMMERCE.nom_commerce} 👋
              </h1>
              <p className="text-[#6B7280] text-sm mt-1 capitalize">{mois}</p>
            </div>
            <button
              onClick={() => setCtaOpen(true)}
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
              <p className="text-3xl font-bold">{DEMO_CLIENTS.length}</p>
              <p className="text-xs text-[#6B7280] mt-1">Total inscrits</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#6B7280] font-medium">Scans ce mois</span>
                <div className="w-10 h-10 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center">
                  <QrCode size={20} className="text-[#0F6E56]" />
                </div>
              </div>
              <p className="text-3xl font-bold">{SCANS_CE_MOIS}</p>
              <p className="text-xs text-[#6B7280] mt-1">Visites enregistrées</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#6B7280] font-medium">Points distribués</span>
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <TrendingUp size={20} className="text-yellow-600" />
                </div>
              </div>
              <p className="text-3xl font-bold">{TOTAL_POINTS.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-[#6B7280] mt-1">Points cumulés total</p>
            </div>
          </div>

          {/* Tableau clients */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <h2 className="font-semibold text-[#1A1A23]">Mes clients fidèles</h2>
                <p className="text-xs text-[#6B7280]">{DEMO_CLIENTS.length} clients inscrits</p>
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

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-[#6B7280] border-b border-gray-100">
                    <th className="text-left px-6 py-3 font-medium">Client</th>
                    <th className="text-left px-6 py-3 font-medium">Progression</th>
                    <th className="text-left px-6 py-3 font-medium">Récompenses</th>
                    <th className="text-left px-6 py-3 font-medium">Dernière visite</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((client) => {
                    const initiales = client.nom.slice(0, 2).toUpperCase()
                    return (
                      <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#534AB7]/10 flex items-center justify-center text-[#534AB7] font-semibold text-sm">
                              {initiales}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{client.nom}</p>
                              <p className="text-xs text-[#6B7280]">{client.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 min-w-[180px]">
                          <ProgressBar
                            value={client.points}
                            max={DEMO_COMMERCE.points_pour_recompense}
                            color={DEMO_COMMERCE.couleur_principale}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Star size={14} className="text-yellow-500" fill="currentColor" />
                            <span className="text-sm font-medium">{client.recompenses}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6B7280]">
                          {formatDate(client.visite)}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => setCtaOpen(true)}
                            title="Fonctionnalité disponible après inscription"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-200 cursor-not-allowed"
                            disabled
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal CTA démo */}
      {ctaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
            <button
              onClick={() => setCtaOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
            >
              <X size={16} />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-[#534AB7]/10 flex items-center justify-center mx-auto mb-4">
              <ScanLine size={26} className="text-[#534AB7]" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A23] mb-2">
              Créez votre compte pour scanner
            </h3>
            <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
              Le scanner, les vraies données clients et toutes les fonctionnalités sont disponibles après inscription.
            </p>
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 w-full bg-[#534AB7] text-white font-semibold py-3.5 rounded-xl hover:bg-[#3C3489] transition-colors"
            >
              Voir les tarifs
              <ArrowRight size={17} />
            </Link>
            <button
              onClick={() => setCtaOpen(false)}
              className="mt-3 w-full text-sm text-[#6B7280] hover:text-[#1A1A23] transition-colors"
            >
              Continuer la démo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
