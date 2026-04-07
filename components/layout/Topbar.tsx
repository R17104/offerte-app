export default function Topbar() {
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
        }}
      >
        A
      </div>
    </header>
  )
}
