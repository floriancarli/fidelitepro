import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const startUrl = `/mon-qr-code/${id}`

  const manifest = {
    name: 'Ma Carte Fidélité',
    short_name: 'Ma Fidélité',
    description: 'Votre carte de fidélité numérique personnelle.',
    start_url: startUrl,
    scope: '/mon-qr-code/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F9F9FB',
    theme_color: '#534AB7',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
