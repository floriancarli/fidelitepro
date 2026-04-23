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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const commercantId = session.metadata?.commercant_id
      const plan = session.metadata?.plan ?? 'mensuel'

      if (!commercantId) {
        console.error('[stripe/webhook] commercant_id manquant dans metadata')
        break
      }

      const { error } = await supabaseAdmin()
        .from('commercants')
        .update({
          abonnement_actif: true,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan_actif: plan,
        })
        .eq('id', commercantId)

      if (error) console.error('[stripe/webhook] DB update error:', error)
      else console.log(`[stripe/webhook] compte activé: ${commercantId} (${plan})`)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      // Réactivation si le statut revient à "active"
      if (sub.status === 'active') {
        await supabaseAdmin()
          .from('commercants')
          .update({ abonnement_actif: true })
          .eq('stripe_subscription_id', sub.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const { error } = await supabaseAdmin()
        .from('commercants')
        .update({ abonnement_actif: false, plan_actif: null })
        .eq('stripe_subscription_id', sub.id)

      if (error) console.error('[stripe/webhook] deactivation error:', error)
      else console.log('[stripe/webhook] abonnement résilié:', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.warn('[stripe/webhook] paiement échoué pour customer:', invoice.customer)
      // Could send an email here
      break
    }
  }

  return NextResponse.json({ received: true })
}
