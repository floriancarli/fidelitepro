import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { recompenseId } = await request.json()
  if (!recompenseId) return NextResponse.json({ error: 'recompenseId manquant' }, { status: 400 })

  // Récupérer la récompense
  const { data: recompense, error: rErr } = await supabase
    .from('recompenses')
    .select('*, cartes_fidelite(*)')
    .eq('id', recompenseId)
    .eq('commercant_id', user.id)
    .single()

  if (rErr || !recompense) {
    return NextResponse.json({ error: 'Récompense introuvable' }, { status: 404 })
  }
  if (recompense.utilisee) {
    return NextResponse.json({ error: 'Récompense déjà validée' }, { status: 400 })
  }

  const carte = recompense.cartes_fidelite
  if (!carte) return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })

  // Récupérer les paliers du commerçant pour savoir combien de points déduire
  const { data: commercant } = await supabase
    .from('commercants')
    .select('paliers, points_pour_recompense')
    .eq('id', user.id)
    .single()

  type Palier = { points: number; libelle: string }
  const paliers: Palier[] = Array.isArray(commercant?.paliers) && commercant.paliers.length > 0
    ? (commercant.paliers as Palier[]).sort((a, b) => a.points - b.points)
    : [{ points: commercant?.points_pour_recompense ?? 10, libelle: '' }]

  // Trouver le palier correspondant au libellé de la récompense
  const palier = paliers.find((p) => p.libelle === recompense.libelle) ?? paliers[0]
  const pointsADeduire = palier.points

  const nouveauxPoints = Math.max(0, carte.nombre_points - pointsADeduire)

  // Déduire les points de la carte
  const { error: updateErr } = await supabase
    .from('cartes_fidelite')
    .update({ nombre_points: nouveauxPoints })
    .eq('id', carte.id)

  if (updateErr) {
    return apiError(updateErr, { fallback: 'Erreur lors de la validation.' })
  }

  // Marquer la récompense comme utilisée
  const { error: markErr } = await supabase
    .from('recompenses')
    .update({ utilisee: true, date_utilisation: new Date().toISOString() })
    .eq('id', recompenseId)

  if (markErr) {
    return apiError(markErr, { fallback: 'Erreur lors de la validation.' })
  }

  return NextResponse.json({ ok: true, pointsRestants: nouveauxPoints })
}
