import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@fidelitepro.fr'
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'DemoFidelite2024!'
const DEMO_QR = 'QR-DEMO-BOULANGERIE'

const DEMO_PALIERS = [
  { points: 5,  libelle: 'Café offert' },
  { points: 10, libelle: 'Croissant offert' },
  { points: 20, libelle: 'Baguette offerte' },
]

const DEMO_CLIENTS = [
  { nom: 'Marie Dupont',   email: 'marie.dupont.demo@fidelitepro.fr',   qr: 'QR-DEMO-CLI-01', points: 8,  cumul: 23, recompenses: 1 },
  { nom: 'Thomas Bernard', email: 'thomas.bernard.demo@fidelitepro.fr', qr: 'QR-DEMO-CLI-02', points: 4,  cumul: 14, recompenses: 1 },
  { nom: 'Sophie Leblanc', email: 'sophie.leblanc.demo@fidelitepro.fr', qr: 'QR-DEMO-CLI-03', points: 9,  cumul: 19, recompenses: 0 },
  { nom: 'Lucas Petit',    email: 'lucas.petit.demo@fidelitepro.fr',    qr: 'QR-DEMO-CLI-04', points: 2,  cumul: 32, recompenses: 3 },
  { nom: 'Emma Rousseau',  email: 'emma.rousseau.demo@fidelitepro.fr',  qr: 'QR-DEMO-CLI-05', points: 6,  cumul: 16, recompenses: 1 },
  { nom: 'Nathan Leblanc', email: 'nathan.leblanc.demo@fidelitepro.fr', qr: 'QR-DEMO-CLI-06', points: 1,  cumul: 6,  recompenses: 0 },
  { nom: 'Camille Moreau', email: 'camille.moreau.demo@fidelitepro.fr', qr: 'QR-DEMO-CLI-07', points: 7,  cumul: 27, recompenses: 2 },
  { nom: 'Julien Garcia',  email: 'julien.garcia.demo@fidelitepro.fr',  qr: 'QR-DEMO-CLI-08', points: 3,  cumul: 8,  recompenses: 0 },
]

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Create or find the demo auth user
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  let demoUserId: string
  const existingUser = users.find((u) => u.email === DEMO_EMAIL)

  if (existingUser) {
    demoUserId = existingUser.id
    // Ensure password is up to date
    await admin.auth.admin.updateUserById(demoUserId, { password: DEMO_PASSWORD })
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    })
    if (createErr || !created.user) {
      return NextResponse.json({ error: createErr?.message ?? 'Cannot create user' }, { status: 500 })
    }
    demoUserId = created.user.id
  }

  // 2. Upsert the commercant record
  const { error: commErr } = await admin.from('commercants').upsert({
    id: demoUserId,
    nom_commerce: 'Boulangerie Martin',
    secteur_activite: 'Boulangerie / Pâtisserie',
    qr_code_id: DEMO_QR,
    couleur_principale: '#2D4A8A',
    points_par_visite: 1,
    points_pour_recompense: 5,
    libelle_recompense: 'Café offert',
    paliers: DEMO_PALIERS,
    nom_programme: 'Club Fidélité Martin',
    message_bienvenue: 'Bienvenue dans notre programme de fidélité !',
    abonnement_actif: true,
    plan_actif: 'annuel',
  }, { onConflict: 'id' })

  if (commErr) return NextResponse.json({ error: commErr.message }, { status: 500 })

  // 3. Upsert demo clients and their cartes
  const visiteBase = new Date()
  for (let i = 0; i < DEMO_CLIENTS.length; i++) {
    const c = DEMO_CLIENTS[i]

    await admin.from('clients').upsert({
      email: c.email,
      nom: c.nom,
      qr_code_id: c.qr,
    }, { onConflict: 'email' })

    const visite = new Date(visiteBase)
    visite.setDate(visite.getDate() - i * 2)

    await admin.from('cartes_fidelite').upsert({
      commercant_id: demoUserId,
      client_email: c.email,
      client_nom: c.nom,
      nombre_points: c.points,
      points_cumules_total: c.cumul,
      recompenses_obtenues: c.recompenses,
      derniere_visite: visite.toISOString(),
    }, { onConflict: 'commercant_id,client_email' })
  }

  // 4. Insert a few demo rewards for context
  const { data: cartes } = await admin
    .from('cartes_fidelite')
    .select('id, client_nom, recompenses_obtenues')
    .eq('commercant_id', demoUserId)
    .gt('recompenses_obtenues', 0)

  for (const carte of (cartes ?? [])) {
    const { count } = await admin
      .from('recompenses')
      .select('*', { count: 'exact', head: true })
      .eq('carte_fidelite_id', carte.id)
      .eq('commercant_id', demoUserId)

    if ((count ?? 0) === 0) {
      await admin.from('recompenses').insert({
        carte_fidelite_id: carte.id,
        commercant_id: demoUserId,
        libelle: 'Café offert',
        utilisee: false,
        date_obtention: new Date(Date.now() - 86_400_000 * 3).toISOString(),
      })
    }
  }

  return NextResponse.json({ ok: true, demoUserId, email: DEMO_EMAIL })
}
