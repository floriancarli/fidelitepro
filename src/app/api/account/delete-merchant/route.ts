import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAccountDeletedMerchantEmail } from '@/lib/email'

interface CommercantRow {
  nom_commerce: string
  logo_url: string | null
  stripe_subscription_id: string | null
}

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const { password } = body as Record<string, unknown>
  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Mot de passe requis.' }, { status: 400 })
  }

  // Vérifier la session active
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  // Re-vérifier le mot de passe avant toute action irréversible
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })
  if (authError) {
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: comm, error: commErr } = await admin
    .from('commercants')
    .select('nom_commerce, logo_url, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  if (commErr || !comm) {
    return NextResponse.json({ error: 'Compte commerçant introuvable.' }, { status: 404 })
  }

  const { nom_commerce: nomCommerce, logo_url: logoUrl, stripe_subscription_id: stripeSubId } =
    comm as CommercantRow

  // Sauvegarder l'email avant toute modification (utilisé pour l'email de confirmation)
  const savedEmail = user.email

  // Résilier l'abonnement Stripe (obligation de service + prévention double facturation)
  if (stripeSubId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      await stripe.subscriptions.cancel(stripeSubId)
    } catch (err) {
      console.error('[delete-merchant] Stripe cancel error (non bloquant):', err)
    }
  }

  // Supprimer le logo du bucket Storage
  if (logoUrl) {
    try {
      // L'URL publique est de la forme : .../storage/v1/object/public/logos/<path>
      const path = logoUrl.split('/logos/').pop()
      if (path) await admin.storage.from('logos').remove([path])
    } catch (err) {
      console.error('[delete-merchant] logo delete error (non bloquant):', err)
    }
  }

  // Récupérer les emails des clients liés à ce commerçant via leurs cartes
  const { data: carteRows } = await admin
    .from('cartes_fidelite')
    .select('client_email')
    .eq('commercant_id', user.id)

  const clientEmails = [...new Set(
    (carteRows || [])
      .map((c: { client_email: string }) => c.client_email)
      .filter((e: string) => !e.endsWith('@orlyo.deleted'))
  )]

  if (clientEmails.length > 0) {
    const { data: clientRows } = await admin
      .from('clients')
      .select('id, email')
      .in('email', clientEmails)

    if (clientRows && clientRows.length > 0) {
      // Charger tous les auth users une seule fois pour éviter N appels listUsers
      const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
      const authByEmail = new Map(
        (authData?.users || []).map((u) => [u.email!, u.id])
      )

      for (const client of clientRows as { id: string; email: string }[]) {
        const anonEmail = `supprime_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}@orlyo.deleted`
        await admin
          .from('cartes_fidelite')
          .update({ client_email: anonEmail, client_nom: 'Client supprimé' })
          .eq('client_email', client.email)

        await admin.from('clients').delete().eq('id', client.id)

        const authUserId = authByEmail.get(client.email)
        if (authUserId) {
          await admin.auth.admin.deleteUser(authUserId)
        }
      }
    }
  }

  // Anonymiser le commerçant — conserver id, stripe fields, created_at (obligation comptable L123-22)
  await admin.from('commercants').update({
    nom_commerce: '[Compte supprimé]',
    secteur_activite: '',
    nom_programme: '',
    message_bienvenue: '',
    logo_url: null,
    // qr_code_id doit rester unique (contrainte UNIQUE NOT NULL)
    qr_code_id: `DELETED-${user.id.replace(/-/g, '').slice(0, 16)}`,
    abonnement_actif: false,
    deleted_at: new Date().toISOString(),
  }).eq('id', user.id)

  // Supprimer l'auth user du commerçant (la FK vers auth.users a été supprimée en migration 003,
  // la row commercants est donc conservée après cette suppression)
  await admin.auth.admin.deleteUser(user.id)

  // Email de confirmation best-effort
  sendAccountDeletedMerchantEmail({ to: savedEmail, nomCommerce }).catch((err) =>
    console.error('[delete-merchant] email error:', err)
  )

  return NextResponse.json({ success: true })
}
