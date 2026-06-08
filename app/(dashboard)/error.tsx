'use client'

export default function DashboardError({ error }: { error: Error & { digest?: string } }) {
  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h2 style={{ color: '#e83000', marginBottom: 16 }}>Fout</h2>
      <p style={{ marginBottom: 8 }}><strong>Message:</strong> {error.message}</p>
      {error.digest && <p style={{ marginBottom: 8 }}><strong>Digest:</strong> {error.digest}</p>}
      <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, fontSize: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
        {error.stack}
      </pre>
    </div>
  )
}
