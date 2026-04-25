'use client'

import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Gift, Star, TrendingUp, Users, RefreshCw, Wifi } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const SECRET_KEY = 'orlyo2026'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://getorlyo.com'

const PALIERS = [
  { points: 5,  libelle: 'Café offert',         emoji: '☕' },
  { points: 10, libelle: 'Viennoiserie offerte', emoji: '🥐' },
  { points: 20, libelle: 'Pain offert',          emoji: '🍞' },
]

const POINTS_MAX = 20

interface ScanEvent {
  id: number
  time: string
  points: number
  palier?: string
}

function PalierBadge({ libelle, emoji, unlocked }: { libelle: string; emoji: string; unlocked: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
      unlocked
        ? 'bg-[#0F6E56] border-[#0F6E56] text-white shadow-lg shadow-[#0F6E56]/30'
        : 'bg-gray-50 border-gray-200 text-[#6B7280]'
    }`}>
      <span className="text-xl">{emoji}</span>
      <span className={`text-sm font-medium ${unlocked ? 'text-white' : ''}`}>{libelle}</span>
      {unlocked && <span className="ml-auto text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">✓ Débloqué</span>}
    </div>
  )
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const nextPalier = PALIERS.find(p => p.points > value)
  return (
    <div>
      <div className="flex justify-between text-xs text-[#6B7280] mb-2">
        <span>{value} point{value > 1 ? 's' : ''}</span>
        {nextPalier && <span>Prochain : {nextPalier.libelle} à {nextPalier.points} pts</span>}
      </div>
      <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: '#2D4A8A' }}
        />
      </div>
    </div>
  )
}

function DemoLiveContent() {
  const params = useSearchParams()
  const [authorized, setAuthorized] = useState(false)
  const [points, setPoints] = useState(0)
  const [scans, setScans] = useState<ScanEvent[]>([])
  const [flash, setFlash] = useState(false)
  const [connected, setConnected] = useState(false)
  const scanCountRef = useRef(0)
  const totalScansState = useRef(0)
  const [totalScans, setTotalScans] = useState(0)

  useEffect(() => {
    setAuthorized(params.get('key') === SECRET_KEY)
  }, [params])

  const addPoint = useCallback(() => {
    setPoints(prev => {
      const next = prev >= POINTS_MAX ? 1 : prev + 1
      const palier = PALIERS.find(p => p.points === next)
      const id = ++scanCountRef.current
      const event: ScanEvent = {
        id,
        time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()),
        points: next,
        palier: palier?.libelle,
      }
      setScans(s => [event, ...s].slice(0, 5))
      return next
    })
    totalScansState.current += 1
    setTotalScans(totalScansState.current)
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
  }, [])

  // Supabase Realtime broadcast subscription
  useEffect(() => {
    if (!authorized) return
    const supabase = createClient()
    const channel = supabase.channel('demo-live')
    channel
      .on('broadcast', { event: 'scan' }, () => addPoint())
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(channel) }
  }, [authorized, addPoint])

  const reset = useCallback(() => {
    setPoints(0)
    setScans([])
    scanCountRef.current = 0
    totalScansState.current = 0
    setTotalScans(0)
  }, [])

  const scanUrl = `${APP_URL}/api/demo-live/scan?key=${SECRET_KEY}`
  const rewardsEarned = PALIERS.filter(p => p.points <= points).length

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#1A1A23] flex items-center justify-center">
        <p className="text-white/40 text-sm">Accès refusé</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-6 lg:p-10">
      {/* Flash overlay */}
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
        <button
          onClick={reset}
          className="flex items-center gap-2 border border-gray-200 bg-white text-[#6B7280] text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 hover:text-[#1A1A23] transition-colors shadow-sm"
        >
          <RefreshCw size={14} />
          Réinitialiser la démo
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">

        {/* Left — KPIs + paliers + historique */}
        <div className="lg:col-span-2 space-y-6">

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Points actuels', value: points, icon: TrendingUp, color: 'text-[#2D4A8A]', bg: 'bg-[#2D4A8A]/10', highlight: flash },
              { label: 'Récompenses', value: rewardsEarned, icon: Gift, color: 'text-[#0F6E56]', bg: 'bg-[#0F6E56]/10', highlight: false },
              { label: 'Scans totaux', value: totalScans, icon: Users, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', highlight: false },
            ].map(({ label, value, icon: Icon, color, bg, highlight }) => (
              <div key={label} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all duration-300 ${highlight ? 'border-green-400 shadow-green-100' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[#6B7280] font-medium">{label}</span>
                  <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon size={16} className={color} />
                  </div>
                </div>
                <p className={`text-3xl font-bold tabular-nums transition-all duration-300 ${highlight ? 'text-green-600' : 'text-[#1A1A23]'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Client card */}
          <div className={`bg-white rounded-2xl border shadow-sm p-6 transition-all duration-300 ${flash ? 'border-green-400' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-[#2D4A8A]/10 flex items-center justify-center text-[#2D4A8A] font-bold text-lg">JD</div>
              <div>
                <p className="font-semibold text-[#1A1A23]">Jean Dupont</p>
                <p className="text-sm text-[#6B7280]">jean.dupont@gmail.com</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Star size={14} className="text-yellow-500" fill="currentColor" />
                <span className="text-sm font-semibold">{rewardsEarned} récompense{rewardsEarned !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <ProgressBar value={points} max={POINTS_MAX} />
          </div>

          {/* Paliers */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-[#1A1A23] mb-4">Programme de fidélité</h3>
            <div className="space-y-3">
              {PALIERS.map((p) => (
                <PalierBadge
                  key={p.points}
                  libelle={`${p.points} pts — ${p.libelle}`}
                  emoji={p.emoji}
                  unlocked={points >= p.points}
                />
              ))}
            </div>
          </div>

          {/* Historique */}
          {scans.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-[#1A1A23] mb-4">Historique des scans</h3>
              <div className="space-y-2">
                {scans.map((s, i) => (
                  <div key={s.id} className={`flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 ${i === 0 ? 'animate-in slide-in-from-top-2 duration-300' : ''}`}>
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-sm text-[#6B7280] tabular-nums w-20 flex-shrink-0">{s.time}</span>
                    <span className="text-sm font-medium text-[#1A1A23]">+1 point → {s.points} pts</span>
                    {s.palier && (
                      <span className="ml-auto text-xs font-semibold bg-[#0F6E56] text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                        🎉 {s.palier}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — QR code */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center sticky top-6">
            <h3 className="font-semibold text-[#1A1A23] mb-1">Carte fidélité de</h3>
            <p className="text-2xl font-bold text-[#2D4A8A] mb-5">Jean Dupont</p>

            <div className={`inline-block p-4 rounded-2xl border-2 transition-all duration-300 ${flash ? 'border-green-500 shadow-lg shadow-green-500/25' : 'border-gray-100'}`}>
              <QRCodeSVG
                value={scanUrl}
                size={210}
                bgColor="#ffffff"
                fgColor="#2D4A8A"
                level="M"
              />
            </div>

            <p className="text-xs text-[#6B7280] mt-4 mb-5 leading-relaxed">
              Scannez avec l'appareil photo de votre téléphone pour ajouter un point en temps réel
            </p>

            <button
              onClick={addPoint}
              className="w-full bg-[#F59E0B] text-[#1B2B4B] font-semibold py-3 rounded-xl hover:bg-[#e08900] transition-colors text-sm"
            >
              ✚ Simuler un scan
            </button>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs text-[#6B7280] mb-1">Points actuels</p>
              <p className={`text-5xl font-bold tabular-nums transition-all duration-300 ${flash ? 'text-green-600' : 'text-[#2D4A8A]'}`}>
                {points}
              </p>
              <p className="text-xs text-[#6B7280] mt-1">/ {POINTS_MAX} pts max</p>
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
