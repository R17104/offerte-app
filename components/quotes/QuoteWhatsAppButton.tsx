'use client'

export default function QuoteWhatsAppButton({
  phone, firstName, quoteNumber, url,
}: {
  phone: string | null
  firstName: string
  quoteNumber: string
  url: string
}) {
  if (!phone) {
    return <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Geen telefoonnummer bij klant</span>
  }
  const d = phone.replace(/\D/g, '')
  const intl = d.startsWith('0031') ? d.slice(2) : d.startsWith('31') ? d : d.startsWith('0') ? '31' + d.slice(1) : '31' + d
  const text = `Hallo ${firstName}, hierbij je offerte (${quoteNumber}) van Bespaarhulp Friesland. Je kunt 'm hier bekijken en direct ondertekenen: ${url}`
  const href = `https://wa.me/${intl}?text=${encodeURIComponent(text)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: '100%', padding: '8px 14px', borderRadius: 8, background: '#25D366',
        color: '#fff', fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 32 32" fill="none">
        <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.67 4.61 1.832 6.5L4 29l7.742-1.807A11.94 11.94 0 0016 27c6.627 0 12-5.373 12-12S22.627 3 16 3z" fill="#fff"/>
        <path d="M22 18.6c-.3-.15-1.8-.9-2.1-1-.28-.1-.48-.15-.69.15-.2.3-.79 1-.97 1.2-.18.2-.36.22-.66.07-.3-.15-1.3-.48-2.47-1.52-.91-.81-1.53-1.82-1.7-2.12-.18-.3-.02-.47.13-.62.14-.14.3-.36.46-.54.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.54-.08-.15-.69-1.66-.95-2.27-.25-.6-.5-.52-.69-.53l-.58-.01a1.13 1.13 0 00-.82.38c-.28.3-1.07 1.05-1.07 2.56s1.1 2.97 1.25 3.17c.15.2 2.16 3.3 5.24 4.63.73.32 1.3.5 1.75.65.74.23 1.4.2 1.94.12.59-.09 1.81-.74 2.07-1.46.26-.72.26-1.33.18-1.46-.07-.13-.27-.2-.57-.35z" fill="#25D366"/>
      </svg>
      Stuur via WhatsApp
    </a>
  )
}
