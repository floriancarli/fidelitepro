import Image from 'next/image'
import Link from 'next/link'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg', white?: boolean, iconOnly?: boolean }) {
  const sizes = { sm: 80, md: 120, lg: 160 }
  const px = sizes[size]
  return (
    <Link href="/">
      <Image src="/logo-orlyo.png" alt="Orlyo" width={px} height={px} />
    </Link>
  )
}
