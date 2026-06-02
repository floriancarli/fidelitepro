import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeMerchantEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const nomCommerce = typeof body.nomCommerce === 'string' ? body.nomCommerce : ''
  if (!nomCommerce) return NextResponse.json({ error: 'nomCommerce manquant' }, { status: 400 })

  try {
    await sendWelcomeMerchantEmail({ email: user.email, nomCommerce })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[bienvenue-commercant] email error:', err)
    return NextResponse.json({ error: 'Email non envoyé' }, { status: 500 })
  }
}
