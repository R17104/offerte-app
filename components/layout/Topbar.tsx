import Link from 'next/link'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { logout } from '@/lib/actions/auth.actions'

export default async function Topbar() {
  const session = await getSession()
  const user = session?.userId
    ? await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } })
    : null

  const displayName = user?.name || session?.email?.split('@')[0] || 'Account'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <header
      className="topbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 'var(--sidebar-w)',
        right: 0,
        height: 'var(--topbar-h)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 40,
        gap: 12,
        padding: '0 20px',
      }}
    >
      <div style={{ flex: 1 }} />

      <form action={logout}>
        <button
          type="submit"
          style={{
            padding: '5px 10px',
            fontSize: 12,
            color: 'var(--text-tertiary)',
            background: 'transparent',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Uitloggen
        </button>
      </form>

      <Link
        href="/account"
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          textDecoration: 'none', padding: '4px 8px',
          borderRadius: 'var(--radius-md)',
          transition: 'background 0.1s',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {displayName}
        </span>
        <div
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--accent-muted)',
            border: '1px solid var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
          }}
        >
          {initials}
        </div>
      </Link>
    </header>
  )
}
