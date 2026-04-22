import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  return {
    title: 'Ma Carte Fidélité',
    description: 'Votre carte de fidélité numérique personnelle.',
    manifest: `/api/pwa/${id}`,
    appleWebApp: {
      capable: true,
      title: 'Ma Carte Fidélité',
      statusBarStyle: 'default',
      startupImage: '/icons/icon.svg',
    },
    other: {
      // Force standalone sur iOS même si le manifest dynamique n'est pas reconnu
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
