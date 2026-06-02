import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWeeklySummaryEmail } from '@/lib/email'
import { apiError } from '@/lib/api-error'

type Commercant = {
  id: string
  nom_commerce: string
  couleur_principale: string
  qr_code_id: string
  email_optin: boolean
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron/resume-hebdo] CRON_SECRET not configured')
    return NextResponse.json({ error: 'CRON_SECRET manquant' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Semaine courante : lundi dernier → aujourd'hui
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  // Semaine précédente : pour calculer la variation
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(weekStart.getDate() - 7)

  // Récupérer tous les commerçants avec abonnement actif et email_optin
  const { data: commercants, error: commercantsError } = await supabase
    .from('commercants')
    .select('id, nom_commerce, couleur_principale, qr_code_id, email_optin')
    .eq('abonnement_actif', true)
    .neq('id', '00000000-0000-0000-0000-000000000000') // exclure compte démo

  if (commercantsError) return apiError(commercantsError, { fallback: 'Erreur résumé hebdo.' })
  if (!commercants || commercants.length === 0) return NextResponse.json({ sent: 0 })

  const results = await Promise.allSettled(
    (commercants as Commercant[])
      .filter((c) => c.email_optin !== false)
      .map(async (commercant) => {
        // Récupérer l'email du commerçant depuis Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(commercant.id)
        if (authError || !authUser.user?.email) return

        // Scans cette semaine
        const { count: scansCount } = await supabase
          .from('scans')
          .select('id', { count: 'exact', head: true })
          .eq('commercant_id', commercant.id)
          .gte('created_at', weekStart.toISOString())

        // Scans semaine précédente (pour delta)
        const { count: scansPrevCount } = await supabase
          .from('scans')
          .select('id', { count: 'exact', head: true })
          .eq('commercant_id', commercant.id)
          .gte('created_at', prevWeekStart.toISOString())
          .lt('created_at', weekStart.toISOString())

        // Nouveaux clients cette semaine
        const { count: nouveauxClientsCount } = await supabase
          .from('cartes_fidelite')
          .select('id', { count: 'exact', head: true })
          .eq('commercant_id', commercant.id)
          .gte('created_at', weekStart.toISOString())

        // Récompenses débloquées cette semaine
        const { count: recompensesCount } = await supabase
          .from('recompenses')
          .select('id', { count: 'exact', head: true })
          .eq('commercant_id', commercant.id)
          .gte('date_obtention', weekStart.toISOString())

        // Clients inactifs > 30j
        const cutoff30j = new Date(Date.now() - 30 * 86_400_000)
        const { count: inactifsCount } = await supabase
          .from('cartes_fidelite')
          .select('id', { count: 'exact', head: true })
          .eq('commercant_id', commercant.id)
          .lt('derniere_visite', cutoff30j.toISOString())

        await sendWeeklySummaryEmail({
          email: authUser.user.email,
          nomCommerce: commercant.nom_commerce,
          merchantQrCodeId: commercant.qr_code_id,
          scansTotal: scansCount ?? 0,
          scansDelta: (scansCount ?? 0) - (scansPrevCount ?? 0),
          nouveauxClients: nouveauxClientsCount ?? 0,
          recompensesDebloquees: recompensesCount ?? 0,
          clientsInactifs: inactifsCount ?? 0,
        })
      })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  console.log(`[cron/resume-hebdo] sent=${sent} failed=${failed}`)

  return NextResponse.json({ sent, failed })
}
