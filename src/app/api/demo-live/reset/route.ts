import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-error'

const DEMO_LIVE_EMAIL = 'demo-live@getorlyo.com'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== DEMO_LIVE_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Reset all cartes for this merchant to 0 points
  const { error } = await supabase
    .from('cartes_fidelite')
    .update({
      nombre_points: 0,
      points_cumules_total: 0,
      recompenses_obtenues: 0,
      derniere_visite: new Date().toISOString(),
    })
    .eq('commercant_id', user.id)

  if (error) return apiError(error, { fallback: 'Erreur lors de la réinitialisation.' })

  // Delete all scans for this merchant
  await supabase.from('scans').delete().eq('commercant_id', user.id)

  return NextResponse.json({ ok: true })
}
