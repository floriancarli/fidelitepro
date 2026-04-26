import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#2D4A8A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Orlyo — Cartes de fidélité pour commerçants',
  description: 'Fidélisez vos clients simplement avec un QR code unique.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/logo-orlyo.png', type: 'image/png' }],
    apple: [{ url: '/logo-orlyo.png', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Orlyo',
    statusBarStyle: 'default',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.className}>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
