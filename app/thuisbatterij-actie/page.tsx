import type { Metadata } from 'next'
import ThuisbatterijActie from '@/components/marketing/ThuisbatterijActie'

export const metadata: Metadata = {
  title: 'Thuisbatterij in Friesland, bespaar tot €1.400/jaar | Gratis advies',
  description: 'Sla uw zonnestroom op met een thuisbatterij, juist nu de salderingsregeling verdwijnt. Gratis en vrijblijvend advies van een installateur uit Friesland. Wij bellen u terug.',
  alternates: { canonical: '/thuisbatterij-actie' },
  robots: { index: false, follow: false }, // advertentie-landingspagina, niet voor SEO
}

export default function ThuisbatterijActiePage() {
  return <ThuisbatterijActie />
}
