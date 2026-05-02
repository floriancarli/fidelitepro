import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_ICONS = [
  { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const startUrl = `/mon-qr-code/${id}`

  let nomCommerce: string | null = null
  let commercantId: string | null = null
  let hasLogo = false

  try {
    const supabase = createAdminClient()

    // Find the client's most recently visited commercant
    const { data: client } = await supabase
      .from('clients')
      .select('email')
      .eq('qr_code_id', id)
      .single()

    if (client?.email) {
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
      if (commercant) {
        nomCommerce = commercant.nom_commerce
        commercantId = commercant.id
        hasLogo = !!commercant.logo_url
      }
    }
  } catch {
    // Fall back to generic manifest on any error
  }

  const name = nomCommerce ? `Fidélité ${nomCommerce}` : 'Ma Carte Fidélité'
  const shortName = nomCommerce ?? 'Ma Fidélité'

  // Use same-origin proxy URL so iOS Safari can load the icon
  const icons = hasLogo && commercantId
    ? [
        { src: `/api/logo/${commercantId}`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ...DEFAULT_ICONS,
      ]
    : DEFAULT_ICONS

  const manifest = {
    name,
    short_name: shortName,
    description: 'Votre carte de fidélité numérique personnelle.',
    start_url: startUrl,
    scope: '/mon-qr-code/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F9F9FB',
    theme_color: '#2D4A8A',
    icons,
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
