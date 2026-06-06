export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        padding: '24px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              background: 'var(--accent)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 16 16">
              <path d="M8 13.5C8 13.5 2.5 10.5 2.5 6A5.5 5.5 0 0 1 13.5 6C13.5 10.5 8 13.5 8 13.5Z" stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M8 13.5V8M8 8L5.5 5.5M8 8L10.5 5.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', display: 'block', lineHeight: 1.2 }}>Bespaarhulp</span>
            <span style={{ fontWeight: 500, fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Friesland</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
