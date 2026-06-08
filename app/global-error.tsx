'use client'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body style={{ fontFamily: 'monospace', padding: 40 }}>
        <h2 style={{ color: '#e83000' }}>Fout (global)</h2>
        <p><strong>Message:</strong> {error.message}</p>
        {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, fontSize: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
          {error.stack}
        </pre>
      </body>
    </html>
  )
}
