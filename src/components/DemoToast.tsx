'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function DemoToast({ onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1A1A23] text-white text-sm font-medium px-5 py-3.5 rounded-2xl shadow-xl whitespace-nowrap">
      <span>🎭</span>
      <span>
        Mode démo —{' '}
        <Link href="/pricing" className="underline underline-offset-2 hover:text-white/80">
          Créez votre compte
        </Link>{' '}
        pour accéder à cette fonctionnalité
      </span>
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  )
}
