'use client'

import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  white?: boolean
  iconOnly?: boolean
}

export default function Logo({ size = 'md' }: LogoProps) {
  const sizes = { sm: 80, md: 120, lg: 160 }
  const px = sizes[size]

  return (
    <Link href="/" style={{ display: 'inline-block', lineHeight: 0 }}>
      <Image
        src="/logo-orlyo.png"
        alt="Orlyo"
        width={px}
        height={px}
        style={{ objectFit: 'contain' }}
        priority
      />
    </Link>
  )
}
