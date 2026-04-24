import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const PLANS = {
  mensuel: {
    lookupKey: 'fidelitepro_mensuel',
    name: 'Orlyo — Plan Mensuel',
    description: 'Clients illimités, 1 programme de fidélité, notifications email, support email.',
    amount: 3900,
    interval: 'month' as const,
  },
  annuel: {
    lookupKey: 'fidelitepro_annuel',
    name: 'Orlyo — Plan Annuel',
    description: 'Clients illimités, programmes multiples, analytics avancés, export CSV, support prioritaire.',
    amount: 34800,
    interval: 'year' as const,
  },
}

async function getOrCreatePrice(stripe: Stripe, planKey: keyof typeof PLANS): Promise<string> {
  const def = PLANS[planKey]

  // Try to find an existing active price with this lookup_key
  const existing = await stripe.prices.list({ lookup_keys: [def.lookupKey], limit: 1 })
  if (existing.data.length > 0) {
    console.log(`[checkout] found existing price for ${def.lookupKey}: ${existing.data[0].id}`)
    return existing.data[0].id
  }

  // Not found — create product + price
  console.log(`[checkout] creating price for ${def.lookupKey}`)
  const product = await stripe.products.create({ name: def.name, description: def.description })
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: def.amount,
    currency: 'eur',
    recurring: { interval: def.interval },
    lookup_key: def.lookupKey,
    transfer_lookup_key: true,
  })
  console.log(`[checkout] created price ${price.id} for ${def.lookupKey}`)
  return price.id
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await req.json()
  const plan = body.plan as keyof typeof PLANS
  if (!PLANS[plan]) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[checkout] STRIPE_SECRET_KEY manquante')
    return NextResponse.json({ error: 'Configuration Stripe manquante sur le serveur' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  let priceId: string
  try {
    priceId = await getOrCreatePrice(stripe, plan)
  } catch (err) {
    console.error('[checkout] getOrCreatePrice error:', err)
    return NextResponse.json({ error: 'Impossible de récupérer le prix Stripe' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getorlyo.com'

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      metadata: { commercant_id: user.id, plan },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      locale: 'fr',
      allow_promotion_codes: true,
    })
  } catch (err) {
    console.error('[checkout] session.create error:', err)
    return NextResponse.json({ error: 'Impossible de créer la session de paiement' }, { status: 500 })
  }

  console.log(`[checkout] session created: ${session.id} for ${user.email} (${plan})`)
  return NextResponse.json({ url: session.url })
}
