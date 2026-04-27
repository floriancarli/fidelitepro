'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import DashboardSidebar from '@/components/DashboardSidebar'

export default function MonCompteLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-white">

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          <div className="lg:hidden flex items-center h-14 px-4 border-b border-gray-200 bg-white sticky top-0 z-20 flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-[#1A1A23] hover:bg-gray-100 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} />
            </button>
            <span className="ml-3 font-semibold text-[#1A1A23] text-sm">Mon Compte</span>
          </div>
          <main className="flex-1">{children}</main>
        </div>

      </div>
    </AuthGuard>
  )
}
