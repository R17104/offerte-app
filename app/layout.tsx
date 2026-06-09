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

export const metadata: Metadata = {
  title: 'Bespaarhulp Friesland — Gratis energieadvies',
  description: 'Gratis en onafhankelijk advies voor zonnepanelen, thuisbatterijen en warmtepompen in heel Friesland.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
