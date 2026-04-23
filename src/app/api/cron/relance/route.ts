import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendRelanceEmail } from '@/lib/email'

// Protect the cron endpoint with a shared secret (set CRON_SECRET in env)
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // unprotected in dev if secret not set
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

type CarteRelance = {
  id: string
  client_email: string
  nombre_points: number
  derniere_visite: string
  commercants: {
    nom_commerce: string
    couleur_principale: string
    paliers: { points: number; libelle: string }[] | null
    points_pour_recompense: number
    libelle_recompense: string
  }
  clients: {
    nom: string
    qr_code_id: string
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  // Window: 30–31 days ago — one email per client per inactivity cycle
  const windowEnd = new Date()
  windowEnd.setDate(windowEnd.getDate() - 30)
  const windowStart = new Date()
  windowStart.setDate(windowStart.getDate() - 31)

  const { data: cartes, error } = await supabase
    .from('cartes_fidelite')
    .select(`
      id, client_email, nombre_points, derniere_visite,
      commercants ( nom_commerce, couleur_principale, paliers, points_pour_recompense, libelle_recompense ),
      clients!cartes_fidelite_client_email_fkey ( nom, qr_code_id )
    `)
    .gte('derniere_visite', windowStart.toISOString())
    .lte('derniere_visite', windowEnd.toISOString())

  if (error) {
    console.error('[cron/relance] query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!cartes || cartes.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const results = await Promise.allSettled(
    (cartes as unknown as CarteRelance[]).map(async (carte) => {
      const c = carte.commercants
      const cl = carte.clients
      if (!c || !cl) return

      const paliers = Array.isArray(c.paliers) && c.paliers.length > 0
        ? [...c.paliers].sort((a, b) => a.points - b.points)
        : [{ points: c.points_pour_recompense, libelle: c.libelle_recompense }]

      const nextPalier = paliers.find((p) => p.points > carte.nombre_points)

      const derniere = new Date(carte.derniere_visite)
      const joursInactif = Math.floor((Date.now() - derniere.getTime()) / 86_400_000)

      await sendRelanceEmail({
        clientEmail: carte.client_email,
        clientNom: cl.nom,
        clientQrCodeId: cl.qr_code_id,
        nomCommerce: c.nom_commerce,
        couleur: c.couleur_principale || '#534AB7',
        nombrePoints: carte.nombre_points,
        joursInactif,
        libelleProchainPalier: nextPalier?.libelle ?? null,
        pointsManquants: nextPalier ? nextPalier.points - carte.nombre_points : null,
      })
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  console.log(`[cron/relance] sent=${sent} failed=${failed}`)

  return NextResponse.json({ sent, failed })
}
