import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bespaarhulpfriesland.nl'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Bespaarhulp Friesland | Gratis energieadvies',
    template: '%s | Bespaarhulp Friesland',
  },
  description: 'Gratis en onafhankelijk advies voor zonnepanelen, thuisbatterijen en warmtepompen in heel Friesland. Bespaar tot €3.000 per jaar op uw energierekening.',
  keywords: ['thuisbatterij Friesland', 'zonnepanelen Friesland', 'warmtepomp Friesland', 'energiebesparing Friesland', 'gratis energieadvies', 'thuisbatterij kopen', 'alpha ESS', 'SigenStor'],
  authors: [{ name: 'Bespaarhulp Friesland' }],
  creator: 'Bespaarhulp Friesland',
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    siteName: 'Bespaarhulp Friesland',
    url: BASE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bespaarhulp Friesland | Gratis energieadvies',
    description: 'Gratis en onafhankelijk advies voor zonnepanelen, thuisbatterijen en warmtepompen in Friesland.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

import ConsentBanner from '@/components/marketing/ConsentBanner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        {children}
        <ConsentBanner />
      </body>
    </html>
  )
}
