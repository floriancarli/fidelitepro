import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRelance15jEmail } from '@/lib/email'
import { apiError } from '@/lib/api-error'

type Palier = { points: number; libelle: string }

type CarteRelance = {
  id: string
  client_email: string
  nombre_points: number
  derniere_visite: string
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
    email_optin: boolean
  }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron/relance-15j] CRON_SECRET not configured')
    return NextResponse.json({ error: 'CRON_SECRET manquant' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Fenêtre : dernière visite il y a exactement 15–16 jours
  const windowEnd = new Date(Date.now() - 15 * 86_400_000)
  const windowStart = new Date(Date.now() - 16 * 86_400_000)

  const { data: cartes, error } = await supabase
    .from('cartes_fidelite')
    .select(`
      id, client_email, nombre_points, derniere_visite,
      commercants ( nom_commerce, couleur_principale, paliers, points_pour_recompense, libelle_recompense ),
      clients!cartes_fidelite_client_email_fkey ( nom, qr_code_id, email_optin )
    `)
    .gte('derniere_visite', windowStart.toISOString())
    .lte('derniere_visite', windowEnd.toISOString())

  if (error) return apiError(error, { fallback: 'Erreur relance 15j.' })
  if (!cartes || cartes.length === 0) return NextResponse.json({ sent: 0 })

  // Vérifier qu'une relance 15j n'a pas déjà été envoyée pour ces cartes dans les 16 derniers jours
  const carteIds = (cartes as unknown as CarteRelance[]).map((c) => c.id)
  const { data: dejaEnvoyes } = await supabase
    .from('email_logs')
    .select('carte_fidelite_id')
    .eq('type', 'relance_15j')
    .in('carte_fidelite_id', carteIds)
    .gte('sent_at', windowStart.toISOString())

  const dejaEnvoyesSet = new Set(
    (dejaEnvoyes ?? []).map((e: { carte_fidelite_id: string }) => e.carte_fidelite_id)
  )

  const results = await Promise.allSettled(
    (cartes as unknown as CarteRelance[])
      .filter((carte) => {
        const cl = carte.clients
        return cl && cl.email_optin !== false && !dejaEnvoyesSet.has(carte.id)
      })
      .map(async (carte) => {
        const c = carte.commercants
        const cl = carte.clients
        if (!c || !cl) return

        const paliers: Palier[] = Array.isArray(c.paliers) && c.paliers.length > 0
          ? [...c.paliers].sort((a, b) => a.points - b.points)
          : [{ points: c.points_pour_recompense, libelle: c.libelle_recompense }]

        const nextPalier = paliers.find((p) => p.points > carte.nombre_points)

        await sendRelance15jEmail({
          clientEmail: carte.client_email,
          clientNom: cl.nom,
          clientQrCodeId: cl.qr_code_id,
          nomCommerce: c.nom_commerce,
          couleur: c.couleur_principale || '#2D4A8A',
          nombrePoints: carte.nombre_points,
          libelleProchainPalier: nextPalier?.libelle ?? null,
          pointsManquants: nextPalier ? nextPalier.points - carte.nombre_points : null,
        })

        await supabase.from('email_logs').insert({
          carte_fidelite_id: carte.id,
          type: 'relance_15j',
          metadata: { points_at_time: carte.nombre_points },
        })
      })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  console.log(`[cron/relance-15j] sent=${sent} failed=${failed}`)

  return NextResponse.json({ sent, failed })
}
