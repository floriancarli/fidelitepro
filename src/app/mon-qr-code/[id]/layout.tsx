import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

async function getCommercantId(qrCodeId: string): Promise<string | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: client } = await supabase
      .from('clients')
      .select('email')
      .eq('qr_code_id', qrCodeId)
      .single()

    if (!client?.email) return null

    const { data: carte } = await supabase
      .from('cartes_fidelite')
      .select('commercants(id, logo_url)')
      .eq('client_email', client.email)
      .order('derniere_visite', { ascending: false })
      .limit(1)
      .single()

    const commercant = (carte as unknown as {
      commercants: { id: string; logo_url: string | null } | null
    })?.commercants

    if (!commercant?.logo_url) return null
    return commercant.id
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
  const commercantId = await getCommercantId(id)

  const appleIcon = commercantId
    ? { url: `/api/logo/${commercantId}`, sizes: '180x180', type: 'image/png' }
    : { url: '/icons/icon-192.png', sizes: '180x180', type: 'image/png' }

  return {
    title: 'Ma Carte Fidélité',
    description: 'Votre carte de fidélité numérique personnelle.',
    manifest: `/api/pwa/${id}`,
    appleWebApp: {
      capable: true,
      title: 'Ma Carte Fidélité',
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
