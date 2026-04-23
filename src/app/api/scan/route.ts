import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAlmostThereEmail } from '@/lib/email'

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

  // Résoudre les paliers : utilise paliers[] si définis, sinon fallback sur l'ancien champ unique
  type Palier = { points: number; libelle: string }
  const paliers: Palier[] = Array.isArray(commercant.paliers) && commercant.paliers.length > 0
    ? (commercant.paliers as Palier[]).slice().sort((a, b) => a.points - b.points)
    : [{ points: commercant.points_pour_recompense, libelle: commercant.libelle_recompense }]

  // Palier de référence pour la barre de progression (le plus bas)
  const palierMin = paliers[0]

  let recompenseDeclenchee = false
  let libelleRecompenseObtenue = ''
  let carteCourante = carte

  const pointsParVisite = commercant.points_par_visite

  if (!carteCourante) {
    const { data: newCarte, error: insertError } = await supabase
      .from('cartes_fidelite')
      .insert({
        commercant_id: commercant.id,
        client_email: client.email,
        client_nom: client.nom,
        nombre_points: pointsParVisite,
        points_cumules_total: pointsParVisite,
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
    let newPoints = carteCourante.nombre_points + pointsParVisite
    let recompensesObtenues = carteCourante.recompenses_obtenues

    // Trouver le palier le plus élevé atteint
    const palierAtteint = [...paliers].reverse().find((p) => newPoints >= p.points)

    if (palierAtteint) {
      recompenseDeclenchee = true
      libelleRecompenseObtenue = palierAtteint.libelle
      newPoints = newPoints - palierAtteint.points
      recompensesObtenues += 1

      const { error: recompenseError } = await supabase.from('recompenses').insert({
        carte_fidelite_id: carteCourante.id,
        commercant_id: commercant.id,
        libelle: palierAtteint.libelle,
        utilisee: false,
        date_obtention: new Date().toISOString(),
      })
      if (recompenseError) console.error('[scan] insert recompense error:', recompenseError)
    }

    const { error: updateError } = await supabase
      .from('cartes_fidelite')
      .update({
        nombre_points: newPoints,
        points_cumules_total: carteCourante.points_cumules_total + pointsParVisite,
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
      points_cumules_total: carteCourante.points_cumules_total + pointsParVisite,
      recompenses_obtenues: recompensesObtenues,
    }
  }

  // Email "presque là" : 1 ou 2 points du prochain palier non atteint
  if (!recompenseDeclenchee) {
    const nextPalier = paliers.find((p) => p.points > carteCourante!.nombre_points)
    const pointsManquants = nextPalier ? nextPalier.points - carteCourante!.nombre_points : null
    if (nextPalier && pointsManquants !== null && pointsManquants <= 2) {
      const carteId = carteCourante!.id
      sendAlmostThereEmail({
        clientEmail: client.email,
        clientNom: client.nom,
        clientQrCodeId: client.qr_code_id,
        nomCommerce: commercant.nom_commerce,
        couleur: commercant.couleur_principale || '#534AB7',
        pointsActuels: carteCourante!.nombre_points,
        pointsManquants,
        libelleProchainPalier: nextPalier.libelle,
        pointsProchainPalier: nextPalier.points,
      })
        .then(() =>
          supabase.from('email_logs').insert({
            carte_fidelite_id: carteId,
            type: 'almost_there',
            metadata: {
              points_at_time: carteCourante!.nombre_points,
              points_manquants: pointsManquants,
              palier_libelle: nextPalier.libelle,
              palier_points: nextPalier.points,
            },
          }).then(({ error }) => { if (error) console.error('[scan] email_log error:', error) })
        )
        .catch((err) => console.error('[scan] email error:', err))
    }
  }

  // Enregistrer le scan
  const { error: scanError } = await supabase.from('scans').insert({
    carte_fidelite_id: carteCourante.id,
    commercant_id: commercant.id,
    points_ajoutes: pointsParVisite,
    points_apres_scan: carteCourante.nombre_points,
    recompense_declenchee: recompenseDeclenchee,
  })
  if (scanError) console.error('[scan] insert scan error:', scanError)

  return NextResponse.json({
    client,
    carte: carteCourante,
    pointsAjoutes: pointsParVisite,
    recompenseDeclenchee,
    libelleRecompense: libelleRecompenseObtenue || palierMin.libelle,
    pointsPourRecompense: palierMin.points,
    paliers,
  })
}
