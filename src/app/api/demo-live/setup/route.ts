import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SECRET_KEY = 'orlyo2026'

const DEMO_LIVE_EMAIL    = 'demo-live@getorlyo.com'
const DEMO_LIVE_PASSWORD = 'OrlyoDemo2026'
const MERCHANT_QR        = 'QR-DEMOLIVE-MERCHANT'
const JEAN_QR            = 'QR-DEMOLIVE-JEAN'

const PALIERS = [
  { points: 5,  libelle: 'Café offert' },
  { points: 10, libelle: 'Viennoiserie offerte' },
  { points: 20, libelle: 'Pain offert' },
]

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Create or find auth user
  const { data: { users } } = await admin.auth.admin.listUsers()
  let userId: string
  const existing = users.find(u => u.email === DEMO_LIVE_EMAIL)

  if (existing) {
    userId = existing.id
    await admin.auth.admin.updateUserById(userId, { password: DEMO_LIVE_PASSWORD })
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: DEMO_LIVE_EMAIL,
      password: DEMO_LIVE_PASSWORD,
      email_confirm: true,
    })
    if (error || !created.user) {
      return NextResponse.json({ error: error?.message ?? 'Cannot create user' }, { status: 500 })
    }
    userId = created.user.id
  }

  // 2. Upsert commercant
  const { error: commErr } = await admin.from('commercants').upsert({
    id: userId,
    nom_commerce: 'Boulangerie du coin',
    secteur_activite: 'Boulangerie / Pâtisserie',
    qr_code_id: MERCHANT_QR,
    couleur_principale: '#2D4A8A',
    points_par_visite: 1,
    points_pour_recompense: 20,
    libelle_recompense: 'Pain offert',
    paliers: PALIERS,
    nom_programme: 'Fidélité Boulangerie Artisanale',
    message_bienvenue: 'Bienvenue dans notre programme de fidélité !',
    abonnement_actif: true,
    plan_actif: 'annuel',
  }, { onConflict: 'id' })

  if (commErr) return NextResponse.json({ error: commErr.message }, { status: 500 })

  // 3. Upsert client Jean Dupont
  const { error: clientErr } = await admin.from('clients').upsert({
    email: 'jean.dupont@gmail.com',
    nom: 'Jean Dupont',
    qr_code_id: JEAN_QR,
  }, { onConflict: 'email' })

  if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 })

  // 4. Upsert carte fidelite (start at 0 points)
  const { error: carteErr } = await admin.from('cartes_fidelite').upsert({
    commercant_id: userId,
    client_email: 'jean.dupont@gmail.com',
    client_nom: 'Jean Dupont',
    nombre_points: 0,
    points_cumules_total: 0,
    recompenses_obtenues: 0,
    derniere_visite: new Date().toISOString(),
  }, { onConflict: 'commercant_id,client_email' })

  if (carteErr) return NextResponse.json({ error: carteErr.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    userId,
    email: DEMO_LIVE_EMAIL,
    password: DEMO_LIVE_PASSWORD,
    jean_qr: JEAN_QR,
  })
}
