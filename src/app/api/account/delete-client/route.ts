import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAccountDeletedClientEmail } from '@/lib/email'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, email')
    .eq('email', user.email)
    .maybeSingle()

  if (!client) {
    return NextResponse.json({ error: 'Compte client introuvable.' }, { status: 404 })
  }

  const savedEmail = user.email

  // Anonymiser toutes les cartes de fidélité (par email ET par client_id car
  // les cartes créées via /join n'ont pas toujours client_id renseigné)
  const anonEmail = `supprime_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}@orlyo.deleted`
  await admin
    .from('cartes_fidelite')
    .update({ client_email: anonEmail, client_nom: 'Client supprimé' })
    .eq('client_email', client.email)

  // Supprimer le profil client
  await admin.from('clients').delete().eq('id', client.id)

  // Supprimer l'auth user en dernier (invalide la session courante)
  await admin.auth.admin.deleteUser(user.id)

  // Email de confirmation best-effort (envoyé avant deleteUser pour avoir l'email)
  sendAccountDeletedClientEmail({ to: savedEmail }).catch((err) =>
    console.error('[delete-client] email error:', err)
  )

  return NextResponse.json({ success: true })
}
