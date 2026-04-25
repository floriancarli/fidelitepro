import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
  }

  const resend = new Resend(apiKey)

  const { data, error } = await resend.emails.send({
    from: 'Orlyo <noreply@getorlyo.com>',
    to: 'floriancarlipro@gmail.com',
    subject: 'Test Resend — Orlyo',
    html: '<p>Si vous recevez cet email, la clé API Resend fonctionne correctement.</p>',
  })

  if (error) {
    console.error('[test-email] error:', error)
    return NextResponse.json({ ok: false, error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data?.id })
}
