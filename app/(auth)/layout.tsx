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
          <svg width="44" height="42" viewBox="0 0 36 34" fill="none">
            <rect x="10" y="4" width="3.5" height="6" rx="0.5" fill="#f5c442"/>
            <path d="M0 15L18 2L36 15H0Z" fill="#f5c442"/>
            <rect x="2" y="15" width="32" height="19" rx="1.5" fill="#0a5c35"/>
            <rect x="5" y="18" width="7" height="5.5" rx="0.5" fill="white" fillOpacity="0.22"/>
            <rect x="5" y="25.5" width="7" height="6" rx="0.5" fill="white" fillOpacity="0.22"/>
            <rect x="14" y="18" width="7" height="5.5" rx="0.5" fill="white" fillOpacity="0.22"/>
            <rect x="14" y="25.5" width="7" height="6" rx="0.5" fill="white" fillOpacity="0.22"/>
            <circle cx="28" cy="22" r="4.5" fill="#f5c442"/>
            <circle cx="26.5" cy="20.5" r="3" fill="#0a5c35"/>
          </svg>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
              <span style={{ color: '#0a5c35' }}>Bespaar</span><span style={{ color: '#f5c442' }}>hulp</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.10em', textTransform: 'uppercase', marginTop: 4 }}>
              Friesland
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
