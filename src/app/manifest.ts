import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ma Carte Fidélité',
    short_name: 'Ma Fidélité',
    description: 'Votre carte de fidélité numérique — cumulez des points et débloquez des récompenses.',
    start_url: '/register',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F9F9FB',
    theme_color: '#534AB7',
    categories: ['shopping', 'lifestyle'],
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
}
