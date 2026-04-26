'use client'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  white?: boolean
  iconOnly?: boolean
}

export default function Logo({ size = 'md', white = false, iconOnly = false }: LogoProps) {
  const textSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' }
  const iconSizes = { sm: 24, md: 32, lg: 48 }
  const px = iconSizes[size]

  const arcColor  = white ? '#FFFFFF' : '#2D4A8A'
  const textColor = white ? '#FFFFFF' : '#2D4A8A'

  return (
    <span className="inline-flex items-center gap-2">
      {/* Arc Return icon — inline SVG for crisp rendering at all sizes */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* 300° arc — loyalty loop */}
        <path
          d="M 35 24 A 30 30 0 1 1 65 24"
          fill="none"
          stroke={arcColor}
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        {/* Orange reward dot at gap */}
        <circle cx="50" cy="20" r="6.5" fill="#F59E0B" />
      </svg>

      {!iconOnly && (
        <span
          className={`font-bold tracking-tight leading-none ${textSizes[size]}`}
          style={{ color: textColor }}
        >
          <span style={{ color: '#F59E0B' }}>O</span>rlyo
        </span>
      )}
    </span>
  )
}
