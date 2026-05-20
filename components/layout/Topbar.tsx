import { getSession } from '@/lib/session'
import { logout } from '@/lib/actions/auth.actions'

export default async function Topbar() {
  const session = await getSession()
  const initials = session?.email?.[0]?.toUpperCase() ?? 'A'

  return (
    <header
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
        padding: '0 28px',
        zIndex: 40,
        gap: 12,
      }}
    >
      <div style={{ flex: 1 }} />

      <span
        style={{
          fontSize: 12.5,
          color: 'var(--text-tertiary)',
          maxWidth: 200,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {session?.email}
      </span>

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

      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: 'var(--accent-muted)',
          border: '1px solid var(--border-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--accent)',
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
    </header>
  )
}
