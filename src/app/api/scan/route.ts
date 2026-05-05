import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAlmostThereEmail } from '@/lib/email'
import { apiError } from '@/lib/api-error'

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
    return apiError(commercantError, { status: 404, fallback: 'Compte commerçant introuvable.' })
  }

  // Récupérer le client via son QR code — admin car la session du commerçant
  // ne peut pas lire les enregistrements clients qui ne lui appartiennent pas
  const { data: client, error: clientError } = await createAdminClient()
    .from('clients')
    .select('*')
    .eq('qr_code_id', clientQrCodeId)
    .single()

  if (clientError || !client) {
    return apiError(clientError, { status: 404, fallback: 'QR code non reconnu.' })
  }

  // Trouver ou créer la carte — lookup par client_email (pas client_id, colonne optionnelle)
  const { data: carte, error: carteSelectError } = await supabase
    .from('cartes_fidelite')
    .select('*')
    .eq('commercant_id', commercant.id)
    .eq('client_email', client.email)
    .maybeSingle()

  if (carteSelectError) {
    return apiError(carteSelectError, { fallback: 'Erreur lors du scan.' })
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
      return apiError(insertError, { fallback: 'Erreur lors du scan.' })
    }
    carteCourante = newCarte
  } else {
    const oldPoints = carteCourante.nombre_points
    let newPoints = oldPoints + pointsParVisite
    let recompensesObtenues = carteCourante.recompenses_obtenues

    // Déclencher uniquement au franchissement du seuil (pas si déjà au-dessus)
    // Cela évite de recréer une récompense à chaque scan tant qu'elle n'est pas validée
    const palierAtteint = paliers.find((p) => oldPoints < p.points && newPoints >= p.points)

    if (palierAtteint) {
      recompenseDeclenchee = true
      libelleRecompenseObtenue = palierAtteint.libelle
      // Les points NE sont PAS déduits ici — la déduction se fait lors de la validation manuelle
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
      return apiError(updateError, { fallback: 'Erreur lors du scan.' })
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
    console.log('[scan] email check —', {
      nombre_points: carteCourante!.nombre_points,
      recompenseDeclenchee,
      nextPalier,
      pointsManquants,
    })
    if (nextPalier && pointsManquants !== null && pointsManquants <= 2) {
      console.log('[scan] envoi email "presque là"')
      try {
        const emailResult = await sendAlmostThereEmail({
          clientEmail: client.email,
          clientNom: client.nom,
          clientQrCodeId: client.qr_code_id,
          nomCommerce: commercant.nom_commerce,
          couleur: commercant.couleur_principale || '#2D4A8A',
          pointsActuels: carteCourante!.nombre_points,
          pointsManquants,
          libelleProchainPalier: nextPalier.libelle,
          pointsProchainPalier: nextPalier.points,
        })
        console.log('[scan] email envoyé, id:', emailResult.data?.id, 'error:', emailResult.error)

        if (!emailResult.error) {
          const { error: logError } = await supabase.from('email_logs').insert({
            carte_fidelite_id: carteCourante!.id,
            type: 'almost_there',
            metadata: {
              points_at_time: carteCourante!.nombre_points,
              points_manquants: pointsManquants,
              palier_libelle: nextPalier.libelle,
              palier_points: nextPalier.points,
            },
          })
          if (logError) console.error('[scan] email_log insert error:', logError)
        }
      } catch (err) {
        console.error('[scan] sendAlmostThereEmail threw:', err)
      }
    } else {
      console.log('[scan] pas d\'email — condition non remplie (pointsManquants > 2 ou palier max atteint)')
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
