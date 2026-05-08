import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    console.error('[stripe/webhook] missing signature or STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[stripe/webhook] invalid signature:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  console.log('[stripe/webhook]', event.type)

  const db = supabaseAdmin()

  // Idempotence : on vérifie si cet event a déjà été traité avec succès.
  // SELECT avant le switch pour éviter tout re-traitement inutile.
  const { data: existingEvent, error: selectError } = await db
    .from('stripe_processed_events')
    .select('event_id')
    .eq('event_id', event.id)
    .maybeSingle()

  if (selectError) {
    console.error('[stripe/webhook] erreur lecture stripe_processed_events:', selectError)
    return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
  }

  if (existingEvent) {
    console.log('[stripe/webhook] event déjà traité:', event.id)
    return NextResponse.json({ received: true })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const commercantId = session.metadata?.commercant_id
      const plan = session.metadata?.plan ?? 'mensuel'

      if (!commercantId) {
        console.error('[stripe/webhook] commercant_id manquant dans metadata')
        break
      }

      const { error } = await db
        .from('commercants')
        .update({
          abonnement_actif: true,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan_actif: plan,
        })
        .eq('id', commercantId)

      if (error) {
        console.error('[stripe/webhook] DB update error (checkout.session.completed):', error)
        return NextResponse.json({ error: 'Erreur activation abonnement' }, { status: 500 })
      }
      console.log(`[stripe/webhook] compte activé: ${commercantId} (${plan})`)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      // Réactivation si le statut revient à "active"
      if (sub.status === 'active') {
        const { error } = await db
          .from('commercants')
          .update({ abonnement_actif: true })
          .eq('stripe_subscription_id', sub.id)

        if (error) {
          console.error('[stripe/webhook] DB update error (subscription.updated):', error)
          return NextResponse.json({ error: 'Erreur réactivation abonnement' }, { status: 500 })
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const { error } = await db
        .from('commercants')
        .update({ abonnement_actif: false, plan_actif: null })
        .eq('stripe_subscription_id', sub.id)

      if (error) {
        console.error('[stripe/webhook] DB update error (subscription.deleted):', error)
        return NextResponse.json({ error: 'Erreur résiliation abonnement' }, { status: 500 })
      }
      console.log('[stripe/webhook] abonnement résilié:', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.warn('[stripe/webhook] paiement échoué pour customer:', invoice.customer)
      // Could send an email here
      break
    }
  }

  // INSERT après succès du traitement métier (pattern "INSERT last").
  // ON CONFLICT DO NOTHING = ceinture-bretelles contre les requêtes concurrentes théoriques.
  // Si cet INSERT échoue (Supabase down juste après le UPDATE), on log et on retourne 200 quand même :
  // le traitement métier a réussi, un retry Stripe referait le même UPDATE (idempotent).
  const { error: insertError } = await db
    .from('stripe_processed_events')
    .insert({ event_id: event.id, event_type: event.type })

  if (insertError && (insertError as { code?: string }).code !== '23505') {
    console.error('[stripe/webhook] impossible d\'enregistrer l\'idempotence pour', event.id, ':', insertError)
  }

  return NextResponse.json({ received: true })
}
