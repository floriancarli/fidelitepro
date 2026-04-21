import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { clientQrCodeId } = await request.json()
  if (!clientQrCodeId) {
    return NextResponse.json({ error: 'QR code invalide' }, { status: 400 })
  }

  // Récupérer le commerçant
  const { data: commercant, error: commercantError } = await supabase
    .from('commercants')
    .select('*')
    .eq('id', user.id)
    .single()

  if (commercantError || !commercant) {
    console.error('[scan] commercant error:', commercantError)
    return NextResponse.json({ error: 'Compte commerçant introuvable', detail: commercantError?.message }, { status: 404 })
  }

  // Récupérer le client via son QR code
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('qr_code_id', clientQrCodeId)
    .single()

  if (clientError || !client) {
    console.error('[scan] client error:', clientError)
    return NextResponse.json({ error: 'Client introuvable — QR code non reconnu', detail: clientError?.message }, { status: 404 })
  }

  // Trouver ou créer la carte — lookup par client_email (pas client_id, colonne optionnelle)
  const { data: carte, error: carteSelectError } = await supabase
    .from('cartes_fidelite')
    .select('*')
    .eq('commercant_id', commercant.id)
    .eq('client_email', client.email)
    .maybeSingle()

  if (carteSelectError) {
    console.error('[scan] carte select error:', carteSelectError)
    return NextResponse.json({ error: 'Erreur lecture carte', detail: carteSelectError.message }, { status: 500 })
  }

  let recompenseDeclenchee = false
  let carteCourante = carte

  if (!carteCourante) {
    // Première visite chez ce commerçant
    const { data: newCarte, error: insertError } = await supabase
      .from('cartes_fidelite')
      .insert({
        commercant_id: commercant.id,
        client_email: client.email,
        nombre_points: commercant.points_par_visite,
        points_cumules_total: commercant.points_par_visite,
        derniere_visite: new Date().toISOString(),
        recompenses_obtenues: 0,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[scan] insert carte error:', insertError)
      return NextResponse.json({ error: 'Erreur création carte', detail: insertError.message, code: insertError.code }, { status: 500 })
    }
    carteCourante = newCarte
  } else {
    // Visite suivante
    let newPoints = carteCourante.nombre_points + commercant.points_par_visite
    let recompensesObtenues = carteCourante.recompenses_obtenues

    if (newPoints >= commercant.points_pour_recompense) {
      recompenseDeclenchee = true
      newPoints = newPoints - commercant.points_pour_recompense
      recompensesObtenues += 1

      const { error: recompenseError } = await supabase.from('recompenses').insert({
        carte_fidelite_id: carteCourante.id,
        commercant_id: commercant.id,
        libelle: commercant.libelle_recompense,
        utilisee: false,
        date_obtention: new Date().toISOString(),
      })
      if (recompenseError) console.error('[scan] insert recompense error:', recompenseError)
    }

    const { error: updateError } = await supabase
      .from('cartes_fidelite')
      .update({
        nombre_points: newPoints,
        points_cumules_total: carteCourante.points_cumules_total + commercant.points_par_visite,
        derniere_visite: new Date().toISOString(),
        recompenses_obtenues: recompensesObtenues,
      })
      .eq('id', carteCourante.id)

    if (updateError) {
      console.error('[scan] update carte error:', updateError)
      return NextResponse.json({ error: 'Erreur mise à jour carte', detail: updateError.message }, { status: 500 })
    }

    carteCourante = {
      ...carteCourante,
      nombre_points: newPoints,
      points_cumules_total: carteCourante.points_cumules_total + commercant.points_par_visite,
      recompenses_obtenues: recompensesObtenues,
    }
  }

  // Enregistrer le scan
  const { error: scanError } = await supabase.from('scans').insert({
    carte_fidelite_id: carteCourante.id,
    commercant_id: commercant.id,
    points_ajoutes: commercant.points_par_visite,
    points_apres_scan: carteCourante.nombre_points,
    recompense_declenchee: recompenseDeclenchee,
  })
  if (scanError) console.error('[scan] insert scan error:', scanError)

  return NextResponse.json({
    client,
    carte: carteCourante,
    pointsAjoutes: commercant.points_par_visite,
    recompenseDeclenchee,
    libelleRecompense: commercant.libelle_recompense,
    pointsPourRecompense: commercant.points_pour_recompense,
  })
}
