import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const DEMO_EMAIL = 'demo-live@getorlyo.com'

export async function POST(req: NextRequest) {
  const password = process.env.DEMO_PASSWORD
  if (!password) {
    console.error('[api/demo-auth] DEMO_PASSWORD not configured')
    return NextResponse.json({ error: 'Démo temporairement indisponible.' }, { status: 503 })
  }

  // Crée la réponse d'abord pour pouvoir y écrire les cookies de session
  const response = NextResponse.json({ success: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password,
  })

  if (error) {
    console.error('[api/demo-auth] signIn error:', error.message)
    return NextResponse.json({ error: 'Démo temporairement indisponible.' }, { status: 503 })
  }

  return response
}
