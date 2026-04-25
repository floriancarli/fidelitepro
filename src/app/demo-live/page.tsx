'use client'

import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Gift, Star, TrendingUp, Users, RefreshCw, Wifi, UserPlus, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const SECRET_KEY = 'orlyo2026'

const PALIERS = [
  { points: 5,  libelle: 'Café offert',         emoji: '☕' },
  { points: 10, libelle: 'Viennoiserie offerte', emoji: '🥐' },
  { points: 20, libelle: 'Pain offert',          emoji: '🍞' },
]
const POINTS_MAX = 20

interface DemoClient {
  id: string
  name: string
  email: string
  qr: string
  points: number
  scans: ScanEvent[]
}

interface ScanEvent {
  id: number
  time: string
  points: number
  palier?: string
}

const JEAN: DemoClient = {
  id: 'jean',
  name: 'Jean Dupont',
  email: 'jean.dupont@gmail.com',
  qr: 'QR-DEMOLIVE-JEAN',
  points: 0,
  scans: [],
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function slugify(name: string) {
  return name.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '')
}

function PalierBadge({ libelle, emoji, unlocked }: { libelle: string; emoji: string; unlocked: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
      unlocked ? 'bg-[#0F6E56] border-[#0F6E56] shadow-lg shadow-[#0F6E56]/30' : 'bg-gray-50 border-gray-200'
    }`}>
      <span className="text-xl">{emoji}</span>
      <span className={`text-sm font-medium ${unlocked ? 'text-white' : 'text-[#6B7280]'}`}>{libelle}</span>
      {unlocked && <span className="ml-auto text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">✓ Débloqué</span>}
    </div>
  )
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const next = PALIERS.find(p => p.points > value)
  return (
    <div>
      <div className="flex justify-between text-xs text-[#6B7280] mb-2">
        <span>{value} point{value !== 1 ? 's' : ''}</span>
        {next && <span>Prochain : {next.libelle} à {next.points} pts</span>}
      </div>
      <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
        <div className="h-3 rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: '#2D4A8A' }} />
      </div>
    </div>
  )
}

function DemoLiveContent() {
  const params = useSearchParams()
  const [authorized, setAuthorized] = useState(false)
  const [clients, setClients] = useState<DemoClient[]>([JEAN])
  const [activeId, setActiveId] = useState('jean')
  const [flash, setFlash] = useState(false)
  const [connected, setConnected] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const scanCounterRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setAuthorized(params.get('key') === SECRET_KEY) }, [params])
  useEffect(() => { if (showForm) setTimeout(() => inputRef.current?.focus(), 50) }, [showForm])

  const activeClient = clients.find(c => c.id === activeId) ?? clients[0]

  const addPointTo = useCallback((clientId: string) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c
      const next = c.points >= POINTS_MAX ? 1 : c.points + 1
      const palier = PALIERS.find(p => p.points === next)
      const event: ScanEvent = {
        id: ++scanCounterRef.current,
        time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()),
        points: next,
        palier: palier?.libelle,
      }
      return { ...c, points: next, scans: [event, ...c.scans].slice(0, 5) }
    }))
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }, [])

  // Broadcast → add point to active client
  useEffect(() => {
    if (!authorized) return
    const supabase = createClient()
    const channel = supabase.channel('demo-live')
    channel
      .on('broadcast', { event: 'scan' }, () => {
        setActiveId(id => { addPointTo(id); return id })
      })
      .subscribe(status => setConnected(status === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(channel) }
  }, [authorized, addPointTo])

  const reset = useCallback(() => {
    setClients([{ ...JEAN, points: 0, scans: [] }])
    setActiveId('jean')
    scanCounterRef.current = 0
  }, [])

  const createClient_ = useCallback(() => {
    const name = newName.trim()
    if (!name) return
    const id = `demo-${Date.now()}`
    const qr = `QR-DEMOLIVE-${slugify(name)}-${Date.now().toString(36).toUpperCase()}`
    const email = `${slugify(name).toLowerCase().replace(/-/g, '.')}@gmail.com`
    const newClient: DemoClient = { id, name, email, qr, points: 0, scans: [] }
    setClients(prev => [...prev, newClient])
    setActiveId(id)
    setNewName('')
    setShowForm(false)
  }, [newName])

  const removeClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id))
    setActiveId(curr => curr === id ? 'jean' : curr)
  }, [])

  const totalScans = clients.reduce((sum, c) => sum + c.scans.length, 0)
  const rewardsEarned = PALIERS.filter(p => p.points <= activeClient.points).length

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#1A1A23] flex items-center justify-center">
        <p className="text-white/40 text-sm">Accès refusé</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-6 lg:p-10">
      <div className={`fixed inset-0 bg-green-500/10 pointer-events-none z-50 transition-opacity duration-300 ${flash ? 'opacity-100' : 'opacity-0'}`} />

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#2D4A8A] flex items-center justify-center text-white text-xs font-bold">BA</div>
            <span className="font-bold text-[#1A1A23] text-lg">Boulangerie Artisanale</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full transition-colors ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
            <Wifi size={12} className={connected ? 'text-green-500' : 'text-gray-300'} />
            <span className="text-xs text-[#6B7280]">{connected ? 'Temps réel actif' : 'Connexion…'}</span>
          </div>
        </div>
        <button onClick={reset} className="flex items-center gap-2 border border-gray-200 bg-white text-[#6B7280] text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 hover:text-[#1A1A23] transition-colors shadow-sm">
          <RefreshCw size={14} />
          Réinitialiser la démo
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">

        {/* Left — KPIs + client card + paliers + historique */}
        <div className="lg:col-span-2 space-y-6">

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Points actuels', value: activeClient.points, icon: TrendingUp, color: 'text-[#2D4A8A]', bg: 'bg-[#2D4A8A]/10', hi: flash },
              { label: 'Récompenses', value: rewardsEarned, icon: Gift, color: 'text-[#0F6E56]', bg: 'bg-[#0F6E56]/10', hi: false },
              { label: 'Clients démo', value: clients.length, icon: Users, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', hi: false },
            ].map(({ label, value, icon: Icon, color, bg, hi }) => (
              <div key={label} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all duration-300 ${hi ? 'border-green-400 shadow-green-100' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[#6B7280] font-medium">{label}</span>
                  <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}><Icon size={16} className={color} /></div>
                </div>
                <p className={`text-3xl font-bold tabular-nums transition-all duration-300 ${hi ? 'text-green-600' : 'text-[#1A1A23]'}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Active client card */}
          <div className={`bg-white rounded-2xl border shadow-sm p-6 transition-all duration-300 ${flash ? 'border-green-400' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-[#2D4A8A]/10 flex items-center justify-center text-[#2D4A8A] font-bold text-lg">
                {initials(activeClient.name)}
              </div>
              <div>
                <p className="font-semibold text-[#1A1A23]">{activeClient.name}</p>
                <p className="text-sm text-[#6B7280]">{activeClient.email}</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Star size={14} className="text-yellow-500" fill="currentColor" />
                <span className="text-sm font-semibold">{rewardsEarned} récompense{rewardsEarned !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <ProgressBar value={activeClient.points} max={POINTS_MAX} />
          </div>

          {/* Paliers */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-[#1A1A23] mb-4">Programme de fidélité</h3>
            <div className="space-y-3">
              {PALIERS.map(p => (
                <PalierBadge key={p.points} libelle={`${p.points} pts — ${p.libelle}`} emoji={p.emoji} unlocked={activeClient.points >= p.points} />
              ))}
            </div>
          </div>

          {/* Historique */}
          {activeClient.scans.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-[#1A1A23] mb-4">Historique — {activeClient.name}</h3>
              <div className="space-y-2">
                {activeClient.scans.map((s, i) => (
                  <div key={s.id} className={`flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 ${i === 0 ? 'animate-in slide-in-from-top-2 duration-300' : ''}`}>
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-sm text-[#6B7280] tabular-nums w-20 flex-shrink-0">{s.time}</span>
                    <span className="text-sm font-medium text-[#1A1A23]">+1 point → {s.points} pts</span>
                    {s.palier && <span className="ml-auto text-xs font-semibold bg-[#0F6E56] text-white px-2 py-0.5 rounded-full whitespace-nowrap">🎉 {s.palier}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — QR code + client list */}
        <div className="space-y-4">

          {/* Active QR */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center sticky top-6">
            <h3 className="font-semibold text-[#1A1A23] mb-1">Carte fidélité de</h3>
            <p className="text-xl font-bold text-[#2D4A8A] mb-4">{activeClient.name}</p>

            <div className={`inline-block p-4 rounded-2xl border-2 transition-all duration-300 ${flash ? 'border-green-500 shadow-lg shadow-green-500/25' : 'border-gray-100'}`}>
              <QRCodeSVG value={activeClient.qr} size={200} bgColor="#ffffff" fgColor="#2D4A8A" level="M" />
            </div>

            <p className="text-xs text-[#6B7280] mt-3 mb-4 leading-relaxed">
              Scanner avec le dashboard commerçant pour ajouter un point
            </p>

            <button
              onClick={() => addPointTo(activeClient.id)}
              className="w-full bg-[#F59E0B] text-[#1B2B4B] font-semibold py-3 rounded-xl hover:bg-[#e08900] transition-colors text-sm mb-4"
            >
              ✚ Simuler un scan
            </button>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-[#6B7280] mb-1">Points actuels</p>
              <p className={`text-5xl font-bold tabular-nums transition-all duration-300 ${flash ? 'text-green-600' : 'text-[#2D4A8A]'}`}>
                {activeClient.points}
              </p>
              <p className="text-xs text-[#6B7280] mt-1">/ {POINTS_MAX} pts max</p>
            </div>
          </div>

          {/* Client list */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#1A1A23] text-sm">Clients démo ({clients.length})</h3>
              <button
                onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-1.5 bg-[#2D4A8A] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#1e3a6e] transition-colors"
              >
                <UserPlus size={13} />
                Nouveau client
              </button>
            </div>

            {/* Create form */}
            {showForm && (
              <div className="mb-3 p-3 bg-[#F8F9FB] rounded-xl border border-gray-200 animate-in slide-in-from-top-2 duration-200">
                <p className="text-xs font-medium text-[#1A1A23] mb-2">Prénom du client</p>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') createClient_(); if (e.key === 'Escape') { setShowForm(false); setNewName('') } }}
                    placeholder="ex : Sophie Martin"
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2D4A8A]/30 focus:border-[#2D4A8A]"
                  />
                  <button
                    onClick={createClient_}
                    disabled={!newName.trim()}
                    className="w-9 h-9 bg-[#2D4A8A] text-white rounded-lg flex items-center justify-center hover:bg-[#1e3a6e] transition-colors disabled:opacity-40"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setNewName('') }}
                    className="w-9 h-9 border border-gray-200 text-[#6B7280] rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Client rows */}
            <div className="space-y-1">
              {clients.map(c => (
                <div
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors group ${
                    c.id === activeId ? 'bg-[#2D4A8A]/10 border border-[#2D4A8A]/20' : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c.id === activeId ? 'bg-[#2D4A8A] text-white' : 'bg-gray-100 text-[#6B7280]'}`}>
                    {initials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${c.id === activeId ? 'text-[#2D4A8A]' : 'text-[#1A1A23]'}`}>{c.name}</p>
                    <p className="text-xs text-[#6B7280]">{c.points} pts</p>
                  </div>
                  {c.id !== 'jean' && (
                    <button
                      onClick={e => { e.stopPropagation(); removeClient(c.id) }}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DemoLivePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FB]" />}>
      <DemoLiveContent />
    </Suspense>
  )
}
