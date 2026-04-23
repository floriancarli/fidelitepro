import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// One-time idempotent setup: creates Stripe products + prices if they don't exist.
// Prices are identified by lookup_key so no price IDs need to be stored in env vars.
// Protected by CRON_SECRET (or unprotected in dev if not set).
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

const PRODUCTS = [
  {
    lookupKey: 'fidelitepro_mensuel',
    name: 'FidèlePro — Plan Mensuel',
    description: 'Clients illimités, 1 programme de fidélité, notifications email, support email.',
    amount: 3900, // 39,00 €
    interval: 'month' as const,
    intervalCount: 1,
  },
  {
    lookupKey: 'fidelitepro_annuel',
    name: 'FidèlePro — Plan Annuel',
    description: 'Clients illimités, programmes multiples, analytics avancés, export CSV, support prioritaire.',
    amount: 34800, // 348,00 € / an (= 29€/mois)
    interval: 'year' as const,
    intervalCount: 1,
  },
]

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const results: Record<string, { product_id: string; price_id: string; lookup_key: string }> = {}

  for (const def of PRODUCTS) {
    // Check if price with this lookup_key already exists
    const existing = await stripe.prices.list({ lookup_keys: [def.lookupKey], limit: 1 })

    if (existing.data.length > 0) {
      const price = existing.data[0]
      results[def.lookupKey] = {
        product_id: price.product as string,
        price_id: price.id,
        lookup_key: def.lookupKey,
      }
      continue
    }

    // Create product
    const product = await stripe.products.create({
      name: def.name,
      description: def.description,
    })

    // Create price with lookup_key
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: def.amount,
      currency: 'eur',
      recurring: { interval: def.interval, interval_count: def.intervalCount },
      lookup_key: def.lookupKey,
      transfer_lookup_key: true,
    })

    results[def.lookupKey] = {
      product_id: product.id,
      price_id: price.id,
      lookup_key: def.lookupKey,
    }
  }

  return NextResponse.json({ ok: true, products: results })
}
