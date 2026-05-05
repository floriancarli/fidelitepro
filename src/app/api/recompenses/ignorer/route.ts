import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { apiError } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { recompenseId } = await request.json()
  if (!recompenseId) return NextResponse.json({ error: 'recompenseId manquant' }, { status: 400 })

  // Verify the reward belongs to this commercant and is still pending
  const { data: recompense, error: rErr } = await supabase
    .from('recompenses')
    .select('id, utilisee, commercant_id')
    .eq('id', recompenseId)
    .eq('commercant_id', user.id)
    .single()

  if (rErr || !recompense) {
    return NextResponse.json({ error: 'Récompense introuvable' }, { status: 404 })
  }
  if (recompense.utilisee) {
    return NextResponse.json({ error: 'Récompense déjà validée' }, { status: 400 })
  }

  // Delete via admin client — no DELETE RLS policy exists on recompenses
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error: deleteErr } = await admin
    .from('recompenses')
    .delete()
    .eq('id', recompenseId)

  if (deleteErr) {
    return apiError(deleteErr, { fallback: 'Erreur lors de la suppression.' })
  }

  return NextResponse.json({ ok: true })
}
