import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const LOOKUP_KEYS: Record<string, string> = {
  mensuel: 'fidelitepro_mensuel',
  annuel: 'fidelitepro_annuel',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { plan } = await req.json()
  const lookupKey = LOOKUP_KEYS[plan]
  if (!lookupKey) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  // Resolve price by lookup_key — no price ID env vars needed
  const prices = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 })
  if (prices.data.length === 0) {
    return NextResponse.json(
      { error: `Prix introuvable pour le plan "${plan}". Appelez d'abord POST /api/stripe/setup.` },
      { status: 404 }
    )
  }
  const price = prices.data[0]

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fidelitepro.fr'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: price.id, quantity: 1 }],
    customer_email: user.email,
    metadata: { commercant_id: user.id, plan },
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing`,
    locale: 'fr',
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
