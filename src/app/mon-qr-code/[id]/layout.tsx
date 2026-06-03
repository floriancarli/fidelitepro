import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

type CommercantInfo = {
  nomCommerce: string
  commercantId: string | null   // null si pas de logo → fallback Orlyo
}

async function getCommercantInfo(qrCodeId: string): Promise<CommercantInfo | null> {
  try {
    const supabase = createAdminClient()

    const { data: client } = await supabase
      .from('clients')
      .select('email')
      .eq('qr_code_id', qrCodeId)
      .single()

    if (!client?.email) return null

    const { data: carte } = await supabase
      .from('cartes_fidelite')
      .select('commercants(id, nom_commerce, logo_url)')
      .eq('client_email', client.email)
      .order('derniere_visite', { ascending: false })
      .limit(1)
      .single()

    const commercant = (carte as unknown as {
      commercants: { id: string; nom_commerce: string; logo_url: string | null } | null
    })?.commercants

    if (!commercant) return null

    return {
      nomCommerce: commercant.nom_commerce,
      commercantId: commercant.logo_url ? commercant.id : null,
    }
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const info = await getCommercantInfo(id)

  const appTitle = info?.nomCommerce
    ? `Fidélité ${info.nomCommerce}`
    : 'Ma Carte Fidélité'

  // Logo du commerce si disponible, sinon logo Orlyo (pas l'icône violet générique)
  const appleIcon = info?.commercantId
    ? { url: `/api/logo/${info.commercantId}`, sizes: '180x180', type: 'image/png' }
    : { url: '/logo-orlyo.png', sizes: '180x180', type: 'image/png' }

  return {
    title: appTitle,
    description: 'Votre carte de fidélité numérique personnelle.',
    manifest: `/api/pwa/${id}`,
    appleWebApp: {
      capable: true,
      title: appTitle,
      statusBarStyle: 'default',
    },
    icons: {
      apple: [appleIcon],
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  }
}

export default function MonQrCodeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
