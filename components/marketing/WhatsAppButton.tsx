'use client'

const WA_URL = 'https://wa.me/31638922513?text=Hallo%2C%20ik%20heb%20een%20vraag%20over%20een%20van%20uw%20producten.'

export default function WhatsAppButton() {
  return (
    <>
      <style>{`
        @keyframes wa-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(37,211,102,0.55); }
          70%  { box-shadow: 0 0 0 14px rgba(37,211,102,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
        }
        .wa-btn { animation: wa-pulse 2.2s infinite; }
        .wa-btn:hover { transform: scale(1.08) !important; }
      `}</style>
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="wa-btn"
        aria-label="Stuur ons een WhatsApp bericht"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          width: 58, height: 58, borderRadius: '50%',
          background: '#25D366',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
          textDecoration: 'none',
          transition: 'transform 0.15s',
        }}
      >
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
          <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.67 4.61 1.832 6.5L4 29l7.742-1.807A11.94 11.94 0 0016 27c6.627 0 12-5.373 12-12S22.627 3 16 3z" fill="#fff"/>
          <path d="M22.003 18.63c-.307-.154-1.816-.895-2.097-.997-.281-.1-.485-.154-.69.154-.205.308-.793.997-.972 1.202-.179.205-.358.23-.665.077-.307-.154-1.296-.478-2.469-1.523-.912-.813-1.527-1.817-1.706-2.124-.179-.307-.019-.473.135-.626.138-.137.307-.358.461-.537.153-.18.204-.308.306-.513.103-.205.051-.384-.026-.538-.077-.153-.69-1.663-.946-2.277-.249-.598-.502-.517-.69-.527l-.587-.01a1.127 1.127 0 00-.818.384c-.281.307-1.075 1.05-1.075 2.561s1.1 2.97 1.254 3.175c.153.205 2.165 3.306 5.245 4.635.733.316 1.305.505 1.751.646.736.234 1.406.201 1.935.122.59-.088 1.816-.742 2.072-1.46.256-.717.256-1.331.179-1.46-.077-.128-.281-.205-.588-.358z" fill="#25D366"/>
        </svg>
      </a>
    </>
  )
}
