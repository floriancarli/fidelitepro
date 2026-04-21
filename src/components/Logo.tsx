'use client'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  white?: boolean
}

export default function Logo({ size = 'md', white = false }: LogoProps) {
  const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' }
  const color = white ? 'text-white' : 'text-[#534AB7]'

  return (
    <span className={`font-bold tracking-tight ${sizes[size]} ${color}`}>
      Fidèle<span className={white ? 'text-white/70' : 'text-[#534AB7]/70'}>Pro</span>
    </span>
  )
}
