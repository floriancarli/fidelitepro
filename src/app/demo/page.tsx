'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@getorlyo.com'
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'DemoFidelite2024!'

export default function DemoPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const login = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      })
      if (signInError) {
        setError('La démo est temporairement indisponible. Veuillez réessayer dans quelques instants.')
        return
      }
      router.replace('/dashboard')
    }
    login()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Logo size="md" />
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <Logo size="lg" />
      <div className="w-8 h-8 border-4 border-[#2D4A8A] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#6B7280] text-sm">Chargement de la démo…</p>
    </div>
  )
}
