import type { Metadata } from 'next'
import AdviesPage from '@/components/marketing/AdviesPage'

type Props = { searchParams: Promise<{ product?: string }> }

export const metadata: Metadata = {
  title: 'Gratis Energieadvies aanvragen in Friesland',
  description: 'Vraag gratis en vrijblijvend energieadvies aan. Onze adviseurs berekenen uw besparing voor zonnepanelen, thuisbatterij of warmtepomp. Binnen 1 werkdag reactie.',
  alternates: { canonical: '/gratis-advies' },
  openGraph: {
    title: 'Gratis Energieadvies aanvragen in Friesland',
    description: 'Vraag gratis en vrijblijvend energieadvies aan. Binnen 1 werkdag reactie.',
    url: '/gratis-advies',
  },
}

export default async function GratisAdviesRoute({ searchParams }: Props) {
  const { product } = await searchParams
  return <AdviesPage product={product} />
}
