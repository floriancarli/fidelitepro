import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const token = searchParams.get('token')
  const type = searchParams.get('type') as 'client' | 'merchant' | null

  if (!token || !type || !['client', 'merchant'].includes(type)) {
    return NextResponse.redirect(new URL('/?unsub=invalid', req.url))
  }

  const admin = createAdminClient()
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://getorlyo.com'

  if (type === 'client') {
    const { error } = await admin
      .from('clients')
      .update({ email_optin: false })
      .eq('qr_code_id', token)
    if (error) console.error('[unsubscribe] client error:', error)
  } else {
    const { error } = await admin
      .from('commercants')
      .update({ email_optin: false })
      .eq('qr_code_id', token)
    if (error) console.error('[unsubscribe] merchant error:', error)
  }

  return NextResponse.redirect(`${APP_URL}/?unsub=ok`)
}
