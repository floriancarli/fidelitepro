import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  if (!checkRateLimit(ip).allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans une heure.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const { merchant_id, email: rawEmail, password, nom: rawNom } =
    body as Record<string, unknown>

  const email = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : ''
  const nom = typeof rawNom === 'string' ? rawNom.trim() : ''

  if (!merchant_id || typeof merchant_id !== 'string' || !UUID_RE.test(merchant_id)) {
    return NextResponse.json({ error: 'Identifiant commerce invalide.' }, { status: 400 })
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Le mot de passe doit contenir au moins 8 caractères.' },
      { status: 400 }
    )
  }
  if (!nom || nom.length > 100) {
    return NextResponse.json(
      { error: 'Prénom invalide (1–100 caractères).' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // Vérifier que le commerce existe
  const { data: commercant, error: commercantErr } = await admin
    .from('commercants')
    .select('id')
    .eq('id', merchant_id)
    .single()

  if (commercantErr || !commercant) {
    return NextResponse.json({ error: 'Commerce introuvable.' }, { status: 404 })
  }

  // Créer l'utilisateur auth (email confirmé immédiatement)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nom },
  })

  if (authError) {
    const msg = authError.message.toLowerCase()
    if (
      msg.includes('already registered') ||
      msg.includes('already exists') ||
      (authError as { status?: number }).status === 422
    ) {
      return NextResponse.json({ error: 'EMAIL_TAKEN' }, { status: 409 })
    }
    console.error('[api/join] createUser error:', authError)
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte.' },
      { status: 500 }
    )
  }

  const qrCodeId = 'QR-' + crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()

  // Insérer le client
  const { error: clientErr } = await admin
    .from('clients')
    .insert({ email, nom, qr_code_id: qrCodeId })

  if (clientErr) {
    // Rollback : supprimer l'auth user pour éviter un orphelin
    await admin.auth.admin.deleteUser(authData.user.id)
    console.error('[api/join] insert client error:', clientErr)
    return NextResponse.json(
      { error: 'Erreur lors de la création du profil.' },
      { status: 500 }
    )
  }

  // Pré-créer la carte de fidélité (non bloquant si échec — /api/scan la recrée au premier scan)
  const { error: carteErr } = await admin.from('cartes_fidelite').insert({
    commercant_id: merchant_id,
    client_email: email,
    client_nom: nom,
    nombre_points: 0,
    points_cumules_total: 0,
    recompenses_obtenues: 0,
  })
  if (carteErr) {
    console.error('[api/join] insert carte error (non bloquant):', carteErr)
  }

  return NextResponse.json({ success: true, qr_code_id: qrCodeId })
}
