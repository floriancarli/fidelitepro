import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const PLANS = {
  mensuel: {
    priceId: process.env.STRIPE_PRICE_MONTHLY || 'price_1TQ4fOE63QUBXRWn4UMmc8Hi',
  },
  annuel: {
    priceId: process.env.STRIPE_PRICE_YEARLY || 'price_1TQ4gFE63QUBXRWnD9NzVCFY',
  },
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
  const promoCode = typeof body.promoCode === 'string' ? body.promoCode.trim().toUpperCase() : ''

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[checkout] STRIPE_SECRET_KEY manquante')
    return NextResponse.json({ error: 'Configuration Stripe manquante sur le serveur' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  const priceId = PLANS[plan].priceId

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getorlyo.com'

  // Résolution du code promo : si fourni, on l'applique directement ;
  // sinon Stripe affiche lui-même le champ sur sa page de paiement.
  let discounts: Stripe.Checkout.SessionCreateParams['discounts']
  let allowPromotionCodes = true

  if (promoCode) {
    const promos = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 })
    if (promos.data.length === 0) {
      return NextResponse.json({ error: 'Code promo invalide ou expiré.' }, { status: 400 })
    }
    discounts = [{ promotion_code: promos.data[0].id }]
    allowPromotionCodes = false
  }

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
      ...(discounts ? { discounts } : { allow_promotion_codes: allowPromotionCodes }),
    })
  } catch (err) {
    console.error('[checkout] session.create error:', err)
    return NextResponse.json({ error: 'Impossible de créer la session de paiement' }, { status: 500 })
  }

  console.log(`[checkout] session created: ${session.id} plan=${plan}`)
  return NextResponse.json({ url: session.url })
}
