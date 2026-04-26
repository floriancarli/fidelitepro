import Link from 'next/link'

export function Logo({ size = 'md', white = false }: { size?: 'sm' | 'md' | 'lg', white?: boolean, iconOnly?: boolean }) {
  return (
    <Link href="/">
      <img
        src="/logo-orlyo.png"
        alt="Orlyo"
        width={55}
        height={55}
        style={{ objectFit: 'contain', ...(white && { filter: 'brightness(0) invert(1)' }) }}
      />
    </Link>
  )
}
