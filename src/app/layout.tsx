import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FidèlePro — Cartes de fidélité pour commerçants',
  description: 'Fidélisez vos clients simplement avec un QR code unique.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.className}>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
