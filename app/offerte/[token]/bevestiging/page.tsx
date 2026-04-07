import Link from 'next/link'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ token: string }>
  searchParams: Promise<{ type?: string }>
}

export default async function BevestigingPage({ params, searchParams }: Props) {
  const { token } = await params
  const { type } = await searchParams

  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    include: { customer: true },
  })

  if (!quote) notFound()

  const isAccepted = type === 'accepted'

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        padding: '40px 20px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '48px 56px',
          maxWidth: 520,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          border: '1px solid #e5e7eb',
        }}
      >
        {isAccepted ? (
          <>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 28,
              }}
            >
              ✓
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
              Offerte geaccepteerd
            </h1>
            <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.6, marginBottom: 8 }}>
              Bedankt, {quote.customer.firstName}! Je hebt de offerte{' '}
              <strong>{quote.quoteNumber}</strong> succesvol geaccepteerd.
            </p>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 32 }}>
              We nemen zo spoedig mogelijk contact met je op voor de verdere afhandeling.
            </p>
          </>
        ) : (
          <>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 28,
              }}
            >
              ✕
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
              Offerte afgewezen
            </h1>
            <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.6, marginBottom: 8 }}>
              Je hebt de offerte <strong>{quote.quoteNumber}</strong> afgewezen.
            </p>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 32 }}>
              Mocht je vragen hebben of van gedachten veranderen, neem dan contact met ons op.
            </p>
          </>
        )}

        <Link
          href={`/offerte/${token}`}
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            background: '#f3f4f6',
            color: '#374151',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Offerte bekijken
        </Link>
      </div>
    </div>
  )
}
