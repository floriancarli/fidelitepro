import Link from 'next/link'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg', white?: boolean, iconOnly?: boolean }) {
  const sizes = { sm: 80, md: 120, lg: 160 }
  const px = sizes[size]

  return (
    <Link href="/">
      <svg
        width={px}
        height={Math.round(px * 265 / 240)}
        viewBox="0 0 240 265"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Orlyo"
      >
        {/* Left arc — sweeps from bottom-right to upper-left, tip curling inward */}
        <path
          d="M 74 138 C 42 100, 5 62, 26 35"
          fill="none"
          stroke="#2D4A8A"
          strokeWidth="18"
          strokeLinecap="round"
        />
        {/* Right arc — mirror */}
        <path
          d="M 166 138 C 198 100, 235 62, 214 35"
          fill="none"
          stroke="#2D4A8A"
          strokeWidth="18"
          strokeLinecap="round"
        />
        {/* Orange dot centered between arcs */}
        <circle cx="120" cy="90" r="22" fill="#F59E0B" />
        {/* Orlyo — O in orange, rlyo in blue */}
        <text
          x="120"
          y="228"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="bold"
          fontSize="68"
        >
          <tspan fill="#F59E0B">O</tspan>
          <tspan fill="#2D4A8A">rlyo</tspan>
        </text>
      </svg>
    </Link>
  )
}
