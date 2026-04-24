import AuthGuard from '@/components/AuthGuard'
import DashboardSidebar from '@/components/DashboardSidebar'

export default function MonCompteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-white">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AuthGuard>
  )
}
