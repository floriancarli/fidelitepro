/**
 * Crée le coupon 100% + le code promo ORLYO7 (valable 7 jours) dans Stripe.
 * Usage : STRIPE_SECRET_KEY=sk_live_xxx node scripts/create-stripe-promo.mjs
 */
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error('Erreur : STRIPE_SECRET_KEY manquante.')
  console.error('Usage : STRIPE_SECRET_KEY=sk_live_xxx node scripts/create-stripe-promo.mjs')
  process.exit(1)
}

const stripe = new Stripe(key)

const redeemBy = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // +7 jours

// Coupon 100% sur le 1er paiement
const coupon = await stripe.coupons.create({
  name: 'Orlyo — 7 jours offerts',
  percent_off: 100,
  duration: 'once',
})
console.log(`Coupon créé : ${coupon.id}`)

// Code promo ORLYO7 lié au coupon, expire dans 7 jours
const promo = await stripe.promotionCodes.create({
  coupon: coupon.id,
  code: 'ORLYO7',
  redeem_by: redeemBy,
})
console.log(`Code promo créé : ${promo.code} (id: ${promo.id})`)
console.log(`Expire le : ${new Date(redeemBy * 1000).toLocaleDateString('fr-FR')}`)
