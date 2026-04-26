import Link from 'next/link'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg', white?: boolean, iconOnly?: boolean }) {
  return (
    <Link href="/">
      <img src="/logo-orlyo.png" alt="Orlyo" width={55} height={55} style={{objectFit: 'contain'}} />
    </Link>
  )
}
