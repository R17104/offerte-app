import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar />
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
