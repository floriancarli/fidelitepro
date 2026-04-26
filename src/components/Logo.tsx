import Link from 'next/link'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg', white?: boolean, iconOnly?: boolean }) {
  return (
    <Link href="/">
      <img src="/logo-orlyo.png" alt="Orlyo" width={80} height={80} />
    </Link>
  )
}
