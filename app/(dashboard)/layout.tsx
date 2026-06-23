import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { verifySession } from '@/lib/dal'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role } = await verifySession()
  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar role={role} />
      <Topbar />
      <main
        style={{
          marginLeft: 'var(--sidebar-w)',
          marginTop: 'var(--topbar-h)',
          minHeight: 'calc(100vh - var(--topbar-h))',
        }}
      >
        {children}
      </main>
    </div>
  )
}
