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
    return NextResponse.json({ error: 'Compte commerçant introuvable' }, { status: 404 })
  }

  // Récupérer le client via son QR code
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('qr_code_id', clientQrCodeId)
    .single()

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client introuvable — QR code non reconnu' }, { status: 404 })
  }

  // Trouver ou créer la carte de fidélité
  let { data: carte } = await supabase
    .from('cartes_fidelite')
    .select('*')
    .eq('commercant_id', commercant.id)
    .eq('client_id', client.id)
    .maybeSingle()

  let recompenseDeclenchee = false

  if (!carte) {
    // Première visite chez ce commerçant
    const newPoints = commercant.points_par_visite
    const { data: newCarte, error: insertError } = await supabase
      .from('cartes_fidelite')
      .insert({
        commercant_id: commercant.id,
        client_id: client.id,
        client_email: client.email,
        client_nom: client.nom,
        nombre_points: newPoints,
        points_cumules_total: newPoints,
        derniere_visite: new Date().toISOString(),
        recompenses_obtenues: 0,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Erreur création carte' }, { status: 500 })
    }
    carte = newCarte
  } else {
    // Visite suivante
    let newPoints = carte.nombre_points + commercant.points_par_visite
    let recompensesObtenues = carte.recompenses_obtenues

    if (newPoints >= commercant.points_pour_recompense) {
      recompenseDeclenchee = true
      newPoints = newPoints - commercant.points_pour_recompense
      recompensesObtenues += 1

      await supabase.from('recompenses').insert({
        carte_fidelite_id: carte.id,
        commercant_id: commercant.id,
        libelle: commercant.libelle_recompense,
        utilisee: false,
        date_obtention: new Date().toISOString(),
      })
    }

    await supabase
      .from('cartes_fidelite')
      .update({
        nombre_points: newPoints,
        points_cumules_total: carte.points_cumules_total + commercant.points_par_visite,
        derniere_visite: new Date().toISOString(),
        recompenses_obtenues: recompensesObtenues,
      })
      .eq('id', carte.id)

    carte = {
      ...carte,
      nombre_points: newPoints,
      points_cumules_total: carte.points_cumules_total + commercant.points_par_visite,
      recompenses_obtenues: recompensesObtenues,
    }
  }

  // Enregistrer le scan
  await supabase.from('scans').insert({
    carte_fidelite_id: carte.id,
    commercant_id: commercant.id,
    points_ajoutes: commercant.points_par_visite,
    points_apres_scan: carte.nombre_points,
    recompense_declenchee: recompenseDeclenchee,
  })

  return NextResponse.json({
    client,
    carte,
    pointsAjoutes: commercant.points_par_visite,
    recompenseDeclenchee,
    libelleRecompense: commercant.libelle_recompense,
    pointsPourRecompense: commercant.points_pour_recompense,
  })
}
