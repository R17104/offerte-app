'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: '7px 16px',
        background: '#fff',
        border: '1px solid #d1d5db',
        borderRadius: 7,
        fontSize: 13.5,
        cursor: 'pointer',
        fontFamily: 'system-ui, sans-serif',
        color: '#374151',
      }}
    >
      PDF downloaden / afdrukken
    </button>
  )
}
