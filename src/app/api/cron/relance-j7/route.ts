import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRelanceJ7Email } from '@/lib/email'


type Palier = { points: number; libelle: string }

type EmailLog = {
  id: string
  carte_fidelite_id: string
  sent_at: string
  metadata: {
    points_at_time: number
    points_manquants: number
    palier_libelle: string
    palier_points: number
  }
}

type CarteAvecJoins = {
  id: string
  client_email: string
  nombre_points: number
  commercants: {
    nom_commerce: string
    couleur_principale: string
    paliers: Palier[] | null
    points_pour_recompense: number
    libelle_recompense: string
  }
  clients: {
    nom: string
    qr_code_id: string
  }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron/relance-j7] CRON_SECRET not configured')
    return NextResponse.json({ error: 'CRON_SECRET manquant' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Fenêtre : emails "presque là" envoyés il y a 7–8 jours
  const windowEnd = new Date(Date.now() - 7 * 86_400_000)
  const windowStart = new Date(Date.now() - 8 * 86_400_000)

  const { data: logs, error: logsError } = await supabase
    .from('email_logs')
    .select('id, carte_fidelite_id, sent_at, metadata')
    .eq('type', 'almost_there')
    .gte('sent_at', windowStart.toISOString())
    .lte('sent_at', windowEnd.toISOString())

  if (logsError) {
    console.error('[cron/relance-j7] logs query error:', logsError)
    return NextResponse.json({ error: logsError.message }, { status: 500 })
  }
  if (!logs || logs.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // IDs de cartes uniques dans la fenêtre
  const carteIds = [...new Set((logs as EmailLog[]).map((l) => l.carte_fidelite_id))]

  // Vérifier les scans survenus après chaque almost_there
  const { data: recentScans } = await supabase
    .from('scans')
    .select('carte_fidelite_id, created_at')
    .in('carte_fidelite_id', carteIds)
    .gte('created_at', windowStart.toISOString())

  // Vérifier les relance_j7 déjà envoyées pour ces cartes
  const { data: existingJ7 } = await supabase
    .from('email_logs')
    .select('carte_fidelite_id')
    .eq('type', 'relance_j7')
    .in('carte_fidelite_id', carteIds)
    .gte('sent_at', windowStart.toISOString())

  const cartesAvecScanRecent = new Set(
    (recentScans ?? []).map((s: { carte_fidelite_id: string }) => s.carte_fidelite_id)
  )
  const cartesAvecJ7 = new Set(
    (existingJ7 ?? []).map((e: { carte_fidelite_id: string }) => e.carte_fidelite_id)
  )

  // Garder un log par carte (le plus récent si plusieurs almost_there dans la fenêtre)
  const logParCarte = new Map<string, EmailLog>()
  for (const log of logs as EmailLog[]) {
    const existing = logParCarte.get(log.carte_fidelite_id)
    if (!existing || log.sent_at > existing.sent_at) {
      logParCarte.set(log.carte_fidelite_id, log)
    }
  }

  // Filtrer : pas de scan depuis l'envoi, pas de J+7 déjà envoyé
  const eligibles = [...logParCarte.values()].filter(
    (log) => !cartesAvecScanRecent.has(log.carte_fidelite_id) && !cartesAvecJ7.has(log.carte_fidelite_id)
  )

  if (eligibles.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Récupérer les données à jour des cartes éligibles
  const eligibleCarteIds = eligibles.map((l) => l.carte_fidelite_id)
  const { data: cartes, error: cartesError } = await supabase
    .from('cartes_fidelite')
    .select(`
      id, client_email, nombre_points,
      commercants ( nom_commerce, couleur_principale, paliers, points_pour_recompense, libelle_recompense ),
      clients!cartes_fidelite_client_email_fkey ( nom, qr_code_id )
    `)
    .in('id', eligibleCarteIds)

  if (cartesError) {
    console.error('[cron/relance-j7] cartes query error:', cartesError)
    return NextResponse.json({ error: cartesError.message }, { status: 500 })
  }

  const carteById = new Map(
    (cartes as unknown as CarteAvecJoins[]).map((c) => [c.id, c])
  )

  const results = await Promise.allSettled(
    eligibles.map(async (log) => {
      const carte = carteById.get(log.carte_fidelite_id)
      if (!carte?.commercants || !carte?.clients) return

      const c = carte.commercants
      const cl = carte.clients
      const paliers: Palier[] = Array.isArray(c.paliers) && c.paliers.length > 0
        ? [...c.paliers].sort((a, b) => a.points - b.points)
        : [{ points: c.points_pour_recompense, libelle: c.libelle_recompense }]

      // Points actuels (re-fetched) pour l'état à jour
      const nextPalier = paliers.find((p) => p.points > carte.nombre_points)
      if (!nextPalier) return // Déjà au-delà du palier, pas de relance

      const pointsManquants = nextPalier.points - carte.nombre_points

      await sendRelanceJ7Email({
        clientEmail: carte.client_email,
        clientNom: cl.nom,
        clientQrCodeId: cl.qr_code_id,
        nomCommerce: c.nom_commerce,
        couleur: c.couleur_principale || '#2D4A8A',
        pointsActuels: carte.nombre_points,
        pointsManquants,
        libelleProchainPalier: nextPalier.libelle,
        pointsProchainPalier: nextPalier.points,
      })

      // Logger l'envoi pour éviter les doublons
      await supabase.from('email_logs').insert({
        carte_fidelite_id: log.carte_fidelite_id,
        type: 'relance_j7',
        metadata: { almost_there_log_id: log.id, points_at_time: carte.nombre_points, points_manquants: pointsManquants },
      })
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  console.log(`[cron/relance-j7] sent=${sent} failed=${failed}`)

  return NextResponse.json({ sent, failed })
}
