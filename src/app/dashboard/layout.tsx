import AuthGuard from '@/components/AuthGuard'
import DashboardSidebar from '@/components/DashboardSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#F9F9FB]">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AuthGuard>
  )
}
