'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Star, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
import InstallPrompt from '@/components/InstallPrompt'
import type { Client, Palier } from '@/lib/types'

const QRCodeCanvas = dynamic(() => import('qrcode.react').then((m) => m.QRCodeCanvas), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

type CarteInfo = {
  id: string
  commercant_id: string
  client_email: string
  nombre_points: number
  recompenses_obtenues: number
  commercants: {
    nom_commerce: string
    couleur_principale: string
    paliers: Palier[] | null
    points_pour_recompense: number
    libelle_recompense: string
    points_par_visite: number
    nom_programme: string | null
  }
}

type AnimData = {
  pointsAjoutes: number
  nombrePoints: number
  nomCommerce: string
  couleur: string
  paliers: Palier[]
  recompenseDeclenchee: boolean
  libelleRecompense: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPaliers(c: CarteInfo['commercants']): Palier[] {
  if (Array.isArray(c.paliers) && c.paliers.length > 0) {
    return [...c.paliers].sort((a, b) => a.points - b.points)
  }
  return [{ points: c.points_pour_recompense, libelle: c.libelle_recompense }]
}

// ─── Animation overlay ────────────────────────────────────────────────────────

function AnimationOverlay({ data, onDismiss }: { data: AnimData; onDismiss: () => void }) {
  const [bar, setBar] = useState(100)

  useEffect(() => {
    const DURATION = 4000
    const start = Date.now()
    const raf = () => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100)
      setBar(pct)
      if (pct > 0) requestAnimationFrame(raf)
      else onDismiss()
    }
    const id = requestAnimationFrame(raf)
    return () => cancelAnimationFrame(id)
  }, [onDismiss])

  const paliers = data.paliers
  const nextPalier = paliers.find((p) => p.points > data.nombrePoints)
  const progressMax = nextPalier?.points ?? paliers[paliers.length - 1]?.points ?? 1
  const pct = Math.min(100, Math.round((data.nombrePoints / progressMax) * 100))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barre de décompte */}
        <div className="h-1 bg-gray-100 flex-shrink-0">
          <div
            className="h-full rounded-full"
            style={{ width: `${bar}%`, backgroundColor: data.couleur, transition: 'none' }}
          />
        </div>

        {/* En-tête résultat */}
        <div className="px-6 pt-5 pb-4 text-center border-b border-gray-50 flex-shrink-0">
          <p className="text-xs text-[#6B7280] mb-2 font-medium">{data.nomCommerce}</p>
          {data.recompenseDeclenchee ? (
            <>
              <div className="text-4xl mb-1">🎁</div>
              <h2 className="text-xl font-bold text-[#0F6E56]">Récompense débloquée !</h2>
              <p className="text-sm font-semibold text-[#0F6E56] mt-1">{data.libelleRecompense}</p>
            </>
          ) : (
            <>
              <div
                className="text-6xl font-black leading-none mb-1"
                style={{ color: data.couleur }}
              >
                +{data.pointsAjoutes}
              </div>
              <p className="text-sm font-semibold text-[#1A1A23]">
                point{data.pointsAjoutes > 1 ? 's' : ''} !
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                Total&nbsp;: <strong>{data.nombrePoints}</strong> / {progressMax} pts
              </p>
            </>
          )}
        </div>

        {/* Barre de progression */}
        <div className="px-6 py-4 border-b border-gray-50 flex-shrink-0">
          <div className="flex justify-between text-xs text-[#6B7280] mb-1.5">
            <span>Progression vers la prochaine récompense</span>
            <span className="font-medium text-[#1A1A23]">{data.nombrePoints}/{progressMax}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: data.couleur }}
            />
          </div>
          {nextPalier && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: data.couleur }}>
              ✦ Plus que {nextPalier.points - data.nombrePoints} pt{nextPalier.points - data.nombrePoints > 1 ? 's' : ''} pour {nextPalier.libelle}
            </p>
          )}
        </div>

        {/* Liste des paliers */}
        <div className="px-6 py-4 overflow-y-auto">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Paliers</p>
          <div className="space-y-1.5">
            {paliers.map((p) => {
              const reached = data.nombrePoints >= p.points
              return (
                <div
                  key={p.points}
                  className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2 ${
                    reached ? 'bg-[#0F6E56]/10' : 'bg-gray-50'
                  }`}
                >
                  <span className="flex-shrink-0 text-sm">{reached ? '✅' : '🎁'}</span>
                  <span className={`font-bold tabular-nums flex-shrink-0 w-12 ${reached ? 'text-[#0F6E56]' : 'text-[#1A1A23]'}`}>
                    {p.points} pts
                  </span>
                  <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
                  <span className={`truncate ${reached ? 'text-[#0F6E56] font-semibold' : 'text-[#6B7280]'}`}>
                    {p.libelle}
                  </span>
                  {reached && (
                    <span className="ml-auto text-[#0F6E56] font-semibold flex-shrink-0 text-xs">Atteint</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-6 pb-4 text-center flex-shrink-0">
          <p className="text-xs text-[#6B7280]">Appuyez n&apos;importe où pour fermer</p>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function MonQrCodePage() {
  const params = useParams()
  const router = useRouter()
  const qrCodeId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [cartes, setCartes] = useState<CarteInfo[]>([])
  const [animation, setAnimation] = useState<AnimData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Ref pour accéder aux cartes depuis le handler Realtime sans re-subscribe
  const cartesRef = useRef<CarteInfo[]>([])
  useEffect(() => { cartesRef.current = cartes }, [cartes])

  const load = useCallback(async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.replace(`/login?next=/mon-qr-code/${qrCodeId}`)
      return
    }

    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('qr_code_id', qrCodeId)
      .maybeSingle()

    if (!clientData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    // Défense en profondeur : vérification explicite de propriété.
    // La RLS (clients_select_own : email = auth.email()) fournit déjà
    // cette garantie, mais on valide aussi côté application.
    if (clientData.email !== user.email) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setClient(clientData)

    const { data: cartesData } = await supabase
      .from('cartes_fidelite')
      .select(`
        id, commercant_id, client_email, nombre_points, recompenses_obtenues,
        commercants (
          nom_commerce, couleur_principale, paliers,
          points_pour_recompense, libelle_recompense, points_par_visite, nom_programme
        )
      `)
      .eq('client_email', clientData.email)
      .order('derniere_visite', { ascending: false })

    setCartes((cartesData || []) as unknown as CarteInfo[])
    setLoading(false)
  }, [qrCodeId, router])

  useEffect(() => { load() }, [load])

  // ── Realtime ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!client) return

    const supabase = createClient()

    const channel = supabase
      .channel(`mon-qr-${qrCodeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cartes_fidelite',
          filter: `client_email=eq.${client.email}`,
        },
        (payload) => {
          const newData = payload.new as {
            id: string
            commercant_id: string
            nombre_points: number
            recompenses_obtenues: number
          }

          const carteExistante = cartesRef.current.find(
            (c) => c.commercant_id === newData.commercant_id
          )
          if (!carteExistante) { load(); return }

          const paliers = getPaliers(carteExistante.commercants)
          const prevPoints = carteExistante.nombre_points
          const newPoints = newData.nombre_points
          const recompenseDeclenchee = newData.recompenses_obtenues > carteExistante.recompenses_obtenues
          const pointsParVisite = carteExistante.commercants.points_par_visite || 1

          // Après une récompense les points sont remis à zéro — on affiche points_par_visite
          const pointsAjoutes = recompenseDeclenchee
            ? pointsParVisite
            : Math.max(pointsParVisite, newPoints - prevPoints)

          // Identifier le palier déclenché pour son libellé
          let libelleRecompense = ''
          if (recompenseDeclenchee) {
            const totalAvant = prevPoints + pointsParVisite
            libelleRecompense =
              [...paliers].reverse().find((p) => totalAvant >= p.points)?.libelle ??
              paliers[paliers.length - 1]?.libelle ?? ''
          }

          // Mettre à jour l'état local immédiatement
          setCartes((prev) =>
            prev.map((c) =>
              c.commercant_id === newData.commercant_id
                ? { ...c, nombre_points: newPoints, recompenses_obtenues: newData.recompenses_obtenues }
                : c
            )
          )

          setAnimation({
            pointsAjoutes,
            nombrePoints: newPoints,
            nomCommerce: carteExistante.commercants.nom_commerce,
            couleur: carteExistante.commercants.couleur_principale || '#2D4A8A',
            paliers,
            recompenseDeclenchee,
            libelleRecompense,
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cartes_fidelite',
          filter: `client_email=eq.${client.email}`,
        },
        async (payload) => {
          // Première visite chez un nouveau commerce — recharger pour avoir les données jointes
          const newData = payload.new as { id: string; nombre_points: number; commercant_id: string }
          const supabase = createClient()
          const { data: newCarte } = await supabase
            .from('cartes_fidelite')
            .select(`
              id, commercant_id, client_email, nombre_points, recompenses_obtenues,
              commercants (
                nom_commerce, couleur_principale, paliers,
                points_pour_recompense, libelle_recompense, points_par_visite, nom_programme
              )
            `)
            .eq('id', newData.id)
            .single()

          if (!newCarte) return
          const carte = newCarte as unknown as CarteInfo
          const paliers = getPaliers(carte.commercants)

          setCartes((prev) => [carte, ...prev])
          setAnimation({
            pointsAjoutes: newData.nombre_points,
            nombrePoints: newData.nombre_points,
            nomCommerce: carte.commercants.nom_commerce,
            couleur: carte.commercants.couleur_principale || '#2D4A8A',
            paliers,
            recompenseDeclenchee: false,
            libelleRecompense: '',
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [client, qrCodeId, load])

  const dismissAnimation = useCallback(() => setAnimation(null), [])

  // ── États de chargement ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D4A8A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !client) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[#6B7280]">QR code introuvable.</p>
        <Link href="/register" className="text-[#2D4A8A] font-medium hover:underline text-sm">
          Créer une carte de fidélité →
        </Link>
      </div>
    )
  }

  // ── Rendu principal ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {animation && <AnimationOverlay data={animation} onDismiss={dismissAnimation} />}

      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link
          href="/register"
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <Logo size="sm" />
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#0F6E56] animate-pulse" />
          <span className="text-xs text-[#6B7280]">En direct</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">

          {/* QR Card */}
          <div>
            <h1 className="text-2xl font-bold text-center mb-1">Bonjour {client.nom} 👋</h1>
            <p className="text-[#6B7280] text-sm text-center mb-5">Présentez ce QR code en caisse</p>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-[#2D4A8A] to-[#1e3a6e] p-6 text-white text-center">
                <Logo white size="sm" />
                <p className="text-white/70 text-xs mt-1">Carte de fidélité</p>
                <p className="font-bold text-lg mt-2">{client.nom}</p>
              </div>
              <div className="p-8 flex flex-col items-center">
                <QRCodeCanvas
                  value={client.qr_code_id}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#1A1A23"
                  level="H"
                  includeMargin={false}
                />
                <p className="text-xs text-[#6B7280] font-mono mt-4 break-all text-center">
                  {client.qr_code_id}
                </p>
              </div>
            </div>
          </div>

          {/* Ajouter à l'écran d'accueil */}
          <InstallPrompt />

          {/* Points par commerce */}
          {cartes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#2D4A8A]/10 flex items-center justify-center mx-auto mb-3">
                <Star size={22} className="text-[#2D4A8A]" />
              </div>
              <p className="font-medium text-[#1A1A23] text-sm">Pas encore de points</p>
              <p className="text-xs text-[#6B7280] mt-1">
                Présentez ce QR code en caisse pour gagner vos premiers points !
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="font-semibold text-[#1A1A23]">Mes points de fidélité</h2>
              {cartes.map((carte) => {
                const paliers = getPaliers(carte.commercants)
                const color = carte.commercants.couleur_principale || '#2D4A8A'
                const programmeNom = carte.commercants.nom_programme || carte.commercants.nom_commerce
                const maxPalier = paliers[paliers.length - 1]
                const nextPalier = paliers.find((p) => p.points > carte.nombre_points)
                const progressTarget = nextPalier?.points ?? maxPalier.points
                const pct = Math.min(100, Math.round((carte.nombre_points / progressTarget) * 100))

                return (
                  <div key={carte.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Header commerce */}
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {carte.commercants.nom_commerce.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#1A1A23] truncate">
                          {carte.commercants.nom_commerce}
                        </p>
                        <p className="text-xs text-[#6B7280] truncate">
                          {programmeNom !== carte.commercants.nom_commerce ? programmeNom : 'Programme de fidélité'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-black" style={{ color }}>{carte.nombre_points}</p>
                        <p className="text-xs text-[#6B7280]">pts</p>
                      </div>
                    </div>

                    <div className="px-5 py-4 space-y-3">
                      {/* Barre de progression */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-[#6B7280]">Progression</span>
                          <span className="font-medium text-[#1A1A23]">
                            {carte.nombre_points} / {progressTarget} pts
                          </span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>

                      {/* Prochaine récompense */}
                      {nextPalier && (
                        <div
                          className="rounded-xl px-3 py-2.5 flex items-center gap-2"
                          style={{
                            backgroundColor: `${color}12`,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          <Star size={14} style={{ color }} className="flex-shrink-0" />
                          <p className="text-sm" style={{ color }}>
                            <span className="font-semibold">
                              Plus que {nextPalier.points - carte.nombre_points} pt
                              {nextPalier.points - carte.nombre_points > 1 ? 's' : ''}
                            </span>
                            {' '}pour{' '}
                            <span className="font-semibold">{nextPalier.libelle}</span>
                          </p>
                        </div>
                      )}

                      {/* Paliers */}
                      <div className="space-y-1.5">
                        {paliers.map((p) => {
                          const reached = carte.nombre_points >= p.points
                          return (
                            <div
                              key={p.points}
                              className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 ${
                                reached ? 'bg-[#0F6E56]/5' : 'bg-gray-50'
                              }`}
                            >
                              <span>{reached ? '✅' : '🎁'}</span>
                              <span
                                className={`font-semibold tabular-nums flex-shrink-0 ${
                                  reached ? 'text-[#0F6E56]' : 'text-[#6B7280]'
                                }`}
                              >
                                {p.points} pts
                              </span>
                              <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
                              <span
                                className={`truncate ${
                                  reached ? 'text-[#0F6E56] font-medium' : 'text-[#1A1A23]'
                                }`}
                              >
                                {p.libelle}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {carte.recompenses_obtenues > 0 && (
                        <p className="text-xs text-[#6B7280] text-center pt-0.5">
                          🏆 {carte.recompenses_obtenues} récompense
                          {carte.recompenses_obtenues > 1 ? 's' : ''} obtenue
                          {carte.recompenses_obtenues > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
