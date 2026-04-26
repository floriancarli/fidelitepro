import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Orlyo Scan',
  description: 'Scanner les QR codes clients',
  manifest: '/scan-manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Orlyo Scan',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  themeColor: '#2D4A8A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
